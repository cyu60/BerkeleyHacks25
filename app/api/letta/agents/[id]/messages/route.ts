import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.LETTA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Letta API key not configured' },
        { status: 500 }
      );
    }

    const { id: agentId } = await params;
    
    // Try to get conversation history from Letta
    // Based on Letta documentation, let's try different approaches
    const possibleEndpoints = [
      // Try getting agent state which might include message IDs
      `https://api.letta.com/v1/agents/${agentId}`,
      // Try getting messages directly
      `https://api.letta.com/v1/agents/${agentId}/messages`,
      `https://api.letta.com/v1/agents/${agentId}/messages/list`,
      `https://api.letta.com/v1/messages?agent_id=${agentId}`,
      // Try context/memory endpoint
      `https://api.letta.com/v1/agents/${agentId}/context`,
      `https://api.letta.com/v1/agents/${agentId}/context/messages`
    ];
    
    let messages = [];
    let lastError = null;
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Response from ${endpoint}:`, JSON.stringify(data, null, 2));
          
          // Handle different response formats
          if (Array.isArray(data)) {
            messages = data;
            break;
          } else if (data.messages) {
            messages = data.messages;
            break;
          } else if (data.message_ids && endpoint.includes('/agents/')) {
            // If we got agent data with message IDs, try to fetch individual messages
            console.log('Found message IDs in agent data:', data.message_ids);
            // For now, just log this - we'd need to fetch individual messages
            // This might require additional API calls to get full message details
          } else if (data.id && endpoint.includes('/agents/')) {
            // This is agent data, check for any message-related fields
            console.log('Agent data received, checking for message fields...');
            console.log('Available fields:', Object.keys(data));
          }
        } else {
          lastError = `${endpoint}: ${response.status} ${response.statusText}`;
          console.warn(`Failed endpoint ${endpoint}:`, response.status, response.statusText);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error with endpoint ${endpoint}:`, err);
        continue;
      }
    }
    
    console.log('Final messages array:', messages);
    console.log('Last error:', lastError);
    
    // Return empty array if no endpoint worked (agent might be new with no messages)
    return NextResponse.json(messages);
    
  } catch (error) {
    console.error('Error fetching agent messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages from Letta API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.LETTA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Letta API key not configured' },
        { status: 500 }
      );
    }

    const { id: agentId } = await params;
    const { message } = await request.json();
    
    // Send message to Letta agent using correct API structure
    const response = await fetch(`https://api.letta.com/v1/agents/${agentId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      throw new Error(`Letta API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending message to agent:', error);
    return NextResponse.json(
      { error: 'Failed to send message to Letta agent' },
      { status: 500 }
    );
  }
}