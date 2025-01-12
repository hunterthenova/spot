const fullscreenBtn = document.getElementById('fullscreen-btn');
const mediaDisplay = document.getElementById('media-display');
const coverArt = document.getElementById('cover-art');
const progressBar = document.getElementById('progress-bar');

// Spotify API credentials
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spot-red.vercel.app/';
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

let accessToken;

// Step 1: Redirect to Spotify Login
if (!accessToken && window.location.hash) {
  const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
    const [key, value] = item.split('=');
    acc[key] = value;
    return acc;
  }, {});

  accessToken = hash.access_token;
  if (accessToken) {
    mediaDisplay.hidden = false;
    startRefreshing();
  }
}

// Step 2: Refresh Playback Data
function startRefreshing() {
  setInterval(() => {
    fetchCurrentlyPlaying(accessToken);
  }, 1000);
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
    progressBar.style.width = `${(progressMs / durationMs) * 100}%`;
  } catch (error) {
    console.error(error.message);
  }
}

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});
