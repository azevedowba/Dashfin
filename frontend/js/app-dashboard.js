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
        alert("Por favor, preencha a Descrição, o Valor, a Categoria e a Data.");
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
        const inputRow = document.getElementById("linhaNovoLancamento");
        if (inputRow) inputRow.remove();
    } catch (e) {
        console.error("Erro ao salvar lançamento:", e);
        alert("Erro ao salvar no banco.");
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
        alert("Por favor, preencha a Descrição, o Valor, a Categoria e a Data.");
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
    } catch (e) {
        console.error("Erro ao atualizar lançamento:", e);
        alert("Erro ao atualizar no banco.");
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
    if (confirm(`Excluir permanentemente "${desc}"?`)) {
        try {
            await db.collection("lancamentos").doc(id).delete();
        } catch (e) {
            console.error("Erro ao deletar lançamento:", e);
        }
    }
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
            });
        }
    });
}
