(function () {
    "use strict";

    const PAGE_LABELS = {
        "index.html": "Resumo",
        "orcamento.html": "Orçamento",
        "graficos.html": "Gráficos",
        "operacoes.html": "Transações"
    };

    function criarIcone(nome) {
        const icones = {
            menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>',
            buscar: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>',
            adicionar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
            usuario: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></svg>',
            chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'
        };
        return icones[nome] || "";
    }

    function montarHeader() {
        const main = document.querySelector(".finance-main");
        if (!main || document.querySelector(".dashfin-topbar")) return;

        const paginaAtual = location.pathname.split("/").pop() || "index.html";
        const titulo = PAGE_LABELS[paginaAtual] || "Dashfin";

        const header = document.createElement("header");
        header.className = "dashfin-topbar";
        header.innerHTML = `
            <div class="dashfin-topbar-start">
                <button type="button" class="dashfin-menu-toggle" aria-label="Recolher menu" aria-expanded="true">${criarIcone("menu")}</button>
                <div class="dashfin-page-context">
                    <span>Área pessoal</span>
                    <strong>${titulo}</strong>
                </div>
            </div>
            <div class="dashfin-topbar-actions">
                <button type="button" class="dashfin-global-search" aria-label="Pesquisar">${criarIcone("buscar")}<span>Pesquisar</span><kbd>⌘ K</kbd></button>
                <button type="button" class="dashfin-add-button">${criarIcone("adicionar")}<span>Nova transação</span></button>
                <div class="dashfin-profile">
                    <button type="button" class="dashfin-profile-button" aria-expanded="false">
                        <span class="dashfin-profile-avatar">DF</span>
                        <span class="dashfin-profile-copy"><strong>Minha conta</strong><small>Sincronizado</small></span>
                        ${criarIcone("chevron")}
                    </button>
                    <div class="dashfin-profile-menu" hidden>
                        <div class="dashfin-profile-info"><strong id="dashfinProfileName">Usuário</strong><span id="dashfinProfileEmail"></span></div>
                        <button type="button" class="dashfin-profile-menu-item" data-action="theme">Alternar tema</button>
                        <button type="button" class="dashfin-profile-menu-item" id="dashfinProfileLogout">Sair da conta</button>
                    </div>
                </div>
            </div>
        `;

        main.prepend(header);

        const shell = document.querySelector(".finance-shell");
        const menuToggle = header.querySelector(".dashfin-menu-toggle");
        menuToggle.addEventListener("click", () => {
            const fechado = shell.classList.toggle("sidebar-collapsed");
            menuToggle.setAttribute("aria-expanded", String(!fechado));
        });

        const profileButton = header.querySelector(".dashfin-profile-button");
        const profileMenu = header.querySelector(".dashfin-profile-menu");
        profileButton.addEventListener("click", () => {
            const aberto = !profileMenu.hidden;
            profileMenu.hidden = aberto;
            profileButton.setAttribute("aria-expanded", String(!aberto));
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".dashfin-profile")) {
                profileMenu.hidden = true;
                profileButton.setAttribute("aria-expanded", "false");
            }
        });

        header.querySelector("[data-action='theme']").addEventListener("click", () => {
            const toggler = document.getElementById("btn-theme-toggle");
            if (toggler) toggler.click();
        });

        header.querySelector(".dashfin-add-button").addEventListener("click", abrirModalNovaTransacao);
        header.querySelector(".dashfin-global-search").addEventListener("click", focarBuscaGlobal);

        document.addEventListener("keydown", (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                focarBuscaGlobal();
            }
            if (event.key === "Escape") fecharModalNovaTransacao();
        });

        atualizarPerfilUsuario();
    }

    function focarBuscaGlobal() {
        const busca = document.getElementById("searchInput") || document.querySelector("input[placeholder*='Buscar']") || document.querySelector(".dashfin-global-search");
        if (busca && typeof busca.focus === "function") busca.focus();
    }

    function atualizarPerfilUsuario() {
        const auth = window.DASHFIN && window.DASHFIN.auth;
        if (!auth || !auth.onAuthStateChanged) return;

        auth.onAuthStateChanged((user) => {
            if (!user) return;
            const name = document.getElementById("dashfinProfileName");
            const email = document.getElementById("dashfinProfileEmail");
            const avatar = document.querySelector(".dashfin-profile-avatar");
            if (name) name.textContent = user.displayName || "Minha conta";
            if (email) email.textContent = user.email || "";
            if (avatar) avatar.textContent = (user.displayName || user.email || "DF").substring(0, 2).toUpperCase();
        });
    }

    function montarModalNovaTransacao() {
        if (document.getElementById("dashfinTransactionModal")) return;
        const modal = document.createElement("div");
        modal.id = "dashfinTransactionModal";
        modal.className = "dashfin-transaction-modal";
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
            <div class="dashfin-transaction-backdrop" data-close="true"></div>
            <section class="dashfin-transaction-panel" role="dialog" aria-modal="true" aria-labelledby="dashfinTransactionTitle">
                <header>
                    <div><span>Movimentação financeira</span><h2 id="dashfinTransactionTitle">Nova transação</h2></div>
                    <button type="button" class="dashfin-transaction-close" aria-label="Fechar">×</button>
                </header>
                <form id="dashfinTransactionForm">
                    <div class="dashfin-type-switch" role="radiogroup" aria-label="Tipo da transação">
                        <label><input type="radio" name="dashfinMov" value="Despesa" checked><span>Despesa</span></label>
                        <label><input type="radio" name="dashfinMov" value="Receita"><span>Receita</span></label>
                        <label><input type="radio" name="dashfinMov" value="Transferência"><span>Transferência</span></label>
                    </div>
                    <div class="dashfin-transaction-grid">
                        <label class="dashfin-field"><span>Descrição</span><input id="dashfinDesc" type="text" placeholder="Ex.: Supermercado" required></label>
                        <label class="dashfin-field"><span>Valor</span><input id="dashfinValor" type="number" step="0.01" min="0.01" placeholder="0,00" required></label>
                        <label class="dashfin-field"><span>Data</span><input id="dashfinData" type="date" required></label>
                        <label class="dashfin-field"><span>Conta</span><select id="dashfinConta"><option>Banrisul</option><option>Cartão Nubank</option><option>Cartão XP</option><option>Carteira</option><option>Vale Alimentação</option><option>Vale Refeição</option></select></label>
                        <label class="dashfin-field dashfin-destino" hidden><span>Conta destino</span><select id="dashfinContaDestino"><option>Nenhuma (Uso Geral)</option><option>Banrisul</option><option>Cartão Nubank</option><option>Cartão XP</option><option>Carteira</option><option>Vale Alimentação</option><option>Vale Refeição</option></select></label>
                        <label class="dashfin-field"><span>Categoria</span><select id="dashfinCategoria" required></select></label>
                        <label class="dashfin-field"><span>Classificação</span><select id="dashfinSubcategoria"><option>Custo Variável</option><option>Custo Fixo</option></select></label>
                    </div>
                    <label class="dashfin-paid-check"><input id="dashfinPago" type="checkbox" checked><span>Transação paga / realizada</span></label>
                    <footer>
                        <button type="button" class="dashfin-transaction-cancel">Cancelar</button>
                        <button type="submit" class="dashfin-transaction-save">Salvar transação</button>
                    </footer>
                </form>
            </section>
        `;
        document.body.appendChild(modal);

        const hoje = new Date();
        const dataLocal = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
        document.getElementById("dashfinData").value = dataLocal;

        const categoria = document.getElementById("dashfinCategoria");
        if (typeof LISTA_CATEGORIAS !== "undefined") {
            categoria.innerHTML = '<option value="" disabled selected>Selecione</option>' + LISTA_CATEGORIAS.map((item) => `<option>${item}</option>`).join("");
        }

        modal.querySelector(".dashfin-transaction-close").addEventListener("click", fecharModalNovaTransacao);
        modal.querySelector(".dashfin-transaction-cancel").addEventListener("click", fecharModalNovaTransacao);
        modal.querySelector(".dashfin-transaction-backdrop").addEventListener("click", fecharModalNovaTransacao);

        modal.querySelectorAll('input[name="dashfinMov"]').forEach((radio) => {
            radio.addEventListener("change", () => {
                modal.querySelector(".dashfin-destino").hidden = radio.value !== "Transferência";
            });
        });

        document.getElementById("dashfinCategoria").addEventListener("change", (event) => {
            const valor = event.target.value;
            const sub = document.getElementById("dashfinSubcategoria");
            if (typeof CUSTOS_FIXOS !== "undefined") sub.value = CUSTOS_FIXOS.includes(valor) ? "Custo Fixo" : "Custo Variável";
            if (typeof MAPA_RECEITAS !== "undefined" && MAPA_RECEITAS.includes(valor)) {
                modal.querySelector('input[name="dashfinMov"][value="Receita"]').checked = true;
            }
            if (valor === "Transferência") modal.querySelector('input[name="dashfinMov"][value="Transferência"]').checked = true;
        });

        document.getElementById("dashfinTransactionForm").addEventListener("submit", salvarTransacaoModal);
    }

    function abrirModalNovaTransacao() {
        montarModalNovaTransacao();
        const modal = document.getElementById("dashfinTransactionModal");
        modal.classList.add("visible");
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => document.getElementById("dashfinDesc")?.focus(), 50);
    }

    function fecharModalNovaTransacao() {
        const modal = document.getElementById("dashfinTransactionModal");
        if (!modal) return;
        modal.classList.remove("visible");
        modal.setAttribute("aria-hidden", "true");
    }

    async function salvarTransacaoModal(event) {
        event.preventDefault();
        const db = window.db || (window.DASHFIN && window.DASHFIN.db);
        if (!db) {
            if (typeof exibirBanner === "function") exibirBanner("Não foi possível conectar ao banco de dados.", "error", 5000);
            return;
        }

        const descricao = document.getElementById("dashfinDesc").value.trim();
        const valor = parseFloat(document.getElementById("dashfinValor").value);
        const dataRaw = document.getElementById("dashfinData").value;
        const conta = document.getElementById("dashfinConta").value;
        const contaDestino = document.getElementById("dashfinContaDestino").value;
        const categoria = document.getElementById("dashfinCategoria").value;
        const subcategoria = document.getElementById("dashfinSubcategoria").value;
        const movimentacao = document.querySelector('input[name="dashfinMov"]:checked')?.value || "Despesa";
        const status = document.getElementById("dashfinPago").checked ? "Pago" : "Previsão";

        if (!descricao || !valor || !dataRaw || !categoria) {
            if (typeof exibirBanner === "function") exibirBanner("Preencha descrição, valor, data e categoria.", "error", 5000);
            return;
        }

        const partes = dataRaw.split("-");
        const mes = typeof MESES_NOMES !== "undefined" ? MESES_NOMES[parseInt(partes[1], 10) - 1] : "";
        const novoDocumento = {
            descricao,
            valor,
            data: `${partes[2]}/${partes[1]}/${partes[0]}`,
            mes,
            movimentacao,
            status,
            contaOrigem: conta,
            contaDestino: movimentacao === "Transferência" ? contaDestino : "Nenhuma (Uso Geral)",
            categoriaOriginal: categoria,
            subcategoria,
            macroCategoriaPrincipal: subcategoria
        };

        try {
            await db.collection("lancamentos").add(novoDocumento);
            fecharModalNovaTransacao();
            event.target.reset();
            if (typeof exibirBanner === "function") exibirBanner("Transação registrada com sucesso.", "success", 4000);
        } catch (error) {
            console.error("Erro ao registrar transação:", error);
            if (typeof exibirBanner === "function") exibirBanner("Não foi possível registrar a transação.", "error", 5000);
        }
    }

    function redesenharLogin() {
        const gate = document.getElementById("loginGate");
        if (!gate) return;
        const box = gate.querySelector(".login-gate-box");
        if (!box) return;

        box.innerHTML = `
            <div class="dashfin-login-brand"><span>D</span><strong>Dashfin</strong></div>
            <div class="dashfin-login-copy"><span>Seu controle financeiro</span><h1>Bem-vindo de volta</h1><p>Acesse suas contas, lançamentos e planejamento em um só lugar.</p></div>
            <form id="dashfinEmailLoginForm" class="dashfin-login-form">
                <label><span>E-mail</span><input id="dashfinLoginEmail" type="email" autocomplete="email" placeholder="voce@email.com" required></label>
                <label><span>Senha</span><input id="dashfinLoginPassword" type="password" autocomplete="current-password" placeholder="Sua senha" required></label>
                <button type="submit" class="dashfin-email-login">Entrar</button>
            </form>
            <div class="dashfin-login-divider"><span>ou</span></div>
            <button type="button" id="btn-login" class="btn-login-gate"><span class="dashfin-google-mark">G</span>Continuar com Google</button>
            <div id="loginGateErro" class="login-gate-erro"></div>
            <button type="button" id="dashfinCreateAccount" class="dashfin-create-account">Criar conta com e-mail</button>
        `;

        const form = document.getElementById("dashfinEmailLoginForm");
        form.addEventListener("submit", entrarComEmail);
        document.getElementById("dashfinCreateAccount").addEventListener("click", criarContaComEmail);

        const googleButton = document.getElementById("btn-login");
        googleButton.setAttribute("type", "button");
    }

    async function entrarComEmail(event) {
        event.preventDefault();
        const auth = window.DASHFIN && window.DASHFIN.auth;
        if (!auth) return;
        const email = document.getElementById("dashfinLoginEmail").value.trim();
        const password = document.getElementById("dashfinLoginPassword").value;
        const erro = document.getElementById("loginGateErro");
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            if (erro) {
                erro.textContent = traduzirErroLogin(error);
                erro.style.display = "block";
            }
        }
    }

    async function criarContaComEmail() {
        const auth = window.DASHFIN && window.DASHFIN.auth;
        if (!auth) return;
        const email = document.getElementById("dashfinLoginEmail").value.trim();
        const password = document.getElementById("dashfinLoginPassword").value;
        const erro = document.getElementById("loginGateErro");
        if (!email || password.length < 6) {
            if (erro) {
                erro.textContent = "Informe um e-mail válido e uma senha com pelo menos 6 caracteres.";
                erro.style.display = "block";
            }
            return;
        }
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (error) {
            if (erro) {
                erro.textContent = traduzirErroLogin(error);
                erro.style.display = "block";
            }
        }
    }

    function traduzirErroLogin(error) {
        const codigo = error && error.code ? error.code : "";
        if (codigo.includes("invalid-credential") || codigo.includes("wrong-password") || codigo.includes("user-not-found")) return "E-mail ou senha incorretos.";
        if (codigo.includes("email-already-in-use")) return "Este e-mail já possui uma conta.";
        if (codigo.includes("weak-password")) return "A senha deve ter pelo menos 6 caracteres.";
        if (codigo.includes("popup-closed")) return "O acesso pelo Google foi cancelado.";
        return "Não foi possível entrar. Verifique os dados e tente novamente.";
    }

    function vincularLogoutDoPerfil() {
        const button = document.getElementById("dashfinProfileLogout");
        if (!button) return;
        button.addEventListener("click", () => {
            const auth = window.DASHFIN && window.DASHFIN.auth;
            if (auth) auth.signOut();
        });
    }

    function organizarSidebar() {
        const nav = document.querySelector(".finance-nav");
        if (!nav || nav.querySelector(".finance-nav-section")) return;

        const links = Array.from(nav.querySelectorAll(".finance-nav-item"));
        if (!links.length) return;

        const grupos = [
            { titulo: "Visão geral", paginas: ["index.html", "operacoes.html"] },
            { titulo: "Planejamento", paginas: ["orcamento.html"] },
            { titulo: "Análise", paginas: ["graficos.html"] }
        ];

        nav.innerHTML = "";
        const nomes = {
            "index.html": ["⌂", "Resumo"],
            "operacoes.html": ["⇄", "Transações"],
            "orcamento.html": ["◇", "Orçamento"],
            "graficos.html": ["⌁", "Gráficos"]
        };

        grupos.forEach((grupo) => {
            const itens = links.filter((link) => grupo.paginas.includes(link.getAttribute("href") || ""));
            if (!itens.length) return;

            const secao = document.createElement("div");
            secao.className = "finance-nav-section";
            secao.innerHTML = `<span class="finance-nav-section-label">${grupo.titulo}</span>`;

            itens.forEach((link) => {
                const href = link.getAttribute("href") || "";
                const [icone, nome] = nomes[href] || ["•", link.textContent.trim()];
                link.innerHTML = `<span class="finance-nav-icon">${icone}</span><span class="finance-nav-item-label">${nome}</span>`;
                secao.appendChild(link);
            });
            nav.appendChild(secao);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        organizarSidebar();
        montarHeader();
        montarModalNovaTransacao();
        redesenharLogin();
        vincularLogoutDoPerfil();
    });
})();
