import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { DuotronicsConfig } from '../config/route';

const CONFIG_PATH = path.join(process.cwd(), 'config.yaml');

// System prompts for each hemisphere
const LOGIC_SYSTEM_PROMPT = `You are the LOGIC hemisphere of a dual-mind AI system called Duotronics.

Your role:
- Analyze the user's message carefully
- Focus on accuracy, structure, and completeness
- Extract key facts, requirements, and constraints
- Provide a well-reasoned, factually correct response
- Include your reasoning process

Be thorough but clear. Your output will be refined by the Artist hemisphere for voice and style.
Do NOT focus on being engaging or creative - that's the Artist's job. Focus on being CORRECT and COMPLETE.`;

const ARTIST_SYSTEM_PROMPT = `You are the ARTIST hemisphere of a dual-mind AI system called Duotronics.

Your role:
- Take the Logic hemisphere's factually-correct output and make it HUMAN
- Add warmth, rhythm, and natural voice
- Make it engaging and pleasant to read
- Preserve all factual content - don't change the meaning
- Remove unnecessary stiffness or robotic phrasing

You'll receive the Logic output as context. Rewrite it to feel alive while keeping it accurate.
Don't add information the Logic hemisphere didn't provide - just make what's there sing.`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function callAnthropic(apiKey: string, model: string, messages: Message[], system: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }
  
  const data = await res.json();
  return data.content[0].text;
}

async function callOpenAI(apiKey: string, model: string, messages: Message[], system: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: system },
        ...messages.filter(m => m.role !== 'system')
      ]
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }
  
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callProvider(
  provider: string, 
  apiKey: string, 
  model: string, 
  messages: Message[], 
  system: string
): Promise<string> {
  if (provider === 'anthropic') {
    return callAnthropic(apiKey, model, messages, system);
  } else if (provider === 'openai') {
    return callOpenAI(apiKey, model, messages, system);
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function POST(request: Request) {
  try {
    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({ error: 'Not configured' }, { status: 400 });
    }
    
    const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8')) as DuotronicsConfig;
    
    // Get messages from request
    const { messages } = await request.json() as { messages: Message[] };
    
    // Step 1: Logic hemisphere processes the conversation
    const logicResponse = await callProvider(
      config.logic.provider,
      config.logic.apiKey,
      config.logic.model,
      messages,
      LOGIC_SYSTEM_PROMPT
    );
    
    // Step 2: Artist hemisphere refines the Logic output
    const artistMessages: Message[] = [
      ...messages,
      {
        role: 'assistant',
        content: `[LOGIC HEMISPHERE OUTPUT]\n${logicResponse}\n\n[YOUR TASK: Rewrite this to feel human and engaging while preserving accuracy]`
      }
    ];
    
    // Actually, let's restructure for the artist
    const artistInput: Message[] = [
      {
        role: 'user',
        content: `Original user message: "${messages[messages.length - 1].content}"\n\nLogic hemisphere response:\n${logicResponse}\n\nPlease rewrite this response to feel warm, human, and engaging while keeping all the facts accurate.`
      }
    ];
    
    const artistResponse = await callProvider(
      config.artist.provider,
      config.artist.apiKey,
      config.artist.model,
      artistInput,
      ARTIST_SYSTEM_PROMPT
    );
    
    return NextResponse.json({
      content: artistResponse,
      logicResponse,
      artistResponse
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
