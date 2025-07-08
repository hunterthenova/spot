import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Vercel will inject these at build‐time:
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

let user = null
let presets = {}

window.addEventListener('load', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.signInWithOAuth({ provider: 'spotify' })
    return
  }
  user = session.user
  loadPreset()
  startNowPlaying()
})

supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    user = session.user
    loadPreset()
    startNowPlaying()
  }
})

function logout() {
  supabase.auth.signOut()
  location.reload()
}

// Simulate now playing (replace with Spotify SDK if needed)
function startNowPlaying() {
  const title = document.getElementById('title')
  const artist = document.getElementById('artist')
  const progress = document.getElementById('progress')
  const currentTime = document.getElementById('current-time')
  const duration = document.getElementById('duration')

  let time = 0
  const total = 198

  title.textContent = 'Title: Heather'
  artist.textContent = 'Artist: Conan Gray'
  duration.textContent = '03:18'

  setInterval(() => {
    time = (time + 1) % total
    progress.style.width = `${(time / total) * 100}%`
    const mins = Math.floor(time / 60).toString().padStart(2, '0')
    const secs = (time % 60).toString().padStart(2, '0')
    currentTime.textContent = `${mins}:${secs}`
  }, 1000)
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open')
}

document.getElementById('bg-upload').addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      document.body.style.backgroundImage = `url(${reader.result})`
      presets.bg = reader.result
    }
    reader.readAsDataURL(file)
  }
})

document.getElementById('bar-color').addEventListener('input', (e) => {
  document.getElementById('progress').style.backgroundColor = e.target.value
  presets.barColor = e.target.value
})

async function savePreset() {
  if (!user) return
  await supabase.from('presets').upsert({
    user_id: user.id,
    preset: presets,
  }, { onConflict: 'user_id' })
  alert('Preset saved!')
}

async function loadPreset() {
  const { data } = await supabase.from('presets').select('preset').eq('user_id', user.id).single()
  if (!data || !data.preset) return

  presets = data.preset
  if (presets.bg) {
    document.body.style.backgroundImage = `url(${presets.bg})`
  }
  if (presets.barColor) {
    document.getElementById('progress').style.backgroundColor = presets.barColor
    document.getElementById('bar-color').value = presets.barColor
  }
}
