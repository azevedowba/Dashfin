// Configuração centralizada do Firebase do Dashfin
const firebaseConfig = {
  apiKey: "AIzaSyAZyxQWQG0_LzNclCt19DwjWzd7sBiO0k8",
  authDomain: "dashfin-70672.firebaseapp.com",
  projectId: "dashfin-70672",
  storageBucket: "dashfin-70672.firebasestorage.app",
  messagingSenderId: "1062749351420",
  appId: "1:1062749351420:web:c64dfe80d88d12723b9679"
};

// Inicializa o Firebase globalmente
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();