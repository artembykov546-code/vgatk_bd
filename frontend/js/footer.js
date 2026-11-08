// ============================================================
// FOOTER — Все права защищены. Подключается на все страницы.
// ============================================================
(function () {
    'use strict';

    function injectFooter() {
        if (document.getElementById('siteFooter')) return;

        var footer = document.createElement('footer');
        footer.id = 'siteFooter';
        footer.style.cssText = 'margin-top:40px;padding:20px 16px;border-top:1px solid #E2E8F0;text-align:center;font-size:12px;color:#64748B;line-height:1.7;background:#fff;';

        footer.innerHTML =
            '<div>&copy; 2026 Все права защищены</div>' +
            '<div style="margin-top:4px;">Авторы: ГУО &laquo;Витебский технологический колледж&raquo;, Быков Артём Русланович</div>' +
            '<div style="margin-top:4px;">Обратная связь: <a href="https://t.me/artem_20_07" target="_blank" rel="noopener" style="color:#2563EB;text-decoration:none;">Telegram: t.me/artem_20_07</a></div>';

        document.body.appendChild(footer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        injectFooter();
    }
})();