// script.js
const menuBtn       = document.getElementById('menu-btn');
const sidebar       = document.getElementById('sidebar');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const mediaDisplay  = document.getElementById('media-display');
const coverArt      = document.getElementById('cover-art');
const titleElem     = document.getElementById('title');
const albumElem     = document.getElementById('album');
const artistElem    = document.getElementById('artist');
const progBar       = document.getElementById('progress-bar');
const timeElapsed   = document.getElementById('time-elapsed');
const timeRemaining = document.getElementById('time-remaining');
const loginContainer= document.getElementById('login-container');
const loginBtn      = document.getElementById('login-btn');

// Controls
const opts = {
  barColor:     document.getElementById('opt-bar-color'),
  bgUrl:        document.getElementById('opt-bg-url'),
  bgMode:       document.getElementById('opt-bg-mode'),
  showCover:    document.getElementById('opt-show-cover'),
  showDetails:  document.getElementById('opt-show-details'),
  showProgress: document.getElementById('opt-show-progress'),
  titleColor:   document.getElementById('opt-title-color'),
  titleSize:    document.getElementById('opt-title-size'),
  titleVal:     document.getElementById('opt-title-size-val'),
  albumColor:   document.getElementById('opt-album-color'),
  albumSize:    document.getElementById('opt-album-size'),
  albumVal:     document.getElementById('opt-album-size-val'),
  artistColor:  document.getElementById('opt-artist-color'),
  artistSize:   document.getElementById('opt-artist-size'),
  artistVal:    document.getElementById('opt-artist-size-val'),
  presetName:   document.getElementById('preset-name'),
  presetList:   document.getElementById('preset-list'),
  saveBtn:      document.getElementById('save-preset'),
  deleteBtn:    document.getElementById('delete-preset'),
  resetBtn:     document.getElementById('reset-defaults')
};

// Spotify creds
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/';
const scopes = ['user-read-currently-playing','user-read-playback-state'];
let token = getCookie('access_token');

// INITIALIZE
initSidebar();
loadPresets();
applyStored();
setupSpotify();
startRefreshing();

// SIDEBAR TOGGLE
menuBtn.addEventListener('click', ()=> sidebar.classList.toggle('open'));
document.addEventListener('click', e=>{
  if(!sidebar.contains(e.target)&&!menuBtn.contains(e.target))
    sidebar.classList.remove('open');
});

