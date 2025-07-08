// Element refs
const loginC      = document.getElementById('login-container');
const loginBtn    = document.getElementById('login-btn');
const media       = document.getElementById('media-display');
const coverArt    = document.getElementById('cover-art');
const titleElem   = document.getElementById('title');
const albumElem   = document.getElementById('album');
const artistElem  = document.getElementById('artist');
const timeEl      = document.getElementById('time-elapsed');
const timeRem     = document.getElementById('time-remaining');
const progBar     = document.getElementById('progress-bar');
const menuBtn     = document.getElementById('menu-btn');
const sidebar     = document.getElementById('sidebar');
const fullBtn     = document.getElementById('fullscreen-btn');

// Controls
const toggles     = [...document.querySelectorAll('.opt-toggle')];
const barColor    = document.getElementById('opt-bar-color');
const titleColor  = document.getElementById('opt-title-color');
const albumColor  = document.getElementById('opt-album-color');
const artistColor = document.getElementById('opt-artist-color');
const titleSize   = document.getElementById('opt-title-size');
const albumSize   = document.getElementById('opt-album-size');
const artistSize  = document.getElementById('opt-artist-size');
const radius      = document.getElementById('opt-radius');
const bgUrl       = document.getElementById('opt-bg-url');
const bgColor     = document.getElementById('opt-bg-color');
const syncColor   = document.getElementById('opt-sync-color');
const bgFit       = document.getElementById('opt-bg-fit');
const titleNum    = document.getElementById('opt-title-num');
const albumNum    = document.getElementById('opt-album-num');
const artistNum   = document.getElementById('opt-artist-num');
const radiusNum   = document.getElementById('opt-radius-num');
const presetName  = document.getElementById('preset-name');
const saveBtn     = document.getElementById('save-preset');
const presetList  = document.getElementById('preset-list');
const delBtn      = document.getElementById('delete-preset');
const resetBtn    = document.getElementById('reset-defaults');

// Spotify creds
const CLIENT_ID   = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT    = 'https://spotify.huntersdesigns.com/';
const SCOPES      = ['user-read-currently-playing','user-read-playback-state'];
let accessToken   = getCookie('access_token');

// Init
initUI();
setupAuth();

function initUI() {
  // Sidebar toggle
  menuBtn.onclick = ()=> sidebar.classList.toggle('open');
  document.addEventListener('click', e=>{
    if(!sidebar.contains(e.target)&&!menuBtn.contains(e.target))
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

  // Toggles
  toggles.forEach(chk => chk.onchange = ()=> {
    document.querySelector(chk.dataset.target).style.display = chk.checked?'':'none';
    saveTemp(chk.dataset.target, chk.checked);
  });

  // Color inputs
  barColor.oninput   = ()=> updateCSS('--barColor', barColor.value, 'barColor');
  titleColor.oninput = ()=> (titleElem.style.color=titleColor.value, saveTemp('titleColor', titleColor.value));
  albumColor.oninput = ()=> (albumElem.style.color=albumColor.value, saveTemp('albumColor', albumColor.value));
  artistColor.oninput= ()=> (artistElem.style.color=artistColor.value, saveTemp('artistColor', artistColor.value));
  bgColor.oninput    = ()=> {
    document.body.style.backgroundColor = bgColor.value;
    saveTemp('bgColor', bgColor.value);
  };

  // Size & number sync
  [[titleSize,titleNum,titleElem,'titleSize'],
   [albumSize,albumNum,albumElem,'albumSize'],
   [artistSize,artistNum,artistElem,'artistSize'],
   [radius,radiusNum,null,'radius']]
  .forEach(([slider,input,elem,key])=>{
    const sync = val => {
      if(elem) elem.style.fontSize = val+'px';
      slider.value = input.value = val;
      if(key==='radius') document.documentElement.style.setProperty('--radius', val+'px');
      if(key!=='radius') saveTemp(key, val);
      if(key==='radius') saveTemp('radius', val);
    };
    slider.oninput = ()=> sync(slider.value);
    input.oninput  = ()=> sync(input.value);
  });

  // Radius CSS var
  if(localStorage.getItem('spotifyTemp')) {
    const tmp = JSON.parse(localStorage.getItem('spotifyTemp'));
    if(tmp.radius) document.documentElement.style.setProperty('--radius', tmp.radius+'px');
  }

  // Background image/color
  bgUrl.onchange = ()=> {
    if(bgUrl.value) {
      document.body.style.backgroundImage = `url(${bgUrl.value})`;
      saveTemp('bgUrl', bgUrl.value);
    } else {
      document.body.style.backgroundImage = '';
      saveTemp('bgUrl','');
    }
  };
  bgFit.onchange = ()=> (document.body.style.backgroundSize=bgFit.value, saveTemp('bgFit', bgFit.value));

  // Sync color from cover corner
  syncColor.onchange = ()=> {
    if(syncColor.checked && coverArt.src) sampleCoverColor();
  };
  coverArt.onload = ()=> { if(syncColor.checked) sampleCoverColor(); };

  // Presets
  saveBtn.onclick = ()=> {
    const n = presetName.value.trim(); if(!n) return alert('Name your preset');
    const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
    all[n] = gatherSettings(); localStorage.setItem('spotifyPresets', JSON.stringify(all));
    loadPresets(); presetName.value='';
  };
  presetList.onchange = ()=> applySettings(JSON.parse(localStorage.getItem('spotifyPresets')||'{}')[presetList.value]||{});
  delBtn.onclick = ()=> {
    if(presetList.value==='Default') return;
    const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}'); delete all[presetList.value];
    localStorage.setItem('spotifyPresets', JSON.stringify(all)); loadPresets();
  };
  resetBtn.onclick = ()=> {
    if(confirm('Are you sure you want to reset all settings?')) {
      localStorage.clear(); location.reload();
    }
  };

  // Load defaults & presets
  applySettings(JSON.parse(localStorage.getItem('spotifyTemp')||'{}'));
  loadPresets();
  // Add default preset if missing
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  if(!all.Default) {
    all.Default = gatherSettings();
    localStorage.setItem('spotifyPresets', JSON.stringify(all));
    loadPresets();
  }
}

function updateCSS(prop, val, key) {
  document.documentElement.style.setProperty(prop, val);
  saveTemp(key, val);
}

function saveTemp(k, v) {
  const tmp = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  tmp[k] = v; localStorage.setItem('spotifyTemp', JSON.stringify(tmp));
}

function gatherSettings() {
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
    bgColor: bgColor.value,
    syncColor: syncColor.checked,
    '#cover-art': toggles[0].checked,
    '#details': toggles[1].checked,
    '#progress-container': toggles[2].checked
  };
}

