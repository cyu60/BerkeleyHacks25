import { NextResponse } from 'next/server';
import { LettaClient } from '@letta-ai/letta-client';

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
    
    // Initialize Letta client
    const client = new LettaClient({ token: apiKey });
    
    // Use the client to retrieve core memory for the agent
    console.log(`Retrieving core memory for agent: ${agentId}`);
    const coreMemory = await client.agents.coreMemory.retrieve(agentId);
    
    console.log('Core memory retrieved:', JSON.stringify(coreMemory, null, 2));
    
    // Convert the core memory response to the expected format
    const blocks = [];
    
    // Handle the blocks array from the Letta client response
    if (coreMemory.blocks && Array.isArray(coreMemory.blocks)) {
      for (const block of coreMemory.blocks) {
        blocks.push({
          id: block.id,
          label: block.label,
          value: block.value,
          user_id: agentId,
          description: block.description,
          limit: block.limit,
          readOnly: block.readOnly
        });
      }
    }
    
    // Handle file blocks if they exist
    if (coreMemory.fileBlocks && Array.isArray(coreMemory.fileBlocks)) {
      for (const block of coreMemory.fileBlocks) {
        blocks.push({
          id: block.id,
          label: block.label,
          value: block.value,
          user_id: agentId,
          description: block.description,
          limit: block.limit,
          readOnly: block.readOnly
        });
      }
    }
    
    console.log('Formatted blocks:', blocks);
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error fetching agent core memory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch core memory from Letta API' },
      { status: 500 }
    );
  }
}