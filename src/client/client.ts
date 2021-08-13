import WEBGLAudioVisualizer from './audio-visualizer';

function init() {

    const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/UMEK - Amnesiac (Original Mix).mp3');
    
    BackgroundAnimation.createScene();
    BackgroundAnimation.animate();
}

window.addEventListener("DOMContentLoaded", init)