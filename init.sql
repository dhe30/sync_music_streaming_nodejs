CREATE TABLE IF NOT EXISTS users(
    username TEXT UNIQUE,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    artist TEXT, 
    date DATE,
    thumbnail TEXT,
    path TEXT
);

CREATE TABLE IF NOT EXISTS playlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id INTEGER,
    name TEXT, 
    date DATE,
    thumbnail TEXT,
    station_id UUID
);

CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id UUID REFERENCES playlist (id),
    song_id UUID REFERENCES songs (id)
);

DROP TABLE IF EXISTS queue;
CREATE TABLE IF NOT EXISTS queue (
    playlist_id UUID REFERENCES playlist (id),
    song_id UUID REFERENCES songs (id),
    user_token UUID REFERENCES users (id),
    position INTEGER
);
