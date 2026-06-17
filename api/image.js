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
    return res.status(500).json({ error: "HF_API_KEY not set in environment variables" });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "image/*"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 4
          }
        })
      }
    );

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const errorText = contentType.includes("application/json")
        ? JSON.stringify(await response.json())
        : await response.text();
      return res.status(response.status).json({
        error: errorText || "Image generation failed"
      });
    }

    if (contentType.includes("application/json")) {
      const data = await response.json();

      if (data?.image) {
        return res.status(200).json({ image: data.image });
      }

      return res.status(500).json({
        error: "HF returned JSON but no image field was found."
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = contentType || "image/png";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    return res.status(200).json({ image: dataUrl });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Image generation failed"
    });
  }
}
