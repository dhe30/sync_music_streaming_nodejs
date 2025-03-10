import express from "express";
import db from "../db/queries.js";
import bodyParser from "body-parser";


const router = express.Router();

router.use(bodyParser.json({ limit: "30mb", extended: true }));
router.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

router.post('/create', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.new_playlist(req.body);
    res.status(201).json(result);
})

router.get('/test_songs', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.get_all_songs();
    res.status(201).json(result);
})

router.post('/test_playlist', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.upload_song_to_playlist(req.body);
    console.log(result);
    if (!result) {
        res.status(201).json({err: "already exists"});
    } else {
        res.status(201).json(result);
    }
})

router.get('/test_playlist_all', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.get_all_playlists();
    res.status(201).json(result);
})


router.get('/test_playlist_songs/:id', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.get_playlist_songs({id: req.params.id});
    res.status(201).json(result);
})

router.post('/test_upload_song', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.upload_song(req.body);
    res.status(201).json(result);
})

router.post('/test_queue', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.test_queue(req.body);
    res.status(201).json(result);
})

router.get('/get_all_queue', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.get_all_queue();
    res.status(201).json(result);
})

// playlist test id: 8c8a0439-cd8c-4254-af18-d9a37a8dde8b
// usertoken test id: 09d97492-b5d1-4a54-8b9c-11747b005ba7
router.get('/get_next/:id', async (req, res) => {
    // console.log(req);
    // console.log(req.headers);
    // console.log(req.body);

    const result = await db.get_next_in_queue({playlist_id: req.params.id, user_token: '09d97492-b5d1-4a54-8b9c-11747b005ba7'});
    res.status(201).json(result);
})

export default router;