import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

document.getElementById('btn-login').addEventListener('click', loginComGoogle);
const auth = getAuth();
const provider = new GoogleAuthProvider();

function loginComGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Login com sucesso!
      console.log("Usuário logado:", result.user.email);
      location.reload(); // Recarrega a página para carregar os dados
    }).catch((error) => {
      console.error("Erro no login:", error.message);
    });
}

    // ========== CONSTANTES ==========
    const CUSTOS_FIXOS = [
        "Celular", "Combustível", "Condomínio", "Conta de Agua", 
        "Conta de Luz", "Creche", "Financiamento Casa", "Gás", 
        "Internet", "IPTU", "IPVA", "IRPF"
    ];

    const MAPA_RECEITAS = [
        "Ajuda de custos", "Benefício Vale Alimentação", "Benefício Vale Refeição",
        "Bonus PPR", "Décimo terceiro Salário", "Férias", "Prêmio Receita Certa", "Salário"
    ];

    const LISTA_CATEGORIAS = [
        "Ajuda de custos", "Barba e Cabelo", "Benefício Vale Alimentação", "Benefício Vale Refeição",
        "Bonus PPR", "Cafezinho", "Carro", "Celular", "Combustível", "Condomínio", "Conta de Agua",
        "Conta de Luz", "Creche", "Dentista", "Décimo terceiro Salário", "Estacionamento", "Farmácia",
        "Faxina", "Feira", "Financiamento Casa", "Férias", "Gás", "Gastos com Cursos", "Gastos com Jogos ou PC",
        "Gastos com Livros", "Gastos Pessoais", "Internet", "IPTU", "IPVA", "IRPF", "Lazer", "Materiais de Construção",
        "Material de Ferragem ou Ferramentas", "Médico", "Móveis", "Padaria", "Pedágio", "Pet", "Pilates",
        "Prêmio Receita Certa", "Presentes", "Prioridades Financeiras (15%)", "Reforma da Casa", "Restaurante",
        "Salário", "Seguro da Casa", "Seguro do Carro", "Streamings", "Supermercado", "Taxas do Cartório",
        "Taxi/Uber", "Terapeuta", "Transferência", "Utensílios para casa", "Vestuário", "Viagens"
    ];

    const MESES_NOMES = [
        "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
        "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
    ];

    const LISTA_CONTAS = [
        "Banrisul", "Cartão Nubank", "Cartão XP", "Carteira", 
        "Vale Alimentação", "Vale Refeição"
    ];

    // ========== CACHE E ESTADO ==========
    let todosLancamentosCache = [];
    let termoBuscaAtivo = "";

    // ========== FUNÇÕES DE BUSCA RÁPIDA ==========
    function inicializarBusca() {
        const searchInput = document.getElementById("searchInput");
        const btnLimpar = document.getElementById("btnLimparBusca");

        searchInput.addEventListener("input", (e) => {
            termoBuscaAtivo = e.target.value.trim();
            
            if (termoBuscaAtivo.length > 0) {
                btnLimpar.style.display = "block";
                atualizarInfoBusca(termoBuscaAtivo);
            } else {
                btnLimpar.style.display = "none";
                limparInfoBusca();
            }

            renderizarFeedFiltrado();
        });
    }

    function limparBusca() {
        termoBuscaAtivo = "";
        document.getElementById("searchInput").value = "";
        document.getElementById("btnLimparBusca").style.display = "none";
        limparInfoBusca();
        renderizarFeedFiltrado();
    }

    function atualizarInfoBusca(termo) {
        const info = document.getElementById("searchResultsInfo");
        info.textContent = `🔍 Buscando por: "${termo}"`;
        info.classList.add("ativo");
    }

    function limparInfoBusca() {
        const info = document.getElementById("searchResultsInfo");
        info.classList.remove("ativo");
        info.textContent = "";
    }

    function correspondeABusca(item, termo) {
        if (!termo) return true;

        const termoLower = termo.toLowerCase();
        const descricao = (item.descricao || "").toLowerCase();
        const categoria = (item.categoriaOriginal || "").toLowerCase();
        const subcategoria = (item.subcategoria || "").toLowerCase();
        const conta = (item.contaOrigem || "").toLowerCase();

        return descricao.includes(termoLower) ||
               categoria.includes(termoLower) ||
               subcategoria.includes(termoLower) ||
               conta.includes(termoLower);
    }

    function destacarBuscaEmTexto(texto, termo) {
        if (!termo) return texto;
        
        const regex = new RegExp(`(${termo})`, 'gi');
        return texto.replace(regex, '<span class="highlight">$1</span>');
    }

    // ========== FUNÇÕES DE SALDOS ==========
    function obterSaldosIniciaisConfigurados() {
        const b = localStorage.getItem("init_banrisul");
        const n = localStorage.getItem("init_nubank");
        const a = localStorage.getItem("init_valealim");
        const r = localStorage.getItem("init_valeref");
        return {
            banrisul: (b !== null && !isNaN(parseFloat(b))) ? parseFloat(b) : 18935.20,
            nubank: (n !== null && !isNaN(parseFloat(n))) ? parseFloat(n) : -2405.18,
            valealim: (a !== null && !isNaN(parseFloat(a))) ? parseFloat(a) : 779.83,
            valeref: (r !== null && !isNaN(parseFloat(r))) ? parseFloat(r) : 71.58
        };
    }

    function preencherInputsSaldos() {
        const saldos = obterSaldosIniciaisConfigurados();
        document.getElementById("initBanrisul").value = saldos.banrisul;
        document.getElementById("initNubank").value = saldos.nubank;
        document.getElementById("initValeAlim").value = saldos.valealim;
        document.getElementById("initValeRef").value = saldos.valeref;
    }

    function salvarSaldosIniciais() {
        localStorage.setItem("init_banrisul", document.getElementById("initBanrisul").value);
        localStorage.setItem("init_nubank", document.getElementById("initNubank").value);
        localStorage.setItem("init_valealim", document.getElementById("initValeAlim").value);
        localStorage.setItem("init_valeref", document.getElementById("initValeRef").value);
        alert("Ajustes de saldo inicial salvos com sucesso!");
        calcularSaldosContasGlobais();
        renderizarFeedFiltrado();
    }

    // ========== FUNÇÕES DE FORMATAÇÃO ==========
    function converterDataParaOrdenacao(dataString) {
        if (!dataString) return new Date(0);
        const partes = dataString.split("/");
        if (partes.length !== 3) return new Date(0);
        return new Date(partes[2], partes[1] - 1, partes[0]);
    }

    function formatarValorMonetario(valor) {
        return valor.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    function gerarOpcoesSelect(lista, valorSelecionado = "") {
        return lista.map(item => 
            `<option value="${item}" ${item === valorSelecionado ? 'selected' : ''}>${item}</option>`
        ).join('');
    }

    // ========== FUNÇÕES DE LANÇAMENTO ==========
    function criarLinhaNovoLancamentoInline() {
        if (document.getElementById("linhaNovoLancamento")) return;

        const feedContainer = document.getElementById("feedLancamentos");
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
        div.querySelector("#newDescricao").focus();
    }

    function cancelarNovoLancamento() {
        const linha = document.getElementById("linhaNovoLancamento");
        if (linha) linha.remove();
        renderizarFeedFiltrado();
    }

    function anexarEventosMovimentacao(prefixo, container) {
        const radios = container.querySelectorAll(`input[name="${prefixo}Mov${prefixo === 'new' ? '' : '-' + prefixo.substring(4)}"]`);
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
            isPago ? "Pago" : "Previsão", contaOrigem, 
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

    // ========== FUNÇÕES DE EDIÇÃO ==========
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
            isPago ? "Pago" : "Previsão", contaOrigem, 
            mov === "Transferência" ? contaDestino : "Nenhuma (Uso Geral)",
            category, subcat
        );

        try {
            await db.collection("lancamentos").doc(id).update(atualizadoDoc);
        } catch (e) {
            console.error("Erro ao atualizar lançamento:", e);
            alert("Erro ao atualizar no banco.");
        }
    }

    // ========== FUNÇÕES DE DELETAR E ALTERNAR STATUS ==========
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

    // ========== FUNÇÕES DE CÁLCULO ==========
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
        document.getElementById("saldoBanrisul").innerText = "R$ " + formatarValorMonetario(saldos.banrisul);
        document.getElementById("saldoNubank").innerText = "R$ " + formatarValorMonetario(saldos.nubank);
        document.getElementById("saldoValeRef").innerText = "R$ " + formatarValorMonetario(saldos.valeref);
        document.getElementById("saldoValeAlim").innerText = "R$ " + formatarValorMonetario(saldos.valealim);
    }

    // ========== FUNÇÕES DE CONCILIAÇÃO DIÁRIA ==========
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

    // ========== FUNÇÕES DE RENDERIZAÇÃO ==========
    function renderizarFeedFiltrado() {
        const filtros = obterFiltrosSelecionados();
        const feedContainer = document.getElementById("feedLancamentos");
        const linhaInputExistente = document.getElementById("linhaNovoLancamento");
        
        feedContainer.innerHTML = "";
        if (linhaInputExistente) {
            feedContainer.appendChild(linhaInputExistente);
        }

        let somaFiltrada = 0;
        let contador = 0;

        // Agrupar por data
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

        // Ordenar datas em ordem decrescente
        const datasOrdenadas = Object.keys(itensPorData).sort((a, b) => 
            converterDataParaOrdenacao(b) - converterDataParaOrdenacao(a)
        );

        // Renderizar agrupados por data
        datasOrdenadas.forEach(data => {
            const itens = itensPorData[data];
            
            // Calcular saldo do dia
            const saldoInicial = obterSaldoInicialParaData(data, filtros);
            const saldoDiario = calcularSaldoDiario(data, filtros, saldoInicial);

            // Criar header da data
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

            // Criar container para itens
            const itemsContainer = document.createElement("div");
            itemsContainer.className = "items-por-data";

            // Adicionar itens do dia
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
        document.getElementById("contadorItens").innerText = `${contador} lançamentos exibidos`;
        
        const txtTotal = document.getElementById("txtTotalFiltrado");
        txtTotal.innerText = "R$ " + formatarValorMonetario(somaFiltrada);
        
        if (somaFiltrada > 0) txtTotal.className = "text-receita";
        else if (somaFiltrada < 0) txtTotal.className = "text-despesa";
        else txtTotal.className = "text-neutro";

        if (contador === 0 && !linhaInputExistente) {
            feedContainer.innerHTML = `<div class="no-data">Nenhum lançamento encontrado para os filtros selecionados.</div>`;
        }
    }

    // ========== FUNÇÕES DE FIREBASE ==========
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
        const valorSelecionadoAntes = selectAno.value;
        
        selectAno.innerHTML = '<option value="TODOS">Todos</option>';
        anosOrdenados.forEach(ano => {
            selectAno.innerHTML += `<option value="${ano}">${ano}</option>`;
        });
        
        if (valorSelecionadoAntes) selectAno.value = valorSelecionadoAntes;
    }

    // ========== FUNÇÕES DE FILTROS (PERSISTÊNCIA) ==========
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

    // ========== EVENT LISTENERS ==========
    document.addEventListener('DOMContentLoaded', () => {
    carregarFiltrosIndex(); // Carrega os filtros salvos
    iniciarEscutaRealtime(); // Conecta ao Firebase
    inicializarBusca();      // Inicia a busca
    
    // Adiciona os event listeners SOMENTE após o DOM carregar
    document.querySelectorAll("select, input[type='checkbox']").forEach(elem => {
        if (elem.id && !elem.id.startsWith("edit") && !elem.id.startsWith("new") && elem.id !== "searchInput") {
            elem.addEventListener("change", () => {
                salvarFiltrosIndex();
                renderizarFeedFiltrado();
            });
        }
    });
});

// Este observador gerencia o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        // USUÁRIO LOGADO: Agora é seguro carregar os dados
        console.log("Usuário autenticado:", user.email);
        
        // Esconde o botão de login se existir
        const btnLogin = document.getElementById('btn-login');
        if (btnLogin) btnLogin.style.display = 'none';

        // Inicia o carregamento dos dados
        iniciarEscutaRealtime(); 
        inicializarBusca();
        carregarFiltrosIndex();
    } else {
        // USUÁRIO DESLOGADO: Não carrega dados
        console.log("Aguardando login...");
        
        // Opcional: Limpa o feed e mostra aviso
        const feed = document.getElementById("feedLancamentos");
        if (feed) {
            feed.innerHTML = '<div class="no-data">Por favor, faça login para visualizar seus dados.</div>';
        }
    }
});
    // ========== INICIALIZAÇÃO ==========
 //   window.addEventListener('load', () => {
 //       iniciarEscutaRealtime();
 //      inicializarBusca();
 //   });
 
//    document.addEventListener('DOMContentLoaded', () => {
//        carregarFiltrosIndex();
//       if (typeof renderizarFeedFiltrado === "function") renderizarFeedFiltrado();
//    });