document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentSongTitle = document.getElementById('current-song-title');
    const currentSongArtist = document.getElementById('current-song-artist');
    const currentSongImg = document.getElementById('current-song-img');
    const currentTimeSpan = document.getElementById('current-time');
    const totalTimeSpan = document.getElementById('total-time');
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector('.progress');
    const addSongsBtn = document.getElementById('add-songs-btn');
    const audioFileInput = document.getElementById('audio-file-input');
    const playlistUl = document.getElementById('playlist-ul');
    const togglePlaylistBtn = document.getElementById('toggle-playlist-btn');
    const playlistContainer = document.getElementById('playlist-container');
    const closePlaylistBtn = document.getElementById('close-playlist-btn');

    let isPlaying = false;
    let currentSongIndex = -1;
    let playlist = []; // Almacenará los objetos de archivo de audio y sus metadatos

    // Función para formatear el tiempo
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Cargar metadatos de la canción (requiere una librería como jsmediatags para archivos locales, aquí se simula)
    const loadSongInfo = (file) => {
        return new Promise((resolve) => {
            if (file) {
                // Simulación de carga de metadatos (realmente necesitarías una librería para esto)
                const reader = new FileReader();
                reader.onload = (e) => {
                    const audio = new Audio(e.target.result);
                    audio.onloadedmetadata = () => {
                        resolve({
                            title: file.name.split('.').slice(0, -1).join('.'), // Título del archivo
                            artist: 'Artista Desconocido', // Puedes intentar extraer esto si la librería lo permite
                            duration: audio.duration,
                            src: e.target.result, // URL del objeto para reproducir
                            image: 'https://via.placeholder.com/150/FFC107/FFFFFF?text=🎵' // Imagen por defecto
                        });
                    };
                };
                reader.readAsDataURL(file);
            } else {
                resolve({
                    title: 'Ninguna Canción',
                    artist: 'N/A',
                    duration: 0,
                    src: '',
                    image: 'https://via.placeholder.com/150/FFC107/FFFFFF?text=🎵'
                });
            }
        });
    };

    // Actualizar la interfaz con la información de la canción
    const updatePlayerInfo = async () => {
        if (currentSongIndex >= 0 && currentSongIndex < playlist.length) {
            const song = playlist[currentSongIndex];
            currentSongTitle.textContent = song.title;
            currentSongArtist.textContent = song.artist;
            currentSongImg.src = song.image;
            audioPlayer.src = song.src;

            // Esperar a que el audio cargue para obtener la duración real
            audioPlayer.onloadedmetadata = () => {
                totalTimeSpan.textContent = formatTime(audioPlayer.duration);
            };

            // Remover la clase 'playing' de todas las canciones y añadirla a la actual
            document.querySelectorAll('#playlist-ul li').forEach((li, index) => {
                if (index === currentSongIndex) {
                    li.classList.add('playing');
                } else {
                    li.classList.remove('playing');
                }
            });

        } else {
            currentSongTitle.textContent = 'Ninguna Canción';
            currentSongArtist.textContent = 'N/A';
            currentSongImg.src = 'https://via.placeholder.com/150/FFC107/FFFFFF?text=🎵';
            totalTimeSpan.textContent = '0:00';
            currentTimeSpan.textContent = '0:00';
            progress.style.width = '0%';
            audioPlayer.src = '';
        }
    };

    // Reproducir o pausar
    const playPauseSong = () => {
        if (playlist.length === 0) return; // No hay canciones para reproducir

        if (isPlaying) {
            audioPlayer.pause();
            playPauseBtn.classList.replace('fa-pause', 'fa-play');
        } else {
            if (currentSongIndex === -1) { // Si no hay canción seleccionada, reproduce la primera
                currentSongIndex = 0;
                updatePlayerInfo();
            }
            audioPlayer.play();
            playPauseBtn.classList.replace('fa-play', 'fa-pause');
        }
        isPlaying = !isPlaying;
    };

    // Siguiente canción
    const nextSong = () => {
        if (playlist.length === 0) return;
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        updatePlayerInfo();
        if (isPlaying) {
            audioPlayer.play();
        } else {
            playPauseBtn.classList.replace('fa-pause', 'fa-play');
            isPlaying = false;
        }
    };

    // Canción anterior
    const prevSong = () => {
        if (playlist.length === 0) return;
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        updatePlayerInfo();
        if (isPlaying) {
            audioPlayer.play();
        } else {
            playPauseBtn.classList.replace('fa-pause', 'fa-play');
            isPlaying = false;
        }
    };

    // Actualizar barra de progreso y tiempo
    audioPlayer.addEventListener('timeupdate', () => {
        const { currentTime, duration } = audioPlayer;
        progress.style.width = `${(currentTime / duration) * 100}%`;
        currentTimeSpan.textContent = formatTime(currentTime);
    });

    // Reproducir la siguiente canción cuando la actual termine
    audioPlayer.addEventListener('ended', nextSong);

    // Click en la barra de progreso
    progressBar.addEventListener('click', (e) => {
        const progressBarWidth = progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / progressBarWidth) * duration;
    });

    // Event Listeners para los botones
    playPauseBtn.addEventListener('click', playPauseSong);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);

    // Manejar la adición de canciones
    addSongsBtn.addEventListener('click', () => {
        audioFileInput.click(); // Abrir el diálogo de selección de archivo
    });

    audioFileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                const songInfo = await loadSongInfo(file);
                playlist.push(songInfo);
            }
        }
        renderPlaylist();
        if (currentSongIndex === -1 && playlist.length > 0) {
            currentSongIndex = 0;
            updatePlayerInfo();
        }
    });

    // Renderizar la lista de reproducción
    const renderPlaylist = () => {
        playlistUl.innerHTML = '';
        playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            li.innerHTML = `
                <span class="song-number">${index + 1}.</span>
                <span class="song-title-list">${song.title}</span>
                <span class="song-duration">${formatTime(song.duration)}</span>
            `;
            if (index === currentSongIndex) {
                li.classList.add('playing');
            }
            li.addEventListener('click', () => {
                currentSongIndex = index;
                updatePlayerInfo();
                if (!isPlaying) {
                    playPauseBtn.classList.replace('fa-play', 'fa-pause');
                    isPlaying = true;
                }
                audioPlayer.play();
            });
            playlistUl.appendChild(li);
        });
    };

    // Toggle para la lista de reproducción
    togglePlaylistBtn.addEventListener('click', () => {
        playlistContainer.classList.toggle('show');
    });

    closePlaylistBtn.addEventListener('click', () => {
        playlistContainer.classList.remove('show');
    });

    // Inicializar el reproductor
    updatePlayerInfo();
    renderPlaylist();
});
