import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      headers: {
        'User-Agent': 'FreeVPN/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP');
    }
    
    const data = await response.json();
    return NextResponse.json({ ip: data.ip });
  } catch (error) {
    return NextResponse.json({ ip: '127.0.0.1' });
  }
}
