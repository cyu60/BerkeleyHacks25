import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.LETTA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Letta API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.letta.com/v1/agents', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Letta API error: ${response.status} ${response.statusText}`);
    }

    const agents = await response.json();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching Letta agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents from Letta API' },
      { status: 500 }
    );
  }
}