// --- Element refs ---
const loginC      = document.getElementById('login-container');
const loginB      = document.getElementById('login-btn');
const mediaD      = document.getElementById('media-display');
const coverArt    = document.getElementById('cover-art');
const titleE      = document.getElementById('title');
const albumE      = document.getElementById('album');
const artistE     = document.getElementById('artist');
const timeEl      = document.getElementById('time-elapsed');
const timeRem     = document.getElementById('time-remaining');
const progBar     = document.getElementById('progress-bar');
const menuB       = document.getElementById('menu-btn');
const side        = document.getElementById('sidebar');
const fullB       = document.getElementById('fullscreen-btn');

// --- Control refs ---
const bgColorIn    = document.getElementById('bg-color');
const bgFitIn      = document.getElementById('bg-fit');
const syncBg       = document.getElementById('sync-bg');
const smartBg      = document.getElementById('smart-bg');
const barColorIn   = document.getElementById('bar-color');
const progTextIn   = document.getElementById('prog-text');
const syncProgTxt  = document.getElementById('sync-prog');
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
const smartToggles = [...document.querySelectorAll('.smart-toggle')];

// --- Preset refs ---
const presetName   = document.getElementById('preset-name');
const savePreset   = document.getElementById('save-preset');
const presetList   = document.getElementById('preset-list');
const deletePreset = document.getElementById('delete-preset');
const resetBtn     = document.getElementById('reset-defaults');

// --- State & Spotify creds ---
let smartEnabled = false;
let accessToken  = getCookie('access_token');
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];

// Initialize
initUI();
setupAuth();

function initUI(){
  // Sidebar toggle
  menuB.onclick = ()=> side.classList.toggle('open');
  document.addEventListener('click', e=>{
    if(!side.contains(e.target) && !menuB.contains(e.target))
      side.classList.remove('open');
  });
  // Fullscreen
  fullB.onclick = ()=> {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', ()=>{
    if(document.fullscreenElement) side.classList.remove('open');
  });
  // Background controls
  bgColorIn.oninput = ()=> updateCSS('--bg-color', bgColorIn.value, 'bg-color');
  bgFitIn.onchange  = ()=> updateCSS('--bg-fit', bgFitIn.value, 'bg-fit');
  syncBg.onchange   = ()=>{ if(syncBg.checked) sampleCover('bg'); };
  // Bar & text
  barColorIn.oninput = ()=>{
    updateCSS('--bar-color', barColorIn.value, 'bar-color');
    if(syncProgTxt.checked) progTextIn.dispatchEvent(new Event('input'));
  };
  progTextIn.oninput = ()=> updateCSS('--prog-text', progTextIn.value, 'prog-text');
  syncProgTxt.onchange = ()=> progTextIn.disabled = syncProgTxt.checked;
  // Title/Album/Artist colors
  titleColorIn.oninput  = ()=> updateCSS('--title-color', titleColorIn.value, 'title-color');
  albumColorIn.oninput  = ()=> updateCSS('--album-color', albumColorIn.value, 'album-color');
  artistColorIn.oninput = ()=> updateCSS('--artist-color', artistColorIn.value, 'artist-color');
  // Sizes & radius
  [[titleSizeIn,titleNumIn,'title-size','--title-size'],
   [albumSizeIn,albumNumIn,'album-size','--album-size'],
   [artistSizeIn,artistNumIn,'artist-size','--artist-size'],
   [radiusIn,radiusNumIn,'radius','--radius']]
  .forEach(([slider,num,key,varName])=>{
    function apply(v){
      slider.value = num.value = v;
      document.documentElement.style.setProperty(varName, v + (varName==='--radius'?'px':'' ) );
      saveTemp(key, v);
    }
    slider.oninput = ()=> apply(slider.value);
    num.oninput    = ()=> apply(num.value);
  });
  // Smart mode
  smartBtn.onclick = ()=> smartEnabled = !smartEnabled;
  // Presets
  savePreset.onclick   = savePresetFn;
  presetList.onchange  = ()=> applyPreset(presetList.value);
  deletePreset.onclick = deletePresetFn;
  resetBtn.onclick     = ()=>{ if(confirm('Reset all settings?')) localStorage.clear(), location.reload(); };
  // Load
  applyStored();
  loadPresetsList();
}

