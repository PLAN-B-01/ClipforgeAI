// Online speech-to-subtitle generation via OpenAI audio transcription.
// The browser extracts audio; only that audio is sent here, not the source video.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Online subtitles are not configured. Add OPENAI_API_KEY to your hosting environment.' });
  try {
    const { audioBase64, filename = 'clip.mp3', language = 'en' } = req.body || {};
    if (typeof audioBase64 !== 'string' || !audioBase64) return res.status(400).json({ error: 'Audio data is required.' });
    if (audioBase64.length > 30_000_000) return res.status(413).json({ error: 'Audio is too large. Trim the video and try again.' });
    const audio = Buffer.from(audioBase64, 'base64');
    if (!audio.length || audio.length > 22 * 1024 * 1024) return res.status(413).json({ error: 'Audio must be 22 MB or smaller.' });
    const form = new FormData();
    form.append('file', new Blob([audio], { type: 'audio/mpeg' }), String(filename).replace(/[^a-zA-Z0-9._-]/g, '_'));
    form.append('model', process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');
    if (language) form.append('language', String(language).slice(0, 12));
    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || 'Transcription provider error' });
    const segments = (data.segments || []).map(s => ({ start: s.start, end: s.end, text: s.text }));
    return res.status(200).json({ text: data.text || '', duration: data.duration || null, segments });
  } catch (error) {
    return res.status(500).json({ error: 'Could not generate online subtitles.' });
  }
}
