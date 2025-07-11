// script.js
// --- Spotify creds/state ---
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token        = getCookie('access_token');

// --- UI Refs ---
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

// --- Control Refs ---
const bgColorIn     = document.getElementById('bg-color');
const bgFitIn       = document.getElementById('bg-fit');
const syncBg        = document.getElementById('sync-bg');
const smartBg       = document.getElementById('smart-bg');
const barColorIn    = document.getElementById('bar-color');
const progTextIn    = document.getElementById('prog-text-color');
const syncProgTxt   = document.getElementById('sync-prog-text');
const smartBar      = document.getElementById('smart-bar');
const smartText     = document.getElementById('smart-text');
const titleColorIn  = document.getElementById('title-color');
const albumColorIn  = document.getElementById('album-color');
const artistColorIn = document.getElementById('artist-color');
const smartTitle    = document.getElementById('smart-text-title');
const smartAlbum    = document.getElementById('smart-text-album');
const smartArtist   = document.getElementById('smart-text-artist');
const smartAll      = document.getElementById('smart-all');

const presetName    = document.getElementById('preset-name');
const savePresetBtn = document.getElementById('save-preset');
const presetList    = document.getElementById('preset-list');
const deletePreset  = document.getElementById('delete-preset');
const resetBtn      = document.getElementById('reset-defaults');

// --- Init ---
initUI();
setupAuth();

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
  syncBg.onchange = ()=>{ if(syncBg.checked) sampleCoverColor('bg'); };
  smartBg.onchange = ()=>{ if(smartBg.checked) smartAll.checked = false; };

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
    if(syncProgTxt.checked){
      progTextIn.value = barColorIn.value;
      progTextIn.dispatchEvent(new Event('input'));
    }
  };
  smartBar.onchange  = ()=>{ if(smartBar.checked) smartAll.checked = false; };
  smartText.onchange = ()=>{ if(smartText.checked) smartAll.checked = false; };
  smartTitle.onchange = ()=>{ if(smartTitle.checked) smartAll.checked = false; };
  smartAlbum.onchange = ()=>{ if(smartAlbum.checked) smartAll.checked = false; };
  smartArtist.onchange = ()=>{ if(smartArtist.checked) smartAll.checked = false; };
  smartAll.onchange  = ()=>{
    const all = smartAll.checked;
    [smartBg, smartBar, smartText, smartTitle, smartAlbum, smartArtist]
      .forEach(chk=> chk.checked = all);
  };

  // Title/Album/Artist colors
  titleColorIn.oninput  = ()=> updateCSSVar('--title-color', titleColorIn.value,'title-color');
  albumColorIn.oninput  = ()=> updateCSSVar('--album-color', albumColorIn.value,'album-color');
  artistColorIn.oninput = ()=> updateCSSVar('--artist-color', artistColorIn.value,'artist-color');

  // Presets
  savePresetBtn.onclick = saveCurrentPreset;
  presetList.onchange  = ()=> applyPreset(presetList.value);
  deletePreset.onclick = deleteCurrentPreset;
  resetBtn.onclick     = ()=>{ if(confirm('Reset all settings?')) localStorage.clear(), location.reload(); };

  // Load stored & presets
  applyStored();
  loadPresetList();
}

function updateCSSVar(name,val,key){
  document.documentElement.style.setProperty(name,val);
  saveTemp(key,val);
}
function saveTemp(k,v){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[k] = v; localStorage.setItem('spotifyTemp', JSON.stringify(t));
}
function applyStored(){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  for(let [k,v] of Object.entries(t)){
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(!el) continue;
    if(el.type==='checkbox') el.checked=v;
    else el.value=v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  }
}

