import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { provider, apiKey, model } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key required' });
    }

    // Test the connection based on provider
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-5',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      
      if (res.ok) {
        return NextResponse.json({ success: true });
      } else {
        const error = await res.json();
        return NextResponse.json({ 
          success: false, 
          error: error.error?.message || 'Invalid API key or model' 
        });
      }
    } 
    
    else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      
      if (res.ok) {
        return NextResponse.json({ success: true });
      } else {
        const error = await res.json();
        return NextResponse.json({ 
          success: false, 
          error: error.error?.message || 'Invalid API key or model' 
        });
      }
    }
    
    else {
      return NextResponse.json({ success: false, error: 'Unknown provider' });
    }
  } catch (error) {
    console.error('Test key error:', error);
    return NextResponse.json({ success: false, error: 'Connection failed' });
  }
}
