module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.length > 5000) {
    res.status(400).json({ error: 'Text is required and must be under 5000 characters' });
    return;
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!voiceId || !apiKey) {
    res.status(500).json({ error: 'ElevenLabs credentials not configured' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.50,
            similarity_boost: 0.78,
            style: 0.22,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: 'TTS generation failed', detail: err });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: 'TTS request failed', detail: e.message });
  }
};
