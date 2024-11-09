import express from "express";
import db from "../db/queries.js";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const stations = new Map()
const router = express.Router();

const station_token = '13635a56-e871-479f-a716-cd0e50b05c91';

const queryHandler = async (query, params, next) => {
    try {
        const result = await query(params);
        return result;
    } catch (err) {
        next(err);
    }
}

router.get("/:playlist_id", async (req, res) => {
    //only attach this to a audio once a button has been clicked
    //i.e. audio src = stream with ID PARAMS to pass into generate stream 

    //id should be user token retrieved from cookies

    //
    const result = await db.get_playlist({id: req.params.playlist_id});
    console.log("result", result);
    if (result) {
        console.log("station exists... initiating connection");
        const { id, stream } = generateStream(result.station_id) // We create a new stream for each new client
        res.setHeader("Content-Type", "audio/mpeg")
        res.setHeader("Transfer-Encoding", "chunked")
        stream.pipe(res) // the client stream is pipe to the response
        res.on('close', () => { 
            stations.get(result.station_id).streams.delete(id) 
            console.log("deleted: " + id)
        });
    } else {
        res.sendStatus(404);
    }
})

router.post("/createStation", (req, res)=>{
    const { id, station } = generateStation(req.body.id);
    playStation(station);
    res.writeHead(200, "OK");
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
    stations.set(id, station);
    // console.log(stations);
    return {id, station}
}

export default router;