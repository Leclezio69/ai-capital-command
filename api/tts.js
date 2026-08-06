export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!apiKey || !voiceId) {
    return res.status(503).json({ error: 'Narration not configured.' });
  }

  if (!text || text.length > 4500) {
    return res.status(400).json({ error: 'Text must be 1-4500 characters.' });
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.52,
            similarity_boost: 0.82,
            style: 0.0,
            use_speaker_boost: false,
          },
        }),
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error('ElevenLabs error:', upstream.status, detail);
      return res.status(upstream.status).json({ error: 'Narration generation failed.', detail });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(buffer);
  } catch (error) {
    console.error('Narration endpoint failure:', error);
    return res.status(500).json({ error: 'Narration service unavailable.' });
  }
}
