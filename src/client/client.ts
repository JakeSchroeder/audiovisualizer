import WEBGLAudioVisualizer from './audio-visualizer';

const BackgroundAnimation = new WEBGLAudioVisualizer('container', "/sounds/Pirates of the Caribbean - He's a Pirate (Extended).mp3");

BackgroundAnimation.createScene();
BackgroundAnimation.animate();
