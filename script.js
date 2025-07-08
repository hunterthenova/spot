// Element refs
const menuBtn       = document.getElementById('menu-btn');
const sidebar       = document.getElementById('sidebar');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const mediaDisplay  = document.getElementById('media-display');
const coverArt      = document.getElementById('cover-art');
const titleElem     = document.getElementById('title');
const albumElem     = document.getElementById('album');
const artistElem    = document.getElementById('artist');
const progressBar   = document.getElementById('progress-bar');
const loginContainer= document.getElementById('login-container');
const loginBtn      = document.getElementById('login-btn');

// Custom controls
const toggles    = document.querySelectorAll('.opt-toggle');
const barColor   = document.getElementById('opt-bar-color');
const titleColor = document.getElementById('opt-title-color');
const albumColor = document.getElementById('opt-album-color');
const artistColor= document.getElementById('opt-artist-color');
const titleSize  = document.getElementById('opt-title-size');
const albumSize  = document.getElementById('opt-album-size');
const artistSize = document.getElementById('opt-artist-size');
const radius     = document.getElementById('opt-radius');
const bgUrl      = document.getElementById('opt-bg-url');
const bgFit      = document.getElementById('opt-bg-fit');
const presetName = document.getElementById('preset-name');
const saveBtn    = document.getElementById('save-preset');
const listPresets= document.getElementById('preset-list');
const delBtn     = document.getElementById('delete-preset');
const resetBtn   = document.getElementById('reset-defaults');

// Display values
const titleVal   = document.getElementById('opt-title-val');
const albumVal   = document.getElementById('opt-album-val');
const artistVal  = document.getElementById('opt-artist-val');
const radiusVal  = document.getElementById('opt-radius-val');

// Spotify creds & state
const clientId    = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/';
const scopes      = ['user-read-currently-playing','user-read-playback-state'];
let accessToken   = getCookie('access_token');

// ──────────────────────────────────────────────────────────────────────
// Initialization
initSidebar();
loadPresets();
applyStoredSettings();
setupSpotifyAuth();
if (accessToken) startRefreshing();

// ── Sidebar toggle ───────────────────────────────────────────────────
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ── Fullscreen ───────────────────────────────────────────────────────
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) sidebar.classList.remove('open');
});

// ── Toggles ───────────────────────────────────────────────────────────
toggles.forEach(chk => {
  chk.addEventListener('change', () => {
    document.querySelector(chk.dataset.target).style.display =
      chk.checked ? '' : 'none';
    saveTemp(chk.dataset.target, chk.checked);
  });
});

// ── Color Pickers ────────────────────────────────────────────────────
barColor.addEventListener('input', () => {
  document.documentElement.style.setProperty('--barColor', barColor.value);
  saveTemp('barColor', barColor.value);
});
titleColor.addEventListener('input', () => {
  titleElem.style.color = titleColor.value;
  saveTemp('titleColor', titleColor.value);
});
albumColor.addEventListener('input', () => {
  albumElem.style.color = albumColor.value;
  saveTemp('albumColor', albumColor.value);
});
artistColor.addEventListener('input', () => {
  artistElem.style.color = artistColor.value;
  saveTemp('artistColor', artistColor.value);
});

// ── Size Sliders ─────────────────────────────────────────────────────
[['title', titleSize, titleVal, titleElem],
 ['album', albumSize, albumVal, albumElem],
 ['artist', artistSize, artistVal, artistElem]]
.forEach(([key, slider, valSpan, elem]) => {
  slider.addEventListener('input', () => {
    const px = slider.value + 'px';
    valSpan.textContent = px;
    elem.style.fontSize = px;
    saveTemp(key + 'Size', slider.value);
  });
});

// ── Radius ────────────────────────────────────────────────────────────
radius.addEventListener('input', () => {
  const r = radius.value + 'px';
  radiusVal.textContent = r;
  document.documentElement.style.setProperty('--radius', r);
  saveTemp('radius', radius.value);
});

// ── Background ───────────────────────────────────────────────────────
bgUrl.addEventListener('change', () => {
  document.body.style.backgroundImage = bgUrl.value
    ? `url(${bgUrl.value})` : 'none';
  saveTemp('bgUrl', bgUrl.value);
});
bgFit.addEventListener('change', () => {
  document.body.style.backgroundSize = bgFit.value;
  saveTemp('bgFit', bgFit.value);
});

// ── Presets ───────────────────────────────────────────────────────────
saveBtn.addEventListener('click', () => {
  const name = presetName.value.trim();
  if (!name) return alert('Enter a preset name.');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
  presetName.value = '';
});
listPresets.addEventListener('change', () => {
  const key = listPresets.value;
  if (!key) return;
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  applySettings(all[key]);
});
delBtn.addEventListener('click', () => {
  const key = listPresets.value;
  if (!key) return alert('Select a preset to delete.');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[key];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
});
resetBtn.addEventListener('click', () => {
  localStorage.removeItem('spotifyTemp');
  localStorage.removeItem('spotifyPresets');
  location.reload();
});

