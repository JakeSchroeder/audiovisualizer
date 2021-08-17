import WEBGLAudioVisualizer from './audio-visualizer';
import SongFileItem from './ui';
let audioVisualizer;
let file;

function initApp() {
    createAudioVisualer();
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
    const selectInput = document.getElementById('mp3FileUploadNode');
    const selectButton = document.getElementById('selectFileBtnNode');
    selectButton?.addEventListener('click', () => {
        selectInput?.click();
    });
    dragFileToUploadNode?.addEventListener('dragover', (event: DragEvent) => {
        event.preventDefault(); //preventing from default behaviour
        dragFileToUploadNode.classList.add('active');
        //  folderImageNode.src = '/images/folder-open.svg';
    });
    //If user leave dragged File from dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('dragleave', (event: DragEvent) => {
        event.preventDefault();
        dragFileToUploadNode.classList.remove('active');

        //  folderImageNode.src = '/images/folder-closed.svg';
    });
    //If user drop File on dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('drop', (event: DragEvent) => {
        dragFileToUploadNode.classList.remove('active');
        event.preventDefault(); //preventing from default behaviour
        //getting user select file and [0] this means if user select multiple files then we'll select only the first one
        file = event.dataTransfer?.files[0] as File;
        if (file) {
            const songFileItem = new SongFileItem(file);
            console.log(songFileItem);
        }
        //  folderImageNode.src = '/images/folder-closed.svg';
    });
}

function createAudioVisualer() {
    audioVisualizer = new WEBGLAudioVisualizer('audioVisualizerDisplayNode', '/sounds/Marsh feat. Leo Wood - My stripes (Braxton & Marsh Remix).mp3');
    audioVisualizer.createScene();
    audioVisualizer.animate();
    audioVisualizer.loadAudio();
}

function render(template: string, node: HTMLDivElement) {
    if (!node) {
        return;
    }

    node.innerHTML = template;
}

document.addEventListener('DOMContentLoaded', initApp);
