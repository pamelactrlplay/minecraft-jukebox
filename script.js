let playlist = [];
let currentIndex = 0;
let isPlaying = false;

const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const trackAuthor = document.getElementById('track-author');
const disc = document.getElementById('disc');
const playlistUl = document.getElementById('playlist-ul');
const addTrackForm = document.getElementById('add-track-form');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// Buscar músicas da API do Node.js
async function fetchTracks() {
    try {
        const response = await fetch('/api/tracks');
        playlist = await response.json();
        
        if (playlist.length > 0) {
            initPlaylist();
            if (!audioPlayer.src) {
                loadTrack(0);
            }
        } else {
            playlistUl.innerHTML = '<li style="justify-content: center; color: #333;">Nenhum disco</li>';
            trackTitle.textContent = "Vazio";
            trackAuthor.textContent = "Insira um disco";
            audioPlayer.src = "";
        }
    } catch (error) {
        console.error("Erro ao carregar músicas da API:", error);
        trackTitle.textContent = "Erro na API";
    }
}

function initPlaylist() {
    playlistUl.innerHTML = '';
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = `🎵 ${track.title}`;
        titleSpan.style.cursor = 'pointer';
        titleSpan.style.flexGrow = '1';
        titleSpan.addEventListener('click', () => {
            loadTrack(index);
            playTrack();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Remover disco';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita dar play ao clicar em deletar
            deleteTrack(track.id, index);
        });

        li.appendChild(titleSpan);
        li.appendChild(deleteBtn);
        playlistUl.appendChild(li);
    });
    updateActivePlaylistUI();
}

function loadTrack(index) {
    if (playlist.length === 0) return;
    currentIndex = index;
    audioPlayer.src = playlist[currentIndex].src;
    trackTitle.textContent = playlist[currentIndex].title;
    trackAuthor.textContent = playlist[currentIndex].author;
    updateActivePlaylistUI();
}

function playTrack() {
    if (!audioPlayer.src) return;
    audioPlayer.play().then(() => {
        isPlaying = true;
        playBtn.textContent = '⏸';
        disc.classList.add('spinning');
    }).catch(error => {
        console.log("Erro ao reproduzir áudio: ", error);
    });
}

function pauseTrack() {
    audioPlayer.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
    disc.classList.remove('spinning');
}

function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function nextTrack() {
    if (playlist.length === 0) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    loadTrack(currentIndex);
    playTrack();
}

function prevTrack() {
    if (playlist.length === 0) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentIndex);
    playTrack();
}

function updateActivePlaylistUI() {
    const items = playlistUl.querySelectorAll('li');
    items.forEach((li, index) => {
        if (index === currentIndex) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

// Deletar música do banco via API
async function deleteTrack(id, index) {
    if (!confirm("Tem certeza que deseja destruir este disco?")) return;

    try {
        const response = await fetch(`/api/tracks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Se a música deletada for a que está tocando, para o áudio
            if (index === currentIndex) {
                pauseTrack();
                audioPlayer.src = '';
            }
            await fetchTracks();
        } else {
            alert("Erro ao deletar disco.");
        }
    } catch (error) {
        console.error("Erro ao deletar:", error);
    }
}

// Atualizar barra de progresso e tempos
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progressPercent;
        
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        durationEl.textContent = formatTime(audioPlayer.duration);
    }
});

// Permitir avançar/retroceder clicando na barra de progresso
progressBar.addEventListener('input', () => {
    if (audioPlayer.duration) {
        const seekTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
    }
});

// Controle de Volume
volumeBar.addEventListener('input', () => {
    audioPlayer.volume = volumeBar.value;
});

// Formatar segundos para minutos:segundos (ex: 3:45)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Adicionar nova música via formulário
addTrackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('new-title').value;
    const author = document.getElementById('new-author').value;
    const src = document.getElementById('new-src').value;

    try {
        const response = await fetch('/api/tracks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, src })
        });

        if (response.ok) {
            document.getElementById('new-title').value = '';
            document.getElementById('new-author').value = '';
            document.getElementById('new-src').value = '';
            await fetchTracks();
        } else {
            alert("Erro ao cadastrar música.");
        }
    } catch (error) {
        console.error("Erro na requisição POST:", error);
    }
});

// Event Listeners dos botões
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
audioPlayer.addEventListener('ended', nextTrack);

// Inicialização
fetchTracks();