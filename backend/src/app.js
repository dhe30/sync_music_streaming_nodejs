// const http = require('http');
// const fs = require('fs');
// const path = require('path');
// const express = require('express')
// const ffmpeg = require('fluent-ffmpeg');
import express from "express"
import fs from "fs"
import path from "path"
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";

import playlistRoutes from "./routes/playlist.js";
import streamRoutes from "./routes/stream.js";
import authRoutes from "./routes/auth.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const app = express();

// const cors = require('cors'); // npm i -s cors - to install it in your express app
app.use(cors());
app.use('/static', express.static(path.join(__dirname)))
app.use('/playlist', playlistRoutes);
app.use('/stream', streamRoutes);
app.use('/auth', authRoutes)

// live station 13635a56-e871-479f-a716-cd0e50b05c91

app.get("/", (req,res)=>{
    res.sendFile("index.html",{root: '.'})
})


app.get("/moby", (req,res)=>{
    // console.log("uhvd")
    stations.get(32).file = path.join(__dirname, "audio","sa.mp3"),
    res.writeHead(200, "OK");
})


app.get("/audio/:id", (req,res) => {
    const filePath = path.join(__dirname, "audio", req.params.id + ".mp3");
    //check that file exists at path
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error(err);
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('File not found');
            return;
        }
        console.log(req.headers.range);
        const range = req.headers.range;
        const parts = range.replace(/bytes=/, "").split("-");

        var partial_start = parts[0];
        var partial_end = parts[1];
        const fileSize = stats.size;
        const chunkSize = 1024 * 1024;
        const start = parseInt(partial_start, 10);
        const end = partial_end ? parseInt(partial_end, 10) : stats.size - 1;
        const headers = {
            "Content-Type": "audio/mpeg",
            "Content-Length": end - start + 1,
            "Content-Range": "bytes " + start + "-" + end + "/" + fileSize,
            "Accept-Ranges": "bytes",
        };

        console.log(headers);

        res.writeHead(206, headers);
        
        const fileStream = fs.createReadStream(filePath, { start, end });
        fileStream.pipe(res)
        

    })
    // res.write("gases"); 
    // res.end();
})

app.post('upload', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({message: "Don't do this!"});
    }

    const inputStream = streamifier.createReadStream(req.file.buffer);
    const outputFilePath = path.join(__dirname, 'audio', `processed-${Date.now()}.mp3`);
    const outputStream = fs.createWriteStream(outputFilePath);

    ffmpeg(inputStream)
        .audioBitrate(128)
        .toFormat('mp3')
        .on('end', () => {
            console.log('File conversion completed'); 
            res.status(200).send({
                message: 'File uploaded and converted successfully!',
                filePath: outputFilePath
            });
        })
        .on('error', (err) => {
            console.error('Error during conversion:', err);
            res.status(500).send({ message: 'File conversion failed', error: err.message });
        })
        .pipe(outputStream, { end: true });
});

if (!fs.existsSync(path.join(__dirname, 'audio'))) {
    fs.mkdirSync(path.join(__dirname, 'audio'));
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});