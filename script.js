// Refs
const loginC       = document.getElementById('login-container');
const loginBtn     = document.getElementById('login-btn');
const media        = document.getElementById('media-display');
const coverArt     = document.getElementById('cover-art');
const titleElem    = document.getElementById('title');
const albumElem    = document.getElementById('album');
const artistElem   = document.getElementById('artist');
const timeEl       = document.getElementById('time-elapsed');
const timeRem      = document.getElementById('time-remaining');
const progBar      = document.getElementById('progress-bar');
const menuBtn      = document.getElementById('menu-btn');
const sidebar      = document.getElementById('sidebar');
const fullBtn      = document.getElementById('fullscreen-btn');

// Controls
const toggles        = [...document.querySelectorAll('.opt-toggle')];
const barColorInput  = document.getElementById('opt-bar-color');
const progTextInput  = document.getElementById('opt-prog-text-color');
const syncProgText   = document.getElementById('opt-sync-prog-text');
const titleColor     = document.getElementById('opt-title-color');
const albumColor     = document.getElementById('opt-album-color');
const artistColor    = document.getElementById('opt-artist-color');
const titleSize      = document.getElementById('opt-title-size');
const titleNum       = document.getElementById('opt-title-num');
const albumSize      = document.getElementById('opt-album-size');
const albumNum       = document.getElementById('opt-album-num');
const artistSize     = document.getElementById('opt-artist-size');
const artistNum      = document.getElementById('opt-artist-num');
const radius         = document.getElementById('opt-radius');
const radiusNum      = document.getElementById('opt-radius-num');
const bgUrl          = document.getElementById('opt-bg-url');
const bgColor        = document.getElementById('opt-bg-color');
const syncColor      = document.getElementById('opt-sync-color');
const bgFit          = document.getElementById('opt-bg-fit');
const presetName     = document.getElementById('preset-name');
const savePresetBtn  = document.getElementById('save-preset');
const presetList     = document.getElementById('preset-list');
const deletePresetBtn= document.getElementById('delete-preset');
const resetBtn       = document.getElementById('reset-defaults');

// Spotify creds
const CLIENT_ID = '2658d08b17ae44bda4d79ee2c1fa905d';
const REDIRECT  = 'https://spotify.huntersdesigns.com/';
const SCOPES    = ['user-read-currently-playing','user-read-playback-state'];
let token        = getCookie('access_token');

// Init
initUI();
setupAuth();

// ── UI Setup ─────────────────────────────────────────────────────────
function initUI() {
  // Sidebar toggle
  menuBtn.onclick = () => sidebar.classList.toggle('open');
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target))
      sidebar.classList.remove('open');
  });

  // Fullscreen
  fullBtn.onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) sidebar.classList.remove('open');
  });

  // Toggles
  toggles.forEach(chk => chk.onchange = () => {
    document.querySelector(chk.dataset.target).style.display = chk.checked ? '' : 'none';
    saveTemp(chk.dataset.target, chk.checked);
  });

  // Progress bar & text colors
  barColorInput.oninput = () => updateCSS('--barColor', barColorInput.value, 'barColor');
  progTextInput.oninput = () => updateCSS('--progText', progTextInput.value, 'progText');
  syncProgText.onchange = () => {
    if (syncProgText.checked) {
      progTextInput.disabled = true;
      progTextInput.value = barColorInput.value;
      updateCSS('--progText', barColorInput.value, 'progText');
    } else progTextInput.disabled = false;
  };

  // Text colors
  titleColor.oninput  = () => (titleElem.style.color = titleColor.value, saveTemp('titleColor', titleColor.value));
  albumColor.oninput  = () => (albumElem.style.color = albumColor.value, saveTemp('albumColor', albumColor.value));
  artistColor.oninput = () => (artistElem.style.color = artistColor.value, saveTemp('artistColor', artistColor.value));
  bgColor.oninput     = () => (document.body.style.backgroundColor = bgColor.value, saveTemp('bgColor', bgColor.value));

  // Size & radius sync
  [[titleSize,titleNum,titleElem,'titleSize'],
   [albumSize,albumNum,albumElem,'albumSize'],
   [artistSize,artistNum,artistElem,'artistSize'],
   [radius,radiusNum,null,'radius']]
  .forEach(([slider,input,elem,key]) => {
    const sync = v => {
      slider.value = input.value = v;
      if (elem) elem.style.fontSize = v + 'px';
      if (key === 'radius') document.documentElement.style.setProperty('--radius', v + 'px');
      saveTemp(key, v);
    };
    slider.oninput = () => sync(slider.value);
    input.oninput  = () => sync(input.value);
  });

  // Background
  bgUrl.onchange = () => {
    if (bgUrl.value) {
      document.body.style.backgroundImage = `url(${bgUrl.value})`;
      saveTemp('bgUrl', bgUrl.value);
    } else {
      document.body.style.backgroundImage = '';
      saveTemp('bgUrl', '');
    }
  };
  syncColor.onchange = () => { if (syncColor.checked) sampleCoverColor(); };
  bgFit.onchange    = () => (document.body.style.backgroundSize = bgFit.value, saveTemp('bgFit', bgFit.value));

  // Presets
  savePresetBtn.onclick = () => {
    const n = presetName.value.trim(); if (!n) return alert('Enter name');
    const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
    all[n] = gather(); localStorage.setItem('spotifyPresets', JSON.stringify(all));
    loadPresets(); presetName.value = '';
  };
  presetList.onchange = () => applySettings(JSON.parse(localStorage.getItem('spotifyPresets')||'{}')[presetList.value]||{});
  deletePresetBtn.onclick = () => {
    if (presetList.value === 'Default') return;
    const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}'); delete all[presetList.value];
    localStorage.setItem('spotifyPresets', JSON.stringify(all)); loadPresets();
  };
  resetBtn.onclick = () => {
    if (confirm('Reset all settings?')) localStorage.clear(), location.reload();
  };

  // Load saved
  applySettings(JSON.parse(localStorage.getItem('spotifyTemp')||'{}'));
  loadPresets();
  const allPres = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  if (!allPres.Default) {
    allPres.Default = gather();
    localStorage.setItem('spotifyPresets', JSON.stringify(allPres));
    loadPresets();
  }
}

