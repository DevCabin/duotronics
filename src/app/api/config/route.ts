import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CONFIG_PATH = path.join(process.cwd(), 'config.yaml');

export interface DuotronicsConfig {
  logic: {
    provider: string;
    apiKey: string;
    model: string;
  };
  artist: {
    provider: string;
    apiKey: string;
    model: string;
  };
}

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8')) as DuotronicsConfig;
      
      // Check if we have the minimum required config
      if (config?.logic?.apiKey && config?.artist?.apiKey) {
        return NextResponse.json({ 
          configured: true,
          logic: {
            provider: config.logic.provider,
            model: config.logic.model
          },
          artist: {
            provider: config.artist.provider,
            model: config.artist.model
          }
        });
      }
    }
    
    return NextResponse.json({ configured: false });
  } catch (error) {
    console.error('Config read error:', error);
    return NextResponse.json({ configured: false });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const config: DuotronicsConfig = {
      logic: {
        provider: body.logic.provider,
        apiKey: body.logic.apiKey,
        model: body.logic.model
      },
      artist: {
        provider: body.artist.provider,
        apiKey: body.artist.apiKey,
        model: body.artist.model
      }
    };
    
    fs.writeFileSync(CONFIG_PATH, yaml.dump(config), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config write error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
