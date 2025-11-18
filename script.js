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

const lyricsToggle = document.getElementById('lyrics-toggle');
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsInner = document.getElementById('lyrics-inner');

// Spotify API credentials
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/'; // Update with your live site URL
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

let accessToken = getCookie('access_token');

let lastTrackId = null;
let currentLyrics = {
  // { lines: [{time, text}], plain: "", syncedRaw: "" }
  lines: [],
  plain: '',
  syncedRaw: ''
};
let lyricsReady = false;

// Debugging log to check access token
console.log('Access Token:', accessToken);

// Step 1: Check if access token exists in cookies
if (!accessToken && window.location.hash) {
  const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
    const [key, value] = item.split('=');
    acc[key] = value;
    return acc;
  }, {});

  accessToken = hash.access_token;
  if (accessToken) {
    document.cookie = `access_token=${accessToken}; path=/;`;
    loginContainer.style.display = 'none'; // Hide login button after successful login
    mediaDisplay.hidden = false;
    startRefreshing();
  }
} else if (accessToken) {
  loginContainer.style.display = 'none'; // Hide login button after successful login
  mediaDisplay.hidden = false;
  startRefreshing();
} else {
  loginContainer.style.display = 'block'; // Show login button if not logged in
  loginBtn.addEventListener('click', () => {
    // Redirect to Spotify login
    window.location.href = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${redirectUri}`;
  });
}

// Toggle lyrics behavior (also add .lyrics-active class to mediaDisplay)
lyricsToggle.addEventListener('change', () => {
  if (lyricsToggle.checked) {
    mediaDisplay.classList.add('lyrics-active');
    lyricsContainer.hidden = false;
    if (!lyricsReady) renderSearchingPlaceholder();
  } else {
    mediaDisplay.classList.remove('lyrics-active');
    lyricsContainer.hidden = true;
  }
});

// Step 2: Start refreshing data once logged in (every 0.1 seconds)
function startRefreshing() {
  // Immediately run once
  fetchCurrentlyPlaying(accessToken);

  // Keep fetching
  setInterval(() => {
    fetchCurrentlyPlaying(accessToken);
  }, 100); // 0.1 seconds (kept as your original)
}

// Fetch currently playing track
async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // If token expired or other error, don't spam console
      // console.warn('Unable to fetch currently playing data.');
      return;
    }

    const data = await response.json();
    if (!data || data.currently_playing_type === 'ad') {
      // If ad or no data, stop the rest of the actions
      return;
    }

    const item = data.item;
    if (!item) return;

    const progressMs = data.progress_ms;
    const durationMs = item.duration_ms;

    // Update media details
    coverArt.src = (item.album.images && item.album.images[0]) ? item.album.images[0].url : '';
    titleElem.textContent = item.name; // Only the song name
    albumElem.textContent = item.album.name; // Only the album name
    artistElem.textContent = item.artists.map(artist => artist.name).join(', '); // Only artist(s)
    progressBar.style.width = `${(progressMs / durationMs) * 100}%`;
    timeElapsed.textContent = formatTime(progressMs);
    timeRemaining.textContent = `-${formatTime(durationMs - progressMs)}`;
    spotifyLink.href = item.external_urls ? item.external_urls.spotify : '#';

    // If track changed, fetch lyrics
    const trackSignature = `${item.name}__${item.artists.map(a => a.name).join(',')}__${item.album.name}__${Math.round(durationMs/1000)}`;
    if (trackSignature !== lastTrackId) {
      lastTrackId = trackSignature;
      lyricsReady = false;
      currentLyrics = { lines: [], plain: '', syncedRaw: '' };
      if (lyricsToggle.checked) {
        lyricsContainer.hidden = false;
        renderSearchingPlaceholder();
      }
      fetchLyricsForTrack(item.name, item.artists.map(a => a.name).join(', '), item.album.name, Math.round(durationMs/1000));
    }

    // Sync highlight if lyrics available
    if (lyricsReady && currentLyrics.lines.length > 0) {
      updateLyricsHighlight(progressMs / 1000);
    } else if (lyricsToggle.checked && !lyricsReady) {
      // attempt to show plain lyrics if available
      if (currentLyrics.plain && currentLyrics.plain.trim().length > 0) {
        renderPlainLyrics(currentLyrics.plain);
      }
    }
  } catch (error) {
    console.error(error.message);
  }
}

// Format milliseconds to mm:ss
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});

// Detect fullscreen change and hide/show the cursor
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    document.body.style.cursor = 'none';
  } else {
    document.body.style.cursor = 'auto';
  }
});

// Get value of cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Handle Enter key press to open track in Spotify
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = spotifyLink.href || '#';
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }
});

/* -------------------------
   Lyrics handling
   ------------------------- */

// show placeholder while searching
function renderSearchingPlaceholder() {
  lyricsInner.innerHTML = '';
  const node = document.createElement('div');
  node.className = 'lyric-line';
  node.textContent = 'Searching lyrics...';
  lyricsInner.appendChild(node);
}

// render plain lyrics (no timing)
function renderPlainLyrics(text) {
  lyricsInner.innerHTML = '';
  const lines = text.split(/\r?\n/).filter(Boolean);
  lines.forEach(line => {
    const d = document.createElement('div');
    d.className = 'lyric-line';
    d.textContent = line;
    lyricsInner.appendChild(d);
  });
}

// parse synced lyrics LRC format
function parseSyncedLyrics(raw) {
  // Normalize line endings
  const lines = raw.split(/\r?\n/);
  const parsed = [];
  const timeTagRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    if (!line.trim()) continue;
    // find all time tags
    let matches;
    const tags = [];
    while ((matches = timeTagRegex.exec(line)) !== null) {
      const m = matches;
      const minutes = parseInt(m[1], 10);
      const seconds = parseInt(m[2], 10);
      const ms = m[3] ? parseInt((m[3] + '000').slice(0, 3), 10) : 0;
      const t = minutes * 60 + seconds + ms / 1000;
      tags.push(t);
    }
    // remove tags from the text
    const text = line.replace(timeTagRegex, '').trim();
    if (tags.length > 0) {
      for (const t of tags) {
        parsed.push({ time: t, text });
      }
    } else {
      // fallback: if no tags but has text, push with -1 (will be treated later)
      parsed.push({ time: -1, text: line.trim() });
    }
  }

  // sort by time (place unsynced lines at end)
  parsed.sort((a, b) => {
    if (a.time === -1) return 1;
    if (b.time === -1) return -1;
    return a.time - b.time;
  });

  return parsed;
}

// fetch lyrics from LRCLIB using your provided API docs
async function fetchLyricsForTrack(trackName, artistName, albumName, durationSeconds) {
  try {
    // <-- Uses lrclib.net endpoint -->
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}&album_name=${encodeURIComponent(albumName)}&duration=${encodeURIComponent(durationSeconds)}`;
    const res = await fetch(url);
    if (!res.ok) {
      // not found or other error
      currentLyrics = { lines: [], plain: '', syncedRaw: '' };
      lyricsReady = false;
      if (lyricsToggle.checked) {
        lyricsInner.innerHTML = '';
        const node = document.createElement('div');
        node.className = 'lyric-line';
        node.textContent = 'No lyrics found';
        lyricsInner.appendChild(node);
      }
      return;
    }

    const json = await res.json();
    currentLyrics.plain = json.plainLyrics || '';
    currentLyrics.syncedRaw = json.syncedLyrics || '';
    if (currentLyrics.syncedRaw && currentLyrics.syncedRaw.trim().length > 0) {
      const parsed = parseSyncedLyrics(currentLyrics.syncedRaw);
      if (parsed.length > 0) {
        currentLyrics.lines = parsed;
        lyricsReady = true;
        renderSyncedLyrics(parsed);
        if (lyricsToggle.checked) lyricsContainer.hidden = false;
        return;
      }
    }

    // fallback to plain lyrics if synced not available
    if (currentLyrics.plain && currentLyrics.plain.trim().length > 0) {
      currentLyrics.lines = [];
      lyricsReady = false;
      renderPlainLyrics(currentLyrics.plain);
      if (lyricsToggle.checked) lyricsContainer.hidden = false;
      return;
    }

    // no lyrics at all
    currentLyrics = { lines: [], plain: '', syncedRaw: '' };
    lyricsReady = false;
    if (lyricsToggle.checked) {
      lyricsInner.innerHTML = '';
      const node = document.createElement('div');
      node.className = 'lyric-line';
      node.textContent = 'No lyrics found';
      lyricsInner.appendChild(node);
    }
  } catch (err) {
    console.error('Lyrics fetch error:', err);
    lyricsReady = false;
    if (lyricsToggle.checked) {
      lyricsInner.innerHTML = '';
      const node = document.createElement('div');
      node.className = 'lyric-line';
      node.textContent = 'Error loading lyrics';
      lyricsInner.appendChild(node);
    }
  }
}

// render parsed synchronized lyrics into DOM
function renderSyncedLyrics(parsedLines) {
  lyricsInner.innerHTML = '';
  parsedLines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.className = 'lyric-line';
    row.dataset.time = line.time;
    row.dataset.index = idx;
    row.textContent = line.text || '';
    lyricsInner.appendChild(row);
  });

  // scroll into center first line
  if (lyricsInner.firstChild) {
    lyricsInner.firstChild.classList.add('current');
    centerLineInView(lyricsInner.firstChild);
  }
}

