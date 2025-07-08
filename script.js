// Refs
const loginC = document.getElementById('login-container');
const loginB = document.getElementById('login-btn');
const media   = document.getElementById('media-display');
const cover   = document.getElementById('cover-art');
const titleE  = document.getElementById('title');
const albumE  = document.getElementById('album');
const artistE = document.getElementById('artist');
const progBar = document.getElementById('progress-bar');
const menuB   = document.getElementById('menu-btn');
const side    = document.getElementById('sidebar');
const fullB   = document.getElementById('fullscreen-btn');

// Controls
const toggles    = [...document.querySelectorAll('.opt-toggle')];
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
const nameI      = document.getElementById('preset-name');
const saveB      = document.getElementById('save-preset');
const listP      = document.getElementById('preset-list');
const delB       = document.getElementById('delete-preset');
const resetB     = document.getElementById('reset-defaults');

// Value spans
const valMap = {
  title: document.getElementById('opt-title-val'),
  album: document.getElementById('opt-album-val'),
  artist:document.getElementById('opt-artist-val'),
  radius:document.getElementById('opt-radius-val')
};

// Spotify creds
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token       = getCookie('access_token');

// Init
setupUI();
setupSpotify();

// ──────────────────────────────────────────
function setupUI(){
  // Sidebar toggle
  menuB.onclick = ()=> side.classList.toggle('open');
  document.addEventListener('click', e=>{
    if(!side.contains(e.target)&&!menuB.contains(e.target)) side.classList.remove('open');
  });

  // Fullscreen
  fullB.onclick = ()=> {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', ()=>{
    if(document.fullscreenElement) side.classList.remove('open');
  });

  // Toggles
  toggles.forEach(chk=>{
    chk.onchange = ()=>{
      document.querySelector(chk.dataset.target).style.display = chk.checked?'':'none';
      saveTemp(chk.dataset.target, chk.checked);
    };
  });

  // Colors
  barColor.oninput   = ()=> updateCSS('--barColor', barColor.value, 'barColor');
  titleColor.oninput = ()=> { titleE.style.color = titleColor.value; saveTemp('titleColor', titleColor.value); };
  albumColor.oninput = ()=> { albumE.style.color = albumColor.value; saveTemp('albumColor', albumColor.value); };
  artistColor.oninput= ()=> { artistE.style.color = artistColor.value; saveTemp('artistColor', artistColor.value); };

  // Sizes & radius
  [[titleSize,'title',titleE],
   [albumSize,'album',albumE],
   [artistSize,'artist',artistE]]
  .forEach(([sl,key,el])=>{
    sl.oninput = ()=>{
      const px = sl.value+'px';
      el.style.fontSize = px;
      valMap[key].textContent = px;
      saveTemp(key+'Size', sl.value);
    };
  });
  radius.oninput = ()=>{
    const r = radius.value+'px';
    updateCSS('--radius', r, 'radius');
    valMap.radius.textContent = r;
  };

  // Background
  bgUrl.onchange = ()=> {
    document.body.style.backgroundImage = bgUrl.value?`url(${bgUrl.value})`:'none';
    saveTemp('bgUrl', bgUrl.value);
  };
  bgFit.onchange = ()=> {
    document.body.style.backgroundSize = bgFit.value;
    saveTemp('bgFit', bgFit.value);
  };

  // Presets
  saveB.onclick = ()=>{
    const n = nameI.value.trim();
    if(!n) return alert('Name it');
    const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
    all[n] = gather(); localStorage.setItem('spotifyPresets', JSON.stringify(all));
    loadList(); nameI.value='';
  };
  listP.onchange = ()=> apply(JSON.parse(localStorage.getItem('spotifyPresets')||'{}')[listP.value]||{});
  delB.onclick = ()=>{
    const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
    delete all[listP.value];
    localStorage.setItem('spotifyPresets', JSON.stringify(all));
    loadList();
  };
  resetB.onclick = ()=> localStorage.clear()||location.reload();

  // Apply stored & presets
  apply(JSON.parse(localStorage.getItem('spotifyTemp')||'{}'));
  loadList();
}

