import { time, timeEnd } from 'console';
import { normalize } from 'path';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Audio, AudioAnalyser, Clock, Color, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer } from 'three';
import { clamp } from 'three/src/math/MathUtils';
import { totalmem } from 'os';


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
    private colors: number[];
    private startTime: number;
    private analyzer: THREE.AudioAnalyser;
    private soundData: Uint8Array;
    private previousAvgAmp: number[];
    private totalAvgVolume = 0;
    private beat_multiplier = 1;

    private particlesRemainingInCircle = 0;
    private radius = 0;
    private particlesInCircle = 0;


    private maxAmp = 100;
    private floatingMaxZHeight = 0;
    private totalAmp = 0;
    private maxRadius = 2000;
    private targetZHeight = 300;

    private sideLength: number;

    private equalizer: number = 1000;

    private particles: number;
    private particleSpacing: number;
    private userZoomLevel: number;
    private freqChannels: number;

    private integral: number;
    private previousTime: number;
    private integralSensitivityFactor: number;
    private totalCurrentAvgZHeight: number;
    private zHeightSum: number[];





















    constructor(containerDOMNodeId: string, audioSource: string) {

        this.audioSource = audioSource;
        this.listener = new THREE.AudioListener();
        this.sound = new THREE.Audio(this.listener);

        myBtn?.addEventListener("click", () => {
            this.loadAudio();
        })

        this.containerDOMNode = document.getElementById(containerDOMNodeId) as Div;
        
        this.startTime = Date.now();
        this.renderer = new THREE.WebGLRenderer();
        this.camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 10000);
        this.camera.position.z = 7000;
        this.scene = new Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 8000, 9000);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        this.material = new THREE.PointsMaterial({ size: 15, vertexColors: true });
        this.points = new THREE.Points(this.geometry, this.material);

        this.freqChannels = 64;
        this.positions = [];
        this.colors = [];
        this.soundData = new Uint8Array();
        this.previousAvgAmp = [];
        this.analyzer = new THREE.AudioAnalyser(this.sound, this.freqChannels * 2);

        this.userZoomLevel = 75;
        this.orbitControls.update();
        // this.orbitControls.enableZoom = false;
        this.orbitControls.rotateSpeed = 0.1;

        this.particles = 100000;
        this.particleSpacing = 20;
        this.sideLength = Math.sqrt(this.particles);

        this.integral = 0;
        this.previousTime = 0;
        this.integralSensitivityFactor = 1;
        this.totalCurrentAvgZHeight = 0;
        this.zHeightSum = [];
    }










    private scale (number: number, inMin: number, inMax: number, outMin: number, outMax: number) {
        let scaledValue = ( (number - inMin) / (inMax - inMin) ) * (outMax - outMin) + outMin
        scaledValue = clamp(scaledValue , outMin, outMax);
        if( scaledValue ){
            return scaledValue
        }else{
            return 0
        }
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
        
        let color = new THREE.Color();

        for (let i = 0; i < this.particles; i++) {

            if(this.particlesRemainingInCircle <= 0){
                this.radius += this.particleSpacing;
                let circumference = 2 * this.radius * Math.PI;
                this.particlesInCircle = Math.round(circumference / this.particleSpacing);
                this.particlesRemainingInCircle = this.particlesInCircle;
            }
            this.particlesRemainingInCircle --;
            let theta = 2 * Math.PI * (this.particlesRemainingInCircle / this.particlesInCircle);

            let x = this.radius * Math.sin(theta)
            let y = this.radius * Math.cos(theta)
            let z = 0;

            //push to mesh position and color properties
            this.positions.push(x, y, z);
            color.r = 1 - clamp( this.radius / this.maxRadius - 0.3 , 0, 1);
            color.g = 0
            color.b = 0
            this.colors.push(color.r, color.g, color.b);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
        this.geometry.computeBoundingSphere();

        this.points.geometry.attributes.position.needsUpdate = true;
        this.scene.add(this.points);
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

        this.points.rotation.y = Math.sin(time / oscillationTime) * sweepAngle;
        this.points.rotation.z = Math.sin(time / oscillationTime) * sweepAngle;
        this.points.rotation.x = -Math.sin(5 + time / oscillationTime) * sweepAngle;

        this.renderer.render(this.scene, this.camera);
    }











    // per frame

    // delta time update
    // update EWMA average
    // update normalized freq amp list
    // update normalized total frame amp
    // update total average z height of non-zero particles z height 
    // update total current max height




    // for each particle

    // update x,y
    // update normalized dist from center
    // scale based on:
    //      Beat : current frame amp vs EWMA average
    //      Volume : current frame amp scales all z heights
    //      Speaker Shape : adjust scaling to create speaker disk shape (particles far from center move more - create cone shape)
    //      intertia : 
    // interpolate : smooth between freq amps
    // equalize : re-maps z value to larger range



    // create center cap
    //





    private showParticles() {
        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
        
        let deltaTime = Date.now() - this.previousTime;
        this.previousTime = Date.now();

        //console.log(this.floatingMaxZHeight);

        let amp: number[] = [this.freqChannels];
        this.totalAmp = 0;
        this.totalCurrentAvgZHeight = 0;
        this.zHeightSum = [];
        let averageZHeightRunningSum = 0;
        let totalCurrentMaxHeight = 0;
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

        
        let integralCorrectionFactor = this.integral;
        //console.log(integralCorrectionFactor);

        //for every particle ("i" represents the index of the coordinate position : [x,y,z,x,y,z,...])
        for (let i = 0; i < this.particles * 3; i += 3) {
            //get position of current particle
            let x = this.positions[i];
            let y = this.positions[i + 1];

            let distFromCenter = Math.sqrt(Math.abs(Math.pow(x, 2) + Math.pow(y, 2)));

            let z = 0;

            let normalizedDistFromCenter = clamp( distFromCenter / this.maxRadius, 0, 1);
            let pointFrequencyAssignemnt = Math.floor(normalizedDistFromCenter * this.freqChannels) ;
            if (pointFrequencyAssignemnt < this.freqChannels ) {
                //finds which freq this point maps to

                /* (ratio of current frame average volume to the past (1 to 40 frames') average volume) * 
                   (normalized avg volume of current frame) *
                   (modifier to influence the height of the particles based on the songs total Average Volume) *
                   (the non-zero value that remaps the scalars to a larger range) *
                   (the volume:height associated with this particles freqency)
               */
                z = amp[pointFrequencyAssignemnt];
                
                //then interpolation adjustment
                if(amp[pointFrequencyAssignemnt + 1] != 0){
                    z +=
                    (amp[pointFrequencyAssignemnt + 1] - z) * 
                    (normalizedDistFromCenter * this.freqChannels - pointFrequencyAssignemnt);
                }else{
                    z -= z * (normalizedDistFromCenter * this.freqChannels - pointFrequencyAssignemnt);
                }

                z *= z * z
                z += z * 0.5 * this.maxAmp * this.totalAmp
                z += z * 0.3 * this.beat_multiplier

                //z += (z * z) * this.totalCurrentAvgZHeight
            } else {
                z = 0
            }

            //radial position based height rebalancer (creates the dome shap for the vitual speaker)
            z *= 5  * ( distFromCenter / this.maxRadius)

            //z *= 100 * integralCorrectionFactor

            //z = clamp(z,-3000,3000)

            z = this.scale(z,0,1000,0, this.equalizer)
            

            if(distFromCenter < 300 && z != 0){
                z -= z*(80 - 80 * Math.pow(distFromCenter/300, 2) ) /80

            }
            
            if(Math.abs(z) > 0){
                averageZHeightRunningSum += z / normalizedDistFromCenter;
                this.zHeightSum.push(averageZHeightRunningSum);
            }

            totalCurrentMaxHeight = Math.max(totalCurrentMaxHeight, z)

            this.colors[i] = z / this.targetZHeight
            
            //set Z pos and clamp max / min height
            this.positions[i + 2] = z;
            
        }


        if(totalCurrentMaxHeight > this.floatingMaxZHeight)
        {
            this.floatingMaxZHeight += 5
        }else{
            this.floatingMaxZHeight -= 5
        }

        if(this.zHeightSum.length != 0){
            this.totalCurrentAvgZHeight = averageZHeightRunningSum / this.zHeightSum.length
        }
        

        if(this.floatingMaxZHeight != 0){
            if( totalCurrentMaxHeight <= this.targetZHeight ){
                this.maxRadius +=  0.15 * Math.abs(this.targetZHeight - this.floatingMaxZHeight) //* (this.targetZHeight - this.floatingMaxZHeight)
                this.equalizer += 5 * Math.abs(this.targetZHeight - this.floatingMaxZHeight) //* (this.targetZHeight - this.floatingMaxZHeight) //(1.2 * this.floatingMaxZHeight) * (deltaTime / 1000)
            }else{
                this.maxRadius -= 0.15 * Math.abs(this.floatingMaxZHeight - this.targetZHeight)  //* (this.targetZHeight - this.floatingMaxZHeight)
                this.equalizer -= 5 * Math.abs(this.floatingMaxZHeight - this.targetZHeight) //* (this.targetZHeight - this.floatingMaxZHeight) //(0.1 * this.floatingMaxZHeight) 
            }
        }

        let debug = [Math.round(this.floatingMaxZHeight) , Math.round(this.equalizer)]
        //console.log(debug);
        


        let error = 800 - this.totalCurrentAvgZHeight;
        this.integral += this.integralSensitivityFactor * error * (deltaTime / 1000000);
        this.integral = clamp(this.integral, -1, 1);
        //console.log(Math.round(10 * this.integral));
        //console.log(error)

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));

        //this.camera.position.z = this.scale(this.floatingMaxZHeight * 2,0,500,2000,6000)


    }


















}

export default WEBGLAudioVisualizer;
