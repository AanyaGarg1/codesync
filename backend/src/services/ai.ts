import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || '';
const API_VERSION = process.env.GEMINI_API_VERSION || 'v1';

if (!apiKey) {
  console.warn('Gemini API key missing. Gemini AI routes will return development mock responses. Set GEMINI_API_KEY in backend/.env to enable real AI.');
}

const getMockResponse = (type: string, code: string, extra?: string) => {
  const note = '*Gemini is not configured or quota was exceeded. Add a valid `GEMINI_API_KEY` to the `backend/.env` file to enable real AI responses.*';
  switch (type) {
    case 'explain':
      return `### CodeSync AI Assistant (Dev Mock Mode)\nHere is an overview of the selected code:\n1. **Core Purpose**: This snippet executes typical algorithms or logic in **${extra || 'selected language'}**.\n2. **Key Operations**:\n   - Variables are initialized and processed.\n   - Flow control or functions execute sequentially.\n3. **Data Flow**: Output/data structure is modified.\n\n${note}`;
    case 'optimize':
      return `### Optimization Suggestions (Dev Mock Mode)\nThe current solution has an estimated complexity of **O(N)** time and **O(1)** space.\n- **Improvement**: Avoid nested loops where possible.\n- **Readability**: Simplify complex expressions.\n\n${note}`;
    case 'bug':
      return `### Bug & Optimization Report (Dev Mock Mode)\n- **Syntax Check**: Passed successfully.\n- **Edge Cases**: Ensure variables are validated for null or undefined states.\n- **Resource Management**: Avoid memory leaks in high-throughput routines.\n\n${note}`;
    case 'hint':
      return `### Progressive Interview Hint (Dev Mock Mode)\n- **Hint 1**: Think about using a hash map or dictionary to search elements in O(1) time.\n- **Hint 2**: Can you solve this using two pointers?\n\n${note}`;
    default:
      return `No AI service requested or key missing.`;
  }
};

const createGeminiModel = (ai: GoogleGenerativeAI, modelName: string) =>
  ai.getGenerativeModel({ model: modelName }, { apiVersion: API_VERSION });

const shouldReturnMockOnError = (error: any) => {
  const msg = String(error?.message || error || '').toLowerCase();
  return /quota|rate limit|rate-limited|429|403|quota exceeded|exceeded|billing|permission denied|not enough credits|service unavailable|503|unavailable|internal server error/i.test(msg);
};

const generateGeminiResponse = async (prompt: string) => {
  const ai = new GoogleGenerativeAI(apiKey);

  const execute = async (modelName: string) => {
    const model = createGeminiModel(ai, modelName);
    const result = await model.generateContent(prompt);
    return result.response.text() || 'No response from AI.';
  };

  try {
    return await execute(MODEL_NAME);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (MODEL_NAME !== FALLBACK_MODEL && /not found|404/i.test(msg)) {
      console.warn(`Model ${MODEL_NAME} unavailable, falling back to ${FALLBACK_MODEL}: ${msg}`);
      try {
        return await execute(FALLBACK_MODEL);
      } catch (fallbackError: any) {
        console.error('Fallback Gemini model error:', fallbackError);
        if (shouldReturnMockOnError(fallbackError)) {
          throw new Error('quota-or-service-error');
        }
        throw fallbackError;
      }
    }
    if (shouldReturnMockOnError(error)) {
      throw new Error('quota-or-service-error');
    }
    throw error;
  }
};

const handleAIError = (error: any, type: 'explain' | 'optimize' | 'bug' | 'hint', code: string, language: string) => {
  const msg = error?.message || String(error);
  if (msg === 'quota-or-service-error' || shouldReturnMockOnError(error)) {
    console.warn('Gemini quota/service fallback, returning mock response:', msg);
    return getMockResponse(type, code, language);
  }
  return `Error retrieving AI ${type}: ${msg}`;
};