// ──────────────────────────────────────────
function updateCSS(prop,val,key){
  document.documentElement.style.setProperty(prop,val);
  saveTemp(key,val);
}
function saveTemp(k,v){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[k]=v; localStorage.setItem('spotifyTemp', JSON.stringify(t));
}
function gather(){
  const o = {};
  o.barColor = barColor.value;
  o.titleColor = titleColor.value;
  o.albumColor = albumColor.value;
  o.artistColor= artistColor.value;
  o.titleSize = titleSize.value;
  o.albumSize = albumSize.value;
  o.artistSize= artistSize.value;
  o.radius    = radius.value+'px';
  o.bgUrl     = bgUrl.value;
  o.bgFit     = bgFit.value;
  toggles.forEach(chk=> o[chk.dataset.target] = chk.checked);
  return o;
}
function apply(cfg){
  if(cfg.barColor) updateCSS('--barColor',cfg.barColor,'barColor');
  if(cfg.radius)   updateCSS('--radius',cfg.radius,'radius');
  if(cfg.titleColor) { titleColor.value=cfg.titleColor; titleE.style.color=cfg.titleColor; }
  if(cfg.albumColor) { albumColor.value=cfg.albumColor; albumE.style.color=cfg.albumColor; }
  if(cfg.artistColor){ artistColor.value=cfg.artistColor; artistE.style.color=cfg.artistColor; }
  if(cfg.titleSize) { titleSize.value=cfg.titleSize; titleE.style.fontSize=cfg.titleSize+'px'; valMap.title.textContent=cfg.titleSize+'px'; }
  if(cfg.albumSize) { albumSize.value=cfg.albumSize; albumE.style.fontSize=cfg.albumSize+'px'; valMap.album.textContent=cfg.albumSize+'px'; }
  if(cfg.artistSize){ artistSize.value=cfg.artistSize; artistE.style.fontSize=cfg.artistSize+'px'; valMap.artist.textContent=cfg.artistSize+'px'; }
  if(cfg.bgUrl!==undefined){ bgUrl.value=cfg.bgUrl; document.body.style.backgroundImage=cfg.bgUrl?`url(${cfg.bgUrl})`:'none'; }
  if(cfg.bgFit) { bgFit.value=cfg.bgFit; document.body.style.backgroundSize=cfg.bgFit; }
  toggles.forEach(chk=>{
    if(cfg[chk.dataset.target]!==undefined){
      chk.checked = cfg[chk.dataset.target];
      document.querySelector(chk.dataset.target).style.display = chk.checked?'':'none';
    }
  });
}
function loadList(){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  listP.innerHTML='<option>-- Load --</option>';
  Object.keys(all).forEach(n=>{
    const o = document.createElement('option');
    o.value=o.textContent=n;
    listP.append(o);
  });
}

// ──────────────────────────────────────────
function setupSpotify(){
  // Auth
  if(!token && location.hash){
    const h = Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token = h.access_token;
    document.cookie = `access_token=${token}; path=/;`;
    history.replaceState({},'',location.pathname);
  }
  if(token){
    loginC.hidden=true;
    media.hidden=false;
    start();
  } else {
    loginC.hidden=false;
    media.hidden=true;
    loginB.onclick = ()=>{
      location.href = `https://accounts.spotify.com/authorize?response_type=token`
        +`&client_id=${CLIENT_ID}`
        +`&scope=${SCOPES.join('%20')}`
        +`&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
  }
}

// ──────────────────────────────────────────
function start(){
  fetchNow();
  setInterval(fetchNow,100);
}
async function fetchNow(){
  try {
    const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!r.ok) throw 0;
    const d = await r.json();
    if(d.currently_playing_type==='ad') return;
    const itm = d.item, prog=d.progress_ms, dur=itm.duration_ms;
    cover.src = itm.album.images[0].url;
    titleE.textContent  = itm.name;
    albumE.textContent  = itm.album.name;
    artistE.textContent = itm.artists.map(a=>a.name).join(', ');
    progBar.style.width = `${(prog/dur)*100}%`;
    cover.onclick = ()=> window.open(itm.external_urls.spotify,'_blank');
  } catch{}
}

// ──────────────────────────────────────────
function getCookie(n){
  const c=document.cookie.split('; ').find(r=>r.startsWith(n+'='));
  return c?c.split('=')[1]:null;
}
