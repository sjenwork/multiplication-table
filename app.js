import { loadState } from './app/state.js?v=20260906-193456';
import { applyTheme } from './app/settings.js?v=20260906-193456';
import { initVersionUpdate } from './app/update.js?v=20260906-193456';
import { initHome } from './app/home.js?v=20260906-193456';
import { initQuiz } from './app/quiz.js?v=20260906-193456';
import { initStudy } from './app/study.js?v=20260906-193456';

(() => {
    'use strict';

    let started = false;
    const start = () => {
        if (started) return;
        started = true;
        if (new URLSearchParams(window.location.search).has('_update')) window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
        const state = loadState();
        applyTheme(state);
        if (document.getElementById('multiplication-grid')) initHome(state);
        if (document.getElementById('question-list')) initQuiz(state);
        if (document.getElementById('study-table')) initStudy(state);
        initVersionUpdate();
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
