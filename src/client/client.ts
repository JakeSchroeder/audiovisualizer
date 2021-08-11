import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Avril 14th.mp3');

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
