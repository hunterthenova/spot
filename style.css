// script.js
// --- Element refs ---
const loginC       = document.getElementById('login-container');
const loginBtn     = document.getElementById('login-btn');
const mediaD       = document.getElementById('media-display');
const coverArt     = document.getElementById('cover-art');
const titleE       = document.getElementById('title');
const albumE       = document.getElementById('album');
const artistE      = document.getElementById('artist');
const timeEl       = document.getElementById('time-elapsed');
const timeRem      = document.getElementById('time-remaining');
const progBar      = document.getElementById('progress-bar');
const menuBtn      = document.getElementById('menu-btn');
const sidebar      = document.getElementById('sidebar');
const fullBtn      = document.getElementById('fullscreen-btn');

// --- Controls ---
const bgColorIn    = document.getElementById('bg-color');
const bgFitIn      = document.getElementById('bg-fit');
const syncBg       = document.getElementById('sync-bg');
const barColorIn   = document.getElementById('bar-color');
const progTextIn   = document.getElementById('prog-text-color');
const syncProgTxt  = document.getElementById('sync-prog-text');
const titleColorIn = document.getElementById('title-color');
const albumColorIn = document.getElementById('album-color');
const artistColorIn= document.getElementById('artist-color');
const titleSizeIn  = document.getElementById('title-size');
const titleNumIn   = document.getElementById('title-num');
const albumSizeIn  = document.getElementById('album-size');
const albumNumIn   = document.getElementById('album-num');
const artistSizeIn = document.getElementById('artist-size');
const artistNumIn  = document.getElementById('artist-num');
const radiusIn     = document.getElementById('radius');
const radiusNumIn  = document.getElementById('radius-num');
const smartBtn     = document.getElementById('smart-mode');

const presetName   = document.getElementById('preset-name');
const savePreset   = document.getElementById('save-preset');
const presetList   = document.getElementById('preset-list');
const deletePreset = document.getElementById('delete-preset');
const resetBtn     = document.getElementById('reset-defaults');

// --- Spotify creds/state ---
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token        = getCookie('access_token');

// --- Init UI ---
initUI();
setupAuth();

// ───────── UI Initialization ──────────────────────
function initUI(){
  // Menu toggle
  menuBtn.onclick = ()=> sidebar.classList.toggle('open');
  document.addEventListener('click', e=>{
    if(!sidebar.contains(e.target) && !menuBtn.contains(e.target))
      sidebar.classList.remove('open');
  });

  // Fullscreen
  fullBtn.onclick = ()=> {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', ()=>{
    if(document.fullscreenElement) sidebar.classList.remove('open');
  });

  // Background
  bgColorIn.oninput = ()=>{
    document.documentElement.style.setProperty('--bg-color', bgColorIn.value);
    saveTemp('bg-color', bgColorIn.value);
  };
  bgFitIn.onchange = ()=>{
    document.documentElement.style.setProperty('--bg-fit', bgFitIn.value);
    saveTemp('bg-fit', bgFitIn.value);
  };
  syncBg.onchange = ()=>{ if(syncBg.checked) sampleCoverColor(); };

  // Bar & prog text
  barColorIn.oninput = ()=>{
    document.documentElement.style.setProperty('--bar-color', barColorIn.value);
    saveTemp('bar-color', barColorIn.value);
    if(syncProgTxt.checked){
      progTextIn.value = barColorIn.value;
      progTextIn.dispatchEvent(new Event('input'));
    }
  };
  progTextIn.oninput = ()=>{
    document.documentElement.style.setProperty('--prog-text', progTextIn.value);
    saveTemp('prog-text', progTextIn.value);
  };
  syncProgTxt.onchange = ()=>{
    progTextIn.disabled = syncProgTxt.checked;
    if(syncProgTxt.checked) {
      progTextIn.value = barColorIn.value;
      progTextIn.dispatchEvent(new Event('input'));
    }
  };

  // Title/Album/Artist colors
  titleColorIn.oninput  = ()=> updateCSSVar('--title-color', titleColorIn.value, 'title-color');
  albumColorIn.oninput  = ()=> updateCSSVar('--album-color', albumColorIn.value, 'album-color');
  artistColorIn.oninput = ()=> updateCSSVar('--artist-color', artistColorIn.value, 'artist-color');

  // Sizes & radius
  [[titleSizeIn,titleNumIn,'title','--',40],
   [albumSizeIn,albumNumIn,'album','--',30],
   [artistSizeIn,artistNumIn,'artist','--',20],
   [radiusIn,radiusNumIn,'radius','--radius',5]]
  .forEach(([slider,number,key,cssVar,def])=>{
    const varName = cssVar==='--'?`--${key}-size`:'--radius';
    function sync(v){
      slider.value = number.value = v;
      if(cssVar==='--radius'){
        document.documentElement.style.setProperty(varName, v+'px');
      } else {
        document.documentElement.style.setProperty(varName, v+'px');
      }
      saveTemp(key, v);
    }
    slider.oninput = ()=> sync(slider.value);
    number.oninput = ()=> sync(number.value);
  });

  // Smart mode
  smartBtn.onclick = applySmartMode;

  // Presets
  savePreset.onclick = saveCurrentPreset;
  presetList.onchange = ()=> applyPreset(presetList.value);
  deletePreset.onclick = deleteCurrentPreset;
  resetBtn.onclick = ()=>{
    if(confirm('Reset all settings?')) localStorage.clear(), location.reload();
  };

  // Load stored & presets
  applyStored();
  loadPresetList();
}

// ───────── Helpers ─────────────────────────
function updateCSSVar(varName, val, tempKey){
  document.documentElement.style.setProperty(varName, val);
  saveTemp(tempKey, val);
}

