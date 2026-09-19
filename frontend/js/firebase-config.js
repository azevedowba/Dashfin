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
  ? firebase.apps.length ? firebase.firestore() : firebase.initializeApp(firebaseConfig) && firebase.firestore()
  : null;

window.db = db;
window.DASHFIN.db = db;

if (!db) {
  console.error("Não foi possível inicializar o Firestore. O Firebase SDK não carregou corretamente.");
}