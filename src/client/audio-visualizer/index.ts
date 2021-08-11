import { time, timeEnd } from 'console';
import { normalize } from 'path';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
    Audio,
    AudioAnalyser,
    Clock,
    PerspectiveCamera,
    Points,
    Scene,
    WebGLRenderer,
} from 'three';

type Div = HTMLDivElement | null;

export interface AudioVisualizerOptions {
    numOfParticles: number;
    particleSpacing: number;
    userZoomLevel: number;
    fog: THREE.Fog;
    sceneBackground: THREE.Color;
    freqChannels: number;
    color: string;
}

class WEBGLAudioVisualizer {
    private containerDOMNode: Div;
    private audioSource: string;
    private options: AudioVisualizerOptions;

    private renderer = new THREE.WebGLRenderer();
    private scene = new Scene();
    private camera = new THREE.PerspectiveCamera(
        27,
        window.innerWidth / window.innerHeight,
        5,
        5000
    );
    private orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    private listener = new THREE.AudioListener();
    private sound = new THREE.Audio(this.listener);

    private geometry = new THREE.BufferGeometry();
    private material = new THREE.PointsMaterial({ size: 15, vertexColors: true });
    private points = new THREE.Points(this.geometry, this.material);

    private positions: number[] = [];
    private startTime = Date.now();

    private soundData = new Uint8Array();
    private previousAvgAmp: number[] = [];
    private totalAvgVolume = 0;
    private amp_multiplier = 0;

    private maxWaveSpeed = 100;
    private maxWaveLength = 400;
    private maxAmp = 100;
    private totalAmp = 0;
    private maxRadius = 1000;

    private sideLength: number;