export const getAIExplanation = async (code: string, language: string) => {
  if (!apiKey) return getMockResponse('explain', code, language);
  const prompt = `Explain the following ${language} code clearly, listing its core components, runtime behavior, and key operations:\n\n\`\`\`${language}\n${code}\n\`\`\``;
  try {
    return await generateGeminiResponse(prompt);
  } catch (error: any) {
    return handleAIError(error, 'explain', code, language);
  }
};

export const getAIOptimization = async (code: string, language: string) => {
  if (!apiKey) return getMockResponse('optimize', code, language);
  const prompt = `Analyze this ${language} code and suggest time/space complexity optimizations. Provide clean refactored alternatives where relevant:\n\n\`\`\`${language}\n${code}\n\`\`\``;
  try {
    return await generateGeminiResponse(prompt);
  } catch (error: any) {
    return handleAIError(error, 'optimize', code, language);
  }
};

export const detectBugs = async (code: string, language: string) => {
  if (!apiKey) return getMockResponse('bug', code, language);
  const prompt = `Detect any bugs, syntax issues, logical gaps, or memory leaks in this ${language} code and describe how to resolve them:\n\n\`\`\`${language}\n${code}\n\`\`\``;
  try {
    return await generateGeminiResponse(prompt);
  } catch (error: any) {
    return handleAIError(error, 'bug', code, language);
  }
};

export const getInterviewHint = async (code: string, language: string, problemDescription: string) => {
  if (!apiKey) return getMockResponse('hint', code, language);
  const prompt = `You are a technical interviewer. The candidate is trying to solve the following problem:\n"${problemDescription}"\n\nTheir current code in ${language} is:\n\`\`\`${language}\n${code}\n\`\`\`\n\nGive them a progressive, helpful algorithmic hint WITHOUT writing the code for them. Keep it brief and encouraging.`;
  try {
    return await generateGeminiResponse(prompt);
  } catch (error: any) {
    return handleAIError(error, 'hint', code, language);
  }
};

export const getInterviewFeedback = async (code: string, language: string, problemDescription: string, history: string, durationSeconds = 0) => {
  try {
    const defaultFeedback = `### AI Interview Session Feedback (Dev Mock Mode)\n1. **Strengths**: Clear and logical structuring.\n2. **Weaknesses**: Minor edge cases and formatting improvements.\n3. **Complexity**: Estimated time/space complexity is reasonable.\n4. **Code Quality**: Good readability and organization.\n- **Overall Rating**: 4.0/5.0\n\n*Gemini is not configured. Add a valid \`GEMINI_API_KEY\` to the \`backend/.env\` file to enable real AI feedback.*`;
    if (!apiKey) return { text: defaultFeedback, rating: 4.0 };
    const prompt = `You are a Principal Engineer reviewing an interview session.\nProblem: "${problemDescription}"\nLanguage: ${language}\nDuration: ${durationSeconds} seconds\nFinal Code:\n\`\`\`\n${code}\n\`\`\`\nSession Logs: ${history}\n\nEvaluate the solution and provide a structured review with headings for:\n- Strengths\n- Weaknesses\n- Time and space complexity\n- Code quality\n- Overall rating (1-5)\n\nReturn the response in plain text with headings and make sure the overall rating is clearly shown as a numeric value.`;
    try {
      const responseText = await generateGeminiResponse(prompt);
      const ratingMatch = responseText.match(/Overall\s+Rating[:\s]+([0-5](?:\.[0-9]+)?)/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.0;
      return { text: responseText, rating };
    } catch (error: any) {
      if (error?.message === 'quota-or-service-error' || shouldReturnMockOnError(error)) {
        console.warn('Gemini interview feedback quota/service fallback, returning mock feedback.');
        return { text: defaultFeedback, rating: 4.0 };
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Gemini Feedback Error:', error);
    const msg = error?.message || String(error);
    return { text: `Failed to compile AI interview analysis: ${msg}`, rating: 3.5 };
  }
};