import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/R.M - Chikyu-u 002.mp3');

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