    constructor(containerDOMNodeId: string, audioSource: string, options?: AudioVisualizerOptions) {
        this.containerDOMNode = document.getElementById(containerDOMNodeId) as Div;
        this.audioSource = audioSource;
        this.options = {} as AudioVisualizerOptions;

        this.options.particleSpacing = 15;
        this.options.sceneBackground = new THREE.Color(0x050505);
        this.options.fog = new THREE.Fog(0x050505, 2000, 4100);
        this.options.freqChannels = 32;
        this.sideLength = Math.sqrt(this.options.numOfParticles);
        this.camera.position.z = 3500;
        this.orbitControls.update();
        this.orbitControls.enableZoom = false;
        this.orbitControls.rotateSpeed = 0.1;

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.containerDOMNode) this.containerDOMNode.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.loadAndAnalyzeAudio();
        this.createParticles();
        this.render();
    }

    public get Options() {
        return this.options;
    }

    public set Options(options: AudioVisualizerOptions) {
        this.options = options;
    }

    public set NumOfParticles(n: number) {
        this.options.numOfParticles = n;
    }

    public loadAndAnalyzeAudio() {
        const audioLoader = new THREE.AudioLoader();

        let localSound = this.sound;

        if (localSound) {
            audioLoader.load(this.audioSource, function (buffer: AudioBuffer) {
                localSound.setBuffer(buffer);
                localSound.setLoop(true);
                localSound.setVolume(0.3);
                localSound.play();
            });

            const analyser = new THREE.AudioAnalyser(this.sound, this.options.freqChannels * 2);
            analyser.getFrequencyData();
        }
    }

    public createParticles() {
        const colors: number[] = [];
        let color = new THREE.Color();

        let offsetX = 0;
        let offsetY = 0;

        for (let i = 0; i < this.options.numOfParticles; i++) {
            const xPos = i % this.sideLength;
            const vert_pos = Math.floor(i / Math.sqrt(this.options.numOfParticles));

            let x = this.options.numOfParticles * xPos + offsetX;
            let y = this.options.particleSpacing * vert_pos + offsetY;
            let z = 0;

            //push to mesh position and color properties
            this.positions.push(x, y, z);
            color.setColorName('red');
            colors.push(color.r, color.g, color.b);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.computeBoundingSphere();

        this.points.geometry.attributes.position.needsUpdate = true;
        this.scene.add(this.points);
    }

    public showParticles() {
        let amp: number[] = [this.options.freqChannels];
        this.totalAmp = 0;

        let centerX = 0;
        let centerY = 0;

        for (let f = 0; f < this.options.freqChannels; f++) {
            //get sound amplitude and frequency
            let normalizedSoundAmp = this.soundData[f] / 255;
            if (!normalizedSoundAmp) normalizedSoundAmp = 0;
            let normalizedSoundFreq = f / this.options.freqChannels;

            amp[f] = normalizedSoundAmp; // Math.pow(normalizedSound, 2);
            this.totalAmp += normalizedSoundAmp / this.options.freqChannels;
        }

        //find out if the average volume is larger than the recent past
        this.previousAvgAmp.push(this.totalAmp);
        let EWMA_average = 0;
        let EWMA_range = 10;
        this.amp_multiplier = 1;
        for (let n = this.previousAvgAmp.length - EWMA_range; n < this.previousAvgAmp.length; n++) {
            EWMA_average += this.previousAvgAmp[n] / EWMA_range;
        }

        for (let n = 0; n < this.previousAvgAmp.length; n++) {
            this.totalAvgVolume += this.previousAvgAmp[n] / this.previousAvgAmp.length;
        }

        let autoLeveler = 0.5 - this.totalAvgVolume + 0.5;
        autoLeveler = 1;

        if (this.totalAmp && EWMA_average) this.amp_multiplier = this.totalAmp / EWMA_average;

        for (let i = 0; i < this.options.numOfParticles * 3; i += 3) {
            //get position of current particle
            let x = this.positions[i];
            let y = this.positions[i + 1];

            let distFromCenter = Math.sqrt(
                Math.abs(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
            );

            let z = 0;

            let normalizedDistFromCenter = distFromCenter / this.maxRadius;
            let pointFrequencyAssignemnt = normalizedDistFromCenter * this.options.freqChannels;
            if (pointFrequencyAssignemnt < this.options.freqChannels - 1) {
                //which freq does this point map to

                if (normalizedDistFromCenter > 1) normalizedDistFromCenter = 1;

                z =
                    this.amp_multiplier *
                    this.totalAmp *
                    autoLeveler *
                    this.maxAmp *
                    amp[Math.floor(normalizedDistFromCenter * this.options.freqChannels)];

                z +=
                    (this.amp_multiplier *
                        this.totalAmp *
                        autoLeveler *
                        this.maxAmp *
                        amp[Math.floor(normalizedDistFromCenter * this.options.freqChannels) + 1] -
                        z) *
                    (normalizedDistFromCenter * this.options.freqChannels -
                        Math.floor(normalizedDistFromCenter * this.options.freqChannels));
            } else {
                z = 0;
            }

            //rebalancer
            z *=
                -30 *
                    -(
                        (distFromCenter - 10) /
                        Math.sqrt(Math.pow(distFromCenter - 10, 2) + 1000000)
                    ) +
                1;

            //set Z pos
            const clamp = (num: number, min: number, max: number) =>
                Math.min(Math.max(num, min), max);

            this.positions[i + 2] = clamp(z, -500, 500);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        this.showParticles();

        const time = -40 + (Date.now() - this.startTime) * 0.001;
        let oscillationTime = 20;
        let sweepAngle = 1.1;

        this.points.rotation.y = Math.sin(time / oscillationTime) * sweepAngle; //Math.sin(time / 20) * 5;
        this.points.rotation.z = Math.sin(time / oscillationTime) * sweepAngle;
        this.points.rotation.x = -Math.sin(5 + time / oscillationTime) * sweepAngle;
        this.camera.position.z =
            Math.sin((2 * time + 50 * this.options.userZoomLevel) / oscillationTime) * 1000 + 2600;
        this.options.userZoomLevel = Math.sin(time);

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate.bind(this));
    }

    private render() {
        this.animate();
    }
}

export default WEBGLAudioVisualizer;
