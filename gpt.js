require('dotenv').config(); // Load environment variables from .env
const OpenAI = require("openai");

// Initialize the OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Load API key from .env
});

async function generateText(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Fallback to GPT-3.5 if GPT-4 is unavailable
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    });

    // Log the generated text from the response
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error generating text:", error);
  }
}

// Example usage
const userPrompt = "What is a large language model (LLM)?";
generateText(userPrompt);
