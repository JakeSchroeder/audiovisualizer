import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Jody Wisternoff - The Bridge (Chicane Rework).mp3');

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