// update which line is active given current time (seconds)
let lastHighlightedIndex = -1;
function updateLyricsHighlight(currentTimeSec) {
  if (!currentLyrics.lines || currentLyrics.lines.length === 0) return;

  // Find the current index: the largest index where line.time <= currentTime
  let idx = -1;
  for (let i = 0; i < currentLyrics.lines.length; i++) {
    const t = currentLyrics.lines[i].time;
    if (t <= currentTimeSec) {
      idx = i;
    } else {
      break;
    }
  }

  // If none found but there are unsynced lines (time -1) and idx === -1, we can show first.
  if (idx === -1) {
    // if first timed entry is > current time, highlight nothing or first line with time > current (optional)
    // We'll highlight the nearest future line if within 2 seconds
    let futureIdx = currentLyrics.lines.findIndex(l => l.time > currentTimeSec);
    if (futureIdx === -1) futureIdx = 0;
    idx = futureIdx === -1 ? 0 : Math.max(0, futureIdx - 1);
  }

  if (idx !== lastHighlightedIndex) {
    // clear previous
    const prev = lyricsInner.querySelector('.lyric-line.current');
    if (prev) prev.classList.remove('current');

    // highlight new
    const newEl = lyricsInner.querySelector(`.lyric-line[data-index="${idx}"]`);
    if (newEl) {
      newEl.classList.add('current');
      centerLineInView(newEl);
      lastHighlightedIndex = idx;
    }
  }
}

// smooth center the active line into view inside lyricsInner
function centerLineInView(el) {
  // compute offset to scroll so the element is vertically centered
  const container = lyricsInner;
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const currentScroll = container.scrollTop;
  const offset = (elRect.top - containerRect.top) + (elRect.height / 2) - (containerRect.height / 2);
  container.scrollTo({
    top: currentScroll + offset,
    behavior: 'smooth'
  });
}
