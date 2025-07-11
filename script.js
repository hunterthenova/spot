// Spotify credentials
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token        = getCookie('access_token');

// UI references
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

// Customization refs
const bgColorIn    = document.getElementById('bg-color');
const bgFitIn      = document.getElementById('bg-fit');
const syncBg       = document.getElementById('sync-bg');
const smartBg      = document.getElementById('smart-bg');
const barColorIn   = document.getElementById('bar-color');
const progTextIn   = document.getElementById('prog-text-color');
const syncProgTxt  = document.getElementById('sync-prog-text');
const smartBar     = document.getElementById('smart-bar');
const smartText    = document.getElementById('smart-text');
const titleColorIn = document.getElementById('title-color');
const albumColorIn = document.getElementById('album-color');
const artistColorIn= document.getElementById('artist-color');
const smartTitle   = document.getElementById('smart-title');
const smartAlbum   = document.getElementById('smart-album');
const smartArtist  = document.getElementById('smart-artist');
const smartAll     = document.getElementById('smart-all');

// Preset refs
const presetName    = document.getElementById('preset-name');
const savePresetBtn = document.getElementById('save-preset');
const presetList    = document.getElementById('preset-list');
const deletePreset  = document.getElementById('delete-preset');
const resetBtn      = document.getElementById('reset-defaults');

// Initialize UI and auth
initUI();
setupAuth();

function initUI(){
  // Sidebar toggle
  menuBtn.onclick = () => sidebar.classList.toggle('open');
  document.addEventListener('click', e => {
    if(!sidebar.contains(e.target) && !menuBtn.contains(e.target))
      sidebar.classList.remove('open');
  });

  // Fullscreen toggle
  fullBtn.onclick = () => {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', () => {
    if(document.fullscreenElement) sidebar.classList.remove('open');
  });

  // Background
  bgColorIn.oninput = () => applyCSSVar('--bg-color', bgColorIn.value, 'bg-color');
  bgFitIn.onchange = () => applyCSSVar('--bg-fit', bgFitIn.value, 'bg-fit');
  syncBg.onchange = () => { if(syncBg.checked) sampleCoverColor('bg'); };
  smartBg.onchange = () => { if(smartBg.checked) smartAll.checked = false; };

  // Bar & text colors
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
  smartBar.onchange  = () => { if(smartBar.checked) smartAll.checked = false; };
  smartText.onchange = () => { if(smartText.checked) smartAll.checked = false; };

  // Title/Album/Artist colors
  titleColorIn.oninput  = () => applyCSSVar('--title-color', titleColorIn.value, 'title-color');
  albumColorIn.oninput  = () => applyCSSVar('--album-color', albumColorIn.value, 'album-color');
  artistColorIn.oninput = () => applyCSSVar('--artist-color', artistColorIn.value, 'artist-color');
  smartTitle.onchange   = () => { if(smartTitle.checked) smartAll.checked = false; };
  smartAlbum.onchange   = () => { if(smartAlbum.checked) smartAll.checked = false; };
  smartArtist.onchange  = () => { if(smartArtist.checked) smartAll.checked = false; };
  smartAll.onchange     = () => {
    const val = smartAll.checked;
    [smartBg, smartBar, smartText, smartTitle, smartAlbum, smartArtist]
      .forEach(chk => chk.checked = val);
  };

  // Presets
  savePresetBtn.onclick = savePreset;
  presetList.onchange  = () => applyPreset(presetList.value);
  deletePreset.onclick = deletePresetEntry;
  resetBtn.onclick     = () => {
    if(confirm('Reset all settings?')) localStorage.clear(), location.reload();
  };

  // Load stored
  applyStored();
  loadPresets();
}

function applyCSSVar(name,value,key){
  document.documentElement.style.setProperty(name,value);
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[key] = value;
  localStorage.setItem('spotifyTemp', JSON.stringify(t));
}

function applyStored(){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  for(const [k,v] of Object.entries(t)){
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(!el) continue;
    if(el.type==='checkbox') el.checked = v;
    else el.value = v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  }
}

