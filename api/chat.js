export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables' });

  const { messages, system } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages' });

  try {
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system || '' }] },
        contents: geminiMessages,
        generationConfig: { temperature: 0.9, maxOutputTokens: 400 }
      })
    });

    const raw = await response.text();

    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return res.status(500).json({ error: 'Gemini returned invalid JSON: ' + raw.slice(0, 200) }); }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Gemini API error' });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No reply from Gemini.';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
