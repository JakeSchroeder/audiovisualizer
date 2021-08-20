import { Tags, TagType, Reader, CallbackType } from 'jsmediatags/types';
import { v4 as uuid } from 'uuid';

class Song {
    id = '';
    _mp3Url?: string = '';
    _title?: string = '';
    _album?: string = '';
    _year?: string = '';
    _albumPictureSrc?: string = '';
    _artist?: string = '';

    constructor() {
        this.id = uuid();
    }

    public getSongMetaData(mediaReader: Reader) {
        return new Promise((resolve, reject) => {
            mediaReader.read({
                onSuccess: (result) => {
                    console.log('Success!');
                    resolve(result.tags);
                },
                onError: (error) => {
                    console.log('Error');
                    reject(error);
                },
            });
        })
            .then((data: any) => {
                this._title = data.title;
                this._artist = data.artist;
                this._album = data.album;
                this._year = data.year;
                // TODO ADD PIC
                console.log(data);
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

class SongFileTableRow {}

export { Song, SongFileTableRow };
