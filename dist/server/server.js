"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const ytExec = require('fs');
const port = 3000;
class App {
    constructor(port) {
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        this.server = new http_1.default.Server(app);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
        const subprocess = ytExec.raw('https://www.youtube.com/watch?v=av9uuDxkVb0', { dumpSingleJson: true });
        console.log(`Running subprocess as ${subprocess.pid}`);
        subprocess.stdout.pipe(fs_1.default.createWriteStream('stdout.txt'));
        subprocess.stderr.pipe(fs_1.default.createWriteStream('stderr.txt'));
        setTimeout(subprocess.cancel, 30000);
    }
}
new App(port).Start();
