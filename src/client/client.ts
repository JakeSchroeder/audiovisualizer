import WEBGLAudioVisualizer from './audio-visualizer';
//import { render } from './ui';

<<<<<<< HEAD
const BackgroundAnimation = new WEBGLAudioVisualizer('container', '/sounds/Pirates of the Caribbean - He\'s a Pirate (Extended).mp3');
=======
// function folderSwitcher() {
//     return `
//         <div class="">
//         </div>
//     `
// }
>>>>>>> 239bd4a4c508d3ae022a1053f10173cc6a9ce0ac

function initApp() {
    const BackgroundAnimation = new WEBGLAudioVisualizer('container', "/sounds/Pirates of the Caribbean - He's a Pirate (Extended).mp3");
    BackgroundAnimation.createScene();
    BackgroundAnimation.animate();

    const dragFileToUploadNode = document.getElementById('dragFileToUploadNode');

    const folderWrapperNode = document.getElementById('folderWrapperNode');
    const image = document.createElement('img');
    if (folderWrapperNode && image) {
        image.src = './images/folder-closed.svg';
    }

    folderWrapperNode?.addEventListener('mpuseenter', () => {
        folderWrapperNode.classList.toggle('active');
    });

    folderWrapperNode?.appendChild(image);

    //If user Drag File Over dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('dragover', (event: DragEvent) => {
        event.preventDefault(); //preventing from default behaviour
        dragFileToUploadNode.classList.add('active');
    });
    //If user leave dragged File from dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('dragleave', () => {
        dragFileToUploadNode.classList.remove('active');
    });
    //If user drop File on dragFileToUploadNode
    dragFileToUploadNode?.addEventListener('drop', (event: DragEvent) => {
        event.preventDefault(); //preventing from default behaviour
        //getting user select file and [0] this means if user select multiple files then we'll select only the first one
        let file = event.dataTransfer?.files[0];
        console.log(file); //calling function
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
        dragFileToUploadNode.addEventListener('drag', drag);
        // dragFileToUploadNode.addEventListener('dragleave', dragLeave);
        // dragFileToUploadNode.addEventListener('drop', drop);
    }

    //

    function dragEnter(e: DragEvent) {
        console.log('it worked');
        e.preventDefault();
        const target = e.target as HTMLDivElement;
        target.classList.add('drag-enter');
    }

    function dragOver(e: DragEvent) {}

    function drag(e: DragEvent) {
        const dt = e.dataTransfer;
        const files = dt?.files;
        const fileArray = [...files!];
        console.log(files);
        console.log(Array);
    }

    function dragLeave(e: DragEvent) {}

    const searchSongInput = document.getElementById('searchSongInput');

    searchSongInput?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            searchSong('Do it!');
        }
    });

    function handleDragEntered() {
        console.log('Entered');
    }

    function searchSong(searchString: string) {
        console.log();
    }
}

document.addEventListener('DOMContentLoaded', initApp);
