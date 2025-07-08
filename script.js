// script.js
const menuBtn       = document.getElementById('menu-btn');
const sidebar       = document.getElementById('sidebar');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const mediaDisplay  = document.getElementById('media-display');
const coverArt      = document.getElementById('cover-art');
const titleElem     = document.getElementById('title');
const albumElem     = document.getElementById('album');
const artistElem    = document.getElementById('artist');
const progressBar   = document.getElementById('progress-bar');
const timeElapsed   = document.getElementById('time-elapsed');
const timeRemaining = document.getElementById('time-remaining');
const spotifyLink   = document.getElementById('spotify-link');
const loginContainer= document.getElementById('login-container');
const loginBtn      = document.getElementById('login-btn');

// Customization controls
const opts = {
  barColor: document.getElementById('opt-bar-color'),
  bgUrl:    document.getElementById('opt-bg-url'),
  titleSize:  document.getElementById('opt-title-size'),
  albumSize:  document.getElementById('opt-album-size'),
  artistSize: document.getElementById('opt-artist-size'),
  presetName: document.getElementById('preset-name'),
  presetList: document.getElementById('preset-list'),
  saveBtn: document.getElementById('save-preset'),
  deleteBtn: document.getElementById('delete-preset'),
  resetBtn: document.getElementById('reset-defaults')
};

// Spotify credentials
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/';
const scopes = ['user-read-currently-playing','user-read-playback-state'];
let accessToken = getCookie('access_token');

// INIT
initSidebar();
loadPresets();
applyStoredSettings();
setupSpotifyAuth();
startRefreshing();

// ── SIDEBAR TOGGLE ───────────────────────────────────────────────────
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// ── FULLSCREEN ───────────────────────────────────────────────────────
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', () => {
  // auto‑close sidebar on fullscreen
  if (document.fullscreenElement) sidebar.classList.remove('open');
});

// ── CUSTOMIZATION EVENTS ─────────────────────────────────────────────
opts.barColor.addEventListener('input', () => {
  progressBar.style.backgroundColor = opts.barColor.value;
  saveTemp('barColor', opts.barColor.value);
});
opts.bgUrl.addEventListener('change', () => {
  document.body.style.backgroundImage = opts.bgUrl.value
    ? `url(${opts.bgUrl.value})`
    : 'none';
  saveTemp('bgUrl', opts.bgUrl.value);
});
opts.titleSize.addEventListener('input', () => {
  titleElem.style.fontSize = opts.titleSize.value + 'px';
  saveTemp('titleSize', opts.titleSize.value);
});
opts.albumSize.addEventListener('input', () => {
  albumElem.style.fontSize = opts.albumSize.value + 'px';
  saveTemp('albumSize', opts.albumSize.value);
});
opts.artistSize.addEventListener('input', () => {
  artistElem.style.fontSize = opts.artistSize.value + 'px';
  saveTemp('artistSize', opts.artistSize.value);
});

// ── PRESETS ───────────────────────────────────────────────────────────
opts.saveBtn.addEventListener('click', () => {
  const name = opts.presetName.value.trim();
  if (!name) return alert('Enter a preset name.');
  const data = gatherCurrentSettings();
  const all = JSON.parse(localStorage.getItem('spotifyPresets') || '{}');
  all[name] = data;
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
  opts.presetName.value = '';
});
opts.presetList.addEventListener('change', () => {
  const key = opts.presetList.value;
  if (!key) return;
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  applySettings(all[key]);
});
opts.deleteBtn.addEventListener('click', () => {
  const key = opts.presetList.value;
  if (!key) return alert('Select a preset to delete.');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[key];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
});
opts.resetBtn.addEventListener('click', () => {
  localStorage.removeItem('spotifyTemp');
  localStorage.removeItem('spotifyPresets');
  location.reload();
});

function initSidebar() {
  // close if click outside
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

function saveTemp(key, val) {
  const temp = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  temp[key] = val;
  localStorage.setItem('spotifyTemp', JSON.stringify(temp));
}
function applyStoredSettings() {
  const temp = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  if (!temp) return;
  applySettings(temp);
}

function gatherCurrentSettings() {
  return {
    barColor: opts.barColor.value,
    bgUrl:    opts.bgUrl.value,
    titleSize: opts.titleSize.value,
    albumSize: opts.albumSize.value,
    artistSize: opts.artistSize.value
  };
}

function applySettings(cfg) {
  if (cfg.barColor) {
    opts.barColor.value = cfg.barColor;
    progressBar.style.backgroundColor = cfg.barColor;
  }
  if (cfg.bgUrl !== undefined) {
    opts.bgUrl.value = cfg.bgUrl;
    document.body.style.backgroundImage = cfg.bgUrl
      ? `url(${cfg.bgUrl})`
      : 'none';
  }
  if (cfg.titleSize) {
    opts.titleSize.value = cfg.titleSize;
    titleElem.style.fontSize = cfg.titleSize + 'px';
  }
  if (cfg.albumSize) {
    opts.albumSize.value = cfg.albumSize;
    albumElem.style.fontSize = cfg.albumSize + 'px';
  }
  if (cfg.artistSize) {
    opts.artistSize.value = cfg.artistSize;
    artistElem.style.fontSize = cfg.artistSize + 'px';
  }
}

function loadPresets() {
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  opts.presetList.innerHTML = '<option value="">-- Load Preset --</option>';
  Object.keys(all).forEach(name => {
    const o = document.createElement('option');
    o.value = name;
    o.textContent = name;
    opts.presetList.appendChild(o);
  });
}

// ── SPOTIFY PLAYING LOGIC ─────────────────────────────────────────────
async function fetchCurrentlyPlaying(token) {
  try {
    const res = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    if (data.currently_playing_type === 'ad') return;
    const item = data.item;
    const prog = data.progress_ms;
    const dur  = item.duration_ms;

    coverArt.src = item.album.images[0].url;
    titleElem.textContent = item.name;
    albumElem.textContent = item.album.name;
    artistElem.textContent = item.artists.map(a=>a.name).join(', ');
    progressBar.style.width = `${(prog/dur)*100}%`;
    timeElapsed.textContent = formatTime(prog);
    timeRemaining.textContent = `-${formatTime(dur-prog)}`;
    spotifyLink.href = item.external_urls.spotify;
  } catch(e){
    console.error(e);
  }
}

function startRefreshing() {
  if (accessToken) {
    setInterval(()=> fetchCurrentlyPlaying(accessToken), 100);
  }
}

function setupSpotifyAuth() {
  if (!accessToken && window.location.hash) {
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce((a,c)=>{
        const [k,v] = c.split('=');
        a[k]=v; return a;
      },{});
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
  } else {
    loginContainer.style.display = 'block';
    loginBtn.addEventListener('click', () => {
      window.location.href =
        `https://accounts.spotify.com/authorize?response_type=token`
        + `&client_id=${clientId}`
        + `&scope=${scopes.join('%20')}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    });
  }
}

function formatTime(ms) {
  const m = Math.floor(ms/60000);
  const s = Math.floor((ms%60000)/1000)
              .toString().padStart(2,'0');
  return `${m}:${s}`;
}

function getCookie(name) {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  if (parts.length===2) return parts.pop().split(';').shift();
  return null;
}

// start login-refresh if already have token
if (accessToken) startRefreshing();

// optional: Open Spotify link on Enter
document.addEventListener('keydown', e => {
  if (e.key==='Enter' && spotifyLink.href) {
    window.open(spotifyLink.href,'_blank');
  }
});
