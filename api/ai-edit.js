// Vercel serverless endpoint. Keep OPENAI_API_KEY on the server; never expose it in the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured. Add OPENAI_API_KEY in your hosting environment.' });
  try {
    const { prompt, video, transcript } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'A prompt is required.' });
    const system = `You are ClipForge AI, an expert video editor. Convert the user's natural-language editing request into a practical FFmpeg editing plan. Return ONLY a JSON object with: explanation (string), start (number|null), end (number|null), aspect (original|9:16|16:9), speed (0.5|0.75|1|1.25|1.5|2), rotate (0|90|180|270), volume (0|0.5|1|1.5|2), animation (none|zoom-in|zoom-out|pan-left|pan-right|shake), effect (none|cinematic|grayscale|vintage|soft-blur|sharpen), fade (none|1|2|3), subtitles (boolean). Use null for unspecified times. Defaults: original, 1, 0, 1, none, none, none, false. Do not invent timestamps or claim to modify pixels. Interpret common requests: Reel/Short/TikTok=9:16; YouTube landscape=16:9; cinematic push/slow zoom=zoom-in; pull back=zoom-out; pan left/right; handheld shake=shake; monochrome=grayscale; warm film= vintage; crisp=sharpen. If the request is outside supported controls, explain the limitation and choose the closest safe plan.`;
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ prompt, video, transcript }) }] })
    });
    const payload = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: payload.error?.message || 'AI provider error' });
    const plan = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    return res.status(200).json({ plan });
  } catch (error) {
    return res.status(500).json({ error: 'Could not create an editing plan.' });
  }
}
