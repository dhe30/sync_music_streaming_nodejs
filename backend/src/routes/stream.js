import express from "express";
import fs from "fs"
import path from "path"
import { PassThrough } from 'stream'
import Throttle from 'throttle';
import db from "../db/queries.js";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

router.use(bodyParser.json({ limit: "30mb", extended: true }));
router.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
const stations = new Map()

const station_token = '13635a56-e871-479f-a716-cd0e50b05c91';

const queryHandler = async (query, params, next) => {
    try {
        const result = await query(params);
        return result;
    } catch (err) {
        next(err);
    }
}

router.get("/next/:playlist_id", async (req, res) => {
    //only attach this to a audio once a button has been clicked
    //i.e. audio src = stream with ID PARAMS to pass into generate stream 

    //id should be user token retrieved from cookies

    //
    const result = await db.get_playlist({id: req.params.playlist_id});
    console.log("result", result);
    if (result.station_id) {
        console.log("station exists... initiating connection");
        const { id, stream } = generateStream(result.station_id) // We create a new stream for each new client
        res.setHeader("Content-Type", "audio/mpeg")
        res.setHeader("Transfer-Encoding", "chunked")
        stream.pipe(res) // the client stream is pipe to the response
        res.on('close', async () => { 
            await deleteStream(result.station_id, id);
            // stations.get(result.station_id).streams.delete(id) 
            // console.log("deleted: " + id)
        });
    } else {
        res.sendStatus(404);
    }
})

router.post("/createStation", async (req, res)=>{
    const { id, station, song } = await generateStation(req.body.id);
    playStation(station, song);
    console.log("station has been created");
    res.status(201).json("result");
})

const generateStream = (station_id) => {
    const id = Math.random().toString(36).slice(2);
    const stream = new PassThrough()
    stations.get(station_id).streams.set(id, stream)
    console.log("created: " +id)
    return { id, stream }
}

const generateStation = async (playlist_id) => {
    const result = await db.updateStation({playlist_id: playlist_id});
    const id = result.station_id;
    const station = {
        id: id, //map key 
        token: station_token, //compatibility with queue 
        playlist: playlist_id,
        streams: new Map()
    }
    const res = await db.get_next_in_queue({ playlist_id: playlist_id, user_token: station_token });
    const song = res.path;
    stations.set(id, station);
    // console.log(stations);
    return {id, station, song}
}

const deleteStream = async (stationId, streamId) => {
    //destroy stream as well!!!!!!!!!
    stations.get(stationId).streams.delete(streamId);
    console.log("deleted stream");
    if (stations.get(stationId).streams.size == 0) {
        await db.deleteStation({playlist_id : stations.get(stationId).playlist});
        stations.delete(stationId);
        console.log("deleted station");
    }
}

const prepareNextSong = async (station) => {
    const result = await db.get_next_in_queue({
      playlist_id: station.playlist,
      user_token: station.token
    });
    playStation(station, result.path);
  };

const playStation = (station, path) => {
    //check if station still exists (pass in id?) 

    const songReadable = fs.createReadStream(path); //update this
    const throttleTransformable = new Throttle(128000 / 4); //all uploaded songs are converted by ffmpeg to have a constant bitrate of 128k
    songReadable.pipe(throttleTransformable);
    throttleTransformable.on('data', (chunk) => { broadcastToEveryStreams(chunk, station.streams) });
    throttleTransformable.on('error', (e) => console.log(e))
    throttleTransformable.on('end', () => prepareNextSong(station))
}

const broadcastToEveryStreams = (chunk, streams) => {
    // console.log(file);
    for (let [id, stream] of streams) {
        stream.write(chunk) // We write to the client stream the new chunck of data
    }
}

export default router;