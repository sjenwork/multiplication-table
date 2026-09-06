(function () {
    'use strict';

    try {
        const saved = JSON.parse(localStorage.getItem('multiplication-practice-state'));
        const theme = saved?.theme === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        const themeColor = document.querySelector('meta[name="theme-color"]');
        const color = window.__APP_THEME_COLORS__?.[theme];
        if (themeColor && color) themeColor.content = color;
    } catch (error) {
        document.documentElement.dataset.theme = 'light';
    }
}());