function updateCSS(prop,val,key) {
  document.documentElement.style.setProperty(prop,val);
  saveTemp(key,val);
}
function saveTemp(k,v) {
  const t = JSON.parse(localStorage.getItem('spotifyTemp')||'{}');
  t[k] = v; localStorage.setItem('spotifyTemp', JSON.stringify(t));
}
function gather() {
  const o = {};
  toggles.forEach(c => o[c.dataset.target] = c.checked);
  ['barColor','progText','titleColor','albumColor','artistColor','bgColor','bgFit','bgUrl'].forEach(k => {
    const el = document.getElementById(`opt-${k}`);
    if (el) o[k] = el.type === 'checkbox' ? el.checked : el.value;
  });
  ['titleSize','albumSize','artistSize','radius'].forEach(k => {
    const el = document.getElementById(`opt-${k}`);
    if (el) o[k] = el.value;
  });
  return o;
}
function applySettings(cfg) {
  if (cfg.barColor) updateCSS('--barColor',cfg.barColor,'barColor');
  if (cfg.progText) updateCSS('--progText',cfg.progText,'progText');
  ['titleColor','albumColor','artistColor'].forEach(k => {
    if (cfg[k]) {
      const el = document.getElementById(`opt-${k}`);
      el.value = cfg[k];
      document.getElementById(k.replace('Color','Elem') || k).style.color = cfg[k];
    }
  });
  ['titleSize','albumSize','artistSize'].forEach(k => {
    if (cfg[k]) {
      document.getElementById(`opt-${k}`).value = cfg[k];
      document.getElementById(`opt-${k.replace('Size','Num')}`).value = cfg[k];
      document.getElementById(k.replace('Size','Elem')).style.fontSize = cfg[k]+'px';
    }
  });
  if (cfg.radius) {
    document.getElementById('opt-radius').value = cfg.radius;
    document.getElementById('opt-radius-num').value = cfg.radius;
    document.documentElement.style.setProperty('--radius', cfg.radius+'px');
  }
  if (cfg.bgUrl !== undefined) document.body.style.backgroundImage = cfg.bgUrl ? `url(${cfg.bgUrl})` : '';
  if (cfg.bgColor) document.body.style.backgroundColor = cfg.bgColor;
  if (cfg.bgFit) document.body.style.backgroundSize = cfg.bgFit;
  toggles.forEach(chk => {
    if (cfg[chk.dataset-target] !== undefined) {
      chk.checked = cfg[chk.dataset.target];
      document.querySelector(chk.dataset.target).style.display = chk.checked?'':'none';
    }
  });
}

function loadPresets() {
  const all = JSON.parse(localStorage.getItem('spotifyPresets')||'{}');
  presetList.innerHTML = '';
  Object.keys(all).forEach(n => {
    const o = document.createElement('option');
    o.value = o.textContent = n;
    presetList.appendChild(o);
  });
}

// Color sampling
function sampleCoverColor() {
  const img = new Image(); img.crossOrigin='Anonymous'; img.src = coverArt.src;
  img.onload = () => {
    const c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    const d = ctx.getImageData(img.width-1,0,1,1).data;
    const hex = `#${d[0].toString(16).padStart(2,'0')}${d[1].toString(16).padStart(2,'0')}${d[2].toString(16).padStart(2,'0')}`;
    bgColor.value = hex; document.body.style.backgroundColor = hex; saveTemp('bgColor',hex);
  };
}

// Spotify auth & fetch
function setupAuth() {
  if (!token && location.hash) {
    const h = Object.fromEntries(location.hash.slice(1).split('&').map(p=>p.split('=')));
    token = h.access_token;
    document.cookie = `access_token=${token}; path=/`;
    history.replaceState({},'',location.pathname);
  }
  if (token) {
    loginC.hidden = true; media.hidden = false; startFetch();
  } else {
    loginC.hidden = false; media.hidden = true;
    loginBtn.onclick = () => {
      location.href =
        `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}`+
        `&scope=${SCOPES.join('%20')}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
  }
}

function startFetch() {
  fetchNow(); setInterval(fetchNow, 100);
}

async function fetchNow() {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const d = await res.json();
    if (d.currently_playing_type === 'ad') return;
    const i = d.item, prog = d.progress_ms, du = i.duration_ms;
    coverArt.src           = i.album.images[0].url;
    titleElem.textContent  = i.name;
    albumElem.textContent  = i.album.name;
    artistElem.textContent = i.artists.map(a=>a.name).join(', ');
    const fmt = ms => `${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`;
    timeEl.textContent  = fmt(prog);
    timeRem.textContent = `-${fmt(du - prog)}`;
    progBar.style.width  = `${(prog/du)*100}%`;
    coverArt.onclick     = () => window.open(i.external_urls.spotify,'_blank');
  } catch {}
}

function getCookie(n) {
  return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1] || null;
}
