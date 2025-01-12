const loginBtn = document.getElementById('login-btn');
const mediaDisplay = document.getElementById('media-display');
const coverArt = document.getElementById('cover-art');
const titleElem = document.getElementById('title');
const artistElem = document.getElementById('artist');
const progressBar = document.getElementById('progress-bar');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');

// Spotify API credentials
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spot-red.vercel.app/';
const scopes = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
];

let accessToken;

// Step 1: Redirect to Spotify Login
loginBtn.addEventListener('click', () => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
  window.location = authUrl;
});

// Step 2: Parse Token from URL
if (window.location.hash) {
  const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
    const [key, value] = item.split('=');
    acc[key] = value;
    return acc;
  }, {});

  accessToken = hash.access_token;
  if (accessToken) {
    loginBtn.style.display = 'none'; // Hide login button
    mediaDisplay.hidden = false;
    startRefreshing();
    setupMediaControls();
  }
}

// Step 3: Refresh Playback Data
function startRefreshing() {
  setInterval(() => {
    fetchCurrentlyPlaying(accessToken);
  }, 1000); // Refresh every second
}

// Fetch currently playing track
async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Unable to fetch currently playing data.');

    const data = await response.json();
    const item = data.item;
    const progressMs = data.progress_ms;
    const durationMs = item.duration_ms;

    // Update media details
    coverArt.src = item.album.images[0].url;
    titleElem.textContent = `Title: ${item.name}`;
    artistElem.textContent = `Artist: ${item.artists.map(artist => artist.name).join(', ')}`;
    progressBar.style.width = `${(progressMs / durationMs) * 100}%`;
  } catch (error) {
    console.error(error.message);
  }
}

// Step 4: Media Controls
function setupMediaControls() {
  playBtn.addEventListener('click', () => togglePlayback(accessToken));
  prevBtn.addEventListener('click', () => sendPlaybackCommand('previous', accessToken));
  nextBtn.addEventListener('click', () => sendPlaybackCommand('next', accessToken));
  shuffleBtn.addEventListener('click', () => toggleShuffle(accessToken));
  repeatBtn.addEventListener('click', () => toggleRepeat(accessToken));
}

async function sendPlaybackCommand(command, token) {
  const endpointMap = {
    previous: 'https://api.spotify.com/v1/me/player/previous',
    next: 'https://api.spotify.com/v1/me/player/next',
  };

  try {
    const response = await fetch(endpointMap[command], {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`${command} command failed.`);
  } catch (error) {
    console.error(error.message);
  }
}

async function togglePlayback(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch playback state.');

    const data = await response.json();
    const isPlaying = data.is_playing;

    const playbackEndpoint = isPlaying
      ? 'https://api.spotify.com/v1/me/player/pause'
      : 'https://api.spotify.com/v1/me/player/play';

    await fetch(playbackEndpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error(error.message);
  }
}

async function toggleShuffle(token) {
  try {
    await fetch('https://api.spotify.com/v1/me/player/shuffle?state=true', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error(error.message);
  }
}

async function toggleRepeat(token) {
  try {
    await fetch('https://api.spotify.com/v1/me/player/repeat?state=context', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error(error.message);
  }
}
