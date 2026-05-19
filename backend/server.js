// Import required packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads variables from .env file
const { GoogleGenAI } = require('@google/genai'); // Import Gemini SDK

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Setup Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Allow parsing JSON in request bodies

// Initialize Gemini client
const ai = new GoogleGenAI({});

// Create a POST route for the chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Format the history array for Gemini API
    // Gemini expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
    // Frontend sends: { role: 'user' | 'assistant', content: '...' }
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add the new user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Generate content using the new SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const aiMessage = response.text;

    // Send it back to the frontend
    res.json({ reply: aiMessage });

  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Failed to communicate with AI. Please check your API key.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
