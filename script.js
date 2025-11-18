/* Keep all your previous features; updated to:
   - show only a single overlay "current verse" (no visible lyrics list)
   - minimal toggle button next to fullscreen
   - album art sits next to title/album/artist and moves to top-right when lyrics active
   - LRCLIB endpoint still used at https://lrclib.net/api/get
*/

const fullscreenBtn = document.getElementById('fullscreen-btn');
const loginContainer = document.getElementById('login-container');
const mediaDisplay = document.getElementById('media-display');
const coverArt = document.getElementById('cover-art');
const titleElem = document.getElementById('title');
const albumElem = document.getElementById('album');
const artistElem = document.getElementById('artist');
const progressBar = document.getElementById('progress-bar');
const timeElapsed = document.getElementById('time-elapsed');
const timeRemaining = document.getElementById('time-remaining');
const spotifyLink = document.getElementById('spotify-link');
const loginBtn = document.getElementById('login-btn');

const lyricsToggleBtn = document.getElementById('lyrics-toggle-btn');
const lyricsOverlay = document.getElementById('lyrics-overlay');

const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/'; // Update with your live site URL
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

let accessToken = getCookie('access_token');

let lastTrackId = null;
let currentLyrics = { lines: [], plain: '', syncedRaw: '' }; // parsed lines stored here
let lyricsReady = false;
let lyricsActive = false;
let lastHighlightedIndex = -1;

// check token and start refresh cycle
if (!accessToken && window.location.hash) {
  const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
    const [key, value] = item.split('=');
    acc[key] = value;
    return acc;
  }, {});
  accessToken = hash.access_token;
  if (accessToken) {
    document.cookie = `access_token=${accessToken}; path=/;`;
    loginContainer.style.display = 'none';
    mediaDisplay.hidden = false;
    startRefreshing();
  }
} else if (accessToken) {
  loginContainer.style.display = 'none';
  mediaDisplay.hidden = false;
  startRefreshing();
} else {
  loginContainer.style.display = 'block';
  loginBtn.addEventListener('click', () => {
    window.location.href = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${redirectUri}`;
  });
}

// minimal toggle behavior
lyricsToggleBtn.addEventListener('click', () => {
  lyricsActive = !lyricsActive;
  lyricsToggleBtn.setAttribute('aria-pressed', lyricsActive ? 'true' : 'false');
  if (lyricsActive) {
    mediaDisplay.classList.add('lyrics-active');
    // show overlay (will show searching until lyrics loaded or fallback)
    showOverlayText('Searching lyrics...');
  } else {
    mediaDisplay.classList.remove('lyrics-active');
    hideOverlay();
  }
});

// start refreshing (keeps your original 100ms interval)
function startRefreshing() {
  fetchCurrentlyPlaying(accessToken);
  setInterval(() => {
    fetchCurrentlyPlaying(accessToken);
  }, 100);
}

async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;

    const data = await response.json();
    if (!data || data.currently_playing_type === 'ad') return;

    const item = data.item;
    if (!item) return;

    const progressMs = data.progress_ms;
    const durationMs = item.duration_ms;

    // update UI
    coverArt.src = (item.album.images && item.album.images[0]) ? item.album.images[0].url : '';
    titleElem.textContent = item.name;
    albumElem.textContent = item.album.name;
    artistElem.textContent = item.artists.map(a => a.name).join(', ');
    progressBar.style.width = `${(progressMs / durationMs) * 100}%`;
    timeElapsed.textContent = formatTime(progressMs);
    timeRemaining.textContent = `-${formatTime(durationMs - progressMs)}`;
    spotifyLink.href = item.external_urls ? item.external_urls.spotify : '#';

    // fetch lyrics on track change
    const trackSignature = `${item.name}__${item.artists.map(a => a.name).join(',')}__${item.album.name}__${Math.round(durationMs/1000)}`;
    if (trackSignature !== lastTrackId) {
      lastTrackId = trackSignature;
      lyricsReady = false;
      currentLyrics = { lines: [], plain: '', syncedRaw: '' };
      lastHighlightedIndex = -1;
      if (lyricsActive) showOverlayText('Searching lyrics...');
      fetchLyricsForTrack(item.name, item.artists.map(a => a.name).join(', '), item.album.name, Math.round(durationMs/1000));
    }

    // if lyrics available, sync highlight to overlay
    if (lyricsReady && currentLyrics.lines.length > 0 && lyricsActive) {
      updateLyricsHighlight(progressMs / 1000);
    } else if (lyricsActive && !lyricsReady && currentLyrics.plain) {
      // show plain fallback (first meaningful line)
      const p = (currentLyrics.plain || '').split(/\r?\n/).find(Boolean) || currentLyrics.plain;
      showOverlayText(p || 'No lyrics found');
    }
  } catch (err) {
    console.error(err);
  }
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// fullscreen
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    document.body.style.cursor = 'none';
  } else {
    document.body.style.cursor = 'auto';
  }
});

// cookie helper
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Enter opens spotify
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = spotifyLink.href || '#';
    if (url && url !== '#') window.open(url, '_blank');
  }
});

/* -------------------------
   Lyrics (single-verse overlay) handling
   ------------------------- */

// show overlay with text (and small pop animation)
let popTimeout = null;
function showOverlayText(text, pop = true) {
  if (!lyricsOverlay) return;
  lyricsOverlay.hidden = false;
  lyricsOverlay.classList.remove('pop', 'show');
  lyricsOverlay.innerHTML = `<div class="line">${escapeHtml(text)}</div>`;
  // short timeout to allow CSS transitions
  requestAnimationFrame(() => {
    lyricsOverlay.classList.add('show');
    if (pop) {
      // trigger pop
      clearTimeout(popTimeout);
      lyricsOverlay.classList.add('pop');
      // remove pop class after animation so it can retrigger next verse
      popTimeout = setTimeout(() => lyricsOverlay.classList.remove('pop'), 420);
    }
  });
}

// hide overlay
function hideOverlay() {
  if (!lyricsOverlay) return;
  lyricsOverlay.classList.remove('pop', 'show');
  // give time for CSS fade
  setTimeout(() => {
    lyricsOverlay.hidden = true;
    lyricsOverlay.innerHTML = '';
  }, 160);
}

// simple HTML escape
function escapeHtml(s) {
  if (!s && s !== '') return '';
  return String(s).replace(/[&<>"'`=\/]/g, function (c) {
    return {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
      "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
    }[c];
  });
}

