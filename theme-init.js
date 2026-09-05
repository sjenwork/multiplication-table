(function () {
    'use strict';

    try {
        const saved = JSON.parse(localStorage.getItem('multiplication-practice-state'));
        const theme = saved?.theme === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.content = theme === 'dark' ? '#091a30' : '#f4fbff';
    } catch (error) {
        document.documentElement.dataset.theme = 'light';
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.content = '#f4fbff';
    }
}());
