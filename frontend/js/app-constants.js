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

let todosLancamentosCache = [];
let termoBuscaAtivo = "";

function inicializarBusca() {
    const searchInput = document.getElementById("searchInput");
    const btnLimpar = document.getElementById("btnLimparBusca");

    if (!searchInput || !btnLimpar) return;

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
    const searchInput = document.getElementById("searchInput");
    const btnLimpar = document.getElementById("btnLimparBusca");

    if (searchInput) searchInput.value = "";
    if (btnLimpar) btnLimpar.style.display = "none";
    limparInfoBusca();
    renderizarFeedFiltrado();
}

function atualizarInfoBusca(termo) {
    const info = document.getElementById("searchResultsInfo");
    if (!info) return;
    info.textContent = `🔍 Buscando por: "${termo}"`;
    info.classList.add("ativo");
}

function limparInfoBusca() {
    const info = document.getElementById("searchResultsInfo");
    if (!info) return;
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
    const initBanrisul = document.getElementById("initBanrisul");
    const initNubank = document.getElementById("initNubank");
    const initValeAlim = document.getElementById("initValeAlim");
    const initValeRef = document.getElementById("initValeRef");

    if (initBanrisul) initBanrisul.value = saldos.banrisul;
    if (initNubank) initNubank.value = saldos.nubank;
    if (initValeAlim) initValeAlim.value = saldos.valealim;
    if (initValeRef) initValeRef.value = saldos.valeref;
}

function salvarSaldosIniciais() {
    localStorage.setItem("init_banrisul", document.getElementById("initBanrisul").value);
    localStorage.setItem("init_nubank", document.getElementById("initNubank").value);
    localStorage.setItem("init_valealim", document.getElementById("initValeAlim").value);
    localStorage.setItem("init_valeref", document.getElementById("initValeRef").value);
    exibirBanner("Ajustes de saldo inicial salvos com sucesso!", "success", 4000);
    calcularSaldosContasGlobais();
    renderizarFeedFiltrado();
}

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
