function criarLinhaNovoLancamentoInline() {
    if (document.getElementById("linhaNovoLancamento")) return;

    const feedContainer = document.getElementById("feedLancamentos");
    if (!feedContainer) return;

    const noData = feedContainer.querySelector(".no-data");
    if (noData) noData.remove();

    const div = document.createElement("div");
    div.id = "linhaNovoLancamento";
    div.className = "lancamento-item em-edicao-inline";

    const opcoesCategoria = `<option value="" disabled selected>Categoria...</option>` + gerarOpcoesSelect(LISTA_CATEGORIAS);
    const opcoesContas = gerarOpcoesSelect(LISTA_CONTAS);
    const hoje = new Date().toISOString().split('T')[0];

    div.innerHTML = `
        <div class="edit-inline-container">
            <div class="edit-inline-row-top">
                <span class="edit-inline-title">✨ Novo Lançamento</span>
                <div class="edit-inline-group">
                    <label><input type="radio" name="newMov" value="Despesa" checked> Despesa</label>
                    <label><input type="radio" name="newMov" value="Receita"> Receita</label>
                    <label><input type="radio" name="newMov" value="Transferência"> Transferência</label>
                </div>
                <div class="edit-inline-group" style="margin-left: auto;">
                    <label class="checkbox-item">
                        <input type="checkbox" id="newStatus" checked> Pago
                    </label>
                </div>
                <div class="edit-inline-actions">
                    <button class="btn-inline-salvar" onclick="salvarNovoLancamentoInline()">💾 Salvar</button>
                    <button class="btn-inline-cancelar" onclick="cancelarNovoLancamento()">❌ Cancelar</button>
                </div>
            </div>
            <div class="edit-inline-row-inputs">
                <input type="date" id="newData" value="${hoje}" class="input-inline-style" style="width: 130px;">
                <input type="text" id="newDescricao" placeholder="Descrição" class="input-inline-style" style="flex: 2; min-width: 150px;">
                <select id="newCategoria" class="select-inline-edit-style" style="flex: 1; min-width: 140px;" onchange="autoPreencherInlineSub()">
                    ${opcoesCategoria}
                </select>
                <select id="newSubcategoria" class="select-inline-edit-style" style="width: 130px;">
                    <option value="Custo Variável">Custo Variável</option>
                    <option value="Custo Fixo">Custo Fixo</option>
                </select>
                <select id="newContaOrigem" class="select-inline-edit-style" style="width: 130px;">
                    ${opcoesContas}
                </select>
                <select id="newContaDestino" class="select-inline-edit-style" style="width: 130px; display: none;">
                    <option value="Nenhuma (Uso Geral)" selected>Conta Destino...</option>
                    ${opcoesContas}
                </select>
                <input type="number" step="0.01" id="newValor" placeholder="0,00" class="input-inline-style" style="width: 100px;">
            </div>
        </div>
    `;

    anexarEventosMovimentacao('new', div);
    feedContainer.insertBefore(div, feedContainer.firstChild);
    const descricaoInput = div.querySelector("#newDescricao");
    if (descricaoInput) descricaoInput.focus();
}

function cancelarNovoLancamento() {
    const linha = document.getElementById("linhaNovoLancamento");
    if (linha) linha.remove();
    renderizarFeedFiltrado();
}

function anexarEventosMovimentacao(prefixo, container) {
    const radioName = `${prefixo}Mov${prefixo === 'new' ? '' : '-' + prefixo.substring(4)}`;
    const radios = container.querySelectorAll(`input[name="${radioName}"]`);
    const destSelect = container.querySelector(`#${prefixo}ContaDestino${prefixo === 'new' ? '' : '-' + prefixo.substring(4)}`);

    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            if (destSelect) {
                destSelect.style.display = e.target.value === 'Transferência' ? 'inline-block' : 'none';
            }
        });
    });
}

function autoPreencherInlineSub() {
    const cat = document.getElementById("newCategoria").value;
    if (!cat) return;

    const subSelect = document.getElementById("newSubcategoria");
    subSelect.value = CUSTOS_FIXOS.includes(cat) ? "Custo Fixo" : "Custo Variável";

    let targetMov = "Despesa";
    if (cat === "Transferência") targetMov = "Transferência";
    else if (MAPA_RECEITAS.includes(cat)) targetMov = "Receita";

    const radios = document.querySelectorAll('input[name="newMov"]');
    radios.forEach(r => {
        if (r.value === targetMov) {
            r.checked = true;
            r.dispatchEvent(new Event('change'));
        }
    });
}

async function salvarNovoLancamentoInline() {
    const desc = document.getElementById("newDescricao").value.trim();
    const valorRaw = document.getElementById("newValor").value;
    const dataRaw = document.getElementById("newData").value;
    const isPago = document.getElementById("newStatus").checked;
    const contaOrigem = document.getElementById("newContaOrigem").value;
    const contaDestino = document.getElementById("newContaDestino").value;
    const category = document.getElementById("newCategoria").value;
    const subcat = document.getElementById("newSubcategoria").value;

    let mov = "Despesa";
    document.querySelectorAll('input[name="newMov"]').forEach(r => {
        if (r.checked) mov = r.value;
    });

    if (!desc || !valorRaw || !dataRaw || !category) {
        exibirBanner("Por favor, preencha a Descrição, o Valor, a Categoria e a Data.", "error", 5000);
        return;
    }

    const novoDoc = criarDocumentoDeLancamento(
        desc, parseFloat(valorRaw), dataRaw, mov,
        isPago ? "Pago" : "Previsão",
        contaOrigem,
        mov === "Transferência" ? contaDestino : "Nenhuma (Uso Geral)",
        category, subcat
    );

    try {
        await db.collection("lancamentos").add(novoDoc);
        exibirBanner("Lançamento salvo com sucesso.", "success", 4000);
        const inputRow = document.getElementById("linhaNovoLancamento");
        if (inputRow) inputRow.remove();
    } catch (e) {
        console.error("Erro ao salvar lançamento:", e);
        exibirBanner("Erro ao salvar no banco.", "error", 5000);
    }
}

