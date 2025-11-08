
/**
 * OpenAI Service
 * Provides AI capabilities for the application
 */

import { toast } from "sonner";

class OpenAIService {
  // Store the API key (in a real production app, this would be in a secure backend)
  private apiKey: string = "sk-5678efgh5678efgh5678efgh5678efgh5678efgh";
  
  // Maximum number of retries for API calls
  private MAX_RETRIES: number = 3;
  // Delay between retries (ms)
  private RETRY_DELAY: number = 1000;
  
  // Allowed models list for validation
  private ALLOWED_MODELS: string[] = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];

  /**
   * Checks if the API key is set
   */
  hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.trim() !== '';
  }

  /**
   * Validates if the provided model name is allowed
   */
  private validateModel(model: string): string {
    if (!this.ALLOWED_MODELS.includes(model)) {
      console.warn(`Unsupported model: ${model}. Falling back to gpt-4o-mini.`);
      return 'gpt-4o-mini';
    }
    return model;
  }

  /**
   * Makes a request to the OpenAI API with retry logic and rate limiting
   */
  private async makeRequest(endpoint: string, body: any): Promise<any> {
    if (!this.hasApiKey()) {
      throw new Error('OpenAI API key not set');
    }

    // Validate model if present in body
    if (body.model) {
      body.model = this.validateModel(body.model);
    }

    // Initialize retry counter
    let retryCount = 0;
    let lastError = null;

    // Implement exponential backoff for retries
    while (retryCount <= this.MAX_RETRIES) {
      try {
        const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, private'
          },
          body: JSON.stringify(body)
        });

        if (response.status === 429) {
          // Handle rate limiting
          const retryAfter = response.headers.get('Retry-After') || '1';
          const delayTime = parseInt(retryAfter, 10) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
          retryCount++;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json();
          // Sanitize error message to not expose sensitive details
          const errorMessage = this.sanitizeErrorMessage(
            errorData.error?.message || 'OpenAI API request failed'
          );
          throw new Error(errorMessage);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount <= this.MAX_RETRIES) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retryCount - 1))
          );
        } else {
          // Log full error but return sanitized error to user
          console.error('OpenAI API error:', error);
          throw new Error('Could not complete the AI request. Please try again later.');
        }
      }
    }

    throw lastError || new Error('OpenAI request failed after retries');
  }

  /**
   * Sanitizes error messages to remove sensitive information
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove any API keys or tokens that might be in the error message
    let sanitized = message.replace(/Bearer\s+[a-zA-Z0-9._~-]+/g, 'Bearer [REDACTED]');
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{30,}/g, '[REDACTED_API_KEY]');
    
    // Provide generic error messages instead of potentially sensitive ones
    if (sanitized.includes('quota') || sanitized.includes('billing')) {
      return 'API quota exceeded. Please try again later.';
    }
    
    if (sanitized.includes('rate limit')) {
      return 'Too many requests. Please try again later.';
    }
    
    return sanitized;
  }

  /**
   * Validates syllabus text input
   */
  private validateSyllabusText(text: string): string {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid syllabus text provided');
    }
    
    // Truncate extremely long inputs
    if (text.length > 50000) {
      return text.substring(0, 50000) + '...';
    }
    
    return text;
  }

  /**
   * Analyzes a syllabus text using GPT-4
   * @param syllabusText The raw text from the syllabus PDF
   */
  async analyzeSyllabus(syllabusText: string): Promise<any> {
    // Input validation
    const validatedText = this.validateSyllabusText(syllabusText);
    
    const prompt = `
You are an expert academic syllabus analyzer. Extract and structure the following information from this syllabus:

1. Course Information:
   - Course title
   - Course code
   - Instructor name
   - Term/semester
   - Department

2. Key Dates and Deadlines (with exact dates if provided):
   - Assignment due dates
   - Exam dates
   - Project deadlines
   - Reading due dates
   - Other important dates

3. Course Topics:
   - Main topics covered
   - Weekly schedule if available
   - Reading list

Please format your response as a JSON object with the following structure:
{
  "courseInfo": {
    "title": "",
    "code": "",
    "instructor": "",
    "term": "",
    "department": ""
  },
  "events": [
    {
      "title": "",
      "date": "YYYY-MM-DD", 
      "description": "",
      "type": "assignment|exam|reading|project|other"
    }
  ],
  "topics": [
    {
      "title": "",
      "description": "",
      "startDate": "YYYY-MM-DD", (optional)
      "endDate": "YYYY-MM-DD" (optional)
    }
  ]
}

Extract only what you can find in the syllabus. Use null for missing information. Here's the syllabus text:

${validatedText}
`;

    try {
      const response = await this.makeRequest('chat/completions', {
        model: 'gpt-4o-mini', // Using a secure model from allowed list
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      // Extract the JSON from the response
      const content = response.choices[0]?.message?.content || '';
      try {
        // Find JSON in the response if it's not pure JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        return JSON.parse(jsonString);
      } catch (error) {
        console.error('Failed to parse JSON from OpenAI response', error);
        toast.error('Failed to analyze syllabus. Please try again.');
        throw new Error('Failed to parse syllabus data');
      }
    } catch (error) {
      console.error('Failed to analyze syllabus with OpenAI', error);
      toast.error('Failed to analyze syllabus. Please try again.');
      throw error;
    }
  }

  /**
   * Extracts text from a PDF using GPT-4 Vision
   * @param pdfFile The PDF file to analyze
   */
  async extractTextFromPDF(pdfFile: File): Promise<string> {
    // Input validation
    if (!pdfFile || !(pdfFile instanceof File)) {
      throw new Error('Invalid PDF file provided');
    }
    
    // Validate file size
    if (pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('PDF file size exceeds the 10MB limit');
    }
    
    // For now, we'll simulate text extraction
    // In a production environment, you would first convert the PDF to images
    // and then use the OpenAI Vision API to extract text
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Normally, you would send the PDF content to your backend
        // which would convert it to images and send those to OpenAI
        // For now, we'll return some mock text
        setTimeout(() => {
          resolve(`Syllabus for ${pdfFile.name}: This is a comprehensive syllabus for an academic course. It includes information about the course title, instructor, schedule, assignments, and grading policy. The course will cover various topics throughout the semester and includes multiple assignments and exams.`);
        }, 1500);
      };
      reader.readAsArrayBuffer(pdfFile);
    });
  }

  /**
   * Generate visual elements for a course
   * @param courseTitle The title of the course
   */
  async generateVisualElements(courseTitle: string): Promise<string> {
    // In a real implementation, this would generate visual elements
    // using OpenAI's DALL-E or similar
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Generated visual elements for ${courseTitle}`);
      }, 1000);
    });
  }
}

// Create and export a singleton instance
export const openaiService = new OpenAIService();
