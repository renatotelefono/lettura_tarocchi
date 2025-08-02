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

// Servi il frontend statico
app.use(express.static(path.join(__dirname, "../frontend")));

// Endpoint per TTS Azure
app.post("/tts", async (req, res) => {
  const text = req.body.text;
  const ssml = `<speak version='1.0' xml:lang='it-IT'>
    <voice name='it-IT-GiuseppeNeural'>${text}</voice>
  </speak>`;

  const response = await fetch(`https://${process.env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_KEY,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
    },
    body: ssml
  });

  if (!response.ok) {
    const msg = await response.text();
    return res.status(500).send(msg);
  }

  res.setHeader("Content-Type", "audio/mpeg");
  response.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server TTS attivo su http://localhost:${PORT}`));