function criarDocumentoDeLancamento(desc, valor, dataRaw, mov, status, contaOrigem, contaDestino, category, subcat) {
    const partes = dataRaw.split("-");
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    const mesNome = MESES_NOMES[parseInt(partes[1]) - 1];

    return {
        descricao: desc,
        valor: valor,
        data: dataFormatada,
        mes: mesNome,
        movimentacao: mov,
        status: status,
        contaOrigem: contaOrigem,
        contaDestino: contaDestino,
        categoriaOriginal: category,
        subcategoria: subcat,
        macroCategoriaPrincipal: subcat
    };
}

function abrirEdicaoItemInline(id) {
    const item = todosLancamentosCache.find(i => i.id === id);
    if (!item) return;

    const div = document.getElementById("item-" + id);
    if (!div || div.classList.contains("em-edicao-inline")) return;

    div.className = "lancamento-item em-edicao-inline";
    div.removeAttribute("onclick");

    const opcoesCategoria = gerarOpcoesSelect(LISTA_CATEGORIAS, item.categoriaOriginal);
    const opcoesContas = gerarOpcoesSelect(LISTA_CONTAS, item.contaOrigem);
    const opcoesDestino = gerarOpcoesSelect(LISTA_CONTAS, item.contaDestino);

    let dataInput = "";
    if (item.data && item.data.includes("/")) {
        const p = item.data.split("/");
        dataInput = `${p[2]}-${p[1]}-${p[0]}`;
    }

    const isDespesa = item.movimentacao === "Despesa";
    const isReceita = item.movimentacao === "Receita";
    const isTransferencia = item.movimentacao === "Transferência" || item.movimentacao === "Transferencia";
    const isPagoStatus = (item.status || "").trim().toLowerCase() === "pago";

    div.innerHTML = `
        <div class="edit-inline-container" onclick="event.stopPropagation();">
            <div class="edit-inline-row-top">
                <span class="edit-inline-title">✏️ Editar Lançamento</span>
                <div class="edit-inline-group">
                    <label><input type="radio" name="editMov-${id}" value="Despesa" ${isDespesa ? 'checked' : ''}> Despesa</label>
                    <label><input type="radio" name="editMov-${id}" value="Receita" ${isReceita ? 'checked' : ''}> Receita</label>
                    <label><input type="radio" name="editMov-${id}" value="Transferência" ${isTransferencia ? 'checked' : ''}> Transferência</label>
                </div>
                <div class="edit-inline-group" style="margin-left: auto;">
                    <label class="checkbox-item">
                        <input type="checkbox" id="editStatus-${id}" ${isPagoStatus ? 'checked' : ''}> Pago
                    </label>
                </div>
                <div class="edit-inline-actions">
                    <button class="btn-inline-salvar" onclick="salvarEdicaoItemInline('${id}')">💾 Salvar</button>
                    <button class="btn-inline-cancelar" onclick="renderizarFeedFiltrado()">❌ Cancelar</button>
                </div>
            </div>
            <div class="edit-inline-row-inputs">
                <input type="date" id="editData-${id}" value="${dataInput}" class="input-inline-style" style="width: 130px;">
                <input type="text" id="editDescricao-${id}" value="${item.descricao || ''}" class="input-inline-style" style="flex: 2; min-width: 150px;">
                <select id="editCategoria-${id}" class="select-inline-edit-style" style="flex: 1; min-width: 140px;" onchange="autoPreencherEditInlineSub('${id}')">
                    ${opcoesCategoria}
                </select>
                <select id="editSubcategoria-${id}" class="select-inline-edit-style" style="width: 130px;">
                    <option value="Custo Variável" ${item.subcategoria === 'Custo Variável' ? 'selected' : ''}>Custo Variável</option>
                    <option value="Custo Fixo" ${item.subcategoria === 'Custo Fixo' ? 'selected' : ''}>Custo Fixo</option>
                </select>
                <select id="editContaOrigem-${id}" class="select-inline-edit-style" style="width: 130px;">
                    ${opcoesContas}
                </select>
                <select id="editContaDestino-${id}" class="select-inline-edit-style" style="width: 130px; display: ${isTransferencia ? 'inline-block' : 'none'};">
                    <option value="Nenhuma (Uso Geral)">Conta Destino...</option>
                    ${opcoesDestino}
                </select>
                <input type="number" step="0.01" id="editValor-${id}" value="${item.valor}" class="input-inline-style" style="width: 100px;">
            </div>
        </div>
    `;

    anexarEventosMovimentacao('edit-' + id, div);
}

function autoPreencherEditInlineSub(id) {
    const cat = document.getElementById(`editCategoria-${id}`).value;
    if (!cat) return;

    const subSelect = document.getElementById(`editSubcategoria-${id}`);
    subSelect.value = CUSTOS_FIXOS.includes(cat) ? "Custo Fixo" : "Custo Variável";

    let targetMov = "Despesa";
    if (cat === "Transferência") targetMov = "Transferência";
    else if (MAPA_RECEITAS.includes(cat)) targetMov = "Receita";

    const radios = document.querySelectorAll(`input[name="editMov-${id}"]`);
    radios.forEach(r => {
        if (r.value === targetMov) {
            r.checked = true;
            r.dispatchEvent(new Event('change'));
        }
    });
}

async function salvarEdicaoItemInline(id) {
    const desc = document.getElementById(`editDescricao-${id}`).value.trim();
    const valorRaw = document.getElementById(`editValor-${id}`).value;
    const dataRaw = document.getElementById(`editData-${id}`).value;
    const isPago = document.getElementById(`editStatus-${id}`).checked;
    const contaOrigem = document.getElementById(`editContaOrigem-${id}`).value;
    const contaDestino = document.getElementById(`editContaDestino-${id}`).value;
    const category = document.getElementById(`editCategoria-${id}`).value;
    const subcat = document.getElementById(`editSubcategoria-${id}`).value;

    let mov = "Despesa";
    document.querySelectorAll(`input[name="editMov-${id}"]`).forEach(r => {
        if (r.checked) mov = r.value;
    });

    if (!desc || !valorRaw || !dataRaw || !category) {
        exibirBanner("Por favor, preencha a Descrição, o Valor, a Categoria e a Data.", "error", 5000);
        return;
    }

    const atualizadoDoc = criarDocumentoDeLancamento(
        desc, parseFloat(valorRaw), dataRaw, mov,
        isPago ? "Pago" : "Previsão",
        contaOrigem,
        mov === "Transferência" ? contaDestino : "Nenhuma (Uso Geral)",
        category,
        subcat
    );

    try {
        await db.collection("lancamentos").doc(id).update(atualizadoDoc);
        exibirBanner("Lançamento atualizado com sucesso.", "success", 4000);
    } catch (e) {
        console.error("Erro ao atualizar lançamento:", e);
        exibirBanner("Erro ao atualizar no banco.", "error", 5000);
    }
}

