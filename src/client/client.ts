import WEBGLAudioVisualizer from './audio-visualizer';
import UserInterface from './ui';

function initApp() {
    //createAudioVisualer();
    createUserInterface();
}

function createUserInterface() {
    const UI = new UserInterface();
}

function createAudioVisualer() {
    let audioVisualizer = new WEBGLAudioVisualizer('audioVisualizerDisplayNode', '/sounds/Marsh feat. Leo Wood - My stripes (Braxton & Marsh Remix).mp3');
    audioVisualizer.createScene();
    audioVisualizer.animate();
    audioVisualizer.loadAudio();
}

window.addEventListener('DOMContentLoaded', initApp);