// ── Persistent Storage Helpers ───────────────────────────────────────
function saveTemp(k,v){
  const t=JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[k]=v; localStorage.setItem('spotifyTemp',JSON.stringify(t));
}
function applyStoredSettings(){
  const t=JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  if(t) applySettings(t);
}
function loadPresets(){
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  listPresets.innerHTML = '<option value="">-- Load Preset --</option>';
  Object.keys(all).forEach(n=>{
    const o=document.createElement('option');
    o.value=n; o.textContent=n;
    listPresets.appendChild(o);
  });
}
function gatherSettings(){
  return {
    barColor: barColor.value,
    titleColor: titleColor.value,
    albumColor: albumColor.value,
    artistColor: artistColor.value,
    titleSize: titleSize.value,
    albumSize: albumSize.value,
    artistSize: artistSize.value,
    radius: radius.value,
    bgUrl: bgUrl.value,
    bgFit: bgFit.value,
    '#cover-art': toggles[0].checked,
    '#details': toggles[1].checked,
    '#progress-container': toggles[2].checked
  };
}
function applySettings(cfg){
  if(cfg.barColor){ barColor.value=cfg.barColor; document.documentElement.style.setProperty('--barColor',cfg.barColor); }
  if(cfg.titleColor){ titleColor.value=cfg.titleColor; titleElem.style.color=cfg.titleColor; }
  if(cfg.albumColor){ albumColor.value=cfg.albumColor; albumElem.style.color=cfg.albumColor; }
  if(cfg.artistColor){ artistColor.value=cfg.artistColor; artistElem.style.color=cfg.artistColor; }
  if(cfg.titleSize){ titleSize.value=cfg.titleSize; titleElem.style.fontSize=cfg.titleSize+'px'; titleVal.textContent=cfg.titleSize+'px'; }
  if(cfg.albumSize){ albumSize.value=cfg.albumSize; albumElem.style.fontSize=cfg.albumSize+'px'; albumVal.textContent=cfg.albumSize+'px'; }
  if(cfg.artistSize){ artistSize.value=cfg.artistSize; artistElem.style.fontSize=cfg.artistSize+'px'; artistVal.textContent=cfg.artistSize+'px'; }
  if(cfg.radius){ radius.value=cfg.radius; document.documentElement.style.setProperty('--radius',cfg.radius+'px'); radiusVal.textContent=cfg.radius+'px'; }
  if(cfg.bgUrl!==undefined){ bgUrl.value=cfg.bgUrl; document.body.style.backgroundImage=cfg.bgUrl?`url(${cfg.bgUrl})`:'none'; }
  if(cfg.bgFit){ bgFit.value=cfg.bgFit; document.body.style.backgroundSize=cfg.bgFit; }
  toggles.forEach(chk=>{
    if(cfg[chk.dataset.target]!==undefined){
      chk.checked=cfg[chk.dataset.target];
      document.querySelector(chk.dataset.target).style.display=chk.checked?'':'none';
    }
  });
}

// ── Spotify Logic (unchanged) ────────────────────────────────────────
async function fetchCurrentlyPlaying(token){
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{ Authorization:`Bearer ${token}` }
    });
    if(!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    if(data.currently_playing_type==='ad') return;
    const item = data.item, prog=data.progress_ms, dur=item.duration_ms;
    coverArt.src = item.album.images[0].url;
    titleElem.textContent = item.name;
    albumElem.textContent = item.album.name;
    artistElem.textContent = item.artists.map(a=>a.name).join(', ');
    progressBar.style.width = `${(prog/dur)*100}%`;
  } catch(e){ console.error(e); }
}
function startRefreshing(){
  setInterval(()=> fetchCurrentlyPlaying(accessToken),100);
}
function setupSpotifyAuth(){
  if(!accessToken && window.location.hash){
    const h=window.location.hash.substring(1).split('&').reduce((a,c)=>{
      const [k,v]=c.split('='); a[k]=v; return a;
    },{});
    accessToken=h.access_token;
    if(accessToken){
      document.cookie=`access_token=${accessToken}; path=/;`;
      loginContainer.style.display='none';
      mediaDisplay.hidden=false;
      startRefreshing();
    }
  } else if(accessToken){
    loginContainer.style.display='none';
    mediaDisplay.hidden=false;
  } else {
    loginContainer.style.display='block';
    loginBtn.addEventListener('click',()=>{
      window.location.href=
        `https://accounts.spotify.com/authorize?response_type=token`+
        `&client_id=${clientId}`+
        `&scope=${scopes.join('%20')}`+
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    });
  }
}
function formatTime(ms){
  const m=Math.floor(ms/60000),
        s=Math.floor((ms%60000)/1000).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function getCookie(name){
  const v=`; ${document.cookie}`, p=v.split(`; ${name}=`);
  return p.length===2?p.pop().split(';').shift():null;
}

// Open Spotify when cover is clicked
coverArt.addEventListener('click',()=>{
  window.open(
    `https://open.spotify.com/search/${encodeURIComponent(titleElem.textContent)}`,
    '_blank'
  );
});
