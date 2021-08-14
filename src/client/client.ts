import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Clubbed to Death (Kurayamino Variation).mp3');

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
