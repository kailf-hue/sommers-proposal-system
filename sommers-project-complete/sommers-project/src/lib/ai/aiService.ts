/**
 * AI Service
 * AI-powered content generation and suggestions
 */

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';

interface AIResponse {
  generated_text: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Generate text using HuggingFace Mistral-7B
 */
export async function generateText(
  prompt: string,
  maxTokens: number = 500
): Promise<string> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.warn('HuggingFace API key not configured');
    return getFallbackResponse(prompt);
  }

  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: AIResponse[] = await response.json();
    return data[0]?.generated_text || '';
  } catch (error) {
    console.error('AI generation error:', error);
    return getFallbackResponse(prompt);
  }
}

/**
 * Chat with AI assistant
 */
export async function chat(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  // Format messages for Mistral instruction format
  let prompt = '';
  
  if (systemPrompt) {
    prompt += `<s>[INST] ${systemPrompt} [/INST]</s>\n`;
  }
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      prompt += `<s>[INST] ${msg.content} [/INST]`;
    } else if (msg.role === 'assistant') {
      prompt += `${msg.content}</s>\n`;
    }
  }

  return generateText(prompt, 1000);
}

/**
 * Generate proposal description
 */
export async function generateProposalDescription(
  services: string[],
  propertyType: string,
  squareFootage: number
): Promise<string> {
  const prompt = `[INST] Write a professional proposal description for asphalt sealcoating services. 
Services: ${services.join(', ')}
Property type: ${propertyType}
Area: ${squareFootage.toLocaleString()} square feet

Keep it concise, professional, and highlight the benefits. [/INST]`;

  return generateText(prompt, 300);
}

/**
 * Generate scope of work
 */
export async function generateScopeOfWork(
  services: string[],
  conditions: string
): Promise<string> {
  const prompt = `[INST] Write a detailed scope of work for an asphalt maintenance project.
Services to be performed: ${services.join(', ')}
Current conditions: ${conditions}

Include preparation, execution, and cleanup steps. Be specific and professional. [/INST]`;

  return generateText(prompt, 500);
}

/**
 * Generate email follow-up
 */
export async function generateFollowUpEmail(
  clientName: string,
  proposalNumber: string,
  daysSinceSent: number
): Promise<string> {
  const prompt = `[INST] Write a professional follow-up email for a sealcoating proposal.
Client: ${clientName}
Proposal: ${proposalNumber}
Days since sent: ${daysSinceSent}

Be friendly but professional. Offer to answer questions. Keep it brief. [/INST]`;

  return generateText(prompt, 200);
}

/**
 * Suggest pricing adjustments
 */
export async function suggestPricing(
  basePrice: number,
  competitorAvg: number,
  winRate: number
): Promise<{
  suggestion: string;
  adjustedPrice: number;
  reasoning: string;
}> {
  const prompt = `[INST] Analyze this pricing scenario and suggest adjustments:
Base price: $${basePrice.toLocaleString()}
Competitor average: $${competitorAvg.toLocaleString()}
Current win rate: ${winRate}%

Provide a brief recommendation. [/INST]`;

  const response = await generateText(prompt, 200);
  
  // Parse AI response or provide defaults
  let adjustedPrice = basePrice;
  if (winRate < 30 && basePrice > competitorAvg) {
    adjustedPrice = Math.round(basePrice * 0.95);
  } else if (winRate > 60) {
    adjustedPrice = Math.round(basePrice * 1.05);
  }

  return {
    suggestion: response || 'Consider adjusting based on market conditions',
    adjustedPrice,
    reasoning: `Based on ${winRate}% win rate and competitor pricing`,
  };
}

/**
 * Analyze proposal for improvements
 */
export async function analyzeProposal(proposal: {
  description: string;
  services: string[];
  total: number;
}): Promise<string[]> {
  const prompt = `[INST] Analyze this sealcoating proposal and suggest improvements:
Description: ${proposal.description}
Services: ${proposal.services.join(', ')}
Total: $${proposal.total.toLocaleString()}

List 3-5 specific suggestions to improve win rate. [/INST]`;

  const response = await generateText(prompt, 300);
  
  // Parse response into array or provide defaults
  const suggestions = response
    .split(/\d+\.\s+/)
    .filter((s) => s.trim().length > 0)
    .slice(0, 5);

  if (suggestions.length === 0) {
    return [
      'Add more details about your process',
      'Include timeline estimates',
      'Highlight warranty information',
      'Add photos of similar completed projects',
    ];
  }

  return suggestions;
}

/**
 * Generate discount recommendation
 */
export async function recommendDiscount(
  clientHistory: {
    totalSpent: number;
    projectCount: number;
    lastProject?: Date;
  },
  proposalValue: number
): Promise<{
  discountPercent: number;
  reason: string;
}> {
  // Logic-based recommendation (can be enhanced with AI)
  let discountPercent = 0;
  let reason = '';

  if (clientHistory.projectCount >= 5) {
    discountPercent = 10;
    reason = 'Loyal customer discount (5+ projects)';
  } else if (clientHistory.totalSpent >= 50000) {
    discountPercent = 7;
    reason = 'Volume customer discount ($50K+ lifetime)';
  } else if (clientHistory.projectCount >= 2) {
    discountPercent = 5;
    reason = 'Repeat customer discount';
  } else if (proposalValue >= 25000) {
    discountPercent = 3;
    reason = 'Large project discount';
  }

  return { discountPercent, reason };
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackResponse(prompt: string): string {
  if (prompt.includes('proposal description')) {
    return 'Professional asphalt sealcoating services to protect and extend the life of your pavement. Our experienced team uses premium materials and proven techniques to deliver lasting results.';
  }
  if (prompt.includes('scope of work')) {
    return '1. Surface Preparation: Clean and prepare the area\n2. Crack Filling: Address all visible cracks\n3. Sealcoat Application: Apply premium sealcoat\n4. Striping: Re-stripe as needed\n5. Cleanup: Remove all debris and equipment';
  }
  if (prompt.includes('follow-up')) {
    return 'I wanted to follow up on the proposal we sent. Please let me know if you have any questions or if there\'s anything I can clarify. We\'re ready to get started whenever you are.';
  }
  return 'AI service temporarily unavailable. Please try again later.';
}

export default {
  generateText,
  chat,
  generateProposalDescription,
  generateScopeOfWork,
  generateFollowUpEmail,
  suggestPricing,
  analyzeProposal,
  recommendDiscount,
};
