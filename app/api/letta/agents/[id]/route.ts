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
    
    console.log('==========================================');
    console.log('🤖 AGENT DETAIL REQUEST');
    console.log('==========================================');
    console.log('Agent ID:', agentId);
    console.log('Timestamp:', new Date().toISOString());
    
    const response = await fetch(`https://api.letta.com/v1/agents/${agentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ Agent fetch failed:', response.status, response.statusText);
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      throw new Error(`Letta API error: ${response.status} ${response.statusText}`);
    }

    const agent = await response.json();
    
    console.log('✅ FULL AGENT INFORMATION:');
    console.log('==========================================');
    console.log('Basic Info:');
    console.log('- ID:', agent.id);
    console.log('- Name:', agent.name);
    console.log('- Created:', agent.created_at);
    console.log('- Updated:', agent.last_updated_at);
    console.log('- Description:', agent.description || 'None');
    
    console.log('\nMemory Structure:');
    if (agent.memory) {
      console.log('- Memory Object:', JSON.stringify(agent.memory, null, 2));
    } else {
      console.log('- Memory: Not available in basic agent data');
    }
    
    console.log('\nTools (' + (agent.tools?.length || 0) + ' total):');
    if (agent.tools && agent.tools.length > 0) {
      agent.tools.forEach((tool: string | { name?: string; tool_type?: string; description?: string }, index: number) => {
        if (typeof tool === 'string') {
          console.log(`  ${index + 1}. ${tool} (string)`);
        } else {
          console.log(`  ${index + 1}. ${tool.name || tool.tool_type || 'Unnamed'} (${tool.tool_type || 'unknown type'})`);
          if (tool.description) {
            console.log(`     Description: ${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}`);
          }
        }
      });
    } else {
      console.log('- No tools configured');
    }
    
    console.log('\nSystem Configuration:');
    if (agent.system) {
      console.log('- System prompt length:', agent.system.length, 'characters');
      console.log('- System prompt preview:', agent.system.substring(0, 200) + (agent.system.length > 200 ? '...' : ''));
    } else {
      console.log('- No system configuration');
    }
    
    console.log('\nMetadata:');
    if (agent.metadata) {
      console.log('- Metadata:', JSON.stringify(agent.metadata, null, 2));
    } else {
      console.log('- No metadata');
    }
    
    console.log('\nModel Information:');
    console.log('- Model:', agent.llm_config?.model || 'Not specified');
    console.log('- Model endpoint:', agent.llm_config?.model_endpoint_type || 'Not specified');
    console.log('- Context window:', agent.llm_config?.context_window || 'Not specified');
    
    console.log('\nRAW AGENT JSON:');
    console.log(JSON.stringify(agent, null, 2));
    console.log('==========================================');
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error fetching Letta agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent from Letta API' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    console.log('==========================================');
    console.log('🗑️ AGENT DELETE REQUEST');
    console.log('==========================================');
    console.log('Agent ID:', agentId);
    console.log('Timestamp:', new Date().toISOString());
    
    const response = await fetch(`https://api.letta.com/v1/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ Agent deletion failed:', response.status, response.statusText);
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      throw new Error(`Letta API error: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Agent deleted successfully');
    console.log('==========================================');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Agent deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting Letta agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent from Letta API' },
      { status: 500 }
    );
  }
}