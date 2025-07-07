// --- CONFIGURATION ---
// these should be injected by your Vercel build process:
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI     = window.location.origin + window.location.pathname;
const SCOPES           = 'user-read-currently-playing';

// --- INIT SUPABASE ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UI ELEMENTS ---
const signInBtn      = document.getElementById('sign-in-btn');
const signOutBtn     = document.getElementById('sign-out-btn');
const nowPlayingPre  = document.getElementById('now-playing');
const hamburger      = document.getElementById('hamburger');
const sidebar        = document.getElementById('sidebar');
const barColorPicker = document.getElementById('bar-color-picker');
const bgImageInput   = document.getElementById('bg-image-input');
const applyStyleBtn  = document.getElementById('apply-style-btn');
const savePresetBtn  = document.getElementById('save-preset-btn');
const presetList     = document.getElementById('preset-list');

// generate or load a pseudo‑user ID
let userId = localStorage.getItem('notes_user_id');
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('notes_user_id', userId);
}

// --- SPOTIFY FLOW ---
function handleSpotifyCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (token) {
    window.history.replaceState({}, document.title, REDIRECT_URI);
    localStorage.setItem('spotify_token', token);
    upsertUserToken(token);
    signInBtn.hidden = true;
    signOutBtn.hidden = false;
    startPolling();
  }
}

async function upsertUserToken(token) {
  await supabaseClient
    .from('users')
    .upsert({ id: userId, spotify_token: token });
}

function signInWithSpotify() {
  const authUrl =
    `https://accounts.spotify.com/authorize?` +
    `response_type=token&client_id=${SPOTIFY_CLIENT_ID}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location = authUrl;
}

async function signOut() {
  localStorage.removeItem('spotify_token');
  signInBtn.hidden = false;
  signOutBtn.hidden = true;
  nowPlayingPre.textContent = `Title: –\nArtist: –\n\n[------------------------------]\n\n00:00 – 00:00`;
  stopPolling();
}

// --- POLLING SPOTIFY ---
let pollInterval;
function startPolling() {
  fetchNowPlaying();
  pollInterval = setInterval(fetchNowPlaying, 5000);
}
function stopPolling() {
  clearInterval(pollInterval);
}

async function fetchNowPlaying() {
  const token = localStorage.getItem('spotify_token');
  if (!token) return;
  const resp = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (resp.status === 204 || resp.status > 400) return;
  const data = await resp.json();
  const { name, artists, progress_ms, item } = data;
  const duration = item.duration_ms;
  const barLen = 30;
  const filled = Math.round((progress_ms / duration) * barLen);
  const bar = `[${'#'.repeat(filled)}${'-'.repeat(barLen - filled)}]`;
  const fmt = ms => new Date(ms).toISOString().substr(14, 5);
  nowPlayingPre.textContent =
    `Title: ${name}\n` +
    `Artist: ${artists.map(a=>a.name).join(', ')}\n\n` +
    `${bar}\n\n` +
    `${fmt(progress_ms)} – ${fmt(duration)}`;
}

// --- CUSTOMIZATION & PRESETS ---
function applyStyles(cfg) {
  document.body.style.setProperty('--bar-color', cfg.barColor);
  document.body.style.backgroundImage = cfg.bgImage ? `url('${cfg.bgImage}')` : '';
}
applyStyleBtn.onclick = () => {
  const cfg = {
    barColor: barColorPicker.value,
    bgImage: bgImageInput.value.trim()
  };
  applyStyles(cfg);
};

async function loadPresets() {
  const { data, error } = await supabaseClient
    .from('presets')
    .select('*')
    .eq('user_id', userId);
  presetList.innerHTML = '';
  if (data) {
    data.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p.name;
      li.onclick = () => applyStyles({ barColor: p.bar_color, bgImage: p.bg_image });
      presetList.appendChild(li);
    });
  }
}

savePresetBtn.onclick = async () => {
  const name = prompt('Preset name?');
  if (!name) return;
  const cfg = {
    user_id: userId,
    name,
    bar_color: barColorPicker.value,
    bg_image: bgImageInput.value.trim()
  };
  await supabaseClient
    .from('presets')
    .upsert(cfg, { onConflict: ['user_id', 'name'] });
  loadPresets();
};

// --- SIDEBAR & FULLSCREEN ---
hamburger.onclick = () => sidebar.classList.toggle('hidden');
document.addEventListener('fullscreenchange', () => {
  const hide = !!document.fullscreenElement;
  sidebar.style.display   = hide ? 'none' : '';
  document.getElementById('top-bar').style.display = hide ? 'none' : 'flex';
});

// --- HOOKS & INIT ---
signInBtn.onclick  = signInWithSpotify;
signOutBtn.onclick = signOut;
handleSpotifyCallback();
loadPresets();
