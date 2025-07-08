// script.js

// now loaded by /api/env.js
const SUPABASE_URL = window.ENV.SUPABASE_URL;
const SUPABASE_ANON = window.ENV.SUPABASE_ANON_KEY;

// init
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// DOM
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

// customization
const barColorPicker = document.getElementById('bar-color-picker');
const bgUrlInput     = document.getElementById('bg-url');
const bgApply        = document.getElementById('bg-apply');
const presetName     = document.getElementById('preset-name');
const savePreset     = document.getElementById('save-preset');
const presetList     = document.getElementById('preset-list');
const loadPreset     = document.getElementById('load-preset');
const deletePreset   = document.getElementById('delete-preset');

let token = null;

document.addEventListener('DOMContentLoaded', async () => {
  // get existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    token = session.provider_token;
    loginContainer.hidden = true;
    mediaDisplay.hidden   = false;
    startRefreshing();
  }

  // auth listener (for redirect flow)
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.provider_token) {
      token = session.provider_token;
      loginContainer.hidden = true;
      mediaDisplay.hidden   = false;
      startRefreshing();
    }
  });

  // login click
  loginBtn.addEventListener('click', () =>
    supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: { redirectTo: window.location.href }
    })
  );

  // load saved UI settings
  applySavedUI();
  refreshPresetList();
});

// polling
function startRefreshing(){
  setInterval(fetchCurrentlyPlaying, 1000);
}
async function fetchCurrentlyPlaying(){
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization:`Bearer ${token}` }
    });
    if(!res.ok) return;
    const data = await res.json();
    if(data.currently_playing_type==='ad') return;
    const item = data.item;
    coverArt.src = item.album.images[0].url;
    titleElem.textContent  = item.name;
    albumElem.textContent  = item.album.name;
    artistElem.textContent = item.artists.map(a=>a.name).join(', ');
    const pct = data.progress_ms / item.duration_ms * 100;
    progressBar.style.width = pct+'%';
    timeElapsed.textContent   = formatTime(data.progress_ms);
    timeRemaining.textContent = '-'+formatTime(item.duration_ms - data.progress_ms);
    spotifyLink.href = item.external_urls.spotify;
  } catch(e){ console.error(e) }
}
function formatTime(ms){
  const m = Math.floor(ms/60000);
  const s = String(Math.floor((ms%60000)/1000)).padStart(2,'0');
  return `${m}:${s}`;
}

// fullscreen & menu
fullscreenBtn.addEventListener('click',()=>{
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
});
menuBtn.addEventListener('click',()=>sidebar.classList.toggle('open'));

// UI customization
barColorPicker.addEventListener('input',e=>{
  progressBar.style.backgroundColor = e.target.value;
  localStorage.setItem('barColor', e.target.value);
});
bgApply.addEventListener('click',()=>{
  const u = bgUrlInput.value.trim();
  document.body.style.background = u?`url(${u}) center/cover`:'#121212';
  localStorage.setItem('bgUrl', u);
});

// presets
function refreshPresetList(){
  const p = JSON.parse(localStorage.getItem('playbackPresets')||'{}');
  presetList.innerHTML = Object.keys(p).map(k=>`<option>${k}</option>`).join('');
}
savePreset.addEventListener('click',()=>{
  const n = presetName.value.trim();
  if(!n) return alert('Name it!');
  const p=JSON.parse(localStorage.getItem('playbackPresets')||'{}');
  p[n]={ barColor:barColorPicker.value, bgUrl:bgUrlInput.value.trim() };
  localStorage.setItem('playbackPresets',JSON.stringify(p));
  refreshPresetList();
});
loadPreset.addEventListener('click',()=>{
  const k=presetList.value;
  const p=JSON.parse(localStorage.getItem('playbackPresets')||'{}');
  if(!p[k])return;
  barColorPicker.value = p[k].barColor;
  progressBar.style.backgroundColor = p[k].barColor;
  bgUrlInput.value = p[k].bgUrl;
  document.body.style.background = p[k].bgUrl?`url(${p[k].bgUrl}) center/cover`:'#121212';
});
deletePreset.addEventListener('click',()=>{
  const k=presetList.value;
  const p=JSON.parse(localStorage.getItem('playbackPresets')||'{}');
  delete p[k];
  localStorage.setItem('playbackPresets',JSON.stringify(p));
  refreshPresetList();
});

// on load
function applySavedUI(){
  const bc=localStorage.getItem('barColor');
  if(bc){ barColorPicker.value=bc; progressBar.style.backgroundColor=bc; }
  const bg=localStorage.getItem('bgUrl');
  if(bg){ bgUrlInput.value=bg; document.body.style.background=bg?`url(${bg}) center/cover`:'#121212'; }
}
