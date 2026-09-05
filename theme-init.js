(function () {
    'use strict';

    try {
        const saved = JSON.parse(localStorage.getItem('multiplication-practice-state'));
        const theme = saved?.theme === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
    } catch (error) {
        document.documentElement.dataset.theme = 'light';
    }
}());
