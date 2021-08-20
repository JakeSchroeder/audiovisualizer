import { jsmediatagsError, Reader, TagType } from 'jsmediatags/types';
import { stringify, v4 as uuid } from 'uuid';
import { Song, SongFileTableRow } from './song';

const jsMediaReader = require('jsmediatags/dist/jsmediatags.min.js');

class UserInterface {
    private isDragging: boolean;
    private bodyDOMElement: HTMLElement;
    private contextSelectNode: HTMLSelectElement;
    private contextSongTableNode: HTMLTableElement;
    private dropFileToUploadNode: HTMLDivElement;
    private songItemList: Song[];
    private dropFileFolderImageNode: HTMLImageElement;
    private songTableTBodyNode: HTMLTableRowElement;

    constructor() {
        this.isDragging = false;
        this.bodyDOMElement = document.querySelector('body') as HTMLBodyElement;
        this.songItemList = [];
        this.dropFileToUploadNode = document.querySelector('#dropFileToUploadNode') as HTMLDivElement;
        this.contextSelectNode = document.querySelector('.contextSelectNode') as HTMLSelectElement;
        this.contextSongTableNode = document.querySelector('.songlist-table') as HTMLTableElement;
        this.songTableTBodyNode = document.querySelector('.songlist-tbody') as HTMLTableRowElement;
        this.dropFileFolderImageNode = document.getElementById('folderImageNode') as HTMLImageElement;

        const selectInput = document.getElementById('mp3FileUploadNode');
        const selectButton = document.getElementById('selectFileBtnNode');
        selectButton?.addEventListener('click', () => {
            selectInput?.click();
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            this.dropFileToUploadNode.addEventListener(
                eventName,
                (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                },
                false
            );
        });

        ['dragenter'].forEach((eventName) => {
            this.dropFileToUploadNode.addEventListener(
                eventName,
                () => {
                    this.dropFileToUploadNode.classList.add('drag-active');
                    this.dropFileFolderImageNode.src = '/images/folder-open.svg';
                },
                false
            );
        });
        ['dragleave', 'drop'].forEach((eventName) => {
            this.dropFileToUploadNode.addEventListener(
                eventName,
                () => {
                    this.dropFileToUploadNode.classList.remove('drag-active');

                    this.dropFileFolderImageNode.src = '/images/folder-closed.svg';
                },
                false
            );
        });

        this.dropFileToUploadNode.addEventListener(
            'drop',
            (e: DragEvent) => {
                let dt = e.dataTransfer;
                if (dt) {
                    let file = [...dt.files][0];
                    // const song = new Song(file);
                    this.addSong(file);
                }
            },
            false
        );

        this.createGlobalEventListeners();
        this.createSearch();
        this.resizeSelect();
    }

    private async addSong(file: File) {
        let song = new Song();
        await song.getSongMetaData(new jsMediaReader.Reader(file));
        this.songItemList.push(song);
        this.renderTable();
    }

    private renderTable() {
        let template = ``;
        this.songItemList.map((songItem, index) => {
            template += `<tr class="songlist-item">
                <td>${index + 1}</td>
                <td class="f ac">
                    <img width="32px" height="32px" src="/images/no-album.png" />
                    <div class="f dc ml-2">
                        <span class="songlist-itemtitle">${songItem._title}</span>
                        <span class="songlist-itemartists small mt">${songItem._artist}</span>
                    </div>
                </td>
                <td>${songItem._album}</td>
                <td>8:11</td>
            </tr>`;
        });
        this.songTableTBodyNode.innerHTML = template;
    }

    private createGlobalEventListeners() {
        //Listen for all change events
        document.addEventListener('change', (e: Event) => {
            // console.log('Document caught the Change Event', e);
            let node = e.target as HTMLElement;
            if (node.matches('select')) {
                this.resizeSelect();
            }
        });
    }

    private resizeSelect() {
        let temp_contextSelectNode = document.querySelector('.temp_contextSelectNode') as HTMLSelectElement;
        let temp_contextOptionNode = document.querySelector('.temp_contextOptionNode') as HTMLOptionElement;
        temp_contextOptionNode.textContent = this.contextSelectNode.options[this.contextSelectNode.selectedIndex].textContent;
        temp_contextSelectNode.appendChild(temp_contextOptionNode);
        this.contextSelectNode.style.width = `${temp_contextSelectNode.getBoundingClientRect().width + 8}px`;
    }

    private createSearch() {
        const searchSongInput = document.getElementById('searchSongInput');

        searchSongInput?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                console.log('We are typing');
            }
        });
    }
}

export default UserInterface;
