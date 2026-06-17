export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.HF_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "HF_API_KEY not found."
    });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required."
    });
  }

  try {

    const response = await fetch(
      "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();

      return res.status(response.status).json({
        error
      });
    }

    const imageBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/png");

    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }
}
