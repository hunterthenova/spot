const fullscreenBtn = document.getElementById('fullscreen-btn');
const loginContainer = document.getElementById('login-container');
const mediaDisplay = document.getElementById('media-display');
const coverArt = document.getElementById('cover-art');
const titleElem = document.getElementById('title');
const albumElem = document.getElementById('album');
const artistElem = document.getElementById('artist');
const progressBar = document.getElementById('progress-bar');
const timeElapsed = document.getElementById('time-elapsed');
const timeRemaining = document.getElementById('time-remaining');
const spotifyLink = document.getElementById('spotify-link');
const loginBtn = document.getElementById('login-btn');
const eyeBtn = document.getElementById('eye-btn');
const eyedropperBtn = document.getElementById('eyedropper-btn');
const uploadBgBtn = document.getElementById('upload-bg-btn');

const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spot-red.vercel.app/';
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

let accessToken = getCookie('access_token');
let currentBgColor = '#121212';
let currentProgressBarColor = '#1db954';

// Step 1: Check if access token exists in cookies
if (!accessToken && window.location.hash) {
  const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
    const [key, value] = item.split('=');
    acc[key] = value;
    return acc;
  }, {});

  accessToken = hash.access_token;
  if (accessToken) {
    document.cookie = `access_token=${accessToken}; path=/;`;
    loginContainer.style.display = 'none'; // Hide login button after successful login
    mediaDisplay.hidden = false;
    startRefreshing();
  }
} else if (accessToken) {
  loginContainer.style.display = 'none'; // Hide login button after successful login
  mediaDisplay.hidden = false;
  startRefreshing();
} else {
  loginBtn.addEventListener('click', () => {
    // Redirect to Spotify login
    window.location.href = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${redirectUri}`;
  });
}

// Step 2: Start refreshing data once logged in
function startRefreshing() {
  setInterval(() => {
    fetchCurrentlyPlaying(accessToken);
  }, 500); // Refresh every 500ms
}

// Fetch currently playing track
async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Unable to fetch currently playing data.');

    const data = await response.json();
    if (data.currently_playing_type === 'ad') return; // Detect ads and do nothing if playing

    const item = data.item;
    const progressMs = data.progress_ms;
    const durationMs = item.duration_ms;

    // Update media details
    coverArt.src = item.album.images[0].url;
    titleElem.textContent = item.name; // Only the song name
    albumElem.textContent = item.album.name; // Only the album name
    artistElem.textContent = item.artists.map(artist => artist.name).join(', '); // Only artist(s)
    progressBar.style.width = `${(progressMs / durationMs) * 100}%`;
    timeElapsed.textContent = formatTime(progressMs);
    timeRemaining.textContent = `-${formatTime(durationMs - progressMs)}`;
    spotifyLink.href = item.external_urls.spotify;
  } catch (error) {
    console.error(error.message);
  }
}

// Format milliseconds to mm:ss
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});

// Detect fullscreen change and hide/show the cursor
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    document.body.style.cursor = 'none'; // Hide cursor
  } else {
    document.body.style.cursor = 'auto'; // Show cursor
  }
});

// Toggle visibility of Spotify link
eyeBtn.addEventListener('click', () => {
  spotifyLink.hidden = !spotifyLink.hidden;
});

// Open color picker for custom background and progress bar colors
eyedropperBtn.addEventListener('click', () => {
  const bgColor = prompt('Enter a hex color code for background:');
  const progressBarColor = prompt('Enter a hex color code for progress bar:');
  currentBgColor = bgColor;
  currentProgressBarColor = progressBarColor;
  document.body.style.backgroundColor = currentBgColor;
  progressBar.style.backgroundColor = currentProgressBarColor;
});

// Allow custom background uploads
uploadBgBtn.addEventListener('click', () => {
  alert('Feature under construction.');
});