// Smart‑Mode logic (called on fetch)
function applySmartMode(){
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = coverArt.src;
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img,0,0);
    let r=0,g=0,b=0,count=0;
    for(let y=0;y<img.height;y+=Math.floor(img.height/10)){
      for(let x=0;x<img.width;x+=Math.floor(img.width/10)){
        const d = ctx.getImageData(x,y,1,1).data;
        r+=d[0]; g+=d[1]; b+=d[2]; count++;
      }
    }
    r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
    const main = rgbToHex(r,g,b);
    const comp = rgbToHex(255-r,255-g,255-b);

    if(smartBg.checked || smartAll.checked) {
      applyCSSVar('--bg-color', main, 'bg-color');
      bgColorIn.value = main;
    }
    if(smartBar.checked || smartAll.checked) {
      barColorIn.value = main;
      barColorIn.dispatchEvent(new Event('input'));
    }
    if(smartText.checked || smartAll.checked) {
      progTextIn.value = comp;
      progTextIn.dispatchEvent(new Event('input'));
    }
    if(smartTitle.checked || smartAll.checked) {
      titleColorIn.value = comp;
      titleColorIn.dispatchEvent(new Event('input'));
    }
    if(smartAlbum.checked || smartAll.checked) {
      albumColorIn.value = comp;
      albumColorIn.dispatchEvent(new Event('input'));
    }
    if(smartArtist.checked || smartAll.checked) {
      artistColorIn.value = comp;
      artistColorIn.dispatchEvent(new Event('input'));
    }
  };
}

function rgbToHex(r,g,b){
  const h=v=>v.toString(16).padStart(2,'0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Preset functions
function savePreset(){
  const name = presetName.value.trim();
  if(!name) return alert('Enter a preset name');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
  presetName.value = '';
}

function loadPresets(){
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
  const cfg = all[name];
  if(!cfg) return;
  Object.entries(cfg).forEach(([k,v])=>{
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(!el) return;
    el.type==='checkbox'? el.checked = v : el.value = v;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input'));
  });
}

function deletePresetEntry(){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[presetList.value];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
}

function gatherSettings(){
  const keys = [
    'bg-color','bg-fit','sync-bg','smart-bg',
    'bar-color','prog-text','sync-prog-text','smart-bar','smart-text',
    'title-color','album-color','artist-color','smart-title','smart-album','smart-artist','smart-all'
  ];
  const o = {};
  keys.forEach(k=>{
    const el = document.getElementById(k.replace(/-/g,'-'));
    if(el) o[k] = el.type==='checkbox'? el.checked : el.value;
  });
  return o;
}

// Spotify auth + fetching
function setupAuth(){
  if(!token && location.hash){
    const h = Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token = h.access_token;
    document.cookie = `access_token=${token}; path=/`;
    history.replaceState({},'',location.pathname);
  }
  if(token){
    loginC.style.display = 'none';
    mediaD.classList.add('active');
    startFetch();
  } else {
    loginC.style.display = 'flex';
    mediaD.classList.remove('active');
    loginBtn.onclick = ()=>{
      location.href =
        `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}` +
        `&scope=${SCOPES.join('%20')}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
  }
}

function startFetch(){
  fetchNow();
  setInterval(fetchNow, 100);
}

async function fetchNow(){
  try{
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers: { Authorization: `Bearer ${token}` }
    });
    if(!res.ok) return;
    const d = await res.json();
    if(d.currently_playing_type==='ad') return;
    const i = d.item, p = d.progress_ms, du = i.duration_ms;
    coverArt.src = i.album.images[0].url;
    titleE.textContent  = i.name;
    albumE.textContent  = i.album.name;
    artistE.textContent = i.artists.map(a=>a.name).join(', ');
    const fmt = ms=>`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent  = fmt(p);
    timeRem.textContent = `-${fmt(du-p)}`;
    progBar.style.width = `${(p/du)*100}%`;
    coverArt.onclick    = ()=> window.open(i.external_urls.spotify,'_blank');

    // Apply smart mode dynamically
    if(smartAll.checked || smartBg.checked || smartBar.checked ||
       smartText.checked || smartTitle.checked ||
       smartAlbum.checked || smartArtist.checked){
      applySmartMode();
    }
  }catch{}
}

function getCookie(name){
  const match = document.cookie.split('; ').find(r=>r.startsWith(name+'='));
  return match ? match.split('=')[1] : null;
}