// FULLSCREEN
fullscreenBtn.addEventListener('click', ()=>{
  if(!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', ()=>{
  if(document.fullscreenElement) sidebar.classList.remove('open');
});

// HELPERS: save/load
function saveTemp(k,v){
  const tmp = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  tmp[k]=v; localStorage.setItem('spotifyTemp',JSON.stringify(tmp));
}
function gather(){
  return {
    barColor: opts.barColor.value,
    bgUrl:    opts.bgUrl.value,
    bgMode:   opts.bgMode.value,
    showCover: opts.showCover.checked,
    showDetails: opts.showDetails.checked,
    showProgress: opts.showProgress.checked,
    titleColor: opts.titleColor.value,
    titleSize: opts.titleSize.value,
    albumColor: opts.albumColor.value,
    albumSize: opts.albumSize.value,
    artistColor: opts.artistColor.value,
    artistSize: opts.artistSize.value
  };
}
function apply(cfg){
  if(!cfg) return;
  document.body.style.backgroundImage = cfg.bgUrl?`url(${cfg.bgUrl})`:'none';
  document.body.style.backgroundSize  = cfg.bgMode;
  opts.bgUrl.value = cfg.bgUrl||'';
  opts.bgMode.value= cfg.bgMode||'cover';

  progBar.style.backgroundColor = cfg.barColor; opts.barColor.value=cfg.barColor;
  opts.showCover.checked = cfg.showCover; coverArt.style.display = cfg.showCover?'':'none';
  opts.showDetails.checked = cfg.showDetails; document.getElementById('details').style.display=cfg.showDetails?'':'none';
  opts.showProgress.checked = cfg.showProgress; document.getElementById('progress-container').style.display=cfg.showProgress?'flex':'none';

  // title
  titleElem.style.color = cfg.titleColor; opts.titleColor.value=cfg.titleColor;
  titleElem.style.fontSize = cfg.titleSize+'px'; opts.titleSize.value=cfg.titleSize;
  opts.titleVal.textContent = cfg.titleSize+'px';
  // album
  albumElem.style.color = cfg.albumColor; opts.albumColor.value=cfg.albumColor;
  albumElem.style.fontSize = cfg.albumSize+'px'; opts.albumSize.value=cfg.albumSize;
  opts.albumVal.textContent = cfg.albumSize+'px';
  // artist
  artistElem.style.color = cfg.artistColor; opts.artistColor.value=cfg.artistColor;
  artistElem.style.fontSize = cfg.artistSize+'px'; opts.artistSize.value=cfg.artistSize;
  opts.artistVal.textContent = cfg.artistSize+'px';
}
function applyStored(){
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  if(t) apply(t);
}
function loadPresets(){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  opts.presetList.innerHTML = '<option value="">-- Load Preset --</option>';
  Object.keys(all).forEach(n=>{
    const o=document.createElement('option');
    o.value=o.textContent=n; opts.presetList.appendChild(o);
  });
}

// CONTROL EVENTS
[
  ['barColor','value'],['bgUrl','value'],['bgMode','value'],
  ['showCover','checked'],['showDetails','checked'],['showProgress','checked'],
  ['titleColor','value'],['albumColor','value'],['artistColor','value']
].forEach(([k,p])=>{
  opts[k].addEventListener('input',()=>{
    saveTemp(k, opts[k][p]);
    applyStored();
  });
});
[['titleSize','titleVal'],['albumSize','albumVal'],['artistSize','artistVal']].forEach(([k,v])=>{
  opts[k].addEventListener('input',()=>{
    opts[v].textContent = opts[k].value+'px';
    saveTemp(k,opts[k].value);
    applyStored();
  });
});

// PRESETS
opts.saveBtn.addEventListener('click',()=>{
  const name = opts.presetName.value.trim();
  if(!name) return alert('Enter a preset name.');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name]=gather();
  localStorage.setItem('spotifyPresets',JSON.stringify(all));
  loadPresets(); opts.presetName.value='';
});
opts.presetList.addEventListener('change',()=>{
  const key=opts.presetList.value;
  if(!key) return;
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  apply(all[key]); saveTemp('...','');
});
opts.deleteBtn.addEventListener('click',()=>{
  const key=opts.presetList.value;
  if(!key) return alert('Select one.');
  const all=JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[key];
  localStorage.setItem('spotifyPresets',JSON.stringify(all));
  loadPresets();
});
opts.resetBtn.addEventListener('click',()=>{
  localStorage.removeItem('spotifyTemp');
  localStorage.removeItem('spotifyPresets');
  location.reload();
});

// SPOTIFY LOGIC
async function fetchPlay(token){
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!res.ok) throw '';
    const d=await res.json();
    if(d.currently_playing_type==='ad') return;
    const it=d.item, p=d.progress_ms, dur=it.duration_ms;
    coverArt.src=it.album.images[0].url;
    titleElem.textContent=it.name;
    albumElem.textContent=it.album.name;
    artistElem.textContent=it.artists.map(a=>a.name).join(', ');
    progBar.style.width=`${(p/dur)*100}%`;
    timeElapsed.textContent=formatTime(p);
    timeRemaining.textContent='-'+formatTime(dur-p);
    // clicking cover opens spotify
    coverArt.onclick=()=>window.open(it.external_urls.spotify,'_blank');
  } catch(e){ console.error(e); }
}
function startRefreshing(){
  if(token) setInterval(()=>fetchPlay(token),100);
}
function setupSpotify(){
  if(!token && window.location.hash){
    const h=window.location.hash.substring(1).split('&').reduce((a,c)=>{
      const [k,v]=c.split('='); a[k]=v; return a;
    },{});
    token=h.access_token;
    if(token){
      document.cookie=`access_token=${token}; path=/;`;
      loginContainer.style.display='none';
      mediaDisplay.hidden=false;
      startRefreshing();
    }
  } else if(token){
    loginContainer.style.display='none';
    mediaDisplay.hidden=false;
  } else {
    loginContainer.style.display='block';
    loginBtn.onclick=()=>window.location.href=
      `https://accounts.spotify.com/authorize?response_type=token`
      +`&client_id=${clientId}`
      +`&scope=${scopes.join('%20')}`
      +`&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
}
function formatTime(ms){
  const m=Math.floor(ms/60000),
        s=Math.floor((ms%60000)/1000).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function getCookie(n){
  const v=`; ${document.cookie}`,p=v.split(`; ${n}=`); return p.length===2?p.pop().split(';').shift():null;
}
