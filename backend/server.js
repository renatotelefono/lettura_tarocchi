import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend statico e disabilita cache per index.html
app.use(express.static(path.join(__dirname, "../frontend"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// Endpoint per TTS Azure
app.post("/tts", async (req, res) => {
  try {
    const text = req.body.text;
    const ssml = `<speak version='1.0' xml:lang='it-IT'>
      <voice name='it-IT-GiuseppeNeural'>${text}</voice>
    </speak>`;

    const response = await fetch(
      `https://${process.env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
        },
        body: ssml
      }
    );

    if (!response.ok) {
      const msg = await response.text();
      return res.status(500).send(msg);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    response.body.pipe(res);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route catch-all compatibile con Express 5
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server attivo su http://localhost:${PORT}`)
);
