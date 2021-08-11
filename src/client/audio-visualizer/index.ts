import { time, timeEnd } from 'console';
import { normalize } from 'path';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Audio, AudioAnalyser, Clock, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer } from 'three';

type Div = HTMLDivElement | null;
class WEBGLAudioVisualizer {
    private containerDOMNode: Div;
    private audioSource: string;

    private scene: Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private orbitControls: OrbitControls;

    private listener: THREE.AudioListener;
    private sound: THREE.Audio;

    private geometry = new THREE.BufferGeometry();
    private material: PointsMaterial;
    private points: Points;

    private positions: number[];
    private startTime: number;
    private analyzer: THREE.AudioAnalyser;
    private soundData: Uint8Array;
    private previousAvgAmp: number[];
    private totalAvgVolume = 0;
    private amp_multiplier = 0;

    private maxAmp = 100;
    private totalAmp = 0;
    private maxRadius = 1000;

    private sideLength: number;

    private particles: number;
    private particleSpacing: number;
    private userZoomLevel: number;
    private freqChannels: number;

    private integral: number;
    private previousTime: number;
    private integralSensitivityFactor: number;
    private totalCurrentAvgZHeight: number;
    private allTotalAvgZHeights: number[];

    constructor(containerDOMNodeId: string, audioSource: string) {
        this.containerDOMNode = document.getElementById(containerDOMNodeId) as Div;
        this.audioSource = audioSource;

        this.startTime = Date.now();
        this.renderer = new THREE.WebGLRenderer();
        this.listener = new THREE.AudioListener();
        this.sound = new THREE.Audio(this.listener);
        this.camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 5000);
        this.camera.position.z = 3500;
        this.scene = new Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 3000, 4000);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        this.material = new THREE.PointsMaterial({ size: 15, vertexColors: true });
        this.points = new THREE.Points(this.geometry, this.material);

        this.freqChannels = 32;
        this.positions = [];
        this.soundData = new Uint8Array();
        this.previousAvgAmp = [];
        this.analyzer = new THREE.AudioAnalyser(this.sound, this.freqChannels * 2);

        this.userZoomLevel = 75;
        this.orbitControls.update();
        this.orbitControls.enableZoom = false;
        this.orbitControls.rotateSpeed = 0.1;

        this.particles = 160000;
        this.particleSpacing = 15;
        this.sideLength = Math.sqrt(this.particles);

        this.integral = 0;
        this.previousTime = 0;
        this.integralSensitivityFactor = 1;
        this.totalCurrentAvgZHeight = 0;
        this.allTotalAvgZHeights = [];
    }

    public createScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        if (this.containerDOMNode) this.containerDOMNode.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.loadAudio();
        this.createParticles();
    }

    private loadAudio() {
        const audioLoader = new THREE.AudioLoader();
        let localSound = this.sound;
        if (localSound) {
            audioLoader.load(this.audioSource, function (buffer: AudioBuffer) {
                localSound.setBuffer(buffer);
                localSound.setLoop(true);
                localSound.setVolume(0.3);
                localSound.play();
            });
        }
    }

    private createParticles() {
        const colors: number[] = [];
        let color = new THREE.Color();

        let offsetX = -((this.particleSpacing * this.sideLength) / 2);
        let offsetY = -((this.particleSpacing * this.sideLength) / 2);

        for (let i = 0; i < this.particles; i++) {
            const horiz_pos = i % this.sideLength;
            const vert_pos = Math.floor(i / this.sideLength);

            let x = this.particleSpacing * horiz_pos + offsetX;
            let y = this.particleSpacing * vert_pos + offsetY;
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

    private showParticles() {
        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

        let deltaTime = Date.now() - this.previousTime;
        this.previousTime = Date.now();
        let amp: number[] = [this.freqChannels];
        this.totalAmp = 0;

        this.totalAvgVolume = 0;

        let centerX = 0;
        let centerY = 0;

        for (let f = 0; f < this.freqChannels; f++) {
            //get sound amplitude and frequency
            let normalizedSoundAmp = this.soundData[f] / 255;
            if (!normalizedSoundAmp) normalizedSoundAmp = 0;
            let normalizedSoundFreq = f / this.freqChannels;

            amp[f] = normalizedSoundAmp; // Math.pow(normalizedSound, 2);
            this.totalAmp += normalizedSoundAmp / this.freqChannels;
        }

        this.previousAvgAmp.push(this.totalAmp);
        let EWMA_average = 0;
        let EWMA_range = 10;
        this.amp_multiplier = 1;

        //averages the last 10 frames of avg volume data (normalized gaussian distribution)
        for (let n = this.previousAvgAmp.length - EWMA_range; n < this.previousAvgAmp.length; n++) {
            EWMA_average += this.previousAvgAmp[n] / EWMA_range;
        }

        //averages all previous frames avg volume data
        for (let n = 0; n < this.previousAvgAmp.length; n++) {
            this.totalAvgVolume += this.previousAvgAmp[n] / this.previousAvgAmp.length;
        }

        //totalAvgVolume will be between 0 and 1
        //error = distance away from 0.5 volume
        //let error = 0.5 - this.totalAvgVolume
        //add error * time to the accumulator
        //private instance field : integralSensitivityFactor = 1;
        //private instance field : integral += integralSensitivityFactor * error * deltaTime;
        //private instance field : previousTime and deltaTime need to be added

        let error = 15 - this.totalCurrentAvgZHeight;

        this.integral += this.integralSensitivityFactor * error * deltaTime;

        // console.log(this.totalAvgZHeight);

        let autoLeveler = clamp(this.integral, 0, 1);

        if (this.totalAmp && EWMA_average) this.amp_multiplier = this.totalAmp / EWMA_average;

        this.totalCurrentAvgZHeight = 0;

        for (let i = 0; i < this.particles * 3; i += 3) {
            //get position of current particle
            let x = this.positions[i];
            let y = this.positions[i + 1];

            let distFromCenter = Math.sqrt(Math.abs(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)));

            let z = 0;

            let normalizedDistFromCenter = distFromCenter / this.maxRadius;
            let pointFrequencyAssignemnt = normalizedDistFromCenter * this.freqChannels;
            if (pointFrequencyAssignemnt < this.freqChannels - 1) {
                //which freq does this point map to

                if (normalizedDistFromCenter > 1) normalizedDistFromCenter = 1;

                // (ratio of current frame average volume to the past (1-40frames') average volume) * (normalized avg volume of current frame) * ()
                z = this.amp_multiplier * this.totalAmp * autoLeveler * this.maxAmp * amp[Math.floor(normalizedDistFromCenter * this.freqChannels)];

                //interpolation
                z +=
                    (this.amp_multiplier * this.totalAmp * autoLeveler * this.maxAmp * amp[Math.floor(normalizedDistFromCenter * this.freqChannels) + 1] - z) *
                    (normalizedDistFromCenter * this.freqChannels - Math.floor(normalizedDistFromCenter * this.freqChannels));
            } else {
                z = 0;
            }

            //rebalancer
            z *= -30 * -((distFromCenter - 10) / Math.sqrt(Math.pow(distFromCenter - 10, 2) + 1000000)) + 1;

            //set Z pos

            this.positions[i + 2] = clamp(z, -900, 900);

            this.totalCurrentAvgZHeight += z / this.particles;
            this.allTotalAvgZHeights.push(this.totalCurrentAvgZHeight);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    }

    public animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.soundData = this.analyzer.getFrequencyData();
        this.showParticles();
        this.render();
    }

    private render() {
        const time = -40 + (Date.now() - this.startTime) * 0.001;

        let oscillationTime = 20;
        let sweepAngle = 1.1;

        this.points.rotation.y = Math.sin(time / oscillationTime) * sweepAngle; //Math.sin(time / 20) * 5;
        this.points.rotation.z = Math.sin(time / oscillationTime) * sweepAngle;
        this.points.rotation.x = -Math.sin(5 + time / oscillationTime) * sweepAngle;
        // this.camera.position.z = Math.sin((2 * time + 50 * this.userZoomLevel) / oscillationTime) * 1000 + 2600;
        this.userZoomLevel = Math.sin(time);

        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export default WEBGLAudioVisualizer;
