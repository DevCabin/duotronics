'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  processing?: {
    logic?: string;
    artist?: string;
  };
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'logic' | 'artist'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if configured
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (!data.configured) {
          router.push('/');
        }
      });
  }, [router]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentPhase('logic');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) throw new Error('Chat request failed');

      const data = await res.json();
      
      setCurrentPhase('artist');
      
      // Small delay to show the phase transition
      await new Promise(r => setTimeout(r, 300));

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        processing: {
          logic: data.logicResponse,
          artist: data.artistResponse
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
      setCurrentPhase('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl brain-glow">🧠</span>
            <span className="font-bold">Duotronics</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowProcessing(!showProcessing)}
              className={`text-sm px-3 py-1 rounded-lg transition ${
                showProcessing ? 'bg-duo-accent/20 text-duo-accent' : 'bg-white/10 text-white/60'
              }`}
            >
              {showProcessing ? '🔬 Show Processing' : '🔬 Processing'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-white/60 hover:text-white text-sm"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Processing indicator */}
      {isLoading && (
        <div className="bg-white/5 border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${currentPhase === 'logic' ? 'text-duo-logic' : 'text-white/40'}`}>
              <div className={`w-2 h-2 rounded-full ${currentPhase === 'logic' ? 'bg-duo-logic animate-pulse' : 'bg-white/20'}`} />
              Logic
            </div>
            <div className="text-white/20">→</div>
            <div className={`flex items-center gap-2 ${currentPhase === 'artist' ? 'text-duo-artist' : 'text-white/40'}`}>
              <div className={`w-2 h-2 rounded-full ${currentPhase === 'artist' ? 'bg-duo-artist animate-pulse' : 'bg-white/20'}`} />
              Artist
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 brain-glow">🧠</div>
              <h2 className="text-xl font-semibold mb-2">Ready to think together</h2>
              <p className="text-white/60">
                Your message will pass through Logic and Artist hemispheres.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-appear ${
                message.role === 'user' ? 'flex justify-end' : ''
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-duo-accent text-white'
                    : 'bg-white/10'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Processing details (if enabled and available) */}
                {showProcessing && message.processing && message.role === 'assistant' && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm">
                    {message.processing.logic && (
                      <div>
                        <div className="flex items-center gap-2 text-duo-logic mb-1">
                          <span>🔬</span> Logic output
                        </div>
                        <div className="text-white/60 text-xs bg-white/5 rounded p-2 font-mono">
                          {message.processing.logic}
                        </div>
                      </div>
                    )}
                    {message.processing.artist && (
                      <div>
                        <div className="flex items-center gap-2 text-duo-artist mb-1">
                          <span>🎨</span> Artist refinement
                        </div>
                        <div className="text-white/60 text-xs bg-white/5 rounded p-2">
                          Final output shown above
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-white/60">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-duo-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-duo-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-duo-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">
                {currentPhase === 'logic' ? 'Logic analyzing...' : 'Artist refining...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 py-3 px-4 bg-white/10 rounded-xl border border-white/20 focus:border-duo-accent outline-none resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="py-3 px-6 bg-duo-accent hover:bg-duo-accent/80 rounded-xl font-semibold transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <div className="text-center mt-2 text-xs text-white/40">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
