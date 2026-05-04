const express = require("express");
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const PROMPTS = {
  improve:   (text) => `Improve the writing quality of this text. Make it clearer, more professional and engaging. Return ONLY the improved text, no explanations:\n\n${text}`,
  grammar:   (text) => `Fix all grammar, spelling and punctuation errors in this text. Return ONLY the corrected text, no explanations:\n\n${text}`,
  shorter:   (text) => `Make this text shorter and more concise while keeping the main points. Return ONLY the shortened text, no explanations:\n\n${text}`,
  longer:    (text) => `Expand this text with more details and examples. Return ONLY the expanded text, no explanations:\n\n${text}`,
  summarize: (text) => `Summarize this text in 2-3 sentences. Return ONLY the summary, no explanations:\n\n${text}`,
  translate: (text) => `Translate this text to English (if already English, translate to French). Return ONLY the translated text, no explanations:\n\n${text}`,
};

router.post("/assist", async (req, res) => {
  const { text, action } = req.body;

  if (!text || !action) return res.status(400).json({ message: "Text and action are required" });
  if (!PROMPTS[action]) return res.status(400).json({ message: "Invalid action" });
  if (!GROQ_API_KEY) return res.status(500).json({ message: "Groq API key not configured" });

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: PROMPTS[action](text) }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ message: data.error?.message || "Groq API error" });
    }

    const result = data.choices?.[0]?.message?.content;
    if (!result) return res.status(500).json({ message: "No response from Groq" });

    res.json({ result });
  } catch (err) {
    console.error("AI assist error:", err);
    res.status(500).json({ message: "Failed to connect to AI service" });
  }
});

module.exports = router;