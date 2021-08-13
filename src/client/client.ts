import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Marsh feat. Leo Wood - My stripes (Braxton & Marsh Remix).mp3');

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
