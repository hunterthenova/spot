// script.js

// Grab env from window.ENV
const SUPABASE_URL = window.ENV.SUPABASE_URL;
const SUPABASE_ANON = window.ENV.SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// DOM refs
const loginBtn       = document.getElementById('login-btn');
const loginContainer = document.getElementById('login-container');
const mediaDisplay   = document.getElementById('media-display');
const coverArt       = document.getElementById('cover-art');
const titleElem      = document.getElementById('title');
const albumElem      = document.getElementById('album');
const artistElem     = document.getElementById('artist');
const progressBar    = document.getElementById('progress-bar');
const timeElapsed    = document.getElementById('time-elapsed');
const timeRemaining  = document.getElementById('time-remaining');
const spotifyLink    = document.getElementById('spotify-link');
const fullscreenBtn  = document.getElementById('fullscreen-btn');
const menuBtn        = document.getElementById('menu-btn');
const sidebar        = document.getElementById('sidebar');

// Customization refs
const barColorPicker = document.getElementById('bar-color-picker');
const bgUrlInput     = document.getElementById('bg-url');
const bgApply        = document.getElementById('bg-apply');
const presetName     = document.getElementById('preset-name');
const savePreset     = document.getElementById('save-preset');
const presetList     = document.getElementById('preset-list');
const loadPreset     = document.getElementById('load-preset');
const deletePreset   = document.getElementById('delete-preset');

let token = null;

// AUTH FLOW
document.addEventListener('DOMContentLoaded', async () => {
  // Check existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    token = session.provider_token;
    loginContainer.hidden = true;
    mediaDisplay.hidden   = false;
    startRefreshing();
  }

  // Listen for auth changes (redirect login)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.provider_token) {
      token = session.provider_token;
      loginContainer.hidden = true;
      mediaDisplay.hidden   = false;
      startRefreshing();
    }
  });

  // Login button
  loginBtn.addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: { redirectTo: window.location.href }
    });
  });

  // Load saved customization & presets
  loadCustomizations();
  refreshPresetList();
});

// POLLING
function startRefreshing() {
  setInterval(fetchCurrentlyPlaying, 1000);
}

async function fetchCurrentlyPlaying() {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.currently_playing_type === 'ad') return;

    const item = data.item;
    coverArt.src = item.album.images[0].url;
    titleElem.textContent  = item.name;
    albumElem.textContent  = item.album.name;
    artistElem.textContent = item.artists.map(a => a.name).join(', ');
    const pct = data.progress_ms / item.duration_ms * 100;
    progressBar.style.width = `${pct}%`;
    timeElapsed.textContent    = formatTime(data.progress_ms);
    timeRemaining.textContent  = `-${formatTime(item.duration_ms - data.progress_ms)}`;
    spotifyLink.href = item.external_urls.spotify;

  } catch (err) {
    console.error(err);
  }
}

function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${m}:${s}`;
}

// FULLSCREEN & MENU
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// CUSTOMIZATIONS
barColorPicker.addEventListener('input', e => {
  progressBar.style.backgroundColor = e.target.value;
  localStorage.setItem('barColor', e.target.value);
});
bgApply.addEventListener('click', () => {
  const url = bgUrlInput.value.trim();
  document.body.style.background = url ? `url(${url}) center/cover` : '#121212';
  localStorage.setItem('bgUrl', url);
});

// PRESETS
function refreshPresetList() {
  const presets = JSON.parse(localStorage.getItem('playbackPresets') || '{}');
  presetList.innerHTML = Object.keys(presets)
    .map(k => `<option value="${k}">${k}</option>`).join('');
}

savePreset.addEventListener('click', () => {
  const name = presetName.value.trim();
  if (!name) return alert('Enter preset name');
  const p = JSON.parse(localStorage.getItem('playbackPresets') || '{}');
  p[name] = {
    barColor: barColorPicker.value,
    bgUrl: bgUrlInput.value.trim()
  };
  localStorage.setItem('playbackPresets', JSON.stringify(p));
  refreshPresetList();
});

loadPreset.addEventListener('click', () => {
  const key = presetList.value;
  const p   = JSON.parse(localStorage.getItem('playbackPresets') || '{}');
  if (!p[key]) return;
  const { barColor, bgUrl } = p[key];
  barColorPicker.value = barColor;
  progressBar.style.backgroundColor = barColor;
  bgUrlInput.value = bgUrl;
  document.body.style.background = bgUrl ? `url(${bgUrl}) center/cover` : '#121212';
});

deletePreset.addEventListener('click', () => {
  const key = presetList.value;
  const p   = JSON.parse(localStorage.getItem('playbackPresets') || '{}');
  delete p[key];
  localStorage.setItem('playbackPresets', JSON.stringify(p));
  refreshPresetList();
});

// INITIAL LOAD
function loadCustomizations() {
  const bc = localStorage.getItem('barColor');
  if (bc) {
    barColorPicker.value = bc;
    progressBar.style.backgroundColor = bc;
  }
  const bg = localStorage.getItem('bgUrl');
  if (bg) {
    bgUrlInput.value = bg;
    document.body.style.background = bg ? `url(${bg}) center/cover` : '#121212';
  }
}
