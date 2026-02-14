// API Configuration
const API_BASE = 'https://www.sankavollerei.com/anime/samehadaku';

// State management
let currentPage = 'home';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let searchTimeout = null;

// DOM Elements
const splash = document.getElementById('splash');
const app = document.getElementById('app');
const mainContent = document.getElementById('mainContent');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        splash.style.display = 'none';
        app.style.display = 'block';
        loadPage('home');
    }, 2500);

    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('searchToggle').addEventListener('click', toggleSearch);
    document.getElementById('closeSearch').addEventListener('click', toggleSearch);
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (e.target.value.trim()) {
                searchAnime(e.target.value);
            }
        }, 500);
    });
    
    document.getElementById('menuToggle').addEventListener('click', openMenu);
    document.getElementById('closeMenu').addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'search') {
                toggleSearch();
            } else {
                navigateToPage(page);
            }
        });
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            closeMenu();
            if (page) {
                navigateToPage(page);
            }
        });
    });
}

function toggleSearch() {
    searchBar.style.display = searchBar.style.display === 'none' ? 'flex' : 'none';
    if (searchBar.style.display === 'flex') {
        searchInput.focus();
    } else {
        searchInput.value = '';
    }
}

function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('show');
}

function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('show');
}

function navigateToPage(page) {
    currentPage = page;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    loadPage(page);
}

async function loadPage(page) {
    showLoading();
    
    try {
        switch(page) {
            case 'home':
                await loadHome();
                break;
            case 'schedule':
                await loadSchedule();
                break;
            case 'ongoing':
                await loadOngoing();
                break;
            case 'completed':
                await loadCompleted();
                break;
            case 'popular':
                await loadPopular();
                break;
            case 'movies':
                await loadMovies();
                break;
            case 'favorites':
                loadFavorites();
                break;
            case 'settings':
                loadSettings();
                break;
            default:
                await loadHome();
        }
    } catch (error) {
        showError('Gagal memuat data: ' + error.message);
    }
}

function showLoading() {
    mainContent.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Memuat data...</p>
        </div>
    `;
}

function showError(message) {
    mainContent.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--error);">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
            <p>${message}</p>
            <button onclick="loadPage('${currentPage}')" style="margin-top: 15px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 25px; cursor: pointer;">
                Coba Lagi
            </button>
        </div>
    `;
}

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data.status !== 'success') throw new Error(data.message || 'Unknown error');
        return data;
    } catch (error) {
        console.log('API Error:', error);
        return null;
    }
}

