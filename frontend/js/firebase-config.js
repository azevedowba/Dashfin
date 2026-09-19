// Configuração centralizada do Firebase do Dashfin
const firebaseConfig = {
  apiKey: "AIzaSyAZyxQWQG0_LzNclCt19DwjWzd7sBiO0k8",
  authDomain: "dashfin-70672.firebaseapp.com",
  projectId: "dashfin-70672",
  storageBucket: "dashfin-70672.firebasestorage.app",
  messagingSenderId: "1062749351420",
  appId: "1:1062749351420:web:c64dfe80d88d12723b9679"
};

window.DASHFIN = window.DASHFIN || {};
window.DASHFIN.firebaseConfig = firebaseConfig;

if (typeof firebase === "undefined") {
  console.error("Firebase SDK não carregado. Verifique a ordem dos scripts na página.");
}

const db = (typeof firebase !== "undefined" && firebase.firestore)
  ? (firebase.apps.length ? firebase.firestore() : (firebase.initializeApp(firebaseConfig) && firebase.firestore()))
  : null;

window.db = db;
window.DASHFIN.db = db;

if (!db) {
  console.error("Não foi possível inicializar o Firestore. O Firebase SDK não carregou corretamente.");
}

// Suporte ao Firebase Emulator Suite (somente quando explicitamente solicitado com ?useEmulator=1)
(function enableEmulatorIfRequested() {
  try {
    const params = new URLSearchParams(window.location.search);
    // Mudar comportamento: EMULATOR só liga se ?useEmulator=1 for passado explicitamente.
    const useEmulator = params.get('useEmulator') === '1';
    window.DASHFIN.useEmulator = useEmulator;
    if (!useEmulator) return;
    console.info('DASHFIN: conectando aos emuladores do Firebase (auth:127.0.0.1:9099, firestore:127.0.0.1:8080)');

    // Auth emulator (compat / v8)
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try {
        if (typeof firebase.auth().useEmulator === 'function') {
          firebase.auth().useEmulator('http://127.0.0.1:9099/');
        } else {
          console.warn('DASHFIN: firebase.auth().useEmulator não disponível nesta versão do SDK.');
        }
      } catch (err) {
        console.warn('DASHFIN: erro ao conectar Auth Emulator', err);
      }
    }

    // Firestore emulator
    if (db) {
      try {
        if (typeof db.useEmulator === 'function') {
          db.useEmulator('127.0.0.1', 8080);
        } else if (typeof db.settings === 'function') {
          db.settings({ host: '127.0.0.1:8080', ssl: false });
        } else {
          console.warn('DASHFIN: método de conexão com Firestore Emulator não disponível.');
        }
      } catch (err) {
        console.warn('DASHFIN: erro ao conectar Firestore Emulator', err);
      }
    }
  } catch (e) {
    console.warn('DASHFIN: não foi possível avaliar uso de emulador', e);
  }
})();