async function alternarStatusLancamento(id, statusAtual) {
    const statusNormalizado = (statusAtual || "").trim().toLowerCase();
    const novo = (statusNormalizado === "pago") ? "Previsão" : "Pago";
    try {
        await db.collection("lancamentos").doc(id).update({ status: novo });
    } catch (e) {
        console.error("Erro ao alternar status:", e);
    }
}

async function deletarLancamento(id, desc) {
    const confirmado = await confirmarAcao(`Excluir permanentemente "${desc}"?`);
    if (!confirmado) return;

    try {
        await db.collection("lancamentos").doc(id).delete();
        exibirBanner("Lançamento removido com sucesso.", "success", 4000);
    } catch (e) {
        console.error("Erro ao deletar lançamento:", e);
        exibirBanner("Erro ao deletar lançamento.", "error", 5000);
    }
}

function exibirBanner(message, type = 'info', autoHideMs = 5000) {
    const banner = document.getElementById('dashfinBanner');
    const bannerText = document.getElementById('dashfinBannerText');
    const closeBtn = banner ? banner.querySelector('.banner-close') : null;
    if (!banner || !bannerText) return;

    banner.className = `dashfin-banner visible ${type}`;
    bannerText.textContent = message;

    if (closeBtn) {
        closeBtn.onclick = () => banner.classList.remove('visible');
    }

    if (autoHideMs > 0) {
        clearTimeout(banner._hideTimer);
        banner._hideTimer = setTimeout(() => banner.classList.remove('visible'), autoHideMs);
    }
}

function confirmarAcao(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('dashfinConfirmOverlay');
        const title = document.getElementById('dashfinConfirmTitle');
        const text = document.getElementById('dashfinConfirmText');
        const ok = document.getElementById('dashfinConfirmOk');
        const cancel = document.getElementById('dashfinConfirmCancel');

        if (!overlay || !title || !text || !ok || !cancel) {
            resolve(false);
            return;
        }

        title.textContent = 'Confirmação';
        text.textContent = message;
        overlay.classList.add('visible');
        overlay.setAttribute('aria-hidden', 'false');

        const finish = (value) => {
            overlay.classList.remove('visible');
            overlay.setAttribute('aria-hidden', 'true');
            resolve(value);
        };

        ok.onclick = () => finish(true);
        cancel.onclick = () => finish(false);
        overlay.onclick = (event) => {
            if (event.target === overlay) finish(false);
        };
    });
}

function calcularSaldosContasGlobais() {
    const configSaldos = obterSaldosIniciaisConfigurados();
    const saldos = {
        banrisul: configSaldos.banrisul,
        nubank: configSaldos.nubank,
        valealim: configSaldos.valealim,
        valeref: configSaldos.valeref
    };

    todosLancamentosCache.forEach(item => {
        if ((item.status || "").trim().toLowerCase() !== "pago") return;

        const valor = Math.abs(parseFloat(item.valor)) || 0;
        const movimentacao = (item.movimentacao || "").trim().toLowerCase();

        atualizarSaldoPorMovimentacao(saldos, movimentacao, item, valor);
    });

    atualizarExibicaoSaldos(saldos);
}

function atualizarSaldoPorMovimentacao(saldos, movimentacao, item, valor) {
    const mapa = {
        "Banrisul": "banrisul",
        "Cartão Nubank": "nubank",
        "Vale Refeição": "valeref",
        "Vale Alimentação": "valealim"
    };

    if (movimentacao === "receita") {
        if (mapa[item.contaOrigem]) saldos[mapa[item.contaOrigem]] += valor;
    } else if (movimentacao === "despesa") {
        if (mapa[item.contaOrigem]) saldos[mapa[item.contaOrigem]] -= valor;
    } else if (movimentacao === "transferência" || movimentacao === "transferencia") {
        if (mapa[item.contaOrigem]) saldos[mapa[item.contaOrigem]] -= valor;
        if (mapa[item.contaDestino]) saldos[mapa[item.contaDestino]] += valor;
    }
}

function atualizarExibicaoSaldos(saldos) {
    const saldoBanrisul = document.getElementById("saldoBanrisul");
    const saldoNubank = document.getElementById("saldoNubank");
    const saldoValeRef = document.getElementById("saldoValeRef");
    const saldoValeAlim = document.getElementById("saldoValeAlim");

    if (saldoBanrisul) saldoBanrisul.innerText = "R$ " + formatarValorMonetario(saldos.banrisul);
    if (saldoNubank) saldoNubank.innerText = "R$ " + formatarValorMonetario(saldos.nubank);
    if (saldoValeRef) saldoValeRef.innerText = "R$ " + formatarValorMonetario(saldos.valeref);
    if (saldoValeAlim) saldoValeAlim.innerText = "R$ " + formatarValorMonetario(saldos.valealim);
}

function calcularSaldoDiario(data, filtros, saldoInicial) {
    let saldoAcumulado = saldoInicial;

    todosLancamentosCache.forEach(item => {
        if (!item.data) return;

        const dataItem = converterDataParaOrdenacao(item.data);
        const dataFiltro = converterDataParaOrdenacao(data);

        if (dataItem > dataFiltro) return;

        if (!passaEmFiltros(item, filtros)) return;
        if ((item.status || "").trim().toLowerCase() !== "pago") return;

        const valor = Math.abs(parseFloat(item.valor)) || 0;
        const movimentacao = (item.movimentacao || "").trim().toLowerCase();

        if (movimentacao === "receita") {
            saldoAcumulado += valor;
        } else if (movimentacao === "despesa") {
            saldoAcumulado -= valor;
        } else if (movimentacao === "transferência" || movimentacao === "transferencia") {
            if (filtros.conta === "TODAS") {
                // Não altera o saldo se for transferência entre contas
            } else if (item.contaOrigem === filtros.conta) {
                saldoAcumulado -= valor;
            } else if (item.contaDestino === filtros.conta) {
                saldoAcumulado += valor;
            }
        }
    });

    return saldoAcumulado;
}

