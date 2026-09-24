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
        macroCategoriaAUVP: subcat
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
    const subcategoriaExibida = item.subcategoria || item.macroCategoriaAUVP || 'Custo Variável';
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

function renderizarOrcamentoMensal() {
    const container = document.getElementById("orcamentoMensal");
    if (!container) return;

    const mesSelect = document.getElementById("orcamentoMes");
    const anoSelect = document.getElementById("orcamentoAno");
    if (mesSelect && !mesSelect.value) {
        mesSelect.value = MESES_NOMES[new Date().getMonth()];
    }
    if (anoSelect && !anoSelect.value) {
        anoSelect.value = String(new Date().getFullYear());
    }

    const orcamento = obterOrcamentoMensalConfigurado();
    const { mesSelecionado, anoSelecionado } = obterPeriodoOrcamento();
    const categorias = Object.keys(orcamento).sort((a, b) => a.localeCompare(b));

    const categoriasDetalhadas = categorias.map((categoria) => {
        const limite = Number(orcamento[categoria]) || 0;
        const gasto = obterTotalGastoCategoria(categoria, mesSelecionado, anoSelecionado);
        const percentual = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;
        const restante = limite - gasto;
        const alerta = gasto > limite;
        const percentualMeta = limite > 0 ? Math.round((gasto / limite) * 100) : 0;

        let statusText = 'Dentro do limite';
        if (alerta) statusText = 'Acima do limite';
        else if (percentualMeta >= 75) statusText = 'Perto do limite';

        let dica = 'Ainda dá para gastar com consciência.';
        if (alerta) {
            dica = `Você excedeu a meta em R$ ${Math.abs(restante).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Revise esse gasto.`;
        } else if (percentualMeta >= 75) {
            dica = `Você já usou ${percentualMeta}% da meta. Fique atento ao restante do mês.`;
        } else if (restante > 0) {
            dica = `Ainda restam R$ ${restante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para essa categoria.`;
        }

        return {
            categoria,
            limite,
            gasto,
            restante,
            alerta,
            percentual,
            statusText,
            dica
        };
    });

    const totalLimite = categoriasDetalhadas.reduce((sum, item) => sum + item.limite, 0);
    const totalGasto = categoriasDetalhadas.reduce((sum, item) => sum + item.gasto, 0);
    const restanteTotal = totalLimite - totalGasto;
    const percentualTotal = totalLimite > 0 ? Math.min((totalGasto / totalLimite) * 100, 100) : 0;
    const categoriasEmAlerta = categoriasDetalhadas.filter((item) => item.alerta || item.percentual >= 75);
    const categoriaCritica = categoriasDetalhadas
        .slice()
        .sort((a, b) => (b.gasto / (b.limite || 1)) - (a.gasto / (a.limite || 1)))[0];

    const mesAnterior = (() => {
        const meses = MESES_NOMES;
        const indexAtual = meses.indexOf(mesSelecionado.toUpperCase());
        const anoAnterior = indexAtual === 0 ? Number(anoSelecionado) - 1 : Number(anoSelecionado);
        const mesAnteriorNome = indexAtual === 0 ? meses[11] : meses[indexAtual - 1];
        return { mesAnteriorNome, anoAnterior };
    })();

    const totalMesAnterior = categorias.reduce((sum, categoria) => {
        const valor = obterTotalGastoCategoria(categoria, mesAnterior.mesAnteriorNome, mesAnterior.anoAnterior);
        return sum + valor;
    }, 0);

    const variacaoMes = totalGasto - totalMesAnterior;
    const variacaoDirecao = variacaoMes > 0 ? 'acima' : variacaoMes < 0 ? 'abaixo' : 'igual';
    const variacaoTexto = `Comparado ao mês anterior (${mesAnterior.mesAnteriorNome} / ${mesAnterior.anoAnterior}), você está ${variacaoDirecao} em R$ ${Math.abs(variacaoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

    const categoriasSugeridas = categoriasDetalhadas
        .filter((item) => item.alerta || item.percentual >= 75)
        .sort((a, b) => (b.gasto / (b.limite || 1)) - (a.gasto / (a.limite || 1)))
        .slice(0, 3)
        .map((item) => `
            <li>
                <strong>${item.categoria}</strong> — ${item.alerta ? 'acima da meta' : 'próxima do limite'}.
                Gasto atual: R$ ${item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
            </li>
        `).join("");

    const sugestoesLista = categoriasSugeridas || '<li>Sem alertas neste período. Mantenha o controle e evite gastos impulsivos.</li>';

    const valorDisponivel = Math.max(restanteTotal, 0);
    const valorExcedido = Math.max(Math.abs(restanteTotal), 0);
    const mensagemDecisao = restanteTotal >= 0
        ? `Você ainda tem R$ ${valorDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} disponíveis para o mês. ${categoriaCritica ? `Foco em ${categoriaCritica.categoria}: ela é a categoria mais sensível no momento.` : 'Mantenha o ritmo e evite novos gastos impulsivos.'}`
        : `O mês está acima da meta em R$ ${valorExcedido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Ajuste os gastos de ${categoriaCritica ? categoriaCritica.categoria : 'algumas categorias'} para recuperar o equilíbrio.`;

    const listaLinhas = categoriasDetalhadas.map((item) => `
        <div class="orcamento-item ${item.alerta ? 'alerta' : ''}">
            <div class="orcamento-header">
                <strong>${item.categoria}</strong>
                <span class="orcamento-status ${item.alerta ? 'status-alerta' : item.percentual >= 75 ? 'status-warning' : 'status-ok'}">
                    ${item.statusText}
                </span>
            </div>
            <div class="orcamento-main">
                <div class="orcamento-valores">
                    <span>Gasto: <strong>R$ ${item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                    <span>Meta: <strong>R$ ${item.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>
                <input
                    class="orcamento-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${item.limite}"
                    data-categoria="${item.categoria}"
                    aria-label="Orçamento para ${item.categoria}"
                >
            </div>
            <div class="orcamento-bar">
                <span style="width: ${item.percentual}%"></span>
            </div>
            <div class="orcamento-meta">
                <span>${item.restante >= 0 ? 'Restante' : 'Excedido'}: <strong>R$ ${Math.abs(item.restante).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>
            <div class="orcamento-dica">${item.dica}</div>
        </div>
    `).join("");

    const alertaLista = categoriasEmAlerta.length > 0
        ? categoriasEmAlerta.map((item) => `<li>${item.categoria}: ${item.alerta ? 'acima da meta' : 'próxima do limite'} (${item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${item.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</li>`).join("")
        : '<li>Nenhuma categoria está em alerta neste período.</li>';

    const resumoEstado = restanteTotal >= 0 ? 'positivo' : 'negativo';
    const resumoLabel = restanteTotal >= 0 ? 'Disponível' : 'Excedido';

    container.innerHTML = `
        <div class="orcamento-dashboard">
            <div class="orcamento-resumo">
                <div>
                    <span class="orcamento-label">Gasto total</span>
                    <strong>R$ ${totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div>
                    <span class="orcamento-label">Meta do mês</span>
                    <strong>R$ ${totalLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div class="${resumoEstado}">
                    <span class="orcamento-label">${resumoLabel}</span>
                    <strong>R$ ${Math.abs(restanteTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
            </div>

            <div class="orcamento-insights">
                <div class="orcamento-insight-card">
                    <div class="insight-title">Resumo do mês</div>
                    <div class="insight-value">${Math.round(percentualTotal)}% usado</div>
                    <p>${mensagemDecisao}</p>
                </div>
                <div class="orcamento-insight-card">
                    <div class="insight-title">Comparativo</div>
                    <div class="insight-value ${variacaoMes >= 0 ? 'up' : 'down'}">${variacaoMes >= 0 ? '+' : '-'}R$ ${Math.abs(variacaoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p>${variacaoTexto}</p>
                </div>
            </div>

            <div class="orcamento-alertas">
                <div class="alertas-header">Atenção</div>
                <ul>${alertaLista}</ul>
            </div>

            <div class="orcamento-acao">
                <div class="alertas-header">O que ajustar agora</div>
                <ul>${sugestoesLista}</ul>
            </div>

            <div class="orcamento-lista">${listaLinhas}</div>
            <button class="btn-salvar-orcamento" type="button" onclick="salvarOrcamentoMensal()">Salvar orçamento</button>
        </div>
    `;
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
