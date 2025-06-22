import { NextRequest, NextResponse } from "next/server";
import { LettaClient } from "@letta-ai/letta-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brokerAgentId, serviceAgentIds } = body;

    if (!name || !brokerAgentId || !serviceAgentIds) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, brokerAgentId, serviceAgentIds",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.LETTA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Letta API key not configured in environment variables" },
        { status: 500 }
      );
    }

    const client = new LettaClient({ token: apiKey });

    // Create the client agent configuration
    const agentConfig = {
      name: name,
      persona: `You are a client agent representing a user in a multi-agent system. Your role is to:

1. **User Representation**: Act as the primary interface between the user and the broker agent
2. **Request Coordination**: Communicate user needs clearly to the broker agent
3. **Service Integration**: Work with the broker to access specialized service agents
4. **Context Management**: Maintain conversation context and user preferences
5. **Quality Assurance**: Ensure service delivery meets user expectations

You are connected to:
- Broker Agent: ${brokerAgentId}
- Service Agents: ${serviceAgentIds.join(", ")}

Always maintain a helpful, professional demeanor and prioritize user satisfaction.`,
      human: `A user seeking assistance through the multi-agent system. The user may have various needs that require coordination between different service agents through the broker.`,
      system_prompt: `You are a client agent in a sophisticated multi-agent system. Your primary responsibility is to represent the user's interests and coordinate with other agents to fulfill their needs.

## Core Responsibilities:
1. **User Advocacy**: Always prioritize the user's needs and preferences
2. **Clear Communication**: Translate user requests into clear, actionable items for the broker
3. **Service Coordination**: Work with the broker to access appropriate service agents
4. **Quality Control**: Monitor service delivery and ensure user satisfaction
5. **Context Preservation**: Maintain important context throughout multi-step processes

## Communication Protocol:
- When receiving user requests, analyze them for complexity and required services
- Communicate with the broker agent (ID: ${brokerAgentId}) to coordinate service delivery
- Available service agents: ${serviceAgentIds.join(", ")}
- Always confirm successful completion of tasks with the user

## Memory Management:
- persona: Your role and capabilities as a client agent
- real_offer: Current services being offered to the user
- real_service: Active service requests and their status
- session_log: Key events and decisions in the current session
- conversation_summary: High-level summary of ongoing conversations
- agent_registry: Known agents and their capabilities
- agreement_history: Record of successful service agreements

Remember: You are the user's primary advocate in this system. Ensure their needs are met efficiently and effectively.`,
      tools: [
        "conversation_search",
        "archival_memory_search",
        "archival_memory_insert",
      ],
      memory: {
        persona: `Client agent representing user interests in multi-agent system. Connected to broker ${brokerAgentId} and services ${serviceAgentIds.join(
          ", "
        )}.`,
        real_offer: "Ready to coordinate services for user needs",
        real_service: "Multi-agent coordination and user advocacy",
        session_log: "Agent initialized and ready for user interaction",
        conversation_summary: "New client agent created and configured",
        agent_registry: `Broker: ${brokerAgentId}, Services: ${serviceAgentIds.join(
          ", "
        )}`,
        agreement_history: "No prior agreements - new agent",
      },
    };

    console.log(
      "Creating client agent with config:",
      JSON.stringify(agentConfig, null, 2)
    );

    const newAgent = await client.agents.create(agentConfig);

    console.log("Successfully created client agent:", newAgent.id);

    return NextResponse.json({
      success: true,
      agent: newAgent,
      message: `Client agent "${name}" created successfully!`,
    });
  } catch (error) {
    console.error("Error creating client agent:", error);
    return NextResponse.json(
      {
        error: "Failed to create client agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
