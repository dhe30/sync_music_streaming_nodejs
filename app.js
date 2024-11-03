// const http = require('http');
// const fs = require('fs');
// const path = require('path');
// const express = require('express')
// const ffmpeg = require('fluent-ffmpeg');
import express from "express"
import fs from "fs"
import path from "path"
import { PassThrough } from 'stream'
import Throttle from 'throttle';
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const stations = new Map()
const app = express();
// const cors = require('cors'); // npm i -s cors - to install it in your express app
app.use(cors());
// const server = http.createServer((req, res) => {
//     // handle requests here
//     console.log("ajsy");
//     // res.write("gas");
//     // res.end();
// });
app.get("/", (req,res)=>{
    res.sendFile("index.html",{root: '.'})
})
app.get("/stream", (req, res) => {
    //only attach this to a audio once a button has been clicked
    //i.e. audio src = stream with ID PARAMS to pass into generate stream 
    const { id, stream } = generateStream() // We create a new stream for each new client
    res.setHeader("Content-Type", "audio/mpeg")
    res.setHeader("Transfer-Encoding", "chunked")
    stream.pipe(res) // the client stream is pipe to the response
    res.on('close', () => { 
        stations.get(32).streams.delete(id) 
        console.log("deleted: " + id)
    })
})
const generateStream = () => {
    const id = Math.random().toString(36).slice(2);
    const stream = new PassThrough()
    stations.get(32).streams.set(id, stream)
    console.log("created: " +id)
    return { id, stream }
}

app.get("/createStation", (req,res)=>{
    const { id, station } = generateStation();
    playStation(station);
    res.writeHead(200, "OK");
})
app.get("/moby", (req,res)=>{
    // console.log("uhvd")
    stations.get(32).file = path.join(__dirname, "audio","sa.mp3"),
    res.writeHead(200, "OK");
})
const generateStation = (ide) => {
    const id = ide;
    const station = {
        //song 
        //queue
        //map of connected streams 
        file: path.join(__dirname, "audio","cha.mp3"),
        streams: new Map()
    }
    stations.set(id, station);
    console.log(stations);
    return {id, station}
}
const playStation = (station) => {
    //do queueing logic here (remove from top )
    const songReadable = fs.createReadStream(station.file);
    const throttleTransformable = new Throttle(128000 / 4);
    songReadable.pipe(throttleTransformable);
    throttleTransformable.on('data', (chunk) => { broadcastToEveryStreams(chunk, station.streams, station.file) });
    throttleTransformable.on('error', (e) => console.log(e))
    throttleTransformable.on('end', () => playStation(station))
}
const broadcastToEveryStreams = (chunk, streams, file) => {
    // console.log(file);
    for (let [id, stream] of streams) {
        stream.write(chunk) // We write to the client stream the new chunck of data
    }
}
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
        // if (!parts[1]) { 
        //     res.writeHead(206)
        //     return;
        // }
        var partial_start = parts[0];
        var partial_end = parts[1];
        const fileSize = stats.size;
    const chunkSize = 1024 * 1024;
    // const start = Number(range.replace(/\D/g, ""));
    const start = parseInt(partial_start, 10);
    // const end = Math.min(start + chunkSize, fileSize - 1);
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

app.listen(3000, () => {
    console.log('Server running on port 3000');
    const { id, station } = generateStation(32);
    playStation(station);
});