function obterSaldoInicialParaData(data, filtros) {
    const incluirAnterior = document.getElementById("incluirSaldoAnterior").checked;
    const filtros_copia = { ...filtros };

    if (!incluirAnterior) {
        return 0;
    }

    const partes = data.split("/");
    const ano = parseInt(partes[2]);
    const mes = parseInt(partes[1]);

    const primeiroDoMes = new Date(ano, mes - 1, 1);
    const ultimaMesAnterior = new Date(ano, mes - 1, 0);

    const configSaldos = obterSaldosIniciaisConfigurados();

    if (filtros.conta === "TODAS") {
        return configSaldos.banrisul + configSaldos.nubank + configSaldos.valealim + configSaldos.valeref;
    } else if (filtros.conta === "Banrisul") {
        return configSaldos.banrisul;
    } else if (filtros.conta === "Cartão Nubank") {
        return configSaldos.nubank;
    } else if (filtros.conta === "Vale Alimentação") {
        return configSaldos.valealim;
    } else if (filtros.conta === "Vale Refeição") {
        return configSaldos.valeref;
    }

    return 0;
}

function renderizarFeedFiltrado() {
    const filtros = obterFiltrosSelecionados();
    const feedContainer = document.getElementById("feedLancamentos");
    if (!feedContainer) return;

    const linhaInputExistente = document.getElementById("linhaNovoLancamento");

    feedContainer.innerHTML = "";
    if (linhaInputExistente) {
        feedContainer.appendChild(linhaInputExistente);
    }

    let somaFiltrada = 0;
    let contador = 0;

    const itensPorData = {};

    todosLancamentosCache.forEach((item) => {
        if (!item.data) return;

        if (!passaEmFiltros(item, filtros)) return;
        if (!correspondeABusca(item, termoBuscaAtivo)) return;

        if (!itensPorData[item.data]) {
            itensPorData[item.data] = [];
        }
        itensPorData[item.data].push(item);
    });

    const datasOrdenadas = Object.keys(itensPorData).sort((a, b) =>
        converterDataParaOrdenacao(b) - converterDataParaOrdenacao(a)
    );

    datasOrdenadas.forEach(data => {
        const itens = itensPorData[data];
        const saldoInicial = obterSaldoInicialParaData(data, filtros);
        const saldoDiario = calcularSaldoDiario(data, filtros, saldoInicial);

        const agrupamento = document.createElement("div");
        agrupamento.className = "agrupamento-data";

        const headerData = document.createElement("div");
        headerData.className = "header-data";

        const titulo = document.createElement("span");
        titulo.className = "header-data-titulo";
        titulo.textContent = data;

        const saldoDiv = document.createElement("div");
        saldoDiv.className = "header-data-saldo";
        if (saldoDiario > 0) saldoDiv.classList.add("positivo");
        else if (saldoDiario < 0) saldoDiv.classList.add("negativo");
        else saldoDiv.classList.add("neutro");
        saldoDiv.textContent = "Saldo: R$ " + formatarValorMonetario(saldoDiario);

        headerData.appendChild(titulo);
        headerData.appendChild(saldoDiv);
        agrupamento.appendChild(headerData);

        const itemsContainer = document.createElement("div");
        itemsContainer.className = "items-por-data";

        itens.forEach(item => {
            contador++;
            somaFiltrada = acumularValorFiltrado(somaFiltrada, item);
            const div = criarElementoLancamento(item);
            itemsContainer.appendChild(div);
        });

        agrupamento.appendChild(itemsContainer);
        feedContainer.appendChild(agrupamento);
    });

    atualizarExibicaoFeed(contador, somaFiltrada, feedContainer, linhaInputExistente);
}

function obterFiltrosSelecionados() {
    return {
        mes: document.getElementById("filtroMes").value,
        ano: document.getElementById("filtroAno").value,
        conta: document.getElementById("filtroConta").value,
        categoria: document.getElementById("filtroCategoria").value,
        exibirReceita: document.getElementById("chkMovReceita").checked,
        exibirDespesa: document.getElementById("chkMovDespesa").checked,
        exibirTransferencia: document.getElementById("chkMovTransferencia").checked,
        exibirPago: document.getElementById("chkStatusPago").checked,
        exibirPrevisao: document.getElementById("chkStatusPrevisao").checked
    };
}

function passaEmFiltros(item, filtros) {
    const anoDoItem = item.data.split("/")[2];
    const movimentacao = (item.movimentacao || "").trim().toLowerCase();
    const isReceita = movimentacao === "receita";
    const isTransferencia = movimentacao === "transferência" || movimentacao === "transferencia";

    if (!(filtros.mes === "TODOS" || item.mes === filtros.mes)) return false;
    if (!(filtros.ano === "TODOS" || anoDoItem === filtros.ano)) return false;
    if (!(filtros.conta === "TODAS" || item.contaOrigem === filtros.conta || item.contaDestino === filtros.conta)) return false;
    if (!(filtros.categoria === "TODAS" || item.categoriaOriginal === filtros.categoria)) return false;

    if (isReceita && !filtros.exibirReceita) return false;
    if (isTransferencia && !filtros.exibirTransferencia) return false;
    if (!isReceita && !isTransferencia && !filtros.exibirDespesa) return false;

    const statusNormalizado = (item.status || "").trim().toLowerCase();
    const passaStatus = (statusNormalizado === "pago" && filtros.exibirPago) ||
        ((statusNormalizado === "previsão" || statusNormalizado === "previsao") && filtros.exibirPrevisao);

    return passaStatus;
}

function acumularValorFiltrado(soma, item) {
    const movimentacao = (item.movimentacao || "").trim().toLowerCase();
    const isReceita = movimentacao === "receita";
    const isTransferencia = movimentacao === "transferência" || movimentacao === "transferencia";
    const valorNumerico = Math.abs(parseFloat(item.valor)) || 0;

    if (!isTransferencia) {
        soma += isReceita ? valorNumerico : -valorNumerico;
    }
    return soma;
}

function criarElementoLancamento(item) {
    const div = document.createElement("div");
    const movimentacao = (item.movimentacao || "").trim().toLowerCase();
    const isReceita = movimentacao === "receita";
    const isTransferencia = movimentacao === "transferência" || movimentacao === "transferencia";
    const isPago = (item.status || "").trim().toLowerCase() === "pago";
    const subcategoriaExibida = item.subcategoria || item.macroCategoriaPrincipal || 'Custo Variável';
    const valorNumerico = Math.abs(parseFloat(item.valor)) || 0;

    let classeItem = 'item-despesa';
    let sinalValor = '-';
    let classeValor = 'text-despesa';

    if (isReceita) {
        classeItem = 'item-receita';
        sinalValor = '+';
        classeValor = 'text-receita';
    } else if (isTransferencia) {
        classeItem = 'item-transferencia';
        sinalValor = '⇄';
        classeValor = 'text-neutro';
    }

    div.id = "item-" + item.id;
    div.className = `lancamento-item ${classeItem}`;
    if (termoBuscaAtivo && correspondeABusca(item, termoBuscaAtivo)) {
        div.classList.add("destaque-busca");
    }
    div.style.cursor = "pointer";
    div.setAttribute("onclick", `abrirEdicaoItemInline('${item.id}')`);

    const contaExibida = item.contaDestino && item.contaDestino !== "Nenhuma (Uso Geral)"
        ? `${item.contaOrigem} ➔ ${item.contaDestino}`
        : item.contaOrigem;

    const descricaoExibida = destacarBuscaEmTexto(item.descricao || '', termoBuscaAtivo);

    div.innerHTML = `
        <div class="item-bloco-esquerdo">
            <div class="item-info-texto">
                <div class="item-data-tag">
                    <span>${item.data} • ${item.mes}</span>
                    <span class="tag-status ${isPago ? 'status-pago' : 'status-previsao'}" onclick="event.stopPropagation(); alternarStatusLancamento('${item.id}', '${item.status}')">${isPago ? 'PAGO' : 'PREVISÃO'}</span>
                    <span class="tag-conta">${contaExibida}</span>
                </div>
                <div class="item-descricao">${descricaoExibida}</div>
                <div class="item-meta">
                    <span>🏷️ Categoria: <strong>${item.categoriaOriginal || 'Definir'}</strong> • Sub: <strong>${subcategoriaExibida}</strong></span>
                </div>
            </div>
        </div>
        <div class="item-bloco-direito" onclick="event.stopPropagation();">
            <div class="item-valor ${classeValor}">${sinalValor} R$ ${formatarValorMonetario(valorNumerico)}</div>
            <button class="btn-acao-deletar" onclick="deletarLancamento('${item.id}', '${item.descricao}')">🗑️ Excluir</button>
        </div>
    `;

    return div;
}

function atualizarExibicaoFeed(contador, somaFiltrada, feedContainer, linhaInputExistente) {
    const contadorItens = document.getElementById("contadorItens");
    if (contadorItens) contadorItens.innerText = `${contador} lançamentos exibidos`;

    const txtTotal = document.getElementById("txtTotalFiltrado");
    if (txtTotal) {
        txtTotal.innerText = "R$ " + formatarValorMonetario(somaFiltrada);

        if (somaFiltrada > 0) txtTotal.className = "text-receita";
        else if (somaFiltrada < 0) txtTotal.className = "text-despesa";
        else txtTotal.className = "text-neutro";
    }

    if (contador === 0 && !linhaInputExistente) {
        feedContainer.innerHTML = `<div class="no-data">Nenhum lançamento encontrado para os filtros selecionados.</div>`;
    }
}

function obterOrcamentoMensalPadrao() {
    return {
        "Celular": 220,
        "Supermercado": 1200,
        "Internet": 120,
        "Combustível": 500,
        "Condomínio": 900,
        "Conta de Luz": 280,
        "Conta de Agua": 220,
        "Gás": 180,
        "Restaurante": 500,
        "Lazer": 400,
        "Transporte": 350
    };
}

function obterOrcamentoMensalConfigurado() {
    const padrao = obterOrcamentoMensalPadrao();
    const salvo = localStorage.getItem("dashfin_orcamento_mensal");

    if (!salvo) return padrao;

    try {
        const parsed = JSON.parse(salvo);
        return { ...padrao, ...parsed };
    } catch (e) {
        console.warn("Orçamento salvo inválido, usando valores padrão.", e);
        return padrao;
    }
}

function salvarOrcamentoMensal() {
    if (!document.querySelector(".orcamento-input")) {
        exibirBanner("Nenhum orçamento configurado para salvar.", "info", 3000);
        return;
    }

    const orcamentoAtualizado = {};
    document.querySelectorAll(".orcamento-input").forEach((input) => {
        const categoria = input.dataset.categoria;
        const valor = parseFloat(input.value);
        if (categoria && !Number.isNaN(valor)) {
            orcamentoAtualizado[categoria] = valor;
        }
    });

    localStorage.setItem("dashfin_orcamento_mensal", JSON.stringify(orcamentoAtualizado));
    exibirBanner("Orçamento salvo com sucesso!", "success", 4000);
    renderizarOrcamentoMensal();
}

function obterPeriodoOrcamento() {
    const filtroMes = document.getElementById("orcamentoMes") || document.getElementById("filtroMes");
    const filtroAno = document.getElementById("orcamentoAno") || document.getElementById("filtroAno");
    const hoje = new Date();

    const mesAtual = MESES_NOMES[hoje.getMonth()];
    const anoAtual = String(hoje.getFullYear());

    const mesSelecionado = filtroMes && filtroMes.value && filtroMes.value !== "TODOS" ? filtroMes.value : mesAtual;
    const anoSelecionado = filtroAno && filtroAno.value && filtroAno.value !== "TODOS" ? filtroAno.value : anoAtual;

    const mesNormalizado = (mesSelecionado || mesAtual).toUpperCase();
    const anoNormalizado = String(anoSelecionado || anoAtual);

    return { mesSelecionado: mesNormalizado, anoSelecionado: anoNormalizado };
}

function obterTotalGastoCategoria(categoria, mes, ano) {
    return todosLancamentosCache.reduce((total, item) => {
        if (!item || !item.categoriaOriginal || item.categoriaOriginal !== categoria) return total;
        if ((item.movimentacao || "").trim().toLowerCase() !== "despesa") return total;
        if ((item.mes || "").toUpperCase() !== mes.toUpperCase()) return total;

        const anoItem = String((item.data || "").split("/")[2] || "");
        if (anoItem && anoItem !== String(ano)) return total;

        return total + (Math.abs(parseFloat(item.valor)) || 0);
    }, 0);
}

