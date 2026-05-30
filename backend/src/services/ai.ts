import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

// Fallback response helpers if key is missing
const getMockResponse = (type: string, code: string, extra?: string) => {
  switch (type) {
    case 'explain':
      return `### CodeSync AI Assistant (Dev Mock Mode)
Here is an overview of the selected code:
1. **Core Purpose**: This snippet executes typical algorithms or logic in **${extra || 'selected language'}**.
2. **Key Operations**:
   - Variables are initialized and processed.
   - Flow control or functions execute sequentially.
3. **Data Flow**: Output/data structure is modified.

*To enable real AI, add a valid \`GEMINI_API_KEY\` to the \`backend/.env\` file.*`;

    case 'optimize':
      return `### Optimization Suggestions (Dev Mock Mode)
The current solution has an estimated complexity of **O(N)** time and **O(1)** space.
- **Improvement**: Avoid nested loops where possible to keep code executing in linear time.
- **Readability**: Simplify complex expressions.

*To enable real AI, add a valid \`GEMINI_API_KEY\` to the \`backend/.env\` file.*`;

    case 'bug':
      return `### Bug & Optimization Report (Dev Mock Mode)
- **Syntax Check**: Passed successfully.
- **Edge Cases**: Ensure variables are validated for null or undefined states.
- **Resource Management**: Avoid memory leaks in high-throughput routines.

*To enable real AI, add a valid \`GEMINI_API_KEY\` to the \`backend/.env\` file.*`;

    case 'hint':
      return `### Progressive Interview Hint (Dev Mock Mode)
- **Hint 1**: Think about using a hash map or dictionary to search elements in O(1) time.
- **Hint 2**: Can you solve this using two pointers from the start and end of the dataset?

*To enable real AI, add a valid \`GEMINI_API_KEY\` to the \`backend/.env\` file.*`;

    default:
      return `No AI service requested or key missing.`;
  }
};

export const getAIExplanation = async (code: string, language: string) => {
  if (!apiKey) return getMockResponse('explain', code, language);
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Explain the following ${language} code clearly, listing its core components, runtime behavior, and key operations:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    const result = await model.generateContent(prompt);
    return result.response.text() || 'No response from AI.';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return `Error retrieving AI explanation: ${error.message}`;
  }
};

export const getAIOptimization = async (code: string, language: string) => {
  if (!apiKey) return getMockResponse('optimize', code, language);
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this ${language} code and suggest time/space complexity optimizations. Provide clean refactored alternatives where relevant:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    const result = await model.generateContent(prompt);
    return result.response.text() || 'No response from AI.';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return `Error retrieving AI optimizations: ${error.message}`;
  }
};

export const detectBugs = async (code: string, language: string) => {
  if (!apiKey) return getMockResponse('bug', code, language);
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Detect any bugs, syntax issues, logical gaps, or memory leaks in this ${language} code and describe how to resolve them:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    const result = await model.generateContent(prompt);
    return result.response.text() || 'No response from AI.';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return `Error retrieving bug analysis: ${error.message}`;
  }
};

export const getInterviewHint = async (code: string, language: string, problemDescription: string) => {
  if (!apiKey) return getMockResponse('hint', code, language);
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a technical interviewer. The candidate is trying to solve the following problem:\n"${problemDescription}"\n\nTheir current code in ${language} is:\n\`\`\`${language}\n${code}\n\`\`\`\n\nGive them a progressive, helpful algorithmic hint WITHOUT writing the code for them. Keep it brief and encouraging.`;
    const result = await model.generateContent(prompt);
    return result.response.text() || 'No response from AI.';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return `Error retrieving interview hint: ${error.message}`;
  }
};

export const getInterviewFeedback = async (code: string, language: string, problemDescription: string, history: string) => {
  try {
    const defaultFeedback = `### AI Interview Session Feedback
1. **Coding Style**: Clear and logical structuring.
2. **Problem Solving**: Handled initial test cases. Candidate was active in coding.
3. **Communication**: Clean annotations and code comments.
- **Overall Rating**: 4.0/5.0`;

    if (!apiKey) return { text: defaultFeedback, rating: 4.0 };

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a Principal Engineer reviewing an interview session.\nProblem: "${problemDescription}"\nLanguage: ${language}\nFinal Code:\n\`\`\`\n${code}\n\`\`\`\nSession Logs: ${history}\n\nProvide an overall assessment of the candidate's code quality, time/space complexity, and general performance. Return a JSON structure matching:\n{\n  "feedback": "A summary of their performance...",\n  "rating": 4.5\n}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text() || '';
    
    // Parse JSON
    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          text: parsed.feedback || responseText,
          rating: parsed.rating || 4.0,
        };
      }
    } catch {
      // JSON parse failed
    }

    return { text: responseText, rating: 4.0 };
  } catch (error: any) {
    console.error('Gemini Feedback Error:', error);
    return {
      text: `Failed to compile AI interview analysis: ${error.message}`,
      rating: 3.5,
    };
  }
};
