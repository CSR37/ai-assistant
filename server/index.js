// index.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send('✅ Server is running 🚀');
});

// AI Chat Route
app.post('/ask', async (req, res) => {
  const { conversation } = req.body;

  if (!conversation || !Array.isArray(conversation)) {
    return res.status(400).json({ error: "Invalid conversation format. Expected an array." });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.1-8b-instant",
        messages: conversation,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const replyRaw = response.data?.choices?.[0]?.message?.content;

    if (!replyRaw) {
      console.error("⚠️ No reply received from Groq API:", response.data);
      return res.status(500).json({ error: "No reply from AI model." });
    }

    // Clean and ensure it's a string
    const reply = typeof replyRaw === 'string' ? replyRaw : JSON.stringify(replyRaw);

    res.json({ reply });

  } catch (error) {
    console.error('❌ Error talking to Groq:', error.response?.data || error.message);
    res.status(500).json({
      error: "Something went wrong talking to AI!",
      details: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
});
