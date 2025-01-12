const loginBtn = document.getElementById('login-btn');
const mediaDisplay = document.getElementById('media-display');
const coverArt = document.getElementById('cover-art');
const titleElem = document.getElementById('title');
const artistElem = document.getElementById('artist');

// Spotify API credentials
const clientId = 'YOUR_SPOTIFY_CLIENT_ID';
const redirectUri = 'https://YOUR_VERCEL_DEPLOYMENT_URL/'; // Replace with your Vercel URL
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];

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

  const accessToken = hash.access_token;
  if (accessToken) {
    fetchCurrentlyPlaying(accessToken);
  }
}

// Step 3: Fetch Currently Playing Track
async function fetchCurrentlyPlaying(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.ok) {
    const data = await response.json();
    mediaDisplay.hidden = false;
    coverArt.src = data.item.album.images[0].url;
    titleElem.textContent = `Title: ${data.item.name}`;
    artistElem.textContent = `Artist: ${data.item.artists.map(artist => artist.name).join(', ')}`;
  } else {
    alert('Unable to fetch currently playing track. Make sure music is playing on your Spotify account.');
  }
}
