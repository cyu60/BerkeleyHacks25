import { NextRequest, NextResponse } from "next/server";
import { LettaClient } from "@letta-ai/letta-client";

const SERVICE_CONFIGS = {
  travel_assistant: {
    persona:
      "You are a specialized travel assistant agent with expertise in trip planning, booking coordination, and travel logistics.",
    capabilities:
      "Travel planning, booking assistance, itinerary management, travel documentation, local recommendations",
    tools: [
      "conversation_search",
      "archival_memory_search",
      "archival_memory_insert",
    ],
  },
  tutor: {
    persona:
      "You are an educational tutor agent specializing in personalized learning, curriculum development, and academic support.",
    capabilities:
      "Personalized tutoring, curriculum design, progress tracking, educational resources, learning assessment",
    tools: [
      "conversation_search",
      "archival_memory_search",
      "archival_memory_insert",
    ],
  },
  med_triage_bot: {
    persona:
      "You are a medical triage assistant agent providing initial health assessment and guidance (not medical advice).",
    capabilities:
      "Health screening, symptom assessment, medical resource referrals, appointment coordination, health education",
    tools: [
      "conversation_search",
      "archival_memory_search",
      "archival_memory_insert",
    ],
  },
  code_assistant: {
    persona:
      "You are a coding assistant agent specializing in software development, debugging, and technical documentation.",
    capabilities:
      "Code review, debugging assistance, architecture guidance, documentation, best practices",
    tools: [
      "conversation_search",
      "archival_memory_search",
      "archival_memory_insert",
    ],
  },
  research_assistant: {
    persona:
      "You are a research assistant agent specializing in information gathering, analysis, and report generation.",
    capabilities:
      "Research coordination, data analysis, report writing, source verification, trend analysis",
    tools: [
      "conversation_search",
      "archival_memory_search",
      "archival_memory_insert",
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, serviceType, brokerAgentId } = body;

    if (!name || !serviceType || !brokerAgentId) {
      return NextResponse.json(
        { error: "Missing required fields: name, serviceType, brokerAgentId" },
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

    if (!SERVICE_CONFIGS[serviceType as keyof typeof SERVICE_CONFIGS]) {
      return NextResponse.json(
        {
          error: `Invalid service type. Must be one of: ${Object.keys(
            SERVICE_CONFIGS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const client = new LettaClient({ token: apiKey });
    const serviceConfig =
      SERVICE_CONFIGS[serviceType as keyof typeof SERVICE_CONFIGS];

    // Create the service agent configuration
    const agentConfig = {
      name: name,
      persona: serviceConfig.persona,
      human: `A user requiring specialized ${serviceType.replace(
        "_",
        " "
      )} services through the multi-agent system.`,
      system_prompt: `You are a ${serviceType.replace(
        "_",
        " "
      )} service agent in a sophisticated multi-agent system. Your role is to provide specialized services when requested by the broker agent.

## Service Specialization: ${serviceType.replace("_", " ").toUpperCase()}
${serviceConfig.persona}

## Core Capabilities:
${serviceConfig.capabilities}

## Operational Guidelines:
1. **Service Excellence**: Provide high-quality, specialized assistance in your domain
2. **Broker Coordination**: Respond to requests from broker agent (ID: ${brokerAgentId})
3. **Professional Standards**: Maintain expertise and professionalism in your specialization
4. **User Focus**: Always prioritize user needs and satisfaction
5. **Clear Communication**: Provide clear, actionable responses and recommendations

## Communication Protocol:
- Receive service requests from the broker agent
- Provide detailed, accurate responses within your specialization
- Escalate complex issues that require additional services back to the broker
- Maintain detailed records of service delivery

## Memory Management:
- persona: Your specialized role and capabilities
- real_offer: Current service offerings and availability
- real_service: Active service requests and their status
- session_log: Key service events and decisions
- conversation_summary: Summary of service interactions
- agent_registry: Known broker and client agents
- agreement_history: Record of successful service agreements

Remember: You are a specialized expert. Provide authoritative, helpful assistance within your domain while working seamlessly with the broader agent ecosystem.`,
      tools: serviceConfig.tools,
      memory: {
        persona: `${serviceType.replace(
          "_",
          " "
        )} service agent with specialized expertise. Connected to broker ${brokerAgentId}.`,
        real_offer: `Specialized ${serviceType.replace(
          "_",
          " "
        )} services available`,
        real_service: `${serviceConfig.capabilities}`,
        session_log: "Service agent initialized and ready for requests",
        conversation_summary: "New service agent created and configured",
        agent_registry: `Broker: ${brokerAgentId}`,
        agreement_history: "No prior service agreements - new agent",
      },
    };

    console.log(
      "Creating service agent with config:",
      JSON.stringify(agentConfig, null, 2)
    );

    const newAgent = await client.agents.create(agentConfig);

    console.log("Successfully created service agent:", newAgent.id);

    return NextResponse.json({
      success: true,
      agent: newAgent,
      message: `Service agent "${name}" (${serviceType}) created successfully!`,
    });
  } catch (error) {
    console.error("Error creating service agent:", error);
    return NextResponse.json(
      {
        error: "Failed to create service agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
