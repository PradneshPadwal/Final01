export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiToken = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    return res.status(500).json({
      error: "Cloudflare credentials missing."
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

      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,

      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          prompt
        })

      }

    );

    if (!response.ok) {

      const err = await response.text();

      return res.status(response.status).json({
        error: err
      });

    }

    const image = await response.arrayBuffer();

    const base64 =
      Buffer.from(image).toString("base64");

    return res.status(200).json({

      image:
        `data:image/png;base64,${base64}`

    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }

}
