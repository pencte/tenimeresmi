const API_BASE = 'https://www.sankavollerei.com/anime/samehadaku';

// Cache data sederhana
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Fungsi fetch dengan cache
async function fetchAPI(endpoint) {
    const cacheKey = endpoint;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('Menggunakan cache:', endpoint);
        return cached.data;
    }

    try {
        console.log('Fetching:', endpoint);
        const response = await fetch(`${API_BASE}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'success') {
            throw new Error(data.message || 'Unknown error');
        }
        
        // Simpan ke cache
        cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Parse hash
function parseHash() {
    const hash = window.location.hash.slice(1) || 'home';
    const [page, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString);
    return { page, params };
}

// Navigasi
function navigate(page, params = {}) {
    const urlParams = new URLSearchParams(params);
    window.location.hash = page + (urlParams.toString() ? '?' + urlParams.toString() : '');
}

// Render utama
async function render() {
    const { page, params } = parseHash();
    const content = document.getElementById('content');
    const paginationDiv = document.getElementById('pagination');
    
    content.innerHTML = '<div class="loading">⏳ Memuat...</div>';
    paginationDiv.style.display = 'none';
    paginationDiv.innerHTML = '';

    try {
        if (page === 'home') {
            await renderHome(content);
        } else if (page === 'ongoing') {
            const pageNum = parseInt(params.get('page') || '1');
            await renderAnimeList(content, paginationDiv, '/ongoing', pageNum, 'Ongoing Anime');
        } else if (page === 'completed') {
            const pageNum = parseInt(params.get('page') || '1');
            await renderAnimeList(content, paginationDiv, '/completed', pageNum, 'Completed Anime');
        } else if (page === 'popular') {
            const pageNum = parseInt(params.get('page') || '1');
            await renderAnimeList(content, paginationDiv, '/popular', pageNum, 'Popular Anime');
        } else if (page === 'movies') {
            await renderMovies(content);
        } else if (page === 'search') {
            const keyword = params.get('q') || '';
            await renderSearch(content, keyword);
        } else if (page === 'anime') {
            const animeId = params.get('id');
            if (animeId) {
                await renderAnimeDetail(content, animeId);
            } else {
                navigate('home');
            }
        } else if (page === 'episode') {
            const episodeId = params.get('id');
            if (episodeId) {
                await renderEpisode(content, episodeId);
            } else {
                navigate('home');
            }
        } else if (page === 'server') {
            const serverId = params.get('id');
            const episodeId = params.get('episode');
            if (serverId && episodeId) {
                await renderServerVideo(content, serverId, episodeId);
            } else {
                navigate('home');
            }
        } else {
            navigate('home');
        }
    } catch (error) {
        content.innerHTML = `<div class="error">❌ Error: ${error.message}. Silakan coba lagi nanti.</div>`;
    }
}

// Render home
async function renderHome(container) {
    const data = await fetchAPI('/home');
    const recent = data.data?.recent?.animeList || [];
    const movies = data.data?.movie?.animeList || [];
    const batch = data.data?.batch?.batchList || [];

    let html = '<div class="detail-container">';

    // Recent section
    html += '<h2>📺 Episode Terbaru</h2><div class="anime-grid">';
    recent.forEach(anime => {
        html += createAnimeCard({
            ...anime,
            type: 'episode'
        });
    });
    html += '</div>';

    // Movies section
    if (movies.length > 0) {
        html += '<h2 style="margin-top:2rem;">🎬 Movie Terbaru</h2><div class="anime-grid">';
        movies.forEach(movie => {
            html += createAnimeCard({
                ...movie,
                type: 'movie'
            });
        });
        html += '</div>';
    }

    // Batch section
    if (batch.length > 0) {
        html += '<h2 style="margin-top:2rem;">📦 Batch Terbaru</h2><div class="batch-list">';
        batch.forEach(b => {
            html += `<div class="batch-item" onclick="navigate('anime', { id: '${b.animeId}' })">📥 ${b.title}</div>`;
        });
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

// Render anime list dengan pagination
async function renderAnimeList(container, paginationDiv, endpoint, page, title) {
    const data = await fetchAPI(`${endpoint}?page=${page}`);
    const animeList = data.data?.animeList || [];
    const pagination = data.pagination;

    let html = `<div class="detail-container"><h2>${title}</h2>`;
    
    if (animeList.length === 0) {
        html += '<p>Tidak ada data.</p>';
    } else {
        html += '<div class="anime-grid">';
        animeList.forEach(anime => {
            html += createAnimeCard(anime);
        });
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // Pagination
    if (pagination && pagination.totalPages > 1) {
        paginationDiv.style.display = 'flex';
        paginationDiv.className = 'pagination';
        
        paginationDiv.innerHTML = `
            <button ${!pagination.hasPrevPage ? 'disabled' : ''} onclick="navigate('${endpoint.replace('/', '')}', { page: ${pagination.prevPage} })">◀ Prev</button>
            <span>Page ${pagination.currentPage} of ${pagination.totalPages}</span>
            <button ${!pagination.hasNextPage ? 'disabled' : ''} onclick="navigate('${endpoint.replace('/', '')}', { page: ${pagination.nextPage} })">Next ▶</button>
        `;
    }
}

// Render movies
async function renderMovies(container) {
    const data = await fetchAPI('/movies');
    const movies = data.data?.animeList || [];

    let html = '<div class="detail-container"><h2>🎬 Movie Anime</h2>';
    
    if (movies.length === 0) {
        html += '<p>Tidak ada movie.</p>';
    } else {
        html += '<div class="anime-grid">';
        movies.forEach(movie => {
            html += createAnimeCard({
                ...movie,
                type: 'movie'
            });
        });
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// Render search
async function renderSearch(container, keyword) {
    if (!keyword) {
        container.innerHTML = '<div class="detail-container"><p>Masukkan kata kunci pencarian.</p></div>';
        return;
    }

    const data = await fetchAPI(`/search?q=${encodeURIComponent(keyword)}`);
    const results = data.data?.animeList || [];

    let html = `<div class="detail-container"><h2>🔍 Hasil pencarian: "${keyword}"</h2>`;
    
    if (results.length === 0) {
        html += '<p>Tidak ditemukan.</p>';
    } else {
        html += '<div class="anime-grid">';
        results.forEach(anime => {
            html += createAnimeCard(anime);
        });
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// Render detail anime
async function renderAnimeDetail(container, animeId) {
    const data = await fetchAPI(`/anime/${animeId}`);
    const anime = data.data;

    const title = anime.title || anime.english || 'Unknown';
    const poster = anime.poster || 'https://via.placeholder.com/300x450?text=No+Image';
    const score = anime.score?.value || anime.score || 'N/A';
    const voters = anime.score?.users || '';
    const japanese = anime.japanese || '';
    const english = anime.english || '';
    const status = anime.status || 'Unknown';
    const type = anime.type || 'Unknown';
    const source = anime.source || 'Unknown';
    const duration = anime.duration || 'Unknown';
    const season = anime.season || 'Unknown';
    const studios = anime.studios || 'Unknown';
    const producers = anime.producers || 'Unknown';
    const aired = anime.aired || 'Unknown';
    const synopsis = anime.synopsis?.paragraphs?.join('\n\n') || anime.synopsis || 'Tidak ada sinopsis.';
    const genres = anime.genreList || [];
    const episodes = anime.episodeList || [];
    const batchList = anime.batchList || [];

    let html = `
        <div class="detail-container">
            <div class="detail-header">
                <img src="${poster}" alt="${title}" loading="lazy">
                <div class="detail-info">
                    <h2>${title}</h2>
                    ${japanese ? `<p><strong>Japanese:</strong> ${japanese}</p>` : ''}
                    ${english ? `<p><strong>English:</strong> ${english}</p>` : ''}
                    <p><strong>Score:</strong> ⭐ ${score} ${voters ? `(${voters} voters)` : ''}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <p><strong>Type:</strong> ${type}</p>
                    <p><strong>Source:</strong> ${source}</p>
                    <p><strong>Duration:</strong> ${duration}</p>
                    <p><strong>Season:</strong> ${season}</p>
                    <p><strong>Studios:</strong> ${studios}</p>
                    <p><strong>Producers:</strong> ${producers}</p>
                    <p><strong>Aired:</strong> ${aired}</p>
                    
                    <div class="genre-tags">
                        ${genres.map(g => 
                            `<span class="genre-tag" onclick="navigate('search', { q: '${g.title}' })">${g.title}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
            
            <h3>📖 Sinopsis</h3>
            <p style="line-height:1.8; text-align:justify;">${synopsis}</p>
    `;

    // Batch section
    if (batchList.length > 0) {
        html += '<h3 style="margin-top:2rem;">📦 Batch Download</h3><div class="batch-list">';
        batchList.forEach(batch => {
            html += `<div class="batch-item" onclick="navigate('anime', { id: '${batch.batchId}' })">📥 ${batch.title}</div>`;
        });
        html += '</div>';
    }

    // Episode section
    if (episodes.length > 0) {
        html += '<h3 style="margin-top:2rem;">📺 Daftar Episode</h3><ul class="episode-list">';
        episodes.forEach(ep => {
            const epNum = ep.title;
            const epId = ep.episodeId;
            html += `<li class="episode-item" onclick="navigate('episode', { id: '${epId}' })">Episode ${epNum}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<p style="margin-top:2rem;">Belum ada episode.</p>';
    }

    html += '</div>';
    container.innerHTML = html;
}

// Render episode
async function renderEpisode(container, episodeId) {
    const data = await fetchAPI(`/episode/${episodeId}`);
    const episode = data.data;

    const title = episode.title || 'Unknown';
    const poster = episode.poster || 'https://via.placeholder.com/300x450?text=No+Image';
    const animeId = episode.animeId;
    const releasedOn = episode.releasedOn || 'Unknown';
    const defaultStreaming = episode.defaultStreamingUrl;
    const hasPrev = episode.hasPrevEpisode;
    const prevEpisode = episode.prevEpisode;
    const hasNext = episode.hasNextEpisode;
    const nextEpisode = episode.nextEpisode;
    const genres = episode.genreList || [];
    const synopsis = episode.synopsis?.paragraphs?.join('\n\n') || episode.synopsis || '';
    const serverQualities = episode.server?.qualities || [];

    // Ambil server pertama sebagai default
    let firstServer = null;
    for (const quality of serverQualities) {
        if (quality.serverList && quality.serverList.length > 0) {
            firstServer = quality.serverList[0];
            break;
        }
    }

    let html = `
        <div class="video-container">
            <div class="nav-buttons">
                ${hasPrev ? `<button class="nav-btn" onclick="navigate('episode', { id: '${prevEpisode.episodeId}' })">◀ Prev Episode</button>` : ''}
                <button class="nav-btn" onclick="navigate('anime', { id: '${animeId}' })">📋 Detail Anime</button>
                ${hasNext ? `<button class="nav-btn" onclick="navigate('episode', { id: '${nextEpisode.episodeId}' })">Next Episode ▶</button>` : ''}
            </div>

            <h2>${title}</h2>
            <p><small>Dirilis: ${releasedOn}</small></p>
    `;

    // Tampilkan video player jika ada server
    if (firstServer) {
        html += `
            <div class="video-player">
                <video id="video-player" controls autoplay>
                    <source src="" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
    }

    // Server selection
    if (serverQualities.length > 0) {
        html += '<div class="server-selection"><h3>🎮 Pilih Server</h3>';
        
        serverQualities.forEach(quality => {
            if (quality.serverList && quality.serverList.length > 0) {
                html += `
                    <div class="quality-group">
                        <h4>${quality.title}</h4>
                        <div class="server-buttons">
                `;
                
                quality.serverList.forEach(server => {
                    html += `
                        <button class="server-btn" onclick="loadServerVideo('${server.serverId}', '${episodeId}', this)">
                            ${server.title}
                        </button>
                    `;
                });
                
                html += '</div></div>';
            }
        });
        
        html += '</div>';
    }

    // Download links
    if (episode.downloadUrl?.formats) {
        html += '<div class="download-section"><h3>📥 Download</h3>';
        
        episode.downloadUrl.formats.forEach(format => {
            html += `<div class="download-format"><h4>${format.title}</h4>`;
            
            format.qualities.forEach(quality => {
                if (quality.urls && quality.urls.length > 0) {
                    html += `
                        <div class="download-quality">
                            <h5>${quality.title}</h5>
                            <div class="download-links">
                    `;
                    
                    quality.urls.forEach(url => {
                        html += `<a href="${url.url}" target="_blank" class="download-link">${url.title}</a>`;
                    });
                    
                    html += '</div></div>';
                }
            });
            
            html += '</div>';
        });
        
        html += '</div>';
    }

    // Synopsis
    if (synopsis) {
        html += `
            <h3 style="margin-top:2rem;">📖 Sinopsis</h3>
            <p style="line-height:1.8; text-align:justify;">${synopsis}</p>
        `;
    }

    // Genres
    if (genres.length > 0) {
        html += `
            <div class="genre-tags" style="margin-top:1rem;">
                ${genres.map(g => 
                    `<span class="genre-tag" onclick="navigate('search', { q: '${g.title}' })">${g.title}</span>`
                ).join('')}
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Load default video
    if (defaultStreaming) {
        const videoPlayer = document.getElementById('video-player');
        if (videoPlayer) {
            videoPlayer.querySelector('source').src = defaultStreaming;
            videoPlayer.load();
        }
    } else if (firstServer) {
        loadServerVideo(firstServer.serverId, episodeId);
    }
}

// Render server video
async function renderServerVideo(container, serverId, episodeId) {
    try {
        const data = await fetchAPI(`/server/${serverId}`);
        // Asumsikan response berisi URL video
        const videoUrl = data.data?.url || data.url;
        
        if (!videoUrl) {
            throw new Error('URL video tidak ditemukan');
        }

        // Kembali ke halaman episode dengan video yang sudah dipilih
        navigate('episode', { id: episodeId });
        
        // Setelah navigasi, set video source
        setTimeout(() => {
            const videoPlayer = document.getElementById('video-player');
            if (videoPlayer) {
                videoPlayer.querySelector('source').src = videoUrl;
                videoPlayer.load();
                videoPlayer.play();
            }
        }, 100);
    } catch (error) {
        alert('Gagal memuat video: ' + error.message);
        navigate('episode', { id: episodeId });
    }
}

// Fungsi global untuk load server video
window.loadServerVideo = async function(serverId, episodeId, btnElement) {
    try {
        // Highlight button
        if (btnElement) {
            document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
            btnElement.classList.add('active');
        }

        const data = await fetchAPI(`/server/${serverId}`);
        const videoUrl = data.data?.url || data.url;
        
        if (!videoUrl) {
            throw new Error('URL video tidak ditemukan');
        }

        const videoPlayer = document.getElementById('video-player');
        if (videoPlayer) {
            videoPlayer.querySelector('source').src = videoUrl;
            videoPlayer.load();
            videoPlayer.play();
        }
    } catch (error) {
        alert('Gagal memuat video: ' + error.message);
    }
};

// Helper create anime card
function createAnimeCard(anime) {
    const title = anime.title || 'Unknown';
    const poster = anime.poster || 'https://via.placeholder.com/150x225?text=No+Image';
    const animeId = anime.animeId || anime.id;
    const episodes = anime.episodes || '';
    const status = anime.status || '';
    const type = anime.type || anime._type || '';

    let statusClass = '';
    if (status.toLowerCase() === 'ongoing') statusClass = 'ongoing';
    else if (status.toLowerCase() === 'completed') statusClass = 'completed';
    else if (type.toLowerCase() === 'movie') statusClass = 'movie';

    return `
        <div class="anime-card" onclick="navigate('anime', { id: '${animeId}' })">
            <img src="${poster}" alt="${title}" loading="lazy">
            <div class="title">${title}</div>
            ${episodes ? `<span class="episodes">${episodes} eps</span>` : ''}
            ${status ? `<span class="status ${statusClass}">${status}</span>` : ''}
        </div>
    `;
}

// Toggle search
function toggleSearch() {
    const container = document.getElementById('search-container');
    container.style.display = container.style.display === 'none' ? 'flex' : 'none';
}

// Search anime
function searchAnime() {
    const keyword = document.getElementById('search-input').value.trim();
    if (keyword) {
        navigate('search', { q: keyword });
        document.getElementById('search-container').style.display = 'none';
        document.getElementById('search-input').value = '';
    }
}

// Event listeners
window.addEventListener('hashchange', render);
window.addEventListener('load', () => {
    if (!window.location.hash) {
        navigate('home');
    } else {
        render();
    }
});

// Ekspos fungsi global
window.navigate = navigate;
window.toggleSearch = toggleSearch;
window.searchAnime = searchAnime;