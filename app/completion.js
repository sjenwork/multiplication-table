export function showCompletionOverlay(correctCount, total) {
    const overlay = document.getElementById('completion-overlay');
    if (!overlay) return;
    const title = overlay.querySelector('[data-completion-title]');
    const detail = overlay.querySelector('[data-completion-detail]');
    const emoji = overlay.querySelector('[data-completion-emoji]');
    const ratio = total ? correctCount / total : 0;
    const result = ratio === 1
        ? { title: '你好棒！', detail: '全部答對，你做到了！', emoji: '🎉', tone: 'score-high' }
        : ratio >= 0.8
            ? { title: '太棒了！', detail: `答對 ${correctCount} 題，再把錯題練熟就更厲害！`, emoji: '🌟', tone: 'score-good' }
            : ratio >= 0.5
                ? { title: '做得很好！', detail: `答對 ${correctCount} 題，錯題再挑戰一次！`, emoji: '💪', tone: 'score-steady' }
                : { title: '繼續加油！', detail: `答對 ${correctCount} 題，一題一題來，你可以的！`, emoji: '🌱', tone: 'score-keep-going' };
    if (title) title.textContent = result.title;
    if (detail) detail.textContent = result.detail;
    if (emoji) emoji.textContent = result.emoji;
    overlay.querySelector('.completion-card')?.classList.remove('score-high', 'score-good', 'score-steady', 'score-keep-going');
    overlay.querySelector('.completion-card')?.classList.add(result.tone);
    overlay.classList.remove('hidden');
}

export function setupCompletionOverlay() {
    const overlay = document.getElementById('completion-overlay');
    const card = overlay?.querySelector('.completion-card');
    const closeButton = document.getElementById('close-completion');
    if (!overlay || !card || !closeButton || card.dataset.dismissReady === 'true') return;
    card.dataset.dismissReady = 'true';
    const close = () => overlay.classList.add('hidden');
    closeButton.addEventListener('click', close);
    let startX = null;
    let startY = null;
    card.addEventListener('pointerdown', (event) => { startX = event.clientX; startY = event.clientY; });
    card.addEventListener('pointerup', (event) => {
        if (startX === null || startY === null) return;
        const distanceX = event.clientX - startX;
        const distanceY = event.clientY - startY;
        if (Math.abs(distanceX) >= 56 && Math.abs(distanceX) > Math.abs(distanceY)) close();
        startX = null;
        startY = null;
    });
    card.addEventListener('pointercancel', () => { startX = null; startY = null; });
}

export function hideCompletionOverlay() {
    document.getElementById('completion-overlay')?.classList.add('hidden');
}
