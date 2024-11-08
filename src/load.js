document.addEventListener('DOMContentLoaded', () => {

    console.log("gdtevdebd");
    const container = document.getElementById('song-container');

    // Function to create a button for each song
    const createSongButton = (song) => {
        const div = document.createElement('div');
        const button = document.createElement('button');
        const addToPlaylist = document.createElement('button');
        addToPlaylist.setAttribute('data-id', song.id)
        addToPlaylist.onclick = () => add(addToPlaylist.getAttribute('data-id'), '8c8a0439-cd8c-4254-af18-d9a37a8dde8b')
        button.textContent = song.title;
        addToPlaylist.textContent = `ADD ${song.title} to playlist1`;
        div.appendChild(button);
        div.appendChild(addToPlaylist);
        // button.onclick = () => window.location.href = song.url;
        return div;
    };

    const add = async (sid, pid) => {
        fetch('http://localhost:3000/playlist/test_playlist', {
            method: "POST", 
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                song_id: sid,
                playlist_id: pid
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("success", data);
        })
        .catch(error => console.error('Error fetching songs:', error));
    }
    // const setStream = async (id) => {

    // }

    // Fetch songs from the API
    fetch('http://localhost:3000/playlist/test_songs') 
        .then(response => response.json())
        .then(songs => {
            songs.forEach(song => {
                const songButton = createSongButton(song);
                container.appendChild(songButton);
            });
        })
        .catch(error => console.error('Error fetching songs:', error));
    
    const playlistsCo = document.getElementById('playlist-container');


    const createPlaylist = (playlist) => {
        const div = document.createElement('div');
        const head = document.createElement('h1');
        const station = document.createElement('button');
        station.setAttribute('data-id', playlist.id)
        // station.onclick = () => add(addToPlaylist.getAttribute('data-id'), '8c8a0439-cd8c-4254-af18-d9a37a8dde8b')
        head.textContent = playlist.name + " " + playlist.id;
        station.textContent = `station`;
        div.appendChild(head);
        div.appendChild(station);
        // button.onclick = () => window.location.href = song.url;
        return div;
    };

    const createAddQueue = (song, playlist_id) => {
        console.log(song);
        const div = document.createElement('div');
        const head = document.createElement('h2');
        const addToQueue = document.createElement('button');

        addToQueue.setAttribute('data-id', song.id);
        addToQueue.setAttribute('data-playlist-id', playlist_id);

        addToQueue.onclick = () => addQueue(song.id, playlist_id)
        head.textContent = song.title + " " + song.id;
        addToQueue.textContent = `ADD to queue`;
        div.appendChild(head);
        div.appendChild(addToQueue);
        // button.onclick = () => window.location.href = song.url;
        return div;
    };

    const addQueue = async (sid, pid) => {
        fetch('http://localhost:3000/playlist/test_queue', {
            method: "POST", 
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                song_id: sid,
                playlist_id: pid
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("success", data);
        })
        .catch(error => console.error('Error fetching songs:', error));
    }

    fetch('http://localhost:3000/playlist/test_playlist_all') 
        .then(response => response.json())
        .then(playlists => {
            playlists.forEach(playlist => {
                console.log(playlist)
                const playlistDiv = createPlaylist(playlist);
                fetch(`http://localhost:3000/playlist/test_playlist_songs/${playlist.id}`,{
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                })
                .then(response => response.json())
                .then(songs => {
                    songs.forEach(song => {
                        console.log(song)
                        const songButton = createAddQueue(song, playlist.id);
                        playlistDiv.appendChild(songButton);
                        playlistsCo.appendChild(playlistDiv);
                    });
                })
                .catch(error => console.error('Error fetching songs:', error));
            });
        })
        .catch(error => console.error('Error fetching songs:', error));


});