function getCategoriasPadraoOrcamento() {
    return [
        { nome: "Custos fixos", valor: 4500, cor: "#5ca9eb" },
        { nome: "Conforto", valor: 2500, cor: "#59c3a8" },
        { nome: "Metas", valor: 1200, cor: "#f0d37b" },
        { nome: "Prazeres", valor: 900, cor: "#8ec5ff" },
        { nome: "Liberdade financeira", valor: 2000, cor: "#9ad9b5" },
        { nome: "Conectividade", valor: 500, cor: "#b7bfc9" }
    ];
}

function obterResumoSaldosPorConta() {
    const saldos = obterSaldosIniciaisConfigurados();
    const contas = {
        "Banrisul": { inicial: saldos.banrisul, atual: saldos.banrisul, nome: "Banrisul" },
        "Cartão Nubank": { inicial: saldos.nubank, atual: saldos.nubank, nome: "Cartão Nubank" },
        "Cartão XP": { inicial: 0, atual: 0, nome: "Cartão XP" },
        "Carteira": { inicial: 0, atual: 0, nome: "Carteira" },
        "Vale Alimentação": { inicial: saldos.valealim, atual: saldos.valealim, nome: "Vale Alimentação" },
        "Vale Refeição": { inicial: saldos.valeref, atual: saldos.valeref, nome: "Vale Refeição" }
    };

    todosLancamentosCache.forEach((item) => {
        const origem = (item.contaOrigem || '').trim();
        const destino = (item.contaDestino || '').trim();
        const valor = Number(item.valor) || 0;
        const mov = (item.movimentacao || '').trim().toLowerCase();
        const abs = Math.abs(valor);

        if (mov === 'receita') {
            if (contas[origem]) contas[origem].atual += abs;
            return;
        }

        if (mov === 'despesa') {
            if (contas[origem]) contas[origem].atual -= abs;
            return;
        }

        if (mov === 'transferência' || mov === 'transferencia') {
            if (contas[origem]) contas[origem].atual -= abs;
            if (contas[destino]) contas[destino].atual += abs;
        }
    });

    Object.keys(contas).forEach((conta) => {
        contas[conta].variacao = contas[conta].atual - contas[conta].inicial;
    });

    return Object.values(contas).filter((conta) => conta.nome);
}

function obterConsolidacaoPeriodo(mes, ano) {
    const receitas = todosLancamentosCache
        .filter((item) => (item.movimentacao || '').trim().toLowerCase() === 'receita')
        .filter((item) => (item.mes || '').toUpperCase() === mes.toUpperCase())
        .filter((item) => String((item.data || '').split('/')[2] || '') === String(ano))
        .reduce((soma, item) => soma + (Math.abs(Number(item.valor)) || 0), 0);

    const despesas = todosLancamentosCache
        .filter((item) => (item.movimentacao || '').trim().toLowerCase() === 'despesa')
        .filter((item) => (item.mes || '').toUpperCase() === mes.toUpperCase())
        .filter((item) => String((item.data || '').split('/')[2] || '') === String(ano))
        .reduce((soma, item) => soma + (Math.abs(Number(item.valor)) || 0), 0);

    return {
        receitas,
        despesas,
        saldoLiquido: receitas - despesas
    };
}

