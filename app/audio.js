const AUDIO_ROOTS = {
    female: 'female/aoede/audio',
    male: 'male/puck/audio',
};
const CLIP_GAP_MIN_MS = 212;
const CLIP_GAP_MAX_MS = 224;

function audioDebug(event, details = {}) {
    console.info(`[multiplication-audio] ${event}`, details);
}

function autoplayPolicy(audio) {
    if (typeof navigator === 'undefined' || typeof navigator.getAutoplayPolicy !== 'function') return 'unsupported';
    try {
        return navigator.getAutoplayPolicy(audio);
    } catch {
        return 'unavailable';
    }
}

function audioPath(gender, factor, multiplier) {
    const root = AUDIO_ROOTS[gender] || AUDIO_ROOTS.female;
    return `${root}/${factor}x${multiplier}.m4a`;
}

function playAudioClip(audio, gender, factor, multiplier) {
    const path = audioPath(gender, factor, multiplier);
    audioDebug('play attempt', {
        path,
        autoplayPolicy: autoplayPolicy(audio),
        readyState: audio.readyState,
        networkState: audio.networkState,
    });
    audio.src = path;
    audio.currentTime = 0;
    return new Promise((resolve, reject) => {
        const finish = () => {
            audio.removeEventListener('ended', finish);
            audio.removeEventListener('error', fail);
            audioDebug('play ended', { path });
            resolve();
        };
        const fail = (error) => {
            audio.removeEventListener('ended', finish);
            audio.removeEventListener('error', fail);
            console.error('[multiplication-audio] play failed', {
                path,
                errorName: error?.name,
                errorMessage: error?.message,
                readyState: audio.readyState,
                networkState: audio.networkState,
                mediaErrorCode: audio.error?.code,
                mediaErrorMessage: audio.error?.message,
            });
            reject(error instanceof Error ? error : new Error('Audio playback failed'));
        };
        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', fail, { once: true });
        audio.play().catch(fail);
    });
}

export { AUDIO_ROOTS, CLIP_GAP_MAX_MS, CLIP_GAP_MIN_MS, audioPath, playAudioClip };
