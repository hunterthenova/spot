// Element refs
const loginContainer = document.getElementById('login-container');
const loginBtn       = document.getElementById('login-btn');
const mediaDisplay   = document.getElementById('media-display');
const coverArt       = document.getElementById('cover-art');
const titleElem      = document.getElementById('title');
const albumElem      = document.getElementById('album');
const artistElem     = document.getElementById('artist');
const progressBar    = document.getElementById('progress-bar');
const menuBtn        = document.getElementById('menu-btn');
const sidebar        = document.getElementById('sidebar');
const fullscreenBtn  = document.getElementById('fullscreen-btn');

// Controls
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

// Display spans
const titleVal  = document.getElementById('opt-title-val');
const albumVal  = document.getElementById('opt-album-val');
const artistVal = document.getElementById('opt-artist-val');
const radiusVal = document.getElementById('opt-radius-val');

// Spotify setup
const clientId    = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/';
const scopes      = ['user-read-currently-playing','user-read-playback-state'];
let accessToken   = getCookie('access_token');

// Init
initSidebar();
loadPresets();
applyStoredSettings();
setupSpotifyAuth();

// Sidebar toggle
menuBtn.onclick = () => sidebar.classList.toggle('open');
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) sidebar.classList.remove('open');
});

// Fullscreen
fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
};
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) sidebar.classList.remove('open');
});

// Toggles
toggles.forEach(chk => chk.onchange = () => {
  const tgt = document.querySelector(chk.dataset.target);
  tgt.style.display = chk.checked ? '' : 'none';
  saveTemp(chk.dataset.target, chk.checked);
});

// Color inputs
barColor.oninput   = () => updateCSS('--barColor', barColor.value, 'barColor');
titleColor.oninput = () => (titleElem.style.color = titleColor.value, saveTemp('titleColor', titleColor.value));
albumColor.oninput = () => (albumElem.style.color = albumColor.value, saveTemp('albumColor', albumColor.value));
artistColor.oninput= () => (artistElem.style.color = artistColor.value, saveTemp('artistColor', artistColor.value));

// Size sliders
[[titleSize,titleVal,titleElem,'titleSize'],
 [albumSize,albumVal,albumElem,'albumSize'],
 [artistSize,artistVal,artistElem,'artistSize']
].forEach(([slider,span,elem,key]) => {
  slider.oninput = () => {
    const px = slider.value+'px';
    span.textContent = px;
    elem.style.fontSize = px;
    saveTemp(key, slider.value);
  };
});

// Radius
radius.oninput = () => {
  const r = radius.value+'px';
  radiusVal.textContent = r;
  updateCSS('--radius', r, 'radius');
};

// Background
bgUrl.onchange = () => {
  document.body.style.backgroundImage = bgUrl.value?`url(${bgUrl.value})`:'none';
  saveTemp('bgUrl', bgUrl.value);
};
bgFit.onchange = () => {
  document.body.style.backgroundSize = bgFit.value;
  saveTemp('bgFit', bgFit.value);
};

// Presets
saveBtn.onclick = () => {
  const name = presetName.value.trim();
  if (!name) return alert('Enter a preset name.');
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  all[name] = gatherSettings();
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
  presetName.value = '';
};
listPresets.onchange = () => {
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  applySettings(all[listPresets.value]||{});
};
delBtn.onclick = () => {
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  delete all[listPresets.value];
  localStorage.setItem('spotifyPresets', JSON.stringify(all));
  loadPresets();
};
resetBtn.onclick = () => localStorage.clear() || location.reload();

