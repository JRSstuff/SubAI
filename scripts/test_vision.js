const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const imgBuf = fs.readFileSync('C:/Users/BeboyPC/.gemini/antigravity/brain/7fd7c8c5-66d2-4866-b1a3-baad6f2c4e71/.user_uploaded/media_1793316040681_7a6c91e6.png');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' + apiKey;
  
  const prompt = `You are SubAI CDO Vision Assistant for urban drainage maintenance in Cagayan de Oro City.
Analyze this photo of a drainage structure and debris blockage.

Respond with ONLY a valid JSON object matching this schema:
{
  "drainageClassification": "Curb Inlet" | "Catch Basin" | "Open Canal" | "Culvert" | "Creek Outfall",
  "detectedCategories": ["pet_bottles" | "flexible_packaging" | "silt" | "organic_debris" | "construction_debris" | "residual_waste"],
  "obstructionSeverity": "low" | "partial" | "substantial",
  "suggestedDescription": "Factual 1-sentence description of the specific drainage structure and visible debris.",
  "recommendedAction": "verified" | "needs_inspection",
  "confidenceNotes": "Notes on materials observed",
  "isUnclear": false
}`;

  console.log('Sending canal image to Gemini 3.5 Flash Lite (500 RPD model)...');
  const start = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/png', data: imgBuf.toString('base64') } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });
  const duration = Date.now() - start;
  console.log('HTTP Status:', res.status, `(Took ${duration}ms)`);
  const data = await res.json();
  console.log('Raw JSON Response:');
  console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

test().catch(console.error);
