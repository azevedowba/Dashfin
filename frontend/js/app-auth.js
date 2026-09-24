const auth = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
const provider = auth && firebase.auth ? new firebase.auth.GoogleAuthProvider() : null;
window.DASHFIN = window.DASHFIN || {};
window.DASHFIN.auth = auth;

function loginComGoogle() {
    if (!auth || !provider) {
        console.error("Firebase Auth não está disponível. Verifique a configuração da página.");
        const erroDiv = document.getElementById('loginGateErro');
        if (erroDiv) {
            erroDiv.textContent = "O login não está disponível no momento. Recarregue a página.";
            erroDiv.style.display = 'block';
        }
        return;
    }

    const erroDiv = document.getElementById('loginGateErro');
    if (erroDiv) erroDiv.style.display = 'none';

    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Usuário logado:", result.user.email);
        }).catch((error) => {
            console.error("Erro no login:", error.message);
            if (erroDiv) {
                erroDiv.textContent = "Não foi possível entrar. Tente novamente.";
                erroDiv.style.display = 'block';
            }
        });
}

function inicializarAuth() {
    if (!auth) {
        return;
    }

    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', loginComGoogle);
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut();
        });
    }

    auth.onAuthStateChanged((user) => {
        const loginGate = document.getElementById('loginGate');
        const appContent = document.getElementById('appContent');

        if (user) {
            console.log("Usuário autenticado:", user.email);

            if (loginGate) loginGate.style.display = 'none';
            if (appContent) appContent.style.display = 'block';

            if (typeof carregarFiltrosIndex === 'function') {
                carregarFiltrosIndex();
            }
            if (typeof iniciarEscutaRealtime === 'function') {
                iniciarEscutaRealtime();
            }
            if (typeof inicializarBusca === 'function') {
                inicializarBusca();
            }
            if (typeof renderizarOrcamentoMensal === 'function') {
                renderizarOrcamentoMensal();
            }
        } else {
            console.log("Aguardando login...");

            if (loginGate) loginGate.style.display = 'flex';
            if (appContent) appContent.style.display = 'none';
        }
    });
}
