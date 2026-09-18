document.addEventListener('DOMContentLoaded', () => {
    if (typeof inicializarAuth === 'function') {
        inicializarAuth();
    }

    if (typeof inicializarEventosDashboard === 'function') {
        inicializarEventosDashboard();
    }
});
