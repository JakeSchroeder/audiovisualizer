import { time, timeEnd } from 'console';
import { normalize } from 'path';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Audio, AudioAnalyser, Clock, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer } from 'three';


const myBtn = document.getElementById("playButton");


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
    private beat_multiplier = 0;

    private maxAmp = 100;
    private totalAmp = 0;
    private maxRadius = 3000;
    private targetZHeight = 1.5;

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

        myBtn?.addEventListener("click", () => {
            this.loadAudio();
        })


        this.containerDOMNode = document.getElementById(containerDOMNodeId) as Div;
        this.audioSource = audioSource;

        this.startTime = Date.now();
        this.renderer = new THREE.WebGLRenderer();
        this.listener = new THREE.AudioListener();
        this.sound = new THREE.Audio(this.listener);
        this.camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 10000);
        this.camera.position.z = 4000;
        this.scene = new Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 8000, 9000);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        this.material = new THREE.PointsMaterial({ size: 15, vertexColors: true });
        this.points = new THREE.Points(this.geometry, this.material);

        this.freqChannels = 64;
        this.positions = [];
        this.soundData = new Uint8Array();
        this.previousAvgAmp = [];
        this.analyzer = new THREE.AudioAnalyser(this.sound, this.freqChannels * 2);

        this.userZoomLevel = 75;
        this.orbitControls.update();
        // this.orbitControls.enableZoom = false;
        this.orbitControls.rotateSpeed = 0.1;

        this.particles = 100000;
        this.particleSpacing = 16;
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
        let centerX = 0;
        let centerY = 0;

        //console.log(this.maxRadius);

        this.beat_multiplier = 1;

        let amp: number[] = [this.freqChannels];
        this.totalAmp = 0;
        this.totalCurrentAvgZHeight = 0;
        this.totalAvgVolume = 0;
        let EWMA_average = 0;
        let EWMA_range = 10;

        for (let n = 0; n < Math.max(this.previousAvgAmp.length, this.freqChannels); n++) {
            //averages the last 10 frames of avg volume data (normalized gaussian distribution)
            if (this.previousAvgAmp.length - EWMA_range < n) {
                EWMA_average += this.previousAvgAmp[n] / EWMA_range;
            }
            //get sound amplitude of each frequency
            if (n < this.freqChannels) {
                let normalizedSoundAmp = this.soundData[n] / 255;
                if (!normalizedSoundAmp) normalizedSoundAmp = 0;

                amp[n] = normalizedSoundAmp;
                //calculate the running average amplitude for the frequencies of this frame
                this.totalAmp += normalizedSoundAmp / this.freqChannels;
            }
            //averages all previous frames avg volume data
            if (n < this.previousAvgAmp.length) {
                this.totalAvgVolume += this.previousAvgAmp[n] / this.previousAvgAmp.length;
            }
        }

        this.previousAvgAmp.push(this.totalAmp);

        if (this.totalAmp && EWMA_average) this.beat_multiplier = this.totalAmp / EWMA_average;

        let autoLeveler = clamp(this.integral, -1, 1);
        //console.log(autoLeveler);

        //for every particle ("i" represents the index of the coordinate position : [x,y,z,x,y,z,...])
        for (let i = 0; i < this.particles * 3; i += 3) {
            //get position of current particle
            let x = this.positions[i];
            let y = this.positions[i + 1];

            let distFromCenter = Math.sqrt(Math.abs(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)));

            let z = 0;

            let normalizedDistFromCenter = distFromCenter / this.maxRadius;
            let pointFrequencyAssignemnt = normalizedDistFromCenter * this.freqChannels;
            if (pointFrequencyAssignemnt < this.freqChannels - 1) {
                //finds which freq this point maps to

                //points beyond the radius are not influenced by the spectrograph volumes
                if (normalizedDistFromCenter > 1) normalizedDistFromCenter = 1;

                /* (ratio of current frame average volume to the past (1 to 40 frames') average volume) * 
                   (normalized avg volume of current frame) *
                   (modifier to influence the height of the particles based on the songs total Average Volume) *
                   (the non-zero value that remaps the scalars to a larger range) *
                   (the volume:height associated with this particles freqency)
               */
                z = this.beat_multiplier * this.totalAmp * this.maxAmp * amp[Math.floor(normalizedDistFromCenter * this.freqChannels)];

                //then interpolation adjustment
                z +=
                    (this.beat_multiplier * this.totalAmp * this.maxAmp * amp[Math.floor(normalizedDistFromCenter * this.freqChannels) + 1] - z) *
                    (normalizedDistFromCenter * this.freqChannels - Math.floor(normalizedDistFromCenter * this.freqChannels));

                z += z * autoLeveler;
            } else {
                z = 0;
            }

            //radial position based height rebalancer (creates the dome shap for the vitual speaker)
            z *= -30 * -((distFromCenter - 10) / Math.sqrt(Math.pow(distFromCenter - 10, 2) + 1000000)) + 1;

            //set Z pos and clamp max / min height
            this.positions[i + 2] = clamp(z, -1000, 1000);

            this.totalCurrentAvgZHeight += z / this.particles;
        }

        let error = this.targetZHeight - this.totalCurrentAvgZHeight;
        this.integral += this.integralSensitivityFactor * error * deltaTime;
        this.maxRadius = this.integral * 0.000000001;

        //console.log(error);

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

        let oscillationTime = 10;
        let sweepAngle = 1;

        this.points.rotation.y = Math.sin(time / oscillationTime) * sweepAngle; //Math.sin(time / 20) * 5;
        this.points.rotation.z = Math.sin(time / oscillationTime) * sweepAngle;
        this.points.rotation.x = -Math.sin(5 + time / oscillationTime) * sweepAngle;
        // this.camera.position.z = Math.sin((2 * time + 50 * this.userZoomLevel) / oscillationTime) * 1000 + 2600;

        //this.points.position.y = Math.sin(time / oscillationTime) * sweepAngle; //Math.sin(time / 20) * 5;
        //this.points.position.z = Math.sin(time / oscillationTime) * sweepAngle;
        //this.points.position.x = -Math.sin(5 + time / oscillationTime) * sweepAngle;

        this.userZoomLevel = 2 * Math.sin(time);

        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export default WEBGLAudioVisualizer;
