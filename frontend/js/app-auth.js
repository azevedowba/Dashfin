const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

function loginComGoogle() {
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

            carregarFiltrosIndex();
            iniciarEscutaRealtime();
            inicializarBusca();
        } else {
            console.log("Aguardando login...");

            if (loginGate) loginGate.style.display = 'flex';
            if (appContent) appContent.style.display = 'none';
        }
    });
}
