(function () {
    const themeStorageKey = "dashfin_theme";
    const root = document.documentElement;

    function readSavedTheme() {
        try {
            const savedTheme = localStorage.getItem(themeStorageKey);
            if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
        } catch {
            return null;
        }
        return null;
    }

    const initialTheme = readSavedTheme()
        || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.dataset.theme = initialTheme;

    document.addEventListener("DOMContentLoaded", function () {
        const themeToggle = document.getElementById("btn-theme-toggle");
        if (!themeToggle) return;

        function updateToggle(theme) {
            const isDark = theme === "dark";
            themeToggle.textContent = isDark ? "Tema claro" : "Tema escuro";
            themeToggle.setAttribute("aria-pressed", String(isDark));
            themeToggle.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
        }

        updateToggle(root.dataset.theme);
        themeToggle.addEventListener("click", function () {
            const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
            root.dataset.theme = nextTheme;
            updateToggle(nextTheme);
            try {
                localStorage.setItem(themeStorageKey, nextTheme);
            } catch {}
            window.dispatchEvent(new CustomEvent("dashfin:themechange", { detail: { theme: nextTheme } }));
        });
    });
})();