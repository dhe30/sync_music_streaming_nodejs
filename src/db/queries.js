import db from './config.js';

const initialize = async () => {
    const client = await db.connect();
    // DROP TABLE IF EXISTS songs CASCADE;

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
    `;
    const createPlaylistSongs = `
        DROP TABLE IF EXISTS playlist_songs;
        CREATE TABLE playlist_songs (
            playlist_id UUID REFERENCES playlist (id),
            song_id UUID REFERENCES songs (id)
        );
    `;
    try {
        await client.query('BEGIN');
        await client.query(createSongs + createPlaylist + createPlaylistSongs);
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
    SELECT songs.title, songs.artist, songs.thumbnail, songs.path 
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

export default {
    initialize,
    new_playlist,
    upload_song_to_playlist,
    upload_song,
    get_playlist_songs,
    get_all_songs,
    get_all_playlists
}