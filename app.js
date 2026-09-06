import { loadState } from './app/state.js?v=20260906-124042';
import { applyTheme } from './app/settings.js?v=20260906-124042';
import { initVersionUpdate } from './app/update.js?v=20260906-124042';
import { initHome } from './app/home.js?v=20260906-124042';
import { initQuiz } from './app/quiz.js?v=20260906-124042';

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        if (new URLSearchParams(window.location.search).has('_update')) window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
        const state = loadState();
        applyTheme(state);
        if (document.getElementById('multiplication-grid')) initHome(state);
        if (document.getElementById('question-list')) initQuiz(state);
        initVersionUpdate();
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
}());