function updateCSS(prop,val,key){
  document.documentElement.style.setProperty(prop, val);
  saveTemp(key,val);
}
function saveTemp(k,v){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[k]=v; localStorage.setItem('spotifyTemp', JSON.stringify(t));
}
function applyStored(){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  Object.entries(t).forEach(([k,v])=>{
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    if(el.type==='checkbox') el.checked = v;
    else el.value = v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}

// Smart color sampling
function sampleCover(target){
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = coverArt.src;
  img.onload = ()=>{
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let r=0,g=0,b=0,count=0;
    for(let y=0;y<img.height; y+=10){
      for(let x=0;x<img.width; x+=10){
        const d = ctx.getImageData(x,y,1,1).data;
        r+=d[0]; g+=d[1]; b+=d[2]; count++;
      }
    }
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
    const main=rgbToHex(r,g,b), comp=rgbToHex(255-r,255-g,255-b);
    if(smartEnabled){
      smartToggles.forEach(ch=>{
        if(ch.checked){
          const t=ch.dataset.type;
          if(t==='bar') barColorIn.value=main, barColorIn.dispatchEvent(new Event('input'));
          if(t==='text') progTextIn.value=comp, progTextIn.dispatchEvent(new Event('input'));
          if(t==='title') titleColorIn.value=comp, titleColorIn.dispatchEvent(new Event('input'));
          if(t==='album') albumColorIn.value=comp, albumColorIn.dispatchEvent(new Event('input'));
          if(t==='artist') artistColorIn.value=comp, artistColorIn.dispatchEvent(new Event('input'));
        }
      });
    }
    if(syncBg.checked || target==='bg' || smartBg.checked){
      bgColorIn.value = main; bgColorIn.dispatchEvent(new Event('input'));
    }
  };
}

function rgbToHex(r,g,b){ const h=v=>v.toString(16).padStart(2,'0'); return `#${h(r)}${h(g)}${h(b)}`; }

// Preset functions
function savePresetFn(){
  const n = presetName.value.trim();
  if(!n) return alert('Enter preset name');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[n] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresetsList(); presetName.value='';
}
function loadPresetsList(){
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
    if(el.type==='checkbox') el.checked = v;
    else el.value = v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}
function deletePresetFn(){
  const name = presetList.value; if(!name) return;
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[name];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresetsList();
}
function gatherSettings(){
  const o={};
  ['bg-color','bg-fit','bar-color','prog-text','title-color','album-color','artist-color','title-size','album-size','artist-size','radius']
    .forEach(k=>{
      const el = document.getElementById(k.replace(/-/g,'-'));
      if(el) o[k] = el.type==='checkbox'?el.checked:el.value;
    });
  ['sync-bg','smart-bg','sync-prog'].forEach(k=>o[k] = !!document.getElementById(k).checked);
  return o;
}

// Spotify auth & player
function setupAuth(){
  if(!accessToken && window.location.hash){
    const h = Object.fromEntries(window.location.hash.slice(1).split('&').map(p=>p.split('=')));
    accessToken = h.access_token;
    document.cookie = `access_token=${accessToken}; path=/`;
    history.replaceState({},'',location.pathname);
  }
  if(accessToken){
    loginC.hidden = true;
    mediaD.hidden = false;
    mediaD.classList.add('active');
    startFetch();
  } else {
    loginC.hidden = false;
    mediaD.hidden = true;
    loginB.onclick = ()=>{
      location.href = `https://accounts.spotify.com/authorize?response_type=token` +
                      `&client_id=${CLIENT_ID}` +
                      `&scope=${SCOPES.join('%20')}` +
                      `&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
  }
}

function startFetch(){
  fetchNow();
  setInterval(()=>{
    fetchNow();
    if(smartEnabled) sampleCover();
  },100);
}

async function fetchNow(){
  try{
    const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if(!r.ok) return;
    const d = await r.json();
    if(d.currently_playing_type==='ad') return;
    const i = d.item, p=d.progress_ms, du=i.duration_ms;
    coverArt.src = i.album.images[0].url;
    titleE.textContent  = i.name;
    albumE.textContent  = i.album.name;
    artistE.textContent = i.artists.map(a=>a.name).join(', ');
    const fmt = ms=>`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent  = fmt(p);
    timeRem.textContent = `-${fmt(du-p)}`;
    progBar.style.width  = `${(p/du)*100}%`;
    coverArt.onclick     = ()=> window.open(i.external_urls.spotify,'_blank');
  }catch{}
}

function getCookie(n){
  return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]||null;
}
