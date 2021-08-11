import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer(
    'container',
    '/sounds/Avril 14th.mp3',
    undefined
);

const playButton = document.getElementById('playButton');

if (playButton) {
    playButton.addEventListener('click', () => {
        console.log(BackgroundAnimation);
    });
}

console.log(BackgroundAnimation);
