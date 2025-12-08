// ═══════════════════════════════════════════════════════════
// Gemini AI Service - Simplified
// ═══════════════════════════════════════════════════════════

const { GoogleGenerativeAI } = require('@google/generative-ai');
const prompts = require('../config/prompts');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('⚠️  GEMINI_API_KEY is not set in environment variables!');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Models
const CHAT_MODEL = 'gemini-2.0-flash-exp';
const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Helper to extract and parse JSON from AI response
 * robustly handles markdown, extra text, and nested structures
 */
function extractAndParseJSON(text) {
    // Find start of JSON (array or object)
    let startIndex = text.indexOf('[');
    let startBrace = text.indexOf('{');
    
    // If neither found
    if (startIndex === -1 && startBrace === -1) {
         throw new Error('No JSON structure found in AI response');
    }
    
    // Determine which comes first
    let isArray = true;
    if (startIndex === -1 || (startBrace !== -1 && startBrace < startIndex)) {
        startIndex = startBrace;
        isArray = false;
    }
    
    let openChar = isArray ? '[' : '{';
    let closeChar = isArray ? ']' : '}';
    
    // Extract using bracket counting
    let balance = 0;
    let endIndex = -1;
    let inString = false;
    let escape = false;
    
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        
        if (escape) {
            escape = false;
            continue;
        }
        
        if (char === '\\') {
            escape = true;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
            continue;
        }
        
        if (!inString) {
            if (char === openChar) {
                balance++;
            } else if (char === closeChar) {
                balance--;
                if (balance === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
    }
    
    // If balanced close not found, fallback to simple trim or last char
    let jsonString = '';
    if (endIndex !== -1) {
        jsonString = text.substring(startIndex, endIndex + 1);
    } else {
        // Fallback: assume the rest of the string contains the JSON (risky but better than nothing)
        // Or try to match greedy regex as backup
        const match = text.substring(startIndex).match(isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
        jsonString = match ? match[0] : text.substring(startIndex);
    }
    
    // Clean
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    // Fix trailing commas
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('JSON Parse Error:', e.message);
        console.error('Failed JSON string:', jsonString);
        // Attempt to fix common JSON errors
        try {
            // Try to fix unquoted keys
            const fixedString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            return JSON.parse(fixedString);
        } catch (e2) {
            throw new Error('Failed to parse JSON from AI response: ' + e.message);
        }
    }
}

/**
 * Generate chat response
 * @param {number} userId - Optional user ID for token tracking
 */
async function generateChatResponse(userMessage, context = [], responseStyle = 'standard', exam = 'NEET PG', userId = null, mode = 'normal') {
    const start = Date.now();
    console.log(`🤖 Generating AI response (Style: ${responseStyle}, Mode: ${mode}, Context: ${context.length} chunks)...`);

    try {
        const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
        let prompt;

        if (mode === 'general') {
             // General Mode Prompt
             prompt = `${prompts.GENERAL_SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT QUERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exam: ${exam}
Response Style: ${responseStyle}

Query: ${userMessage}

Now provide your answer based on your general medical knowledge.
IMPORTANT: You MUST follow the '${responseStyle}' response style defined in the system prompt.
- If 'ultra': Provide a textbook-level, exhaustive explanation (2000+ words).
- If 'comprehensive': Provide a deep dive with extensive details (900-1500 words).
- If 'standard': Provide a balanced coverage (450-900 words).
- If 'brief': Provide a quick summary (150-250 words).

Response:`;
        } else {
            // RAG Mode Prompt
            const contextText = context && context.length > 0
                ? context.map(c => `[${c.subject} - ${c.topic}]\n${c.text}`).join('\n\n---\n\n')
                : '[No specific context available from knowledge base]';

            prompt = `${prompts.SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT (Use STRICTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT QUERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exam: ${exam}
Response Style: ${responseStyle}

Query: ${userMessage}

Now provide your answer.
IMPORTANT: You MUST follow the '${responseStyle}' response style defined in the system prompt.
For '${responseStyle}', the expected length and depth is CRITICAL.
- If 'ultra': Provide a textbook-level, exhaustive explanation (2000+ words).
- If 'comprehensive': Provide a deep dive with extensive details (900-1500 words).
- If 'standard': Provide a balanced coverage (450-900 words).
- If 'brief': Provide a quick summary (150-250 words).

Response:`;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract usage metadata from Gemini response
        const usage = result.response.usageMetadata || null;

        const duration = (Date.now() - start) / 1000;
        console.log(`✅ AI Response generated in ${duration}s (Length: ${responseText.length} chars)`);

        if (usage) {
            console.log(`   📊 Tokens: ${usage.totalTokenCount} (Input: ${usage.promptTokenCount}, Output: ${usage.candidatesTokenCount})`);
        }

        // Parse suggested questions from response
        let suggestedQuestions = [];
        let cleanedResponse = responseText;

        const questionsMatch = responseText.match(/\|\|\|SUGGESTED_QUESTIONS:\s*([^|]+)\|\|\|/);
        if (questionsMatch) {
            const questionsText = questionsMatch[1].trim();
            suggestedQuestions = questionsText.split(/[,?]/)
                .map(q => q.trim())
                .filter(q => q.length > 0)
                .map(q => q.endsWith('?') ? q : q + '?')
                .slice(0, 3); // Take only first 3

            // Remove the marker from response
            cleanedResponse = responseText.replace(/\|\|\|SUGGESTED_QUESTIONS:[^|]+\|\|\|/, '').trim();
        }

        return {
            response: cleanedResponse,
            suggestedQuestions,
            responseStyle,
            usage: usage ? {
                inputTokens: usage.promptTokenCount || 0,
                outputTokens: usage.candidatesTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0
            } : null
        };
    } catch (error) {
        const duration = (Date.now() - start) / 1000;
        console.error(`❌ AI Generation failed after ${duration}s:`, error);
        throw new Error(`AI response failed: ${error.message}`);
    }
}

/**
 * Generate flashcards from topic
 */
async function generateFlashcards(subject, topic, context, count = 5) {
    try {
        const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

        const contextText = context.map(c => c.text).join('\n\n');

        const prompt = `You are creating medical flashcards for ${subject} - ${topic}.

Context:
${contextText}

Create exactly ${count} high-quality flashcards following these rules:
1. Front: Clear, concise question or term
2. Back: Detailed but exam-focused answer
3. Cover the most important concepts
4. Make them suitable for spaced repetition
5. Include clinical correlations when relevant

Respond ONLY with a JSON array in this exact format:
[
  {
    "front": "Question or term",
    "back": "Detailed answer"
  }
]

No additional text, only the JSON array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return extractAndParseJSON(text);
    } catch (error) {
        console.error('Gemini flashcards error:', error);
        throw new Error(`Flashcard generation failed: ${error.message}`);
    }
}

/**
 * Generate MCQ questions from topic
 * @param {string} examType - 'neet-pg' or 'ini-cet'
 */
async function generateQuestions(subject, topic, context, difficulty = 'medium', count = 5, examType = 'neet-pg') {
    try {
        const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

        const contextText = context.map(c => c.text).join('\n\n');

        // Exam-specific guidelines
        const examGuidelines = {
            'neet-pg': `- NEET PG style: Focus on clinical scenarios, applied knowledge, and integrated topics
- Include patient case presentations where relevant
- Emphasize differential diagnosis and treatment approaches
- Use Indian medical context and guidelines`,
            'ini-cet': `- INI CET style: Balance between conceptual and clinical questions
- Include recent advances and current guidelines
- Focus on high-yield topics and pattern-based questions
- Mix of direct recall and application-based questions`,
            'neet-pg-inicet': `- Combined NEET PG & INI CET style: Comprehensive approach covering both exams
- Focus on clinical scenarios (NEET PG) and conceptual depth (INI CET)
- Include high-yield topics, recent advances, and patient cases
- Balance between applied knowledge and theoretical concepts`
        };

        const guidelines = examGuidelines[examType] || examGuidelines['neet-pg'];

        const prompt = `You are creating ${difficulty} level MCQ questions for ${subject} - ${topic}.
Exam Format: ${examType.toUpperCase().replace('-', ' ')}

Context:
${contextText}

Create exactly ${count} high-quality MCQs following these rules:
1. ${guidelines}
2. Clear, unambiguous stems
3. 4 options (A, B, C, D)
4. Only ONE correct answer
5. Detailed, educational explanations in HTML format (use <p>, <ul>, <li>, <strong> tags for styling)
6. Difficulty: ${difficulty}
7. Questions should be exam-appropriate and test important concepts

Respond ONLY with a JSON array in this exact format:
[
  {
    "stem": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_option": 0,
    "explanation": "<p>Detailed explanation...</p>"
  }
]

No additional text, only the JSON array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return extractAndParseJSON(text);
    } catch (error) {
        console.error('Gemini questions error:', error);
        throw new Error(`Question generation failed: ${error.message}`);
    }
}

/**
 * Generate study recommendations
 */
async function generateStudyPlan(weakAreas, performanceData) {
    try {
        const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

        const prompt = `You are a medical exam preparation advisor analyzing a student's performance.

Weak areas:
${JSON.stringify(weakAreas, null, 2)}

Overall performance:
${JSON.stringify(performanceData, null, 2)}

Based on this data:
1. Identify the 3-5 most critical topics to focus on
2. Suggest a study plan for today
3. Provide motivational, actionable advice

Respond in JSON format:
{
  "suggestedTopics": ["topic1", "topic2", "topic3"],
  "planDescription": "Brief description of today's recommended focus",
  "questionsCount": 30,
  "estimatedTime": "45 mins"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return extractAndParseJSON(text);
    } catch (error) {
        console.error('Gemini study plan error:', error);
        throw new Error(`Study plan generation failed: ${error.message}`);
    }
}

/**
 * Generate text embeddings
 */
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Gemini embedding error:', error);
        throw new Error(`Embedding generation failed: ${error.message}`);
    }
}

module.exports = {
    generateChatResponse,
    generateFlashcards,
    generateQuestions,
    generateStudyPlan,
    generateEmbedding,
};
