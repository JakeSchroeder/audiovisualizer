import WEBGLAudioVisualizer from './audio-visualizer';

function init() {

    const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Jody Wisternoff - The Bridge (Chicane Rework).mp3');
    
    BackgroundAnimation.createScene();
    BackgroundAnimation.animate();
}

window.addEventListener("DOMContentLoaded", init)