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

// Spotify API credentials
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spotify.huntersdesigns.com/'; // Update with your live site URL
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

let accessToken = getCookie('access_token');

// Debugging log to check access token
console.log('Access Token:', accessToken);

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
  loginContainer.style.display = 'block'; // Show login button if not logged in
  loginBtn.addEventListener('click', () => {
    // Redirect to Spotify login
    window.location.href = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${redirectUri}`;
  });
}

// Step 2: Start refreshing data once logged in (every 0.1 seconds)
function startRefreshing() {
  setInterval(() => {
    fetchCurrentlyPlaying(accessToken);
  }, 100); // 0.1 seconds
}

// Fetch currently playing track
async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Unable to fetch currently playing data.');

    const data = await response.json();
    if (data.currently_playing_type === 'ad') {
      // If ad is detected, stop the rest of the actions
      return;
    }

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
    document.body.style.cursor = 'none';
  } else {
    document.body.style.cursor = 'auto';
  }
});

// Get value of cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Handle Enter key press to open track in Spotify
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    window.open(spotifyLink.href, '_blank');
  }
});
