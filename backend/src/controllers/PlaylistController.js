import pool from './config.js';

const new_playlist = async ({name}) => {
    const newPlaylist = `
        INSERT INTO playlist (name, date)
        VALUES ($1, $2)
        RETURNING *
        ;
    `;
    const result = await pool.query(newPlaylist, [name, new Date().toISOString()]);
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
    const result = await pool.query(upload, [playlist_id, song_id]);
    return result.rows[0];
}

const get_playlist_songs = async({id}) => {
    const getter = `
    SELECT songs.title, songs.artist, songs.thumbnail, songs.path, songs.id
    FROM playlist_songs JOIN songs 
    ON playlist_songs.song_id = songs.id
    WHERE playlist_songs.playlist_id = $1;
    `;

    const result = await pool.query(getter, [id]);
    return result.rows;
}

const get_playlist = async ({id}) => {
    const playlist = `
        SELECT * from playlist 
        WHERE id = $1;
    `;
    const result = await pool.query(playlist, [id]);
    return result.rows[0];
}

const get_all_playlists = async() => {
    const getter = `
    SELECT * from playlist;
    `;
    const result = await pool.query(getter);
    return result.rows;
}

export default {
    new_playlist,
    upload_song_to_playlist,
    get_playlist_songs,
    get_playlist,
    get_all_playlists
}