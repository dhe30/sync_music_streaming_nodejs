import db from './config.js';

const initialize = async () => {
    const client = await db.connect();
    // DROP TABLE IF EXISTS songs CASCADE;

    const createQueue = `
        DROP TABLE IF EXISTS queue;
        CREATE TABLE IF NOT EXISTS queue (
            playlist_id UUID REFERENCES playlist (id),
            song_id UUID REFERENCES songs (id),
            user_token UUID,
            position INTEGER
        );
    `;

    const createSongs = `
        CREATE TABLE IF NOT EXISTS songs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT,
            artist TEXT, 
            date DATE,
            thumbnail TEXT,
            path TEXT
        );
    `;
    //user_id reference users (id)
    // DROP TABLE IF EXISTS playlist CASCADE;

    const createPlaylist = `
        CREATE TABLE IF NOT EXISTS playlist (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            test_id INTEGER,
            name TEXT, 
            date DATE,
            thumbnail TEXT
        );
        UPDATE playlist 
        SET station_id = NULL;
    `;
    const createPlaylistSongs = `
        CREATE TABLE IF NOT EXISTS playlist_songs (
            playlist_id UUID REFERENCES playlist (id),
            song_id UUID REFERENCES songs (id)
        );
    `;
    try {
        await client.query('BEGIN');
        await client.query(createSongs + createPlaylist + createPlaylistSongs + createQueue);
        await client.query('COMMIT');

    } catch (e) {
        await client.query('ROLLBACK');
        console.log("error creating tables");
        throw e;
    } finally {
        client.release();
    }
}

const new_playlist = async ({name}) => {
    const newPlaylist = `
        INSERT INTO playlist (name, date)
        VALUES ($1, $2)
        RETURNING *
        ;
    `;
    const result = await db.query(newPlaylist, [name, new Date().toISOString()]);
    return result.rows[0];
}

const upload_song_to_playlist = async ({song_id, playlist_id}) => {
    const upload = `
        INSERT INTO playlist_songs (playlist_id, song_id)
        SELECT $1, $2
        WHERE NOT EXISTS (SELECT 1 FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2)
        RETURNING *
        ;
    `;
    const result = await db.query(upload, [playlist_id, song_id]);
    return result.rows[0];

}

//after ffmpeg processes the mp3 file and uploads it to the server file
const upload_song = async ({title, artist, date, thumbnail, path}) => {
    const upload = `
    INSERT INTO songs (title, artist, date, thumbnail, path)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;

    const result = await db.query(upload, [title, artist, date, thumbnail, path]);
    return result.rows[0];
}

const get_playlist_songs = async({id}) => {
    const getter = `
    SELECT songs.title, songs.artist, songs.thumbnail, songs.path, songs.id
    FROM playlist_songs JOIN songs 
    ON playlist_songs.song_id = songs.id
    WHERE playlist_songs.playlist_id = $1;
    `;

    const result = await db.query(getter, [id]);
    return result.rows;
}

const get_all_songs = async() => {
    const getter = `
    SELECT * from songs;
    `;
    const result = await db.query(getter);
    return result.rows;
}

const get_all_playlists = async() => {
    const getter = `
    SELECT * from playlist;
    `;
    const result = await db.query(getter);
    return result.rows;
}

const get_all_queue = async() => {
    const getter = `
    SELECT * from queue;
    `;
    const result = await db.query(getter);
    return result.rows;
}

const test_queue = async ({playlist_id, song_id}) => {
    const getter = `
    INSERT INTO queue (playlist_id, song_id)
    SELECT $1, $2
    WHERE NOT EXISTS (SELECT 1 FROM queue WHERE playlist_id = $1 AND song_id = $2)
    RETURNING *;
    `;
    const result = await db.query(getter, [playlist_id, song_id]);
    return result.rows;
}

const get_next_in_queue = async ({playlist_id, user_token}) => {
    //check if queue exists 
    const client = await db.connect()
    try {

        const count = `
        SELECT COUNT(*) FROM queue 
        WHERE playlist_id = $1 AND user_token = $2
        `;

        await client.query('BEGIN')

        const result = await client.query(count, [playlist_id, user_token]);

        if (result.rows[0].count == 0) {

            console.log("no queue, initializing...");

            const initializeQueue = `
                INSERT INTO queue (playlist_id, user_token, song_id, position)
                SELECT 
                    playlist_songs.playlist_id,
                    $2,
                    playlist_songs.song_id,
                    ROW_NUMBER() OVER () - 1 AS position
                FROM playlist_songs WHERE playlist_songs.playlist_id = $1
                LIMIT 5
                RETURNING *
                ;
            `;

            console.log("Inserting...");

            const fresh = await client.query(initializeQueue, [playlist_id, user_token])

            console.log("Inserted: ", fresh.rows);

        } else {

            console.log(`Already exists ${result.rows[0].count} songs in queue.`)

        }
            // (SELECT * from queue WHERE user_token = $2 AND playlist_id = $1) AS current
            //         OUTER RIGHT JOIN (SELECT * from playlist_songs WHERE playlist_id = $1) AS list 
            //         WHERE current.song_id = list.song_id

        //q.user_token is NULL selects for songs not currently in queue
        const queueUp = `
            INSERT INTO queue (playlist_id, user_token, song_id, position)
            SELECT 
                p.playlist_id,
                $2, 
                p.song_id,
                (SELECT MAX(position) from queue WHERE user_token = $2 AND playlist_id = $1) + 1
            FROM queue AS q 
                RIGHT OUTER JOIN playlist_songs AS p 
                ON q.song_id = p.song_id AND q.playlist_id = p.playlist_id 
            WHERE p.playlist_id = $1 AND q.user_token is NULL 
            ORDER BY RANDOM()
            LIMIT 1
            RETURNING *;
        `;

        console.log("Inserting new song into queue...");

        const newInLine = await client.query(queueUp, [playlist_id, user_token])
       
        console.log("Inserted new song: ", newInLine.rows[0]);

        const pop = `
            WITH next_song as (
                DELETE FROM queue 
                WHERE position = (SELECT MIN(position) from queue WHERE user_token = $2 AND playlist_id = $1)
                AND user_token = $2 AND playlist_id = $1
                RETURNING song_id
            ) SELECT * from songs AS list
            WHERE id = (SELECT song_id from next_song);
        `;

        console.log("Popping from queue...");

        const checkOut = await client.query(pop, [playlist_id, user_token])
        
        console.log("Popped: ", checkOut.rows[0]);

        await client.query('COMMIT')

        return checkOut.rows[0];


    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

const get_playlist = async ({id}) => {
    const playlist = `
        SELECT * from playlist 
        WHERE id = $1;
    `;
    const result = await db.query(playlist, [id]);
    return result.rows[0];
}

const updateStation = async ({playlist_id}) => {
    const makeStation = `
        UPDATE playlist 
        SET station_id = gen_random_uuid()
        WHERE id = $1 AND station_id IS NULL
        RETURNING *
        ;
    `;
    const result = await db.query(makeStation, [playlist_id]);
    return result.rows[0];
}

const deleteStation = async ({playlist_id}) => {
    const destroyStation = `
        UPDATE playlist 
        SET station_id = NULL
        WHERE id = $1
        RETURNING *
        ;
    `;
    const result = await db.query(destroyStation, [playlist_id]);
    return result.rows[0];
}

export default {
    initialize,
    new_playlist,
    upload_song_to_playlist,
    upload_song,
    get_playlist_songs,
    get_all_songs,
    get_all_playlists,
    get_all_queue,
    test_queue,
    get_next_in_queue,
    get_playlist,
    updateStation,
    deleteStation
}