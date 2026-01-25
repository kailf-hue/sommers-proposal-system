/**
 * AI Assistant Component
 * AI-powered content generation and suggestions
 */

import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Copy, RefreshCw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useProposalStore } from '@/stores/proposalStore';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onClose: () => void;
}

const quickPrompts = [
  { label: 'Write introduction', prompt: 'Write a professional introduction for this proposal' },
  { label: 'Scope of work', prompt: 'Generate a detailed scope of work based on the selected services' },
  { label: 'Suggest upsells', prompt: 'Suggest additional services that would benefit this property' },
  { label: 'Improve pricing', prompt: 'Analyze the pricing and suggest optimizations' },
];

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you write proposal content, suggest services, analyze pricing, and more. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formData, pricing } = useProposalStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to AI
  const handleSend = async (prompt?: string) => {
    const messageContent = prompt || input;
    if (!messageContent.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from proposal data
      const context = `
        Property: ${formData.propertyName} (${formData.propertyType})
        Address: ${formData.address}, ${formData.city}, ${formData.state}
        Square Footage: ${formData.measurements.netSqft.toLocaleString()} sq ft
        Surface Condition: ${formData.surfaceCondition}
        Selected Services: ${formData.selectedServices.join(', ')}
        Pricing Tier: ${formData.selectedTier}
        Total: $${pricing.total.toLocaleString()}
      `;

      // Call AI API (HuggingFace Mistral-7B)
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<s>[INST] You are a helpful assistant for a sealcoating proposal system. Use this context about the current proposal:

${context}

User request: ${messageContent} [/INST]`,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();
      const aiResponse = data[0]?.generated_text?.split('[/INST]')[1]?.trim() || 
        "I apologize, but I couldn't generate a response. Please try again.";

      // Add AI response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI error:', error);
      
      // Fallback response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. In the meantime, here are some suggestions based on your proposal:\n\n• Consider adding crack filling if not already included\n• A premium tier typically increases conversions by 15%\n• Include a clear timeline in your scope of work",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy message content
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-red" />
          <CardTitle className="text-lg">AI Assistant</CardTitle>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg p-3',
                  message.role === 'user'
                    ? 'bg-brand-red text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-brand-red" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1 mb-2">
            <Lightbulb className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">Quick prompts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleSend(item.prompt)}
                disabled={isLoading}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-brand-red disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