function applySettings(cfg) {
  if(cfg.barColor) updateCSS('--barColor', cfg.barColor, 'barColor');
  if(cfg.titleColor) titleElem.style.color=cfg.titleColor;
  if(cfg.albumColor) albumElem.style.color=cfg.albumColor;
  if(cfg.artistColor) artistElem.style.color=cfg.artistColor;
  if(cfg.titleSize) titleSize.value=cfg.titleNum.value=cfg.titleSize, titleElem.style.fontSize=cfg.titleSize+'px';
  if(cfg.albumSize) albumSize.value=albumNum.value=cfg.albumSize, albumElem.style.fontSize=cfg.albumSize+'px';
  if(cfg.artistSize) artistSize.value=artistNum.value=cfg.artistSize, artistElem.style.fontSize=cfg.artistSize+'px';
  if(cfg.radius) radius.value=radiusNum.value=cfg.radius, document.documentElement.style.setProperty('--radius', cfg.radius+'px');
  if(cfg.bgUrl!==undefined) document.body.style.backgroundImage=cfg.bgUrl?`url(${cfg.bgUrl})`:'';
  if(cfg.bgFit) document.body.style.backgroundSize=cfg.bgFit;
  if(cfg.bgColor) document.body.style.backgroundColor=cfg.bgColor;
  if(cfg.syncColor!==undefined) syncColor.checked=cfg.syncColor;
  toggles.forEach(chk=>{
    if(cfg[chk.dataset.target]!==undefined) {
      chk.checked=cfg[chk.dataset.target];
      document.querySelector(chk.dataset.target).style.display=cfg[chk.dataset.target]?'': 'none';
    }
  });
}

function loadPresets() {
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  presetList.innerHTML = '';
  Object.keys(all).forEach(n=>{
    const o=document.createElement('option');o.value=o.textContent=n; presetList.appendChild(o);
  });
}

// Color sampling
function sampleCoverColor() {
  const img=new Image(); img.crossOrigin='Anonymous'; img.src=coverArt.src;
  img.onload = ()=>{
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
    const ctx=c.getContext('2d'); ctx.drawImage(img,0,0);
    const data=ctx.getImageData(img.width-1,0,1,1).data;
    const hex = `#${data[0].toString(16).padStart(2,'0')}${data[1].toString(16).padStart(2,'0')}${data[2].toString(16).padStart(2,'0')}`;
    bgColor.value=hex; document.body.style.backgroundColor=hex; saveTemp('bgColor',hex);
  };
}

// Spotify auth & fetch
function setupAuth() {
  if(!accessToken && location.hash) {
    const h=Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    accessToken=h.access_token; history.replaceState({},'',location.pathname);
  }
  if(accessToken) {
    loginC.hidden=true; media.hidden=false; startFetching();
  } else {
    loginC.hidden=false; media.hidden=true;
    loginBtn.onclick=()=> location.href =
      `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}`+
      `&scope=${SCOPES.join('%20')}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
  }
}

function startFetching() {
  fetchNow(); setInterval(fetchNow,100);
}

async function fetchNow() {
  try {
    const res=await fetch('https://api.spotify.com/v1/me/player/currently-playing',{headers:{Authorization:`Bearer ${accessToken}`}});
    if(!res.ok) return;
    const d=await res.json(); if(d.currently_playing_type==='ad') return;
    const item=d.item, prog=d.progress_ms, dur=item.duration_ms;
    coverArt.src=item.album.images[0].url;
    titleElem.textContent=item.name;
    albumElem.textContent=item.album.name;
    artistElem.textContent=item.artists.map(a=>a.name).join(', ');
    const fmt = ms=>`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent=fmt(prog);
    timeRem.textContent=`-${fmt(dur-prog)}`;
    progBar.style.width=`${(prog/dur)*100}%`;
    coverArt.onclick=()=>window.open(item.external_urls.spotify,'_blank');
  } catch{}
}

function getCookie(n){return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]||null;}
