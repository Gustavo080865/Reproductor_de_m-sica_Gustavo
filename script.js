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

    const LOCAL_STORAGE_KEY = 'gustavoMusicPlaylist'; // Clave para localStorage

    // Función para formatear el tiempo
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Cargar metadatos de la canción
    // Nota: Para archivos locales, `FileReader.readAsDataURL` crea una URL temporal.
    // Esta URL *no* persiste entre sesiones. Para que persistan, necesitaríamos un servidor
    // o una base de datos indexada. Sin embargo, podemos guardar los *nombres* de los archivos
    // y la estructura de la playlist para recrear una apariencia similar,
    // pero el usuario tendría que volver a cargar los archivos si quiere que el reproductor
    // vuelva a tener acceso a los bytes del audio.
    // Para simplificar y cumplir con la persistencia "visual" de la playlist,
    // guardaremos la información de las canciones y asumiremos que, al recargar,
    // el usuario volverá a seleccionar los archivos para la reproducción si lo desea.
    // Si realmente necesitas los *archivos de audio* persistentes sin que el usuario los seleccione,
    // eso va más allá del alcance de un reproductor puramente frontend con localStorage.
    const loadSongInfo = (file) => {
        return new Promise((resolve) => {
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const audio = new Audio(e.target.result);
                    audio.onloadedmetadata = () => {
                        resolve({
                            title: file.name.split('.').slice(0, -1).join('.'),
                            artist: 'Artista Desconocido',
                            duration: audio.duration,
                            src: e.target.result, // Esta src es temporal y NO persistirá al recargar.
                            fileName: file.name, // Guardamos el nombre del archivo para referencia
                            image: 'https://via.placeholder.com/150/FFC107/FFFFFF?text=🎵'
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
                    fileName: '',
                    image: 'https://via.placeholder.com/150/FFC107/FFFFFF?text=🎵'
                });
            }
        });
    };

    // Función para cargar la playlist desde localStorage
    const loadPlaylistFromLocalStorage = () => {
        const savedPlaylist = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedPlaylist) {
            playlist = JSON.parse(savedPlaylist);
            // IMPORTANTE: Las URLs de DataURL (src) NO persisten en localStorage de forma útil.
            // Al cargar, estas URLs estarán rotas. El usuario deberá volver a añadir los archivos
            // para que el reproductor pueda acceder a su contenido de audio, aunque la lista
            // de nombres de canciones sí persista.
            // Podríamos intentar recrear la playlist visualmente y pedir al usuario que recargue los archivos.
            playlist.forEach(song => {
                song.src = ''; // Limpiamos la src para evitar errores con URLs rotas
            });
            renderPlaylist();
            // Si hay canciones guardadas, intenta establecer la primera como actual, pero sin reproducir
            if (playlist.length > 0) {
                currentSongIndex = 0;
                updatePlayerInfo(false); // No intentes cargar el audio todavía
            }
        }
    };

    // Función para guardar la playlist en localStorage
    const savePlaylistToLocalStorage = () => {
        // Al guardar, no necesitamos guardar el 'src' temporal del DataURL,
        // solo la información que describe la canción.
        const playlistToSave = playlist.map(song => ({
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            fileName: song.fileName, // Guardamos el nombre del archivo para referencia
            image: song.image
        }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playlistToSave));
    };


    // Actualizar la interfaz con la información de la canción
    const updatePlayerInfo = async (loadAudio = true) => {
        if (currentSongIndex >= 0 && currentSongIndex < playlist.length) {
            const song = playlist[currentSongIndex];
            currentSongTitle.textContent = song.title;
            currentSongArtist.textContent = song.artist;
            currentSongImg.src = song.image;
            totalTimeSpan.textContent = formatTime(song.duration || 0); // Mostrar duración guardada

            if (loadAudio) {
                // Si la 'src' de la canción actual está vacía (porque se cargó de localStorage)
                // y el usuario intenta reproducir, se le pedirá que la añada de nuevo.
                // Esto es una limitación del almacenamiento de archivos locales en el navegador.
                if (song.src === '') {
                    console.warn(`No se puede reproducir "${song.title}" directamente. Por favor, añade el archivo de audio nuevamente.`);
                    audioPlayer.src = '';
                    currentSongTitle.textContent += " (Cargar de nuevo)";
                    isPlaying = false;
                    playPauseBtn.classList.replace('fa-pause', 'fa-play');
                } else {
                    audioPlayer.src = song.src;
                    audioPlayer.onloadedmetadata = () => {
                        totalTimeSpan.textContent = formatTime(audioPlayer.duration);
                    };
                }
            } else {
                audioPlayer.src = ''; // Aseguramos que el reproductor no intente cargar una src rota
            }


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
        if (playlist.length === 0) return;

        if (currentSongIndex === -1) {
            currentSongIndex = 0;
            updatePlayerInfo();
        }

        // Si la src está vacía (canción cargada de localStorage sin archivo), no se puede reproducir
        if (playlist[currentSongIndex].src === '') {
            console.warn("No se puede reproducir. El archivo de audio no está disponible.");
            return;
        }

        if (isPlaying) {
            audioPlayer.pause();
            playPauseBtn.classList.replace('fa-pause', 'fa-play');
        } else {
            audioPlayer.play();
            playPauseBtn.classList.replace('fa-play', 'fa-pause');
        }
        isPlaying = !isPlaying;
    };

    // Siguiente canción
    const nextSong = () => {
        if (playlist.length === 0) return;
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        updatePlayerInfo(); // Siempre intenta cargar la src si existe
        if (isPlaying && playlist[currentSongIndex].src !== '') {
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
        updatePlayerInfo(); // Siempre intenta cargar la src si existe
        if (isPlaying && playlist[currentSongIndex].src !== '') {
            audioPlayer.play();
        } else {
            playPauseBtn.classList.replace('fa-pause', 'fa-play');
            isPlaying = false;
        }
    };

    // Actualizar barra de progreso y tiempo
    audioPlayer.addEventListener('timeupdate', () => {
        const { currentTime, duration } = audioPlayer;
        if (duration) { // Solo actualizar si la duración es válida
            progress.style.width = `${(currentTime / duration) * 100}%`;
            currentTimeSpan.textContent = formatTime(currentTime);
        }
    });

    // Reproducir la siguiente canción cuando la actual termine
    audioPlayer.addEventListener('ended', nextSong);

    // Click en la barra de progreso
    progressBar.addEventListener('click', (e) => {
        if (audioPlayer.src === '' || !audioPlayer.duration) return; // No hacer nada si no hay audio cargado
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
        audioFileInput.click();
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
        savePlaylistToLocalStorage(); // Guardar la playlist cada vez que se añaden canciones
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
            // Mostrar un indicador si la SRC está vacía (canción no cargada)
            const songTitleDisplay = song.src === '' ? `${song.title} (requiere recarga)` : song.title;
            const songDurationDisplay = song.duration ? formatTime(song.duration) : '0:00';

            li.innerHTML = `
                <span class="song-number">${index + 1}.</span>
                <span class="song-title-list">${songTitleDisplay}</span>
                <span class="song-duration">${songDurationDisplay}</span>
            `;
            if (index === currentSongIndex) {
                li.classList.add('playing');
            }
            li.addEventListener('click', () => {
                currentSongIndex = index;
                updatePlayerInfo(); // Cargar el audio cuando se hace clic en la lista
                if (!isPlaying && playlist[currentSongIndex].src !== '') {
                    playPauseBtn.classList.replace('fa-play', 'fa-pause');
                    isPlaying = true;
                } else if (playlist[currentSongIndex].src === '') {
                    // Si la canción no tiene SRC, no se puede reproducir
                    playPauseBtn.classList.replace('fa-pause', 'fa-play');
                    isPlaying = false;
                }
                if (isPlaying) { // Solo intentar reproducir si isPlaying es true y hay src
                    audioPlayer.play();
                }
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

    // Inicializar el reproductor: Cargar playlist del localStorage al inicio
    loadPlaylistFromLocalStorage();
});
