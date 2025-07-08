// stays exactly the same
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.ENV = {
      SUPABASE_URL: "${process.env.SUPABASE_URL}",
      SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
    };
  `);
}
