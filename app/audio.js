const AUDIO_ROOTS = {
    female: 'female/aoede/audio',
    male: 'male/puck/audio',
};

function audioPath(gender, factor, multiplier) {
    const root = AUDIO_ROOTS[gender] || AUDIO_ROOTS.female;
    return `${root}/${factor}x${multiplier}.m4a`;
}

function playAudioClip(audio, gender, factor, multiplier) {
    audio.src = audioPath(gender, factor, multiplier);
    audio.currentTime = 0;
    return new Promise((resolve) => {
        const finish = () => {
            audio.removeEventListener('ended', finish);
            audio.removeEventListener('error', finish);
            resolve();
        };
        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        audio.play().catch(finish);
    });
}

export { AUDIO_ROOTS, audioPath, playAudioClip };
