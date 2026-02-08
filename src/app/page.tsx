'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Provider = 'anthropic' | 'openai' | 'other';

interface HemisphereConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  tested: boolean;
  testing: boolean;
  error: string | null;
}

const PROVIDER_INFO = {
  anthropic: {
    name: 'Anthropic Claude',
    models: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-sonnet-4-5',
    keyPrefix: 'sk-ant-',
    description: 'Known for precise reasoning and careful analysis'
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    keyPrefix: 'sk-',
    description: 'Strong all-around with creative flair'
  },
  other: {
    name: 'Other Provider',
    models: [],
    defaultModel: '',
    keyPrefix: '',
    description: 'Bring your own endpoint'
  }
};

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  
  const [logic, setLogic] = useState<HemisphereConfig>({
    provider: 'anthropic',
    apiKey: '',
    model: PROVIDER_INFO.anthropic.defaultModel,
    tested: false,
    testing: false,
    error: null
  });
  
  const [artist, setArtist] = useState<HemisphereConfig>({
    provider: 'openai',
    apiKey: '',
    model: PROVIDER_INFO.openai.defaultModel,
    tested: false,
    testing: false,
    error: null
  });

  // Check if config already exists
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setConfigExists(true);
        } else {
          setConfigExists(false);
        }
      })
      .catch(() => setConfigExists(false));
  }, []);

  const testConnection = async (hemisphere: 'logic' | 'artist') => {
    const config = hemisphere === 'logic' ? logic : artist;
    const setConfig = hemisphere === 'logic' ? setLogic : setArtist;
    
    setConfig(prev => ({ ...prev, testing: true, error: null }));
    
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setConfig(prev => ({ ...prev, tested: true, testing: false }));
      } else {
        setConfig(prev => ({ 
          ...prev, 
          tested: false, 
          testing: false, 
          error: data.error || 'Connection failed' 
        }));
      }
    } catch (err) {
      setConfig(prev => ({ 
        ...prev, 
        tested: false, 
        testing: false, 
        error: 'Network error' 
      }));
    }
  };

  const saveConfig = async () => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logic: {
          provider: logic.provider,
          apiKey: logic.apiKey,
          model: logic.model
        },
        artist: {
          provider: artist.provider,
          apiKey: artist.apiKey,
          model: artist.model
        }
      })
    });
    
    if (res.ok) {
      router.push('/chat');
    }
  };

  // Loading state
  if (configExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl brain-glow">🧠</div>
      </div>
    );
  }

  // Already configured - offer to reconfigure or go to chat
  if (configExists && step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 rounded-2xl p-8 backdrop-blur border border-white/10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 brain-glow">🧠</div>
            <h1 className="text-3xl font-bold">Duotronics</h1>
            <p className="text-white/60 mt-2">Your dual mind is ready</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/chat')}
              className="w-full py-3 px-4 bg-duo-accent hover:bg-duo-accent/80 rounded-xl font-semibold transition"
            >
              Launch Chat →
            </button>
            <button
              onClick={() => { setConfigExists(false); setStep(0); }}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
            >
              Reconfigure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white/5 rounded-2xl p-8 backdrop-blur border border-white/10">
        
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="text-6xl mb-4 brain-glow">🧠</div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Duotronics</h1>
            <p className="text-white/60 mb-8">
              Two hemispheres. One voice.<br />
              Let's set up your dual mind.
            </p>
            <button
              onClick={() => setStep(1)}
              className="py-3 px-8 bg-duo-accent hover:bg-duo-accent/80 rounded-xl font-semibold transition"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Step 1: Logic Hemisphere */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-duo-logic/20 flex items-center justify-center logic-glow">
                <span className="text-2xl">🔬</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Logic Hemisphere</h2>
                <p className="text-white/60 text-sm">Handles reasoning, structure, facts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <select
                  value={logic.provider}
                  onChange={(e) => {
                    const provider = e.target.value as Provider;
                    setLogic(prev => ({
                      ...prev,
                      provider,
                      model: PROVIDER_INFO[provider].defaultModel,
                      tested: false,
                      error: null
                    }));
                  }}
                  className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/20 focus:border-duo-logic outline-none"
                >
                  <option value="anthropic">Anthropic Claude (Recommended)</option>
                  <option value="openai">OpenAI</option>
                </select>
                <p className="text-white/40 text-xs mt-1">
                  {PROVIDER_INFO[logic.provider].description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={logic.apiKey}
                  onChange={(e) => setLogic(prev => ({ 
                    ...prev, 
                    apiKey: e.target.value, 
                    tested: false,
                    error: null 
                  }))}
                  placeholder={`${PROVIDER_INFO[logic.provider].keyPrefix}...`}
                  className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/20 focus:border-duo-logic outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={logic.model}
                  onChange={(e) => setLogic(prev => ({ ...prev, model: e.target.value, tested: false }))}
                  className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/20 focus:border-duo-logic outline-none"
                >
                  {PROVIDER_INFO[logic.provider].models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {logic.error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm">
                  {logic.error}
                </div>
              )}

              <button
                onClick={() => testConnection('logic')}
                disabled={!logic.apiKey || logic.testing}
                className="w-full py-2 px-4 bg-duo-logic/20 hover:bg-duo-logic/30 border border-duo-logic/50 rounded-lg font-medium transition disabled:opacity-50"
              >
                {logic.testing ? 'Testing...' : logic.tested ? '✓ Connected' : 'Test Connection'}
              </button>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!logic.tested}
                className="flex-1 py-2 px-4 bg-duo-accent hover:bg-duo-accent/80 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Artist Hemisphere */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-duo-artist/20 flex items-center justify-center artist-glow">
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Artist Hemisphere</h2>
                <p className="text-white/60 text-sm">Handles voice, creativity, humanity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <select
                  value={artist.provider}
                  onChange={(e) => {
                    const provider = e.target.value as Provider;
                    setArtist(prev => ({
                      ...prev,
                      provider,
                      model: PROVIDER_INFO[provider].defaultModel,
                      tested: false,
                      error: null
                    }));
                  }}
                  className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/20 focus:border-duo-artist outline-none"
                >
                  <option value="openai">OpenAI (Recommended)</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
                <p className="text-white/40 text-xs mt-1">
                  {PROVIDER_INFO[artist.provider].description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={artist.apiKey}
                  onChange={(e) => setArtist(prev => ({ 
                    ...prev, 
                    apiKey: e.target.value, 
                    tested: false,
                    error: null 
                  }))}
                  placeholder={`${PROVIDER_INFO[artist.provider].keyPrefix}...`}
                  className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/20 focus:border-duo-artist outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={artist.model}
                  onChange={(e) => setArtist(prev => ({ ...prev, model: e.target.value, tested: false }))}
                  className="w-full py-2 px-3 bg-white/10 rounded-lg border border-white/20 focus:border-duo-artist outline-none"
                >
                  {PROVIDER_INFO[artist.provider].models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {artist.error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm">
                  {artist.error}
                </div>
              )}

              <button
                onClick={() => testConnection('artist')}
                disabled={!artist.apiKey || artist.testing}
                className="w-full py-2 px-4 bg-duo-artist/20 hover:bg-duo-artist/30 border border-duo-artist/50 rounded-lg font-medium transition disabled:opacity-50"
              >
                {artist.testing ? 'Testing...' : artist.tested ? '✓ Connected' : 'Test Connection'}
              </button>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!artist.tested}
                className="flex-1 py-2 px-4 bg-duo-accent hover:bg-duo-accent/80 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-6xl mb-4 brain-glow">🧠</div>
            <h2 className="text-2xl font-bold mb-2">Your Duotronic Mind is Ready!</h2>
            <p className="text-white/60 mb-6">
              Logic and Artist hemispheres configured.
            </p>
            
            <div className="flex gap-4 justify-center mb-8">
              <div className="px-4 py-2 bg-duo-logic/20 rounded-lg border border-duo-logic/50">
                <div className="text-xs text-white/60">Logic</div>
                <div className="font-mono text-sm">{logic.model}</div>
              </div>
              <div className="px-4 py-2 bg-duo-artist/20 rounded-lg border border-duo-artist/50">
                <div className="text-xs text-white/60">Artist</div>
                <div className="font-mono text-sm">{artist.model}</div>
              </div>
            </div>

            <button
              onClick={saveConfig}
              className="py-3 px-8 bg-duo-accent hover:bg-duo-accent/80 rounded-xl font-semibold transition"
            >
              Launch Chat →
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i === step ? 'bg-duo-accent' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