function formatarMoeda(valor) {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function renderizarOrcamentoMensal() {
    const container = document.getElementById("orcamentoMensal");
    if (!container) return;

    const mesSelecionado = document.getElementById("orcamentoMes") ? document.getElementById("orcamentoMes").value : MESES_NOMES[new Date().getMonth()];
    const anoSelecionado = document.getElementById("orcamentoAno") ? document.getElementById("orcamentoAno").value : String(new Date().getFullYear());

    const orcamento = obterOrcamentoMensalConfigurado();
    const categoriasPadrao = getCategoriasPadraoOrcamento();
    const categorias = Object.keys(orcamento).sort((a, b) => a.localeCompare(b));

    const totalMeta = categorias.reduce((total, categoria) => total + (Number(orcamento[categoria]) || 0), 0);
    const totalGasto = categorias.reduce((total, categoria) => total + obterTotalGastoCategoria(categoria, mesSelecionado, anoSelecionado), 0);
    const restante = totalMeta - totalGasto;
    const percentualUsado = totalMeta > 0 ? Math.min((totalGasto / totalMeta) * 100, 100) : 0;

    const consolidacaoMes = obterConsolidacaoPeriodo(mesSelecionado, anoSelecionado);
    const mesAnteriorIndex = MESES_NOMES.indexOf((mesSelecionado || '').toUpperCase());
    const mesAnteriorNome = mesAnteriorIndex > 0 ? MESES_NOMES[mesAnteriorIndex - 1] : MESES_NOMES[11];
    const anoAnterior = mesAnteriorIndex > 0 ? Number(anoSelecionado) : Number(anoSelecionado) - 1;
    const consolidacaoAnterior = obterConsolidacaoPeriodo(mesAnteriorNome, anoAnterior);
    const variacaoMes = consolidacaoMes.saldoLiquido - consolidacaoAnterior.saldoLiquido;

    const contas = obterResumoSaldosPorConta();
    const contasPiores = contas
        .filter((conta) => conta.variacao < 0)
        .sort((a, b) => a.variacao - b.variacao)
        .slice(0, 3);

    const cardsCategoria = categoriasPadrao.map((item) => {
        const valor = totalMeta > 0 ? (item.valor / totalMeta) * 100 : 0;
        return `
            <div class="finance-goal-row">
                <div class="row-label">
                    <span>${item.nome}</span>
                    <span>${Math.round(valor)}%</span>
                </div>
                <div class="finance-goal-bar"><span style="width:${Math.min(valor, 100)}%; background:${item.cor};"></span></div>
            </div>
        `;
    }).join('');

    const linhasResumo = categorias.map((categoria) => {
        const limite = Number(orcamento[categoria]) || 0;
        const gasto = obterTotalGastoCategoria(categoria, mesSelecionado, anoSelecionado);
        const percentual = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;
        const frente = gasto > limite ? 'down' : 'up';
        return `
            <tr>
                <td>${categoria}</td>
                <td>${formatarMoeda(limite)}</td>
                <td>${formatarMoeda(gasto)}</td>
                <td>${percentual.toFixed(1)}%</td>
                <td class="${frente}">${formatarMoeda(Math.abs(limite - gasto))}</td>
            </tr>
        `;
    }).join('');

    const contasCards = contas.map((conta) => {
        const tendencia = conta.variacao >= 0 ? 'positive' : 'negative';
        const label = conta.variacao >= 0 ? 'Melhorou' : 'Diminuíu';
        return `
            <div class="finance-account-item">
                <div class="finance-account-meta">
                    <span class="finance-account-name">${conta.nome}</span>
                    <span class="finance-account-value">${formatarMoeda(conta.atual)}</span>
                </div>
                <span class="finance-account-trend ${tendencia}">${label}</span>
            </div>
        `;
    }).join('');

    const contasAlertas = contasPiores.length > 0
        ? contasPiores.map((conta) => `<li>${conta.nome}: ${formatarMoeda(conta.variacao)}</li>`).join('')
        : '<li>Nenhuma conta em alerta neste período.</li>';

    const salarioBase = Number((document.getElementById('initBanrisul') || {}).value || 0) + Number((document.getElementById('initNubank') || {}).value || 0);
    const valorSalario = Number.isFinite(salarioBase) ? salarioBase : 0;
    const salarioElem = document.getElementById('valorSalarioResumo');
    if (salarioElem) salarioElem.textContent = formatarMoeda(valorSalario);

    container.innerHTML = `
        <div class="finance-budget-grid">
            <div class="finance-panel finance-panel--budget">
                <h3>Gastos</h3>
                <div class="finance-donut-box">
                    <div class="finance-donut">
                        <span class="finance-donut-label">${Math.round(percentualUsado)}%</span>
                    </div>
                </div>
                <div class="finance-legend">
                    <span><i class="finance-dot" style="background:#5ca9eb;"></i>Custos fixos</span>
                    <span><i class="finance-dot" style="background:#59c3a8;"></i>Conforto</span>
                    <span><i class="finance-dot" style="background:#f0d37b;"></i>Metas</span>
                    <span><i class="finance-dot" style="background:#9ad9b5;"></i>Liberdade financeira</span>
                </div>
            </div>

            <div class="finance-panel finance-panel--summary">
                <h3>Resumo</h3>
                <table class="finance-summary-table">
                    <thead>
                        <tr>
                            <th>Budget</th>
                            <th>Valor gasto</th>
                            <th>Devo gastar</th>
                            <th>Utilizado</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasResumo}
                    </tbody>
                </table>
                <div class="finance-summary-total">
                    <strong>${formatarMoeda(totalGasto)}</strong>
                    <strong class="${restante >= 0 ? 'up' : 'down'}">${restante >= 0 ? 'Disponível' : 'Acima da meta'} ${formatarMoeda(Math.abs(restante))}</strong>
                </div>
            </div>

            <div class="finance-panel finance-panel--vertical">
                <h3>Metas</h3>
                <div class="finance-goal-list">
                    ${cardsCategoria}
                </div>
            </div>
        </div>

        <div class="finance-card-grid">
            <div class="finance-editor-card">
                <h3>Custos fixos</h3>
                <div class="finance-editor-list">
                    <div class="finance-editor-item"><span class="name">Planos de saúde</span><span class="value">${formatarMoeda(700)}</span></div>
                    <div class="finance-editor-item"><span class="name">Roupas normais</span><span class="value">${formatarMoeda(500)}</span></div>
                    <div class="finance-editor-item"><span class="name">Manutenção básicos</span><span class="value">${formatarMoeda(1500)}</span></div>
                    <div class="finance-editor-item"><span class="name">Seguro de vida</span><span class="value">${formatarMoeda(0)}</span></div>
                </div>
            </div>

            <div class="finance-editor-card">
                <h3>Conforto</h3>
                <div class="finance-editor-list">
                    <div class="finance-editor-item"><span class="name">Compras</span><span class="value">${formatarMoeda(0)}</span></div>
                    <div class="finance-editor-item"><span class="name">Manutenção Superf.</span><span class="value">${formatarMoeda(300)}</span></div>
                    <div class="finance-editor-item"><span class="name">Assinatura de vinho</span><span class="value">${formatarMoeda(100)}</span></div>
                    <div class="finance-editor-item"><span class="name">Café / pequenos</span><span class="value">${formatarMoeda(120)}</span></div>
                </div>
            </div>

            <div class="finance-editor-card">
                <h3>Metas</h3>
                <div class="finance-editor-list">
                    <div class="finance-editor-item"><span class="name">Fundo emergência</span><span class="value">${formatarMoeda(1000)}</span></div>
                    <div class="finance-editor-item"><span class="name">Invest. aposentadoria</span><span class="value">${formatarMoeda(1500)}</span></div>
                    <div class="finance-editor-item"><span class="name">Viagem</span><span class="value">${formatarMoeda(650)}</span></div>
                    <div class="finance-editor-item"><span class="name">Reserva</span><span class="value">${formatarMoeda(500)}</span></div>
                </div>
            </div>
        </div>

        <div class="finance-bottom-grid">
            <div class="finance-quick-card">
                <h3>Saldo por conta</h3>
                <div class="finance-account-list">
                    ${contasCards}
                </div>
            </div>

            <div class="finance-quick-card">
                <h3>Conciliação por período</h3>
                <div class="finance-metric-box">
                    <span class="label">Receitas</span>
                    <strong>${formatarMoeda(consolidacaoMes.receitas)}</strong>
                </div>
                <div class="finance-metric-box">
                    <span class="label">Despesas</span>
                    <strong>${formatarMoeda(consolidacaoMes.despesas)}</strong>
                </div>
                <div class="finance-metric-box">
                    <span class="label">Saldo líquido</span>
                    <strong class="${consolidacaoMes.saldoLiquido >= 0 ? 'good' : 'bad'}">${formatarMoeda(consolidacaoMes.saldoLiquido)}</strong>
                </div>
            </div>

            <div class="finance-quick-card">
                <h3>Variação líquida</h3>
                <div class="finance-metric-box">
                    <span class="label">Mês atual</span>
                    <strong class="${variacaoMes >= 0 ? 'good' : 'bad'}">${variacaoMes >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(variacaoMes))}</strong>
                    <p>Comparado com ${mesAnteriorNome} de ${anoAnterior}.</p>
                </div>
                <ul class="finance-legend-row">
                    ${contasAlertas}
                </ul>
            </div>
        </div>
    `;
}

function abrirConfiguracaoSistema() {
    const modal = document.getElementById('configModal');
    if (!modal) return;
    const mes = document.getElementById('configMesAtual');
    const ano = document.getElementById('configAnoAtual');
    if (mes) {
        mes.innerHTML = MESES_NOMES.map((item) => `<option value="${item}">${item}</option>`).join('');
        mes.value = document.getElementById('orcamentoMes') ? document.getElementById('orcamentoMes').value : MESES_NOMES[new Date().getMonth()];
    }
    if (ano) {
        const startYear = 2024;
        const currentYear = new Date().getFullYear();
        const options = [];
        for (let year = startYear; year <= currentYear + 2; year += 1) {
            options.push(`<option value="${year}">${year}</option>`);
        }
        ano.innerHTML = options.join('');
        ano.value = document.getElementById('orcamentoAno') ? document.getElementById('orcamentoAno').value : String(currentYear);
    }
    preencherInputsSaldos();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharConfiguracaoSistema() {
    const modal = document.getElementById('configModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

function salvarConfiguracaoSistema() {
    salvarSaldosIniciais();
    if (document.getElementById('configMesAtual') && document.getElementById('orcamentoMes')) {
        document.getElementById('orcamentoMes').value = document.getElementById('configMesAtual').value;
    }
    if (document.getElementById('configAnoAtual') && document.getElementById('orcamentoAno')) {
        document.getElementById('orcamentoAno').value = document.getElementById('configAnoAtual').value;
    }
    renderizarOrcamentoMensal();
    fecharConfiguracaoSistema();
}

function inicializarConfiguracaoSistema() {
    const buttonAbrir = document.getElementById('btnAbrirConfiguracao');
    const buttonFechar = document.getElementById('btnFecharConfiguracao');
    const buttonSalvar = document.getElementById('btnSalvarConfiguracao');
    const buttonReset = document.getElementById('btnResetConfig');

    if (buttonAbrir) {
        buttonAbrir.addEventListener('click', abrirConfiguracaoSistema);
    }
    if (buttonFechar) {
        buttonFechar.addEventListener('click', fecharConfiguracaoSistema);
    }
    if (buttonSalvar) {
        buttonSalvar.addEventListener('click', salvarConfiguracaoSistema);
    }
    if (buttonReset) {
        buttonReset.addEventListener('click', () => {
            localStorage.removeItem('init_banrisul');
            localStorage.removeItem('init_nubank');
            localStorage.removeItem('init_valealim');
            localStorage.removeItem('init_valeref');
            preencherInputsSaldos();
            exibirBanner('Configuração padrão restaurada.', 'success', 3000);
        });
    }

    const backdrop = document.querySelector('[data-close-config="true"]');
    if (backdrop) {
        backdrop.addEventListener('click', fecharConfiguracaoSistema);
    }
}

function inicializarOrcamentoUi() {
    const mes = document.getElementById('orcamentoMes');
    const ano = document.getElementById('orcamentoAno');
    if (mes && !mes.value) {
        mes.value = MESES_NOMES[new Date().getMonth()];
    }
    if (ano && !ano.value) {
        ano.value = String(new Date().getFullYear());
    }
    inicializarConfiguracaoSistema();
}

function iniciarEscutaRealtime() {
    preencherInputsSaldos();
    db.collection("lancamentos").onSnapshot((snapshot) => {
        todosLancamentosCache = [];
        const anosEncontrados = new Set();

        snapshot.forEach((doc) => {
            const dados = doc.data();
            dados.id = doc.id;
            todosLancamentosCache.push(dados);
            if (dados.data && dados.data.includes("/")) {
                const ano = dados.data.split("/")[2];
                if (ano) anosEncontrados.add(ano);
            }
        });

        atualizarSelectAnos(anosEncontrados);
        todosLancamentosCache.sort((a, b) => converterDataParaOrdenacao(b.data) - converterDataParaOrdenacao(a.data));

        calcularSaldosContasGlobais();
        renderizarFeedFiltrado();
        renderizarOrcamentoMensal();
    });
}

function atualizarSelectAnos(anosEncontrados) {
    const anosOrdenados = Array.from(anosEncontrados).sort((a, b) => b - a);
    const selectAno = document.getElementById("filtroAno");
    if (!selectAno) return;

    const valorSelecionadoAntes = selectAno.value;

    selectAno.innerHTML = '<option value="TODOS">Todos</option>';
    anosOrdenados.forEach(ano => {
        selectAno.innerHTML += `<option value="${ano}">${ano}</option>`;
    });

    if (valorSelecionadoAntes) selectAno.value = valorSelecionadoAntes;
}

function salvarFiltrosIndex() {
    const filtros = {};
    document.querySelectorAll("select, input[type='checkbox']").forEach(elem => {
        if (elem.id && !elem.id.startsWith("edit") && !elem.id.startsWith("new") && elem.id !== "searchInput") {
            filtros[elem.id] = elem.type === "checkbox" ? elem.checked : elem.value;
        }
    });
    localStorage.setItem("dashfin_filtros_index", JSON.stringify(filtros));
}

function carregarFiltrosIndex() {
    const filtrosSalvos = localStorage.getItem("dashfin_filtros_index");
    if (filtrosSalvos) {
        const filtros = JSON.parse(filtrosSalvos);
        Object.keys(filtros).forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                if (elem.type === "checkbox") elem.checked = filtros[id];
                else elem.value = filtros[id];
            }
        });
    }
}

function limparFiltrosIndex() {
    localStorage.removeItem("dashfin_filtros_index");
    document.querySelectorAll("select, input[type='checkbox']").forEach(elem => {
        if (elem.id && !elem.id.startsWith("edit") && !elem.id.startsWith("new") && elem.id !== "searchInput") {
            if (elem.type === "checkbox") {
                elem.checked = true;
            } else {
                if (elem.id.toLowerCase().includes("ano")) elem.value = "TODOS";
                else if (Array.from(elem.options).some(o => o.value === "TODOS")) elem.value = "TODOS";
                else elem.value = elem.options[0].value;
            }
        }
    });
    limparBusca();
    if (typeof renderizarFeedFiltrado === "function") renderizarFeedFiltrado();
}

function inicializarEventosDashboard() {
    document.querySelectorAll("select, input[type='checkbox']").forEach(elem => {
        if (elem.id && !elem.id.startsWith("edit") && !elem.id.startsWith("new") && elem.id !== "searchInput") {
            elem.addEventListener("change", () => {
                salvarFiltrosIndex();
                renderizarFeedFiltrado();
                renderizarOrcamentoMensal();
            });
        }
    });
}
