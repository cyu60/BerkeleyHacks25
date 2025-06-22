import { NextRequest, NextResponse } from "next/server";
import { LettaClient } from "@letta-ai/letta-client";

interface LettaAgent {
  id: string;
  name: string;
  created_at?: string;
  memory?: {
    human?: string;
    persona?: string;
  };
}

interface LettaMessage {
  id: string;
  agent_id: string;
  message_type:
    | "user_message"
    | "assistant_message"
    | "reasoning_message"
    | "tool_call_message"
    | "tool_return_message"
    | "system_message";
  content?: string;
  reasoning?: string;
  tool_call?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  tool_return?: string;
  created_at?: string;
  date?: string;
}

interface ConversationFlow {
  session_id?: string;
  timestamp: string;
  messages: Array<{
    agent: LettaAgent;
    message: LettaMessage;
    sequence: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "24h";

    const apiKey = process.env.LETTA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Letta API key not configured" },
        { status: 500 }
      );
    }

    const client = new LettaClient({ token: apiKey });

    console.log(`🕐 Fetching conversations for ${timeRange}`);

    // Simple time range calculation
    const now = new Date();
    let startTime: Date;
    switch (timeRange) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch all agents
    const agents = await client.agents.list();
    console.log(`📋 Found ${agents.length} agents`);

    // Collect ALL messages from ALL agents
    const allMessages: Array<{
      agent: LettaAgent;
      message: LettaMessage;
    }> = [];

    for (const agent of agents) {
      try {
        console.log(`🔍 ${agent.name}...`);

        const possibleEndpoints = [
          `https://api.letta.com/v1/agents/${agent.id}/messages`,
          `https://api.letta.com/v1/agents/${agent.id}/messages/list`,
          `https://api.letta.com/v1/messages?agent_id=${agent.id}`,
        ];

        let messages: unknown[] = [];

        for (const endpoint of possibleEndpoints) {
          try {
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();

              if (Array.isArray(data)) {
                messages = data;
                break;
              } else if (data.messages && Array.isArray(data.messages)) {
                messages = data.messages;
                break;
              }
            }
          } catch {
            continue;
          }
        }

        // Add messages from this agent
        const agentData: LettaAgent = {
          id: agent.id,
          name: agent.name,
          created_at: agent.createdAt?.toISOString(),
          memory: {
            human: agent.memory?.blocks?.find((b) => b.label === "human")
              ?.value,
            persona: agent.memory?.blocks?.find((b) => b.label === "persona")
              ?.value,
          },
        };

        messages.forEach((msg: unknown) => {
          allMessages.push({
            agent: agentData,
            message: {
              ...(msg as Record<string, unknown>),
              agent_id: agent.id,
            } as LettaMessage,
          });
        });
      } catch (error) {
        console.warn(`❌ ${agent.name}: ${error}`);
      }
    }

    console.log(`📊 Collected ${allMessages.length} total messages`);

    // Simple filtering: remove system messages and apply time filter
    const validMessages = allMessages.filter(({ message }) => {
      // Skip system messages
      if (message.message_type === "system_message") {
        return false;
      }

      // Get timestamp from any available field
      const timestamp =
        (message as Record<string, unknown>).created_at ||
        (message as Record<string, unknown>).date ||
        (message as Record<string, unknown>).timestamp;
      if (!timestamp) {
        return true; // Include messages without timestamps
      }

      const msgTime = new Date(timestamp as string);
      return msgTime >= startTime;
    });

    console.log(`✅ ${validMessages.length} valid messages after filtering`);

    // SIMPLE CHRONOLOGICAL SORT - this is the key part!
    validMessages.sort((a, b) => {
      // Get timestamp from either message
      const getTime = (msg: LettaMessage) => {
        const timestamp =
          (msg as Record<string, unknown>).created_at ||
          (msg as Record<string, unknown>).date ||
          (msg as Record<string, unknown>).timestamp;
        if (!timestamp) return 0; // Put messages without timestamps first
        return new Date(timestamp as string).getTime();
      };

      return getTime(a.message) - getTime(b.message);
    });

    console.log(`🔄 Sorted ${validMessages.length} messages chronologically`);

    // Create single conversation with all messages in chronological order
    const conversationFlow: ConversationFlow = {
      timestamp: new Date().toISOString(),
      session_id: "all_agents_chronological",
      messages: validMessages.map((item, index) => ({
        agent: item.agent,
        message: item.message,
        sequence: index + 1, // Simple sequential numbering
      })),
    };

    console.log(
      `📤 Returning ${conversationFlow.messages.length} messages in pure chronological order`
    );

    return NextResponse.json([conversationFlow]);
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
