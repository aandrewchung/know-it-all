require('dotenv').config(); // Load environment variables from .env
const OpenAI = require("openai");

// Initialize the OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Load API key from .env
});

async function generateText(website_text) {
  const userPrompt = `
I have scraped text from multiple websites, which may contain information about a specific person. The person of interest is likely mentioned multiple times across these texts. Based on the provided text, please:

1. Identify the person who appears most frequently or seems to be the central focus.
2. Extract their name and a short description or bio (max 100 characters) about them.
3. Present the information in the following format:

Name: [extracted name]
Info: [short bio/description]

If you cannot confidently determine a central person or extract relevant information, please only return:

Name: n/a
Info: n/a

Here is the compiled text from multiple sources:

${website_text}

Please analyze the text carefully to identify the most prominent individual before providing your response.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Fallback to GPT-3.5 if GPT-4 is unavailable
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userPrompt.slice(0, 50000) },
      ],
    });

    // Return the generated text from the response
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
}

// Export the generateText function
module.exports = { generateText };

// Example usage (can be commented out or removed when using as a module)
// const sample_text = `
// Skip to content

// An Infinite Descent into Pure Mathematics
// fnawfnaewijfnajkwfnkjaew
// `;

// generateText(sample_text).then(console.log).catch(console.error);
