import './components/completion-overlay.js?v=20260906-191232';

export function showCompletionOverlay(correctCount, total) {
    const overlay = document.getElementById('completion-overlay');
    if (!overlay) return;
    overlay.show(correctCount, total);
}

export function setupCompletionOverlay() {
    const overlay = document.getElementById('completion-overlay');
    if (!overlay || overlay.localName === 'app-completion-overlay') return;
    const component = document.createElement('app-completion-overlay');
    component.id = 'completion-overlay';
    component.className = 'completion-overlay hidden';
    overlay.replaceWith(component);
}

export function hideCompletionOverlay() {
    document.getElementById('completion-overlay')?.hide();
}