// Helpers
function updateCSS(prop,val,tempKey){
  document.documentElement.style.setProperty(prop, val);
  saveTemp(tempKey, val);
}
function saveTemp(k,v){
  const tmp = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  tmp[k] = v;
  localStorage.setItem('spotifyTemp', JSON.stringify(tmp));
}
function applyStoredSettings(){
  const tmp = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  applySettings(tmp);
}
function loadPresets(){
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  listPresets.innerHTML = '<option value="">-- Load Preset --</option>';
  Object.keys(all).forEach(n => {
    const o = document.createElement('option');
    o.value = o.textContent = n;
    listPresets.append(o);
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
    radius: radius.value+'px',
    bgUrl: bgUrl.value,
    bgFit: bgFit.value,
    '#cover-art': toggles[0].checked,
    '#details': toggles[1].checked,
    '#progress-container': toggles[2].checked
  };
}
function applySettings(cfg){
  if (cfg.barColor) updateCSS('--barColor', cfg.barColor);
  if (cfg.radius)  updateCSS('--radius', cfg.radius);
  if (cfg.titleColor) { titleColor.value=cfg.titleColor; titleElem.style.color=cfg.titleColor; }
  if (cfg.albumColor) { albumColor.value=cfg.albumColor; albumElem.style.color=cfg.albumColor; }
  if (cfg.artistColor){ artistColor.value=cfg.artistColor; artistElem.style.color=cfg.artistColor; }
  if (cfg.titleSize) { titleSize.value=cfg.titleSize; titleElem.style.fontSize=cfg.titleSize+'px'; titleVal.textContent=cfg.titleSize+'px'; }
  if (cfg.albumSize) { albumSize.value=cfg.albumSize; albumElem.style.fontSize=cfg.albumSize+'px'; albumVal.textContent=cfg.albumSize+'px'; }
  if (cfg.artistSize){ artistSize.value=cfg.artistSize; artistElem.style.fontSize=cfg.artistSize+'px'; artistVal.textContent=cfg.artistSize+'px'; }
  if (cfg.bgUrl!==undefined) { bgUrl.value=cfg.bgUrl; document.body.style.backgroundImage=cfg.bgUrl?`url(${cfg.bgUrl})`:'none'; }
  if (cfg.bgFit) { bgFit.value=cfg.bgFit; document.body.style.backgroundSize=cfg.bgFit; }
  toggles.forEach(chk => {
    const tgt = document.querySelector(chk.dataset.target);
    if (cfg[chk.dataset.target]!==undefined) {
      chk.checked = cfg[chk.dataset.target];
      tgt.style.display = chk.checked? '' : 'none';
    }
  });
}

// Spotify logic
async function fetchCurrentlyPlaying(token){
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
      headers:{ Authorization:`Bearer ${token}` }
    });
    if (!res.ok) throw '';
    const d = await res.json();
    if (d.currently_playing_type==='ad') return;
    const item=d.item, prog=d.progress_ms, dur=item.duration_ms;
    coverArt.src = item.album.images[0].url;
    titleElem.textContent = item.name;
    albumElem.textContent = item.album.name;
    artistElem.textContent = item.artists.map(a=>a.name).join(', ');
    progressBar.style.width = `${(prog/dur)*100}%`;
    coverArt.onclick = ()=> window.open(item.external_urls.spotify,'_blank');
  } catch{}
}
function startRefreshing(){ setInterval(()=> fetchCurrentlyPlaying(accessToken), 100); }
function setupSpotifyAuth(){
  if (!accessToken && window.location.hash){
    const h = Object.fromEntries(window.location.hash.slice(1).split('&').map(p=>p.split('=')));
    accessToken = h.access_token;
    if (accessToken){
      document.cookie = `access_token=${accessToken}; path=/;`;
      loginContainer.hidden = true;
      mediaDisplay.hidden = false;
      startRefreshing();
    }
  } else if (accessToken){
    loginContainer.hidden = true;
    mediaDisplay.hidden = false;
    startRefreshing();
  } else {
    loginContainer.hidden = false;
    loginBtn.onclick = () => {
      location.href = `https://accounts.spotify.com/authorize?response_type=token`
        + `&client_id=${clientId}`
        + `&scope=${scopes.join('%20')}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    };
  }
}
function getCookie(n){
  return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]||null;
}
