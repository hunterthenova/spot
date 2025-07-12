// — CLAIM HASH TOKEN ON REDIRECT —
(() => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const t = params.get('access_token');
    if (t) document.cookie = `access_token=${t};path=/`;
    history.replaceState(null, '', window.location.pathname);
  }
})();

// Spotify credentials
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token       = getCookie('access_token');

// UI refs
const loginC    = document.getElementById('login-container');
const loginBtn  = document.getElementById('login-btn');
const mediaD    = document.getElementById('media-display');
const coverArt  = document.getElementById('cover-art');
const titleE    = document.getElementById('title');
const albumE    = document.getElementById('album');
const artistE   = document.getElementById('artist');
const timeEl    = document.getElementById('time-elapsed');
const timeRem   = document.getElementById('time-remaining');
const progBar   = document.getElementById('progress-bar');
const menuBtn   = document.getElementById('menu-btn');
const sidebar   = document.getElementById('sidebar');
const fullBtn   = document.getElementById('fullscreen-btn');

// Control refs
const bgColorIn    = document.getElementById('bg-color');
const syncBg       = document.getElementById('sync-bg');
const smartBg      = document.getElementById('smart-bg');
const barColorIn   = document.getElementById('bar-color');
const smartBar     = document.getElementById('smart-bar');
const progTextIn   = document.getElementById('prog-text-color');
const syncProgTxt  = document.getElementById('sync-prog-text');
const smartText    = document.getElementById('smart-text');
const titleColorIn = document.getElementById('title-color');
const smartTitle   = document.getElementById('smart-title');
const albumColorIn = document.getElementById('album-color');
const smartAlbum   = document.getElementById('smart-album');
const artistColorIn= document.getElementById('artist-color');
const smartArtist  = document.getElementById('smart-artist');
const smartAll     = document.getElementById('smart-all');

// Preset refs
const presetName    = document.getElementById('preset-name');
const savePresetBtn = document.getElementById('save-preset');
const presetList    = document.getElementById('preset-list');
const deletePreset  = document.getElementById('delete-preset');
const resetBtn      = document.getElementById('reset-defaults');

// Initialize
initUI();
setupAuth();

function initUI(){
  // Sidebar toggle
  menuBtn.onclick = () => sidebar.classList.toggle('open');
  document.addEventListener('click', e=>{
    if(!sidebar.contains(e.target)&&!menuBtn.contains(e.target))
      sidebar.classList.remove('open');
  });

  // Fullscreen
  fullBtn.onclick = () => {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', ()=>{
    if(document.fullscreenElement) sidebar.classList.remove('open');
  });

  // Background controls
  bgColorIn.oninput = () => {
    applyCSSVar('--bg-color', bgColorIn.value, 'bg-color');
    adjustProgBg();  // ensure contrast
  };
  syncBg.onchange = () => { if(syncBg.checked) sampleCoverColor('bg'); };
  smartBg.onchange = () => { if(smartBg.checked) smartAll.checked=false; };

  // Bar & text
  barColorIn.oninput = () => {
    applyCSSVar('--bar-color', barColorIn.value, 'bar-color');
    if(syncProgTxt.checked){
      progTextIn.value = barColorIn.value;
      progTextIn.dispatchEvent(new Event('input'));
    }
  };
  progTextIn.oninput = () => applyCSSVar('--prog-text', progTextIn.value, 'prog-text');
  syncProgTxt.onchange = () => {
    progTextIn.disabled = syncProgTxt.checked;
    if(syncProgTxt.checked){
      progTextIn.value = barColorIn.value;
      progTextIn.dispatchEvent(new Event('input'));
    }
  };
  smartBar.onchange = () => { if(smartBar.checked) smartAll.checked=false; };
  smartText.onchange= () => { if(smartText.checked) smartAll.checked=false; };

  // Title/Album/Artist
  titleColorIn.oninput = () => applyCSSVar('--title-color', titleColorIn.value, 'title-color');
  albumColorIn.oninput = () => applyCSSVar('--album-color', albumColorIn.value, 'album-color');
  artistColorIn.oninput= () => applyCSSVar('--artist-color', artistColorIn.value, 'artist-color');
  smartTitle.onchange  = () => { if(smartTitle.checked) smartAll.checked=false; };
  smartAlbum.onchange  = () => { if(smartAlbum.checked) smartAll.checked=false; };
  smartArtist.onchange = () => { if(smartArtist.checked) smartAll.checked=false; };
  smartAll.onchange    = () => {
    const v = smartAll.checked;
    [smartBg,smartBar,smartText,smartTitle,smartAlbum,smartArtist]
      .forEach(c=>c.checked=v);
  };

  // Presets
  savePresetBtn.onclick = savePreset;
  presetList.onchange  = () => applyPreset(presetList.value);
  deletePreset.onclick = deletePresetEntry;
  resetBtn.onclick     = () => {
    if(confirm('Reset all settings?')) localStorage.clear(),location.reload();
  };

  // Load stored & presets
  applyStored();
  loadPresets();
}

function applyCSSVar(name,val,key){
  document.documentElement.style.setProperty(name,val);
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[key] = val; localStorage.setItem('spotifyTemp', JSON.stringify(t));
}
function adjustProgBg(){
  // auto-contrast prog-bg vs bg-color
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
  const lum = relativeLum(bg);
  // if bg light, make prog-bg darker; else lighter
  const adj = lum > 0.5 ? -30 : 30;
  const col = lightenDarkenHex(bg, adj);
  document.documentElement.style.setProperty('--prog-bg', col);
}

function lightenDarkenHex(col, amt){
  let usePound = col[0]==='#';
  let num = parseInt(col.slice(usePound?1:0),16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8)&0x00FF) + amt;
  let b = (num & 0x0000FF) + amt;
  r = Math.max(Math.min(255,r),0);
  g = Math.max(Math.min(255,g),0);
  b = Math.max(Math.min(255,b),0);
  return (usePound?'#':'') + ((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}
function relativeLum(hex){
  const c = parseInt(hex.slice(1),16);
  let r = (c>>16)/255, g = ((c>>8)&0xFF)/255, b = (c&0xFF)/255;
  [r,g,b] = [r,g,b].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

function applyStored(){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  Object.entries(t).forEach(([k,v])=>{
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    if(el.type==='checkbox') el.checked=v;
    else el.value=v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}

// Smart‑Mode and fetch logic omitted for brevity… it's identical to prior snippet

function savePreset(){ /* … */ }
function loadPresets(){ /* … */ }
function applyPreset(name){ /* … */ }
function deletePresetEntry(){ /* … */ }
function gatherSettings(){ /* … */ }

function setupAuth(){
  if(!token && location.hash){
    const h = Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token = h.access_token; document.cookie=`access_token=${token};path=/`;
    history.replaceState(null,'',location.pathname);
  }
  if(token){
    loginC.style.display='none'; mediaD.classList.add('active');
    fetchNow(); setInterval(fetchNow,100);
  } else loginC.style.display='flex';
}

async function fetchNow(){ /* … */ }

function getCookie(n){
  const m = document.cookie.split('; ').find(r=>r.startsWith(n+'='));
  return m?m.split('=')[1]:null;
}