// parse synced lyrics LRC format -> array of {time, text}
function parseSyncedLyrics(raw) {
  const lines = raw.split(/\r?\n/);
  const parsed = [];
  const timeTagRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    if (!line.trim()) continue;
    let matches;
    const tags = [];
    while ((matches = timeTagRegex.exec(line)) !== null) {
      const minutes = parseInt(matches[1], 10);
      const seconds = parseInt(matches[2], 10);
      const ms = matches[3] ? parseInt((matches[3] + '000').slice(0, 3), 10) : 0;
      const t = minutes * 60 + seconds + ms / 1000;
      tags.push(t);
    }
    const text = line.replace(timeTagRegex, '').trim();
    if (tags.length > 0) {
      for (const t of tags) parsed.push({ time: t, text });
    } else {
      parsed.push({ time: -1, text });
    }
  }

  parsed.sort((a, b) => {
    if (a.time === -1) return 1;
    if (b.time === -1) return -1;
    return a.time - b.time;
  });

  return parsed;
}

// fetch lyrics from LRCLIB
async function fetchLyricsForTrack(trackName, artistName, albumName, durationSeconds) {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}&album_name=${encodeURIComponent(albumName)}&duration=${encodeURIComponent(durationSeconds)}`;
    const res = await fetch(url);
    if (!res.ok) {
      currentLyrics = { lines: [], plain: '', syncedRaw: '' };
      lyricsReady = false;
      if (lyricsActive) showOverlayText('No lyrics found', true);
      return;
    }

    const json = await res.json();
    currentLyrics.plain = json.plainLyrics || '';
    currentLyrics.syncedRaw = json.syncedLyrics || '';

    if (currentLyrics.syncedRaw && currentLyrics.syncedRaw.trim()) {
      const parsed = parseSyncedLyrics(currentLyrics.syncedRaw);
      if (parsed.length > 0) {
        currentLyrics.lines = parsed;
        lyricsReady = true;
        // immediately show the first matched line (or waiting for sync to align)
        if (lyricsActive) showOverlayText(parsed[0].text || '', true);
        return;
      }
    }

    // fallback to plain lyrics: store lines as unsynced entries
    if (currentLyrics.plain && currentLyrics.plain.trim()) {
      const lines = currentLyrics.plain.split(/\r?\n/).filter(Boolean);
      if (lines.length > 0) {
        currentLyrics.lines = lines.map((t) => ({ time: -1, text: t }));
      } else {
        currentLyrics.lines = [];
      }
      lyricsReady = false;
      if (lyricsActive) {
        const p = lines.find(Boolean) || 'No lyrics found';
        showOverlayText(p, true);
      }
      return;
    }

    // nothing
    currentLyrics = { lines: [], plain: '', syncedRaw: '' };
    lyricsReady = false;
    if (lyricsActive) showOverlayText('No lyrics found', true);
  } catch (err) {
    console.error('Lyrics fetch error:', err);
    lyricsReady = false;
    if (lyricsActive) showOverlayText('Error loading lyrics', true);
  }
}

// update which line is active given current time (seconds) and show it in overlay
function updateLyricsHighlight(currentTimeSec) {
  if (!currentLyrics.lines || currentLyrics.lines.length === 0) return;

  // If lines are timed, pick the last line <= currentTime
  if (currentLyrics.lines.some(l => l.time >= 0)) {
    let idx = -1;
    for (let i = 0; i < currentLyrics.lines.length; i++) {
      const t = currentLyrics.lines[i].time;
      if (t <= currentTimeSec) idx = i;
      else break;
    }
    if (idx === -1) idx = 0;
    if (idx !== lastHighlightedIndex) {
      lastHighlightedIndex = idx;
      const text = currentLyrics.lines[idx].text || '';
      showOverlayText(text, true);
    }
    return;
  }

  // If lines are unsynced (-1), just don't change often; show nearest line by index based on progress maybe
  // We'll keep it simple: show first unsynced line (as verse preview)
  if (lastHighlightedIndex !== 0) {
    lastHighlightedIndex = 0;
    const text = (currentLyrics.lines[0] && currentLyrics.lines[0].text) || (currentLyrics.plain || '');
    showOverlayText(text, true);
  }
}
