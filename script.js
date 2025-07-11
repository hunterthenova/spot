// script.js
// --- Element refs ---
const loginC      = document.getElementById('login-container');
const loginB      = document.getElementById('login-btn');
const mediaD      = document.getElementById('media-display');
const cover       = document.getElementById('cover-art');
const titleE      = document.getElementById('title');
const albumE      = document.getElementById('album');
const artistE     = document.getElementById('artist');
const timeEl      = document.getElementById('time-elapsed');
const timeRem     = document.getElementById('time-remaining');
const progBar     = document.getElementById('progress-bar');
const menuB       = document.getElementById('menu-btn');
const side        = document.getElementById('sidebar');
const fullB       = document.getElementById('fullscreen-btn');

// --- Controls ---
const bgColorIn    = document.getElementById('bg-color');
const bgFitIn      = document.getElementById('bg-fit');
const syncBg       = document.getElementById('sync-bg');
const smartBg      = document.getElementById('smart-bg');
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
const smartToggles = [...document.querySelectorAll('.smart-toggle')];

// Presets
const presetName   = document.getElementById('preset-name');
const savePreset   = document.getElementById('save-preset');
const presetList   = document.getElementById('preset-list');
const deletePreset = document.getElementById('delete-preset');
const resetBtn     = document.getElementById('reset-defaults');

// State
let smartModeEnabled = false;

// Spotify creds
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token        = getCookie('access_token');

// Init
initUI();
setupAuth();

function initUI(){
  menuB.onclick = ()=> side.classList.toggle('open');
  document.addEventListener('click', e=>{
    if(!side.contains(e.target) && !menuB.contains(e.target))
      side.classList.remove('open');
  });

  fullB.onclick = ()=> {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', ()=>{
    if(document.fullscreenElement) side.classList.remove('open');
  });

  // Background
  bgColorIn.oninput = ()=> updateCSS('--bg-color', bgColorIn.value, 'bg-color');
  bgFitIn.onchange  = ()=> updateCSS('--bg-fit', bgFitIn.value, 'bg-fit');
  syncBg.onchange   = ()=>{ if(syncBg.checked) sampleCoverColor('bg'); };

  // Bar & progress text
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
      document.documentElement.style.setProperty(varName, varName==='--radius'? v+'px': v+'px');
      saveTemp(key, v);
    }
    slider.oninput = ()=> apply(slider.value);
    num.oninput    = ()=> apply(num.value);
  });

  // Smart mode
  smartBtn.onclick = ()=> smartModeEnabled = !smartModeEnabled;

  // Presets
  savePreset.onclick   = saveCurrentPreset;
  presetList.onchange  = ()=> applyPreset(presetList.value);
  deletePreset.onclick = deleteCurrentPreset;
  resetBtn.onclick     = ()=>{ if(confirm('Reset all settings?')) localStorage.clear(), location.reload(); };

  applyStored(); loadPresets();
}

function updateCSS(prop,val,key){
  document.documentElement.style.setProperty(prop,val);
  saveTemp(key,val);
}
function saveTemp(k,v){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[k]=v; localStorage.setItem('spotifyTemp',JSON.stringify(t));
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

// Smart Mode sampling
function sampleCoverColor(target){
  const img=new Image(); img.crossOrigin='Anonymous'; img.src=cover.src;
  img.onload=()=>{
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
    const ctx=c.getContext('2d'); ctx.drawImage(img,0,0);
    let r=0,g=0,b=0,count=0;
    for(let y=0;y<img.height;y+=10){
      for(let x=0;x<img.width;x+=10){
        const d=ctx.getImageData(x,y,1,1).data;
        r+=d[0]; g+=d[1]; b+=d[2]; count++;
      }
    }
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
    const main=rgbToHex(r,g,b), comp=rgbToHex(255-r,255-g,255-b);
    if(smartModeEnabled){
      smartToggles.forEach(chk=>{
        if(chk.checked){
          const t=chk.dataset.type;
          if(t==='bar') barColorIn.value=main, barColorIn.dispatchEvent(new Event('input'));
          if(t==='text') progTextIn.value=comp, progTextIn.dispatchEvent(new Event('input'));
          if(t==='title') titleColorIn.value=comp, titleColorIn.dispatchEvent(new Event('input'));
          if(t==='album') albumColorIn.value=comp, albumColorIn.dispatchEvent(new Event('input'));
          if(t==='artist') artistColorIn.value=comp, artistColorIn.dispatchEvent(new Event('input'));
        }
      });
    }
    if(syncBg.checked || target==='bg' || smartBg.checked){
      bgColorIn.value=main; bgColorIn.dispatchEvent(new Event('input'));
    }
  };
}

function rgbToHex(r,g,b){
  const to=v=>v.toString(16).padStart(2,'0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Presets
function saveCurrentPreset(){
  const name = presetName.value.trim(); if(!name) return alert('Enter name');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets(); presetName.value='';
}
function loadPresets(){
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  presetList.innerHTML='';
  Object.keys(all).forEach(n=>{
    const o=document.createElement('option'); o.value=o.textContent=n; presetList.appendChild(o);
  });
}
function applyPreset(name){
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  const cfg=all[name]; if(!cfg) return;
  Object.entries(cfg).forEach(([k,v])=>{
    const el=document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    if(el.type==='checkbox') el.checked=v;
    else el.value=v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}
function deleteCurrentPreset(){
  const name=presetList.value; if(!name) return;
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[name];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
}
function gatherSettings(){
  const o={};
  ['bg-color','bg-fit','bar-color','prog-text','title-color','album-color','artist-color','title-size','album-size','artist-size','radius']
    .forEach(k=>{ const el=document.getElementById(k.replace(/-/g,'-')); if(el) o[k]=el.type==='checkbox'?el.checked:el.value; });
  ['sync-bg','smart-bg','sync-prog-text'].forEach(k=>o[k]=!!document.getElementById(k).checked);
  return o;
}

// Spotify auth & fetching
function setupAuth(){
  if(!token && location.hash){
    const h=Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token=h.access_token; document.cookie=`access_token=${token};path=/`;
    history.replaceState({},'',location.pathname);
  }
  if(token){
    loginC.hidden=true;
    mediaD.hidden=false;
    startFetch();
  } else {
    loginC.hidden=false;
    mediaD.hidden=true;
    loginB.onclick=()=> location.href=
      `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}`+
      `&scope=${SCOPES.join('%20')}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
  }
}

function startFetch(){
  fetchNow();
  setInterval(()=>{
    fetchNow();
    if(smartModeEnabled) sampleCoverColor();
  },100);
}

async function fetchNow(){
  try{
    const res=await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!res.ok) return;
    const d=await res.json();
    if(d.currently_playing_type==='ad') return;
    const i=d.item, p=d.progress_ms, du=i.duration_ms;
    cover.src = i.album.images[0].url;
    titleE.textContent  = i.name;
    albumE.textContent  = i.album.name;
    artistE.textContent = i.artists.map(a=>a.name).join(', ');
    const fmt=ms=>`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent  = fmt(p);
    timeRem.textContent = `-${fmt(du-p)}`;
    progBar.style.width = `${(p/du)*100}%`;
    cover.onclick = ()=> window.open(i.external_urls.spotify,'_blank');
  }catch{}
}

function getCookie(n){
  return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]||null;
}