// Smart mode on song change
async function fetchNow(){
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!res.ok) return;
    const d = await res.json();
    if(d.currently_playing_type==='ad') return;
    const i = d.item, p=d.progress_ms, du=i.duration_ms;
    coverArt.src = i.album.images[0].url;
    titleE.textContent  = i.name;
    albumE.textContent  = i.album.name;
    artistE.textContent = i.artists.map(a=>a.name).join(', ');
    const fmt = ms=>`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent = fmt(p);
    timeRem.textContent= `-${fmt(du-p)}`;
    progBar.style.width = `${(p/du)*100}%`;
    coverArt.onclick = ()=> window.open(i.external_urls.spotify,'_blank');

    // re-run smart-mode if enabled
    if(smartAll.checked || smartBg.checked || smartBar.checked || smartText.checked ||
       smartTitle.checked || smartAlbum.checked || smartArtist.checked){
      applySmartMode();
    }
  } catch {}
}

// Smart‑Mode palette extraction
function applySmartMode(){
  const img = new Image(); img.crossOrigin='Anonymous'; img.src = coverArt.src;
  img.onload = ()=>{
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    let [r,g,b,count] = [0,0,0,0];
    for(let y=0;y<img.height;y+=Math.floor(img.height/10)){
      for(let x=0;x<img.width;x+=Math.floor(img.width/10)){
        const idx = (y*img.width + x)*4;
        const d = ctx.getImageData(x,y,1,1).data;
        r+=d[0]; g+=d[1]; b+=d[2]; count++;
      }
    }
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
    const main = rgbToHex(r,g,b);
    const comp = rgbToHex(255-r,255-g,255-b);

    if(smartAll.checked || smartBg.checked){
      document.documentElement.style.setProperty('--bg-color', main);
      saveTemp('bg-color', main);
      if(smartBg.checked) bgColorIn.value = main;
    }
    if(smartAll.checked || smartBar.checked){
      barColorIn.value = main; barColorIn.dispatchEvent(new Event('input'));
    }
    if(smartAll.checked || smartText.checked){
      progTextIn.value = comp; progTextIn.dispatchEvent(new Event('input'));
    }
    if(smartAll.checked || smartTitle.checked){
      titleColorIn.value = comp; titleColorIn.dispatchEvent(new Event('input'));
    }
    if(smartAll.checked || smartAlbum.checked){
      albumColorIn.value = comp; albumColorIn.dispatchEvent(new Event('input'));
    }
    if(smartAll.checked || smartArtist.checked){
      artistColorIn.value = comp; artistColorIn.dispatchEvent(new Event('input'));
    }
  };
}

function rgbToHex(r,g,b){
  const h = v=>v.toString(16).padStart(2,'0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Presets
function saveCurrentPreset(){
  const name = presetName.value.trim(); if(!name) return alert('Name it');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresetList(); presetName.value='';
}
function loadPresetList(){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  presetList.innerHTML='';
  Object.keys(all).forEach(n=>{
    const o=document.createElement('option'); o.value=o.textContent=n;
    presetList.appendChild(o);
  });
}
function applyPreset(name){
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  const cfg=all[name]; if(!cfg) return;
  Object.entries(cfg).forEach(([k,v])=>{
    const el=document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    el.type==='checkbox' ? el.checked=v : el.value=v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}
function deleteCurrentPreset(){
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[presetList.value];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresetList();
}
function gatherSettings(){
  const o={};
  [
    'bg-color','bg-fit','sync-bg','smart-bg',
    'bar-color','prog-text','sync-prog-text','smart-bar','smart-text',
    'title-color','album-color','artist-color',
    'smart-text-title','smart-text-album','smart-text-artist','smart-all'
  ].forEach(k=>{
    const el=document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    o[k] = el.type==='checkbox' ? el.checked : el.value;
  });
  return o;
}

// Auth + fetch
function setupAuth(){
  if(!token && location.hash){
    const h=Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token = h.access_token; document.cookie=`access_token=${token};path=/`;
    history.replaceState({},'',location.pathname);
  }
  if(token){
    loginC.style.display='none';
    mediaD.classList.add('active');
    startFetch();
  } else {
    loginC.style.display='flex';
    mediaD.classList.remove('active');
    loginBtn.onclick=()=>{
      location.href =
        `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}`+
        `&scope=${SCOPES.join('%20')}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
  }
}
function startFetch(){ fetchNow(); setInterval(fetchNow,100); }
async function fetchNow(){ /* as above, calls applySmartMode */ }

// Utility
function getCookie(n){
  return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]||null;
}
