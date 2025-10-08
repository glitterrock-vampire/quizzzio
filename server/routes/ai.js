import express from 'express';
import OpenAI from 'openai';
import { config } from '../config.js';

const router = express.Router();

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Generate quiz questions using AI
router.post('/generate-questions', async (req, res, next) => {
  try {
    const { subject, questionCount, difficulty } = req.body;
    
    if (!config.openai.apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to your .env file'
      });
    }

    const difficultyText = difficulty === "mixed" 
      ? "a mix of easy, medium, and hard questions"
      : `${difficulty} level questions`;

    const prompt = `Generate ${questionCount} multiple choice quiz questions about ${subject.replace(/_/g, ' ')}.
Create ${difficultyText}.

Requirements:
- Each question must have exactly 4 options
- Questions should be interesting, educational, and varied
- Include a brief explanation (2-3 sentences) for each correct answer
- Questions should test real knowledge, not be too obvious
- Avoid trick questions

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "The exact text of the correct option",
      "difficulty": "easy" | "medium" | "hard",
      "explanation": "Clear explanation of why this is correct"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a knowledgeable quiz creator. Generate high-quality, educational quiz questions. Always respond with valid JSON."
      }, {
        role: "user",
        content: prompt
      }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Add subject and points to each question
    const questions = result.questions.map(q => ({
      ...q,
      subject,
      points: q.difficulty === "easy" ? 10 : q.difficulty === "medium" ? 15 : 20
    }));

    res.json({ 
      questions,
      metadata: {
        model: response.model,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI generation error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded',
        message: 'Please check your OpenAI account billing'
      });
    }
    
    next(error);
  }
});

// Test AI connection
router.get('/test', async (req, res) => {
  try {
    if (!config.openai.apiKey) {
      return res.json({ 
        status: 'not_configured',
        message: 'OpenAI API key not set'
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'Hello'" }],
      max_tokens: 10
    });

    res.json({ 
      status: 'connected',
      message: 'OpenAI API is working',
      response: response.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message
    });
  }
});

export default router;