async function loadHome() {
    try {
        const response = await fetch('https://www.sankavollerei.com/anime/samehadaku/home');
        const data = await response.json();
        
        const recent = data.data?.recent?.animeList || [];
        const movies = data.data?.movie?.animeList || [];
        
        let html = `
            <div class="section-header">
                <h2>Episode Terbaru</h2>
                <span class="view-all" onclick="navigateToPage('ongoing')">Lihat Semua</span>
            </div>
            <div class="horizontal-scroll">
        `;
        
        recent.slice(0, 10).forEach(anime => {
            html += `
                <div class="horizontal-card" onclick="showAnimeDetail('${anime.animeId}')">
                    <img src="${anime.poster || 'https://via.placeholder.com/120x180'}" alt="${anime.title}">
                    <div class="title">${anime.title}</div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        if (movies.length > 0) {
            html += `
                <div class="section-header" style="margin-top: 30px;">
                    <h2>Movie Terbaru</h2>
                    <span class="view-all" onclick="navigateToPage('movies')">Lihat Semua</span>
                </div>
                <div class="horizontal-scroll">
            `;
            
            movies.slice(0, 10).forEach(movie => {
                html += `
                    <div class="horizontal-card" onclick="showAnimeDetail('${movie.animeId}')">
                        <img src="${movie.poster || 'https://via.placeholder.com/120x180'}" alt="${movie.title}">
                        <div class="title">${movie.title}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        mainContent.innerHTML = html;
    } catch (error) {
        showError('Gagal memuat home');
    }
}

async function loadSchedule() {
    showLoading();
    
    try {
        const response = await fetch('https://www.sankavollerei.com/anime/samehadaku/schedule');
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.days) {
            renderScheduleFromAPI(data.data.days);
        } else {
            throw new Error('Data jadwal tidak ditemukan');
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        showError('Gagal memuat jadwal. Pastikan koneksi internet aktif.');
    }
}

function renderScheduleFromAPI(daysData) {
    const dayMapping = {
        'Monday': 'senin',
        'Tuesday': 'selasa', 
        'Wednesday': 'rabu',
        'Thursday': 'kamis',
        'Friday': 'jumat',
        'Saturday': 'sabtu',
        'Sunday': 'minggu'
    };
    
    const dayDisplay = {
        'Monday': 'Senin',
        'Tuesday': 'Selasa',
        'Wednesday': 'Rabu',
        'Thursday': 'Kamis',
        'Friday': 'Jumat',
        'Saturday': 'Sabtu',
        'Sunday': 'Minggu'
    };
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let currentDay = localStorage.getItem('currentDay') || dayMapping[today] || 'senin';
    
    const daysTabs = Object.keys(dayMapping).map(engDay => {
        const id = dayMapping[engDay];
        return `
            <div class="day-tab ${id === currentDay ? 'active' : ''}" onclick="changeDay('${id}')">
                ${dayDisplay[engDay]}
            </div>
        `;
    }).join('');
    
    const activeDayData = daysData.find(d => dayMapping[d.day] === currentDay);
    const animeList = activeDayData?.animeList || [];
    
    const totalEpisodes = animeList.length;
    const liveNow = animeList.filter(item => {
        if (item.estimation === 'Update') return false;
        return item.estimation?.startsWith('0d');
    }).length;
    
    const scheduleHTML = animeList.map(anime => {
        let timeDisplay = 'Jadwal menyusul';
        let isLive = false;
        
        if (anime.estimation && anime.estimation !== 'Update') {
            const match = anime.estimation.match(/(\d+)d\s+(\d+)h\s+(\d+)m/);
            if (match) {
                const days = parseInt(match[1]);
                const hours = parseInt(match[2]);
                const minutes = parseInt(match[3]);
                
                if (days === 0) {
                    timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    
                    if (currentHour === hours && Math.abs(currentMinute - minutes) <= 30) {
                        isLive = true;
                    }
                } else {
                    timeDisplay = `H-${days} ${hours}:${minutes.toString().padStart(2, '0')}`;
                }
            }
        }
        
        const genres = anime.genres ? anime.genres.split(', ') : [];
        
        return `
            <div class="schedule-item ${isLive ? 'live' : ''}" onclick="showAnimeDetail('${anime.animeId}')">
                <div class="schedule-time">
                    <i class="fas fa-clock"></i> 
                    ${timeDisplay}
                    ${anime.estimation === 'Update' ? '<span class="badge-update">Update</span>' : ''}
                    ${isLive ? '<span class="badge-live">LIVE</span>' : ''}
                </div>
                <div class="schedule-content">
                    <img src="${anime.poster || 'https://via.placeholder.com/60x80'}" 
                         alt="${anime.title}" 
                         class="schedule-poster"
                         onerror="this.src='https://via.placeholder.com/60x80'">
                    <div class="schedule-info">
                        <h3 class="schedule-title">${anime.title}</h3>
                        <div class="schedule-meta">
                            <span class="badge-type">${anime.type || 'TV'}</span>
                            <span class="badge-score">⭐ ${anime.score || 'N/A'}</span>
                        </div>
                        <div class="schedule-genres">
                            ${genres.slice(0, 3).map(g => 
                                `<span class="genre-pill">${g}</span>`
                            ).join('')}
                            ${genres.length > 3 ? `<span class="genre-pill">+${genres.length-3}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="schedule-container">
            <div class="schedule-header">
                <div>
                    <h2>📅 Jadwal Rilis Anime</h2>
                    <p class="schedule-date">
                        ${new Date().toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
                <div class="schedule-stats">
                    <span class="stat-badge">
                        <i class="fas fa-calendar-day"></i> ${totalEpisodes} Episode
                    </span>
                    ${liveNow > 0 ? `
                        <span class="stat-badge live">
                            <i class="fas fa-circle"></i> ${liveNow} Sedang Tayang
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div class="day-tabs">
                ${daysTabs}
            </div>
            
            <div class="schedule-list">
                ${scheduleHTML || '<p class="no-schedule">Tidak ada jadwal untuk hari ini</p>'}
            </div>
            
            <div class="schedule-note">
                <i class="fas fa-info-circle"></i>
                <span>Jam tayang dalam WIB. ${liveNow > 0 ? '🟢 Live sekarang!' : 'Jadwal dapat berubah sewaktu-waktu.'}</span>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = html;
    localStorage.setItem('currentDay', currentDay);
}

function changeDay(day) {
    localStorage.setItem('currentDay', day);
    loadSchedule();
}

setInterval(() => {
    if (currentPage === 'schedule') {
        loadSchedule();
    }
}, 60000);

async function loadOngoing() {
    const data = await fetchAPI('/ongoing?page=1');
    const animeList = data?.data?.animeList || [];
    
    let html = '<h2 style="margin-bottom: 20px;">Ongoing Anime</h2>';
    
    if (animeList.length === 0) {
        html += '<p>Tidak ada data.</p>';
    } else {
        html += '<div class="anime-grid">';
        animeList.forEach(anime => {
            html += createAnimeCard(anime);
        });
        html += '</div>';
    }
    
    mainContent.innerHTML = html;
}

async function loadCompleted() {
    const data = await fetchAPI('/completed?page=1');
    const animeList = data?.data?.animeList || [];
    
    let html = '<h2 style="margin-bottom: 20px;">Completed Anime</h2>';
    
    if (animeList.length === 0) {
        html += '<p>Tidak ada data.</p>';
    } else {
        html += '<div class="anime-grid">';
        animeList.forEach(anime => {
            html += createAnimeCard(anime);
        });
        html += '</div>';
    }
    
    mainContent.innerHTML = html;
}

async function loadPopular() {
    const data = await fetchAPI('/popular?page=1');
    const animeList = data?.data?.animeList || [];
    
    let html = '<h2 style="margin-bottom: 20px;">Popular Anime</h2>';
    
    if (animeList.length === 0) {
        html += '<p>Tidak ada data.</p>';
    } else {
        html += '<div class="anime-grid">';
        animeList.forEach(anime => {
            html += createAnimeCard(anime);
        });
        html += '</div>';
    }
    
    mainContent.innerHTML = html;
}

async function loadMovies() {
    const data = await fetchAPI('/movies');
    const movies = data?.data?.animeList || [];
    
    let html = '<h2 style="margin-bottom: 20px;">Movie Anime</h2>';
    
    if (movies.length === 0) {
        html += '<p>Tidak ada data.</p>';
    } else {
        html += '<div class="anime-grid">';
        movies.forEach(movie => {
            html += createAnimeCard(movie);
        });
        html += '</div>';
    }
    
    mainContent.innerHTML = html;
}

function loadFavorites() {
    if (favorites.length === 0) {
        mainContent.innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <i class="fas fa-heart" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 15px;"></i>
                <p>Belum ada anime favorit</p>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 10px;">Tambahkan anime ke favorit dari halaman detail</p>
            </div>
        `;
        return;
    }
    
    let html = '<h2 style="margin-bottom: 20px;">Favorit Saya</h2><div class="anime-grid">';
    favorites.forEach(animeId => {
        html += `
            <div class="anime-card" onclick="showAnimeDetail('${animeId}')">
                <img src="https://via.placeholder.com/200x300" alt="${animeId}">
                <div class="title">${animeId.replace(/-/g, ' ')}</div>
            </div>
        `;
    });
    html += '</div>';
    
    mainContent.innerHTML = html;
}

function loadSettings() {
    mainContent.innerHTML = `
        <div class="settings-container">
            <h2 style="margin-bottom: 20px;">Pengaturan</h2>
            
            <div class="settings-section">
                <h3>Tampilan</h3>
                <div class="setting-item">
                    <span>Mode Gelap</span>
                    <label class="switch">
                        <input type="checkbox" id="darkMode" onchange="toggleDarkMode()">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Notifikasi</h3>
                <div class="setting-item">
                    <span>Notifikasi Episode Baru</span>
                    <label class="switch">
                        <input type="checkbox" id="notifications" onchange="toggleNotifications()">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Cache</h3>
                <button class="clear-cache-btn" onclick="clearCache()">
                    <i class="fas fa-trash"></i> Hapus Cache
                </button>
            </div>
            
            <div class="about-section">
                <h3>Tentang</h3>
                <p><strong>TeNIME v1.0.0</strong></p>
                <p style="margin-top: 10px;">Aplikasi streaming anime dari Samehadaku API</p>
                <p style="margin-top: 5px; font-size: 11px;">© 2024 TeNIME. All rights reserved.</p>
            </div>
        </div>
    `;
    
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const notifications = localStorage.getItem('notifications') === 'true';
    
    document.getElementById('darkMode').checked = darkMode;
    document.getElementById('notifications').checked = notifications;
    
    if (darkMode) enableDarkMode();
}

function createAnimeCard(anime) {
    const title = anime.title || 'Unknown';
    const poster = anime.poster || 'https://via.placeholder.com/200x300';
    const animeId = anime.animeId || anime.id || `anime-${Date.now()}`;
    const status = anime.status || '';
    const episodes = anime.episodes || '';
    
    let statusClass = '';
    if (status.toLowerCase() === 'ongoing') statusClass = 'ongoing';
    else if (status.toLowerCase() === 'completed') statusClass = 'completed';
    
    return `
        <div class="anime-card" onclick="showAnimeDetail('${animeId}')">
            <img src="${poster}" alt="${title}" loading="lazy">
            <div class="title">${title}</div>
            ${episodes ? `<span class="episodes">${episodes} eps</span>` : ''}
            ${status ? `<span class="status ${statusClass}">${status}</span>` : ''}
        </div>
    `;
}

async function showAnimeDetail(animeId) {
    showLoading();
    
    try {
        const data = await fetchAPI(`/anime/${animeId}`);
        const anime = data?.data || {
            title: animeId.replace(/-/g, ' '),
            poster: 'https://via.placeholder.com/300x400',
            score: { value: '8.5' },
            status: 'Ongoing',
            type: 'TV',
            duration: '24 min',
            genreList: [
                { title: 'Action' },
                { title: 'Adventure' },
                { title: 'Fantasy' }
            ],
            synopsis: { paragraphs: ['Sinopsis tidak tersedia.'] },
            episodeList: Array.from({ length: 12 }, (_, i) => ({ 
                title: i + 1, 
                episodeId: `${animeId}-episode-${i + 1}` 
            }))
        };
        
        const isFavorite = favorites.includes(animeId);
        
        let html = `
            <div class="detail-container">
                <div class="detail-header">
                    <img src="${anime.poster || ''}" class="detail-backdrop" alt="">
                    <img src="${anime.poster || 'https://via.placeholder.com/150x200'}" class="detail-poster" alt="${anime.title}">
                </div>
                
                <div class="detail-info">
                    <h1>${anime.title || anime.english || 'Unknown'}</h1>
                    
                    <div class="detail-meta">
                        <span class="meta-item">⭐ ${anime.score?.value || anime.score || 'N/A'}</span>
                        <span class="meta-item">${anime.status || 'Unknown'}</span>
                        <span class="meta-item">${anime.type || 'Unknown'}</span>
                        <span class="meta-item">${anime.duration || 'Unknown'}</span>
                    </div>
                    
                    <div class="genre-tags">
                        ${(anime.genreList || []).map(g => 
                            `<span class="genre-tag" onclick="searchAnime('${g.title}')">${g.title}</span>`
                        ).join('')}
                    </div>
                    
                    <div class="detail-synopsis">
                        ${anime.synopsis?.paragraphs?.join(' ') || anime.synopsis || 'Tidak ada sinopsis.'}
                    </div>
                    
                    <h3 style="margin: 20px 0 10px;">Daftar Episode</h3>
                    <div class="episode-list">
                        ${(anime.episodeList || []).map(ep => 
                            `<div class="episode-item" onclick="showEpisode('${ep.episodeId}')">Episode ${ep.title}</div>`
                        ).join('')}
                        ${(!anime.episodeList || anime.episodeList.length === 0) ? 
                            '<p>Belum ada episode.</p>' : ''}
                    </div>
                    
                    <button class="favorite-btn ${isFavorite ? 'in-favorite' : 'not-favorite'}" onclick="toggleFavorite('${animeId}')">
                        <i class="fas fa-heart"></i> ${isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                    </button>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
    } catch (error) {
        showError('Gagal memuat detail: ' + error.message);
    }
}

async function showEpisode(episodeId) {
    showLoading();
    
    try {
        const data = await fetchAPI(`/episode/${episodeId}`);
        const episode = data?.data || {
            title: 'One Piece Episode 1155',
            defaultStreamingUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            hasPrevEpisode: true,
            hasNextEpisode: true,
            prevEpisode: { episodeId: 'one-piece-episode-1154' },
            nextEpisode: { episodeId: 'one-piece-episode-1156' },
            animeId: 'one-piece',
            server: {
                qualities: [
                    {
                        title: '360p',
                        serverList: [
                            { title: 'Blogspot', serverId: 'server-360-1' },
                            { title: 'Mega', serverId: 'server-360-2' }
                        ]
                    },
                    {
                        title: '480p',
                        serverList: [
                            { title: 'Blogspot', serverId: 'server-480-1' },
                            { title: 'Mega', serverId: 'server-480-2' }
                        ]
                    },
                    {
                        title: '720p',
                        serverList: [
                            { title: 'Blogspot', serverId: 'server-720-1' },
                            { title: 'Mega', serverId: 'server-720-2' }
                        ]
                    }
                ]
            },
            downloadUrl: {
                formats: [
                    {
                        title: 'MKV',
                        qualities: [
                            {
                                title: '480p',
                                urls: [
                                    { title: 'Gofile', url: '#' },
                                    { title: 'Krakenfiles', url: '#' }
                                ]
                            }
                        ]
                    }
                ]
            }
        };
        
        let html = `
            <div class="video-container">
                <div class="video-player">
                    <video controls autoplay>
                        <source src="${episode.defaultStreamingUrl || ''}" type="video/mp4">
                    </video>
                </div>
                
                <div class="video-info">
                    <h2 class="video-title">${episode.title || 'Episode'}</h2>
                    
                    <div class="video-nav">
                        ${episode.hasPrevEpisode ? 
                            `<button class="nav-btn" onclick="showEpisode('${episode.prevEpisode.episodeId}')">◀ Prev</button>` : ''}
                        <button class="nav-btn" onclick="showAnimeDetail('${episode.animeId}')">Detail</button>
                        ${episode.hasNextEpisode ? 
                            `<button class="nav-btn" onclick="showEpisode('${episode.nextEpisode.episodeId}')">Next ▶</button>` : ''}
                    </div>
                    
                    <h3>Pilih Server</h3>
                    <div class="server-list">
        `;
        
        (episode.server?.qualities || []).forEach(quality => {
            if (quality.serverList && quality.serverList.length > 0) {
                quality.serverList.forEach(server => {
                    html += `
                        <button class="server-btn" onclick="changeServer('${server.serverId}', '${episodeId}')">
                            ${server.title} ${quality.title}
                        </button>
                    `;
                });
            }
        });
        
        html += `
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h3>Download</h3>
        `;
        
        (episode.downloadUrl?.formats || []).forEach(format => {
            format.qualities?.forEach(quality => {
                quality.urls?.forEach(url => {
                    html += `
                        <a href="${url.url}" target="_blank" class="download-link">
                            ${url.title} - ${quality.title}
                        </a>
                    `;
                });
            });
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
    } catch (error) {
        showError('Gagal memuat episode: ' + error.message);
    }
}

async function searchAnime(keyword) {
    if (!keyword) return;
    
    showLoading();
    
    try {
        const data = await fetchAPI(`/search?q=${encodeURIComponent(keyword)}`);
        const results = data?.data?.animeList || [];
        
        let html = `<h2 style="margin-bottom: 20px;">Hasil pencarian: "${keyword}"</h2>`;
        
        if (results.length === 0) {
            html += '<p>Tidak ditemukan.</p>';
        } else {
            html += '<div class="anime-grid">';
            results.forEach(anime => {
                html += createAnimeCard(anime);
            });
            html += '</div>';
        }
        
        mainContent.innerHTML = html;
    } catch (error) {
        showError('Pencarian gagal: ' + error.message);
    }
}

async function changeServer(serverId, episodeId) {
    try {
        const response = await fetch(`https://www.sankavollerei.com/anime/samehadaku/server/${serverId}`);
        const data = await response.json();
        const videoUrl = data?.data?.url || data?.url;
        
        const video = document.querySelector('video');
        if (video && videoUrl) {
            video.src = videoUrl;
            video.play();
            
            document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }
    } catch (error) {
        alert('Gagal mengganti server: ' + error.message);
    }
}

function toggleFavorite(animeId) {
    if (favorites.includes(animeId)) {
        favorites = favorites.filter(id => id !== animeId);
    } else {
        favorites.push(animeId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    const btn = document.querySelector('.favorite-btn');
    if (btn) {
        const isFavorite = favorites.includes(animeId);
        btn.className = `favorite-btn ${isFavorite ? 'in-favorite' : 'not-favorite'}`;
        btn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}`;
    }
}

function toggleDarkMode() {
    const isDark = document.getElementById('darkMode').checked;
    localStorage.setItem('darkMode', isDark);
    
    if (isDark) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}

function enableDarkMode() {
    document.documentElement.style.setProperty('--background', '#1a202c');
    document.documentElement.style.setProperty('--surface', '#2d3748');
    document.documentElement.style.setProperty('--text-primary', '#f7fafc');
    document.documentElement.style.setProperty('--text-secondary', '#a0aec0');
    document.documentElement.style.setProperty('--border', '#4a5568');
}

function disableDarkMode() {
    document.documentElement.style.setProperty('--background', '#f8fafc');
    document.documentElement.style.setProperty('--surface', '#ffffff');
    document.documentElement.style.setProperty('--text-primary', '#2d3748');
    document.documentElement.style.setProperty('--text-secondary', '#718096');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
}

function toggleNotifications() {
    const isEnabled = document.getElementById('notifications').checked;
    localStorage.setItem('notifications', isEnabled);
    
    if (isEnabled && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function clearCache() {
    if (confirm('Hapus semua cache? Favorit akan tetap tersimpan.')) {
        localStorage.removeItem('darkMode');
        localStorage.removeItem('notifications');
        localStorage.removeItem('currentDay');
        location.reload();
    }
}

// Global functions
window.navigateToPage = navigateToPage;
window.showAnimeDetail = showAnimeDetail;
window.showEpisode = showEpisode;
window.searchAnime = searchAnime;
window.toggleFavorite = toggleFavorite;
window.clearCache = clearCache;
window.changeServer = changeServer;
window.changeDay = changeDay;
window.toggleDarkMode = toggleDarkMode;
window.toggleNotifications = toggleNotifications;
