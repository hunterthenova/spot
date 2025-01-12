const loginBtn = document.getElementById('login-btn');
const mediaDisplay = document.getElementById('media-display');
const coverArt = document.getElementById('cover-art');
const titleElem = document.getElementById('title');
const artistElem = document.getElementById('artist');
const progressBar = document.getElementById('progress-bar');
const lyricsElem = document.getElementById('lyrics');
const visualizer = document.getElementById('visualizer');

// Spotify API credentials
const clientId = '2658d08b17ae44bda4d79ee2c1fa905d';
const redirectUri = 'https://spot-red.vercel.app/';
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

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
    mediaDisplay.hidden = false;
    startRefreshing();
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

    // Fetch lyrics (mocked for demo)
    fetchLyrics(item.name, item.artists[0].name);

    // Update visualizer
    updateVisualizer();
  } catch (error) {
    console.error(error.message);
  }
}

// Mock lyrics fetcher
async function fetchLyrics(trackName, artistName) {
  // Replace with an actual lyrics API like Musixmatch, Genius, etc.
  lyricsElem.textContent = `Lyrics for "${trackName}" by ${artistName}...`;
}

// Update sound bar visualizer
function updateVisualizer() {
  visualizer.innerHTML = ''; // Clear previous bars
  for (let i = 0; i < 20; i++) {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = `${Math.random() * 100}%`; // Random height for visual effect
    visualizer.appendChild(bar);
  }
}
