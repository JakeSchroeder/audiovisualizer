import WEBGLAudioVisualizer from './audio-visualizer';
import { render } from './ui';

let audioVisualizer;

function initApp() {
    // createAudioVisualer();
    createFileUpload();
    createSearch();
}

function createSearch() {
    const searchSongInput = document.getElementById('searchSongInput');

    searchSongInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            console.log('Do it!');
        }
    });
}

function createFileUpload() {
    const dragFileToUploadNode = document.getElementById('dragFileToUploadNode');
    const folderImageNode = document.getElementById('folderImageNode') as HTMLImageElement;

    dragFileToUploadNode?.addEventListener('dragover', (event: DragEvent) => {
        event.preventDefault(); //preventing from default behaviour
        dragFileToUploadNode.classList.add('active');
        folderImageNode.src = '/images/folder-open.svg';
    });
    //If user leave dragged File from dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('dragleave', () => {
        dragFileToUploadNode.classList.remove('active');
        folderImageNode.src = '/images/folder-closed.svg';
    });
    //If user drop File on dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('drop', (event: DragEvent) => {
        event.preventDefault(); //preventing from default behaviour
        //getting user select file and [0] this means if user select multiple files then we'll select only the first one
        let file = event.dataTransfer?.files[0];
        console.log(file); //calling function
        folderImageNode.src = '/images/folder-closed.svg';
    });

    if (dragFileToUploadNode) {
        //Handle when user drags file over drop zone.
        dragFileToUploadNode.addEventListener('dragover', (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer?.dropEffect;
            const target = e.target as HTMLDivElement;
            target.classList.add('drag-enter');
        });
        //Handle when user leaves drop zone
        dragFileToUploadNode.addEventListener('dragleave', (e: DragEvent) => {
            e.preventDefault();
            const target = e.target as HTMLDivElement;
            target.classList.remove('drag-enter');
        });
    }
}

function createAudioVisualer() {
    audioVisualizer = new WEBGLAudioVisualizer('container', '/sounds/Marsh feat. Leo Wood - My stripes (Braxton & Marsh Remix).mp3');
    audioVisualizer.createScene();
    audioVisualizer.animate();
}

document.addEventListener('DOMContentLoaded', initApp);
