import { time, timeEnd } from 'console';
import * as THREE from 'three';
import {
    Audio,
    AudioAnalyser,
    Clock,
    PerspectiveCamera,
    Points,
    Scene,
    WebGLRenderer,
} from 'three';

//div element in html  to render the canvas in
let containerDomNode: HTMLElement | null;

//default scene view camera
let camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer;

//
let points: Points;
let particles: number;
let positions: number[];
let geometry: THREE.BufferGeometry;
let analyser: AudioAnalyser;

let scale: number;
let width: number;
let height: number;
let offsetX: number;
let offsetY: number;
let centerX: number;
let centerY: number;

let soundData: Uint8Array;
let freqChannels = 32;

let maxWaveSpeed = 100;
let maxWaveLength = 400;
let maxAmp = 10;
let totalAmp = 0;

width = 200;
height = 200;
scale = 15;

let clock: Clock;
let timeElapsed: number;

let sound: Audio;

const playButton = document.createElement('button');
if (playButton) playButton.innerText = 'Start';

playButton.addEventListener('click', () => {
    init();
    animate();
});

document.body.appendChild(playButton);

const pauseAudioButton = document.createElement('button');
if (pauseAudioButton) pauseAudioButton.innerText = 'Pause Audio';

pauseAudioButton.addEventListener('click', () => {
    if (sound.isPlaying) {
        sound.stop();
    } else {
        sound.play();
    }
});

document.body.appendChild(pauseAudioButton);

function init() {
    containerDomNode = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 2000, 3500);

    clock = new Clock(true);

    camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 3500);
    camera.position.z = 2750;

    const listener = new THREE.AudioListener();
    camera.add(listener);

    // create a global audio source
    sound = new THREE.Audio(listener);

    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./sounds/UMEK - Amnesiac (Original Mix).mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.3);
        sound.play();
    });

    analyser = new THREE.AudioAnalyser(sound, freqChannels * 2);

    particles = height * width;
    offsetX = -((scale * width) / 2);
    offsetY = -((scale * height) / 2);
    centerX = offsetX + (scale * width) / 2;
    centerY = offsetY + (scale * height) / 2;

    geometry = new THREE.BufferGeometry();

    positions = [];
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < particles; i++) {
        //calculate particle position

        const horiz_pos = i % width;
        const vert_pos = Math.floor(i / width);

        let x = scale * horiz_pos + offsetX;
        let y = scale * vert_pos + offsetY;
        let z = 0;

        //push to mesh position and color properties
        positions.push(x, y, z);
        color.setColorName('red');
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();

    //

    const material = new THREE.PointsMaterial({ size: 15, vertexColors: true });

    points = new THREE.Points(geometry, material);
    points.geometry.attributes.position.needsUpdate = true;
    scene.add(points);

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (containerDomNode) containerDomNode.appendChild(renderer.domElement);

    //

    //

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function showParticles() {
    //  SoundData  :  Array of volumes of each frequency channel
    //  freqChannels : number of freqency channels if the SoundData array
    //  maxAmp : max height of waves
    //  maxWaveLength
    //  maxWaveSpeed
    //  timeElapsed
    //  distFromCenter

    let waveSpeed: number[] = [freqChannels];
    let waveLength: number[] = [freqChannels];
    let amp: number[] = [freqChannels];

    totalAmp = 0;

    for (let f = 0; f < freqChannels; f++) {
        //get sound amplitude and frequency
        let normalizedSoundAmp = soundData[f] / 255;
        if (!normalizedSoundAmp) normalizedSoundAmp = 0;
        let normalizedSoundFreq = f / freqChannels;

        waveSpeed[f] = maxWaveSpeed * normalizedSoundFreq;
        waveLength[f] = maxWaveLength * normalizedSoundFreq;
        amp[f] = normalizedSoundAmp; // Math.pow(normalizedSound, 2);
        totalAmp += normalizedSoundAmp / freqChannels;
    }

    for (let i = 0; i < particles * 3; i += 3) {
        //get position of current particle
        let x = positions[i];
        let y = positions[i + 1];

        let distFromCenter = Math.sqrt(
            Math.abs(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        );

        let z = positions[i + 2];

        //add frequency ripple to graph
        /*



        
        for (let n = 0; n < freqChannels; n++) {
            if (waveLength[n] > 0 && amp[n] > 0 && totalAmp) {
                z +=
                    maxAmp *
                    (amp[n] / totalAmp) *
                    Math.sin(distFromCenter / waveLength[n] - waveSpeed[n] * timeElapsed);
            }
        }
        */

        if (waveLength[6] > 0 && amp[6] > 0 && totalAmp)
            z =
                maxAmp *
                totalAmp *
                100 *
                Math.sin(distFromCenter / (waveLength[6] / 10) - 10 * timeElapsed);

        //rebalancer
        z *= -((distFromCenter - 10) / Math.sqrt(Math.pow(distFromCenter - 10, 2) + 10000)) + 1;

        //set Z pos
        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

        positions[i + 2] = clamp(z, -300, 300);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
}

function animate() {
    requestAnimationFrame(animate);
    // console.log(soundData)
    timeElapsed = clock.getElapsedTime();

    if (analyser) {
        soundData = analyser.getFrequencyData();
    }

    showParticles();

    render();
}

function render() {
    const time = Date.now() * 0.001;

    points.rotation.x = Math.PI * -0.25;
    points.rotation.x = time * 0.1;
    points.rotation.y = time * 0.1;

    renderer.render(scene, camera);
}