function saveTemp(key, val){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[key] = val; localStorage.setItem('spotifyTemp', JSON.stringify(t));
}

function applyStored(){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  Object.entries(t).forEach(([k,v])=>{
    const el = document.getElementById(k.replace(/-/g,'-'));
    switch(k){
      case 'bg-color': bgColorIn.value=v; bgColorIn.dispatchEvent(new Event('input')); break;
      case 'bg-fit': bgFitIn.value=v; bgFitIn.dispatchEvent(new Event('change')); break;
      case 'sync-bg': syncBg.checked=v; break;
      case 'bar-color': barColorIn.value=v; barColorIn.dispatchEvent(new Event('input')); break;
      case 'prog-text': progTextIn.value=v; progTextIn.dispatchEvent(new Event('input')); break;
      case 'title-color': titleColorIn.value=v; titleColorIn.dispatchEvent(new Event('input')); break;
      case 'album-color': albumColorIn.value=v; albumColorIn.dispatchEvent(new Event('input')); break;
      case 'artist-color': artistColorIn.value=v; artistColorIn.dispatchEvent(new Event('input')); break;
      case 'title': titleSizeIn.value=v; titleNumIn.value=v; titleSizeIn.dispatchEvent(new Event('input')); break;
      case 'album': albumSizeIn.value=v; albumNumIn.value=v; albumSizeIn.dispatchEvent(new Event('input')); break;
      case 'artist': artistSizeIn.value=v; artistNumIn.value=v; artistSizeIn.dispatchEvent(new Event('input')); break;
      case 'radius': radiusIn.value=v; radiusNumIn.value=v; radiusIn.dispatchEvent(new Event('input')); break;
    }
  });
}

// ───────── Smart Mode ─────────────────────────
function applySmartMode(){
  // sample 5x5 pixels grid, average, then complementary
  const img = new Image(); img.crossOrigin='Anonymous'; img.src = coverArt.src;
  img.onload = ()=>{
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0,0,c.width,c.height).data;
    let r=0,g=0,b=0,count=0;
    for(let y=0;y<c.height;y+=Math.floor(c.height/10)){
      for(let x=0;x<c.width;x+=Math.floor(c.width/10)){
        const i = ((y*c.width)+x)*4;
        r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++;
      }
    }
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
    const main = rgbToHex(r,g,b);
    const comp = rgbToHex(255-r,255-g,255-b);
    // apply
    barColorIn.value = main; barColorIn.dispatchEvent(new Event('input'));
    progTextIn.value = comp; progTextIn.dispatchEvent(new Event('input'));
    titleColorIn.value = comp; titleColorIn.dispatchEvent(new Event('input'));
    albumColorIn.value = comp; albumColorIn.dispatchEvent(new Event('input'));
    artistColorIn.value = comp; artistColorIn.dispatchEvent(new Event('input'));
    bgColorIn.value = rgbToHex(r/2,g/2,b/2); bgColorIn.dispatchEvent(new Event('input'));
  };
}

function rgbToHex(r,g,b){
  const to = v=>v.toString(16).padStart(2,'0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// ───────── Presets ───────────────────────────
function saveCurrentPreset(){
  const name = presetName.value.trim(); if(!name) return alert('Enter name');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresetList(); presetName.value='';
}

function loadPresetList(){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  presetList.innerHTML = '';
  Object.keys(all).forEach(n=>{
    const o = document.createElement('option');
    o.value = o.textContent = n;
    presetList.appendChild(o);
  });
}

function applyPreset(name){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  const cfg = all[name]; if(!cfg) return;
  Object.entries(cfg).forEach(([k,v])=>{
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    if(el.type === 'checkbox') el.checked = v;
    else el.value = v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}

function deleteCurrentPreset(){
  const name = presetList.value;
  if(!name) return;
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[name];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresetList();
}

function gatherSettings(){
  return {
    'bg-color': bgColorIn.value,
    'bg-fit': bgFitIn.value,
    'sync-bg': syncBg.checked,
    'bar-color': barColorIn.value,
    'prog-text': progTextIn.value,
    'sync-prog-text': syncProgTxt.checked,
    'title-color': titleColorIn.value,
    'album-color': albumColorIn.value,
    'artist-color': artistColorIn.value,
    'title': titleSizeIn.value,
    'album': albumSizeIn.value,
    'artist': artistSizeIn.value,
    'radius': radiusIn.value
  };
}

// ───────── Spotify Auth & Fetch ─────────────
function setupAuth(){
  if(!token && location.hash){
    const h = Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token = h.access_token; document.cookie = `access_token=${token};path=/`;
    history.replaceState({},'',location.pathname);
  }
  if(token){
    loginC.style.display='none';
    mediaD.classList.add('active');
    startFetch();
  } else {
    loginC.style.display='flex';
    mediaD.classList.remove('active');
    loginBtn.onclick = ()=>{
      location.href =
        `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}`+
        `&scope=${SCOPES.join('%20')}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
  }
}

function startFetch(){
  fetchNow(); setInterval(fetchNow,100);
}

async function fetchNow(){
  try{
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!res.ok) return;
    const d = await res.json();
    if(d.currently_playing_type==='ad') return;
    const i = d.item, p = d.progress_ms, du = i.duration_ms;
    coverArt.src = i.album.images[0].url;
    titleE.textContent = i.name;
    albumE.textContent = i.album.name;
    artistE.textContent = i.artists.map(a=>a.name).join(', ');
    const fmt = ms=>`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent = fmt(p);
    timeRem.textContent = `-${fmt(du-p)}`;
    progBar.style.width = `${(p/du)*100}%`;
    coverArt.onclick = ()=> window.open(i.external_urls.spotify,'_blank');
  }catch{}
}

function getCookie(n){
  return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]||null;
}
