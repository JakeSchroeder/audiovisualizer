import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Bassnectar - Timestretch (Official).mp3');

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
