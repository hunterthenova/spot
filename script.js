let currentTrackId = null; // Store track ID for opening the track in Spotify

// Listen for the 'Enter' and 'F' keys
document.addEventListener('keydown', (e) => {
  // Handle fullscreen toggle with 'F' key
  if (e.key === 'F') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen(); // Enter fullscreen
    } else if (document.exitFullscreen) {
      document.exitFullscreen(); // Exit fullscreen
    }
  }

  // Handle opening the track in Spotify with 'Enter' key
  if (e.key === 'Enter' && currentTrackId) {
    window.open(`https://open.spotify.com/track/${currentTrackId}`, '_blank');
  }
});

// Fetch currently playing track data from Spotify API
async function fetchCurrentlyPlaying(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Unable to fetch currently playing data.');

    const data = await response.json();
    if (data.currently_playing_type === 'ad') {
      // If an ad is playing, stop further actions
      return;
    }

    const item = data.item;
    currentTrackId = item.id; // Store the track ID

    // Update media details (cover art, title, album, artist)
    coverArt.src = item.album.images[0].url;
    titleElem.textContent = item.name; // Song name
    albumElem.textContent = item.album.name; // Album name
    artistElem.textContent = item.artists.map(artist => artist.name).join(', '); // Artist names

    const progressMs = data.progress_ms;
    const durationMs = item.duration_ms;

    // Update progress bar and time
    progressBar.style.width = `${(progressMs / durationMs) * 100}%`;
    timeElapsed.textContent = formatTime(progressMs);
    timeRemaining.textContent = `-${formatTime(durationMs - progressMs)}`;
  } catch (error) {
    console.error(error.message);
  }
}

// Format time in mm:ss
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Periodically fetch currently playing track (every 0.1 seconds)
function startRefreshing() {
  setInterval(() => {
    if (accessToken) fetchCurrentlyPlaying(accessToken);
  }, 100); // 0.1 second refresh
}

// Fetch the access token from the cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Step 1: Check if access token exists in cookies
let accessToken = getCookie('access_token');

// If token exists, fetch currently playing data
if (accessToken) {
  loginContainer.style.display = 'none'; // Hide login button after successful login
  mediaDisplay.hidden = false;
  startRefreshing();
} else {
  // If token doesn't exist, redirect to Spotify login
  loginBtn.addEventListener('click', () => {
    window.location.href = `https://accounts.spotify.com/authorize?response_type=token&client_id=2658d08b17ae44bda4d79ee2c1fa905d&scope=user-read-currently-playing user-read-playback-state&redirect_uri=https://spot-red.vercel.app/`;
  });
}
