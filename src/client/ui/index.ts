import { v4 as uuid } from 'uuid';
const jsmediatags = require('./jsmediatags.min.js');

type Artist = {
    name: string;
    url: string;
};

type Album = {
    name: string;
    year?: string;
    coverImage?: string;
};
interface ISongFileItem {
    id: string;
    mp3: File;
    getMp3: () => File;
    artists?: Artist[];
    album?: Album | undefined;
}

class SongFileItem implements ISongFileItem {
    id: string;
    mp3: File;
    artists: Artist[];
    album?: Album;

    constructor(mp3: File) {
        this.id = uuid();
        this.mp3 = mp3;
        this.artists = [];
        new jsmediatags.Reader(this.mp3).read({
            onSuccess: (tag: any) => {
                console.log('Success!');
                console.log(tag);
                this.album = {
                    name: tag.tags.artist,
                };
                console.log(this.album);
            },
            onError: (error: any) => {
                console.log('Error');
                console.log(error);
            },
        });
    }

    getMp3() {
        return this.mp3;
    }

    getId() {
        return this.id;
    }
}

export default SongFileItem;
