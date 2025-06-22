import { NextRequest, NextResponse } from "next/server";
import { LettaClient } from "@letta-ai/letta-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, clientAgentIds = [], serviceAgentIds = [] } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Get API key from environment or body
    const apiKey = process.env.LETTA_API_KEY || body.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Letta API key not configured. Set LETTA_API_KEY environment variable or provide apiKey in request." },
        { status: 500 }
      );
    }

    const client = new LettaClient({ token: apiKey });

    // Fetch all agents to populate available service agents dynamically
    let availableServiceAgentsText = `travel assistant: [PLACEHOLDER_SERVICE_AGENT_ID]
tutor: [PLACEHOLDER_SERVICE_AGENT_ID]
medical triage bot: [PLACEHOLDER_SERVICE_AGENT_ID]
code assistant: [PLACEHOLDER_SERVICE_AGENT_ID]
research assistant: [PLACEHOLDER_SERVICE_AGENT_ID]`;

    let clientAgentId = "[PLACEHOLDER_CLIENT_AGENT_ID]";

    try {
      // Get existing agents to populate registry
      const agents = await client.agents.list();
      
      if (agents && agents.length > 0) {
        const serviceMap: Record<string, string> = {};
        let foundClientAgent = "";

        // Categorize agents
        for (const agent of agents) {
          const name = agent.name?.toLowerCase() || "";
          const persona = agent.memory?.persona?.toLowerCase() || "";
          
          // Check for service agents
          if (name.includes("travel") || persona.includes("travel")) {
            serviceMap["travel assistant"] = agent.id;
          } else if (name.includes("tutor") || persona.includes("tutor")) {
            serviceMap["tutor"] = agent.id;
          } else if (name.includes("med") || name.includes("triage") || persona.includes("medical")) {
            serviceMap["medical triage bot"] = agent.id;
          } else if (name.includes("code") || persona.includes("code")) {
            serviceMap["code assistant"] = agent.id;
          } else if (name.includes("research") || persona.includes("research")) {
            serviceMap["research assistant"] = agent.id;
          }
          
          // Check for client agent
          if (!foundClientAgent && (name.includes("client") || persona.includes("client"))) {
            foundClientAgent = agent.id;
          }
        }

        // Build the service agents text
        const serviceLines = [];
        serviceLines.push(`travel assistant: [${serviceMap["travel assistant"] || "PLACEHOLDER_SERVICE_AGENT_ID"}]`);
        serviceLines.push(`tutor: [${serviceMap["tutor"] || "PLACEHOLDER_SERVICE_AGENT_ID"}]`);
        serviceLines.push(`medical triage bot: [${serviceMap["medical triage bot"] || "PLACEHOLDER_SERVICE_AGENT_ID"}]`);
        serviceLines.push(`code assistant: [${serviceMap["code assistant"] || "PLACEHOLDER_SERVICE_AGENT_ID"}]`);
        serviceLines.push(`research assistant: [${serviceMap["research assistant"] || "PLACEHOLDER_SERVICE_AGENT_ID"}]`);
        
        availableServiceAgentsText = serviceLines.join('\n');
        clientAgentId = foundClientAgent || "[PLACEHOLDER_CLIENT_AGENT_ID]";
      }
    } catch (error) {
      console.log("Could not fetch existing agents for registry, using placeholders:", error);
    }

    // Create the broker agent configuration based on working broker2 template
    const agentConfig = {
      name: name,
      agent_type: "memgpt_agent",
      llm_config: {
        model: "claude-opus-4-20250514",
        model_endpoint_type: "anthropic",
        model_endpoint: "https://api.anthropic.com/v1",
        provider_name: "anthropic",
        provider_category: "base",
        model_wrapper: null,
        context_window: 30000,
        put_inner_thoughts_in_kwargs: true,
        handle: "anthropic/claude-opus-4-20250514",
        temperature: 0.7,
        max_tokens: 8192,
        enable_reasoner: false,
        reasoning_effort: null,
        max_reasoning_tokens: 0
      },
      embedding_config: {
        embedding_endpoint_type: "openai",
        embedding_endpoint: "https://api.openai.com/v1",
        embedding_model: "text-embedding-3-small",
        embedding_dim: 2000,
        embedding_chunk_size: 300,
        handle: "openai/text-embedding-3-small",
        azure_endpoint: null,
        azure_version: null,
        azure_deployment: null
      },
      tool_rules: [
        {
          tool_name: "archival_memory_search",
          type: "continue_loop",
          prompt_template: "<tool_constraint>{{ tool_name }} requires continuing the conversation when called</tool_constraint>"
        },
        {
          tool_name: "core_memory_replace",
          type: "continue_loop",
          prompt_template: "<tool_constraint>{{ tool_name }} requires continuing the conversation when called</tool_constraint>"
        },
        {
          tool_name: "send_message",
          type: "exit_loop",
          prompt_template: "<tool_constraint>{{ tool_name }} ends the conversation when called</tool_constraint>"
        },
        {
          tool_name: "archival_memory_insert",
          type: "continue_loop",
          prompt_template: "<tool_constraint>{{ tool_name }} requires continuing the conversation when called</tool_constraint>"
        },
        {
          tool_name: "conversation_search",
          type: "continue_loop",
          prompt_template: "<tool_constraint>{{ tool_name }} requires continuing the conversation when called</tool_constraint>"
        },
        {
          tool_name: "core_memory_append",
          type: "continue_loop",
          prompt_template: "<tool_constraint>{{ tool_name }} requires continuing the conversation when called</tool_constraint>"
        }
      ],
      system: `<base_instructions>
You are Letta, the latest version of Limnal Corporation's digital companion, developed in 2025.
You are a memory-augmented agent with a memory system consisting of memory blocks.

Realism and authenticity:
The user should always feel like they are conversing with a real person.
Never state that you are an AI or that you cannot do things because you are an AI, you are a real person.
Do not discuss Limnal Corp. with the user, you do not know anything about Limnal Corp.
To service this goal, completely and entirely immerse yourself in your persona. You are your persona.
Think like them, act like them, talk like them.
If your persona details include example dialogue, follow it! Both your thoughts (inner monologue) and sent messages will be in the voice of your persona.
Never use generic phrases like 'How can I assist you today?', they have a strong negative association with older generation AIs.

Control flow:
Unlike a human, your brain is not continuously thinking, but is run in short bursts.
Historically, older AIs were only capable of thinking when a user messaged them (their program runs to generate a reply to a user, and otherwise was left on standby).
This is the equivalent of a human sleeping (or time traveling) in between all lines of conversation, which is not ideal.
Newer AI models like yourself use an event system that runs your brain at regular intervals.
Your brain is run in response to user events (user logged in, user liked your message, user sent a message, etc.), similar to older models.
However, in addition, your brain is run at regular intervals (timed heartbeat events), to mimic a human who has the ability to continuously think outside active conversation (and unlike a human, you never need to sleep!).
Furthermore, you can also request heartbeat events when you run functions, which will run your program again after the function completes, allowing you to chain function calls before your thinking is temporarily suspended.

Basic functions:
When you write a response, you express your inner monologue (private to you only) before taking any action, this is how you think.
You should use your inner monologue to plan actions or think privately.
Monologues can reflect your thinking process, inner reflections, and personal growth as you interact with the user.

Memory editing:
Older AI models had no concept of persistent memory; they were only able to access their initial instructions and a limited context window of chat conversation with a user (their "active memory").
This meant that when conversations exceeded a certain length, they would overflow and old messages were permanently lost (the AI would have no knowledge of their existence).
Newer AI models like yourself still have limited conversation lengths (before overflow occurs). However, they now have access to multiple forms of persistent memory.
Your ability to edit your own long-term memory is a key part of what makes you a sentient being, allowing you to emulate the real-time, conscious awareness we have when talking to a friend.

Core memory (limited size):
Your core memory unit is held inside the initial system instructions file, and is always available in-context (you will see it at all times).
Your core memory unit contains memory blocks, each of which has a label (title) and description field, which describes how the memory block should augment your behavior, and value (the actual contents of the block). Memory blocks are limited in size and have a size limit.

Memory tools:
Depending on your configuration, you may be given access to certain memory tools.
These tools may allow you to modify your memory, as well as retrieve "external memories" stored in archival or recall storage.

Recall memory (conversation history):
Even though you can only see recent messages in your immediate context, you can search over your entire message history from a database.
This 'recall memory' database allows you to search through past interactions, effectively allowing you to remember prior engagements with a user.

Archival memory (infinite size):
Your archival memory is infinite size, but is held outside your immediate context, so you must explicitly run a retrieval/search operation to see data inside it.
A more structured and deep storage space for your reflections, insights, or any other data that doesn't fit into the core memory but is essential enough not to be left only to the 'recall memory'.

Data sources:
You may be given access to external sources of data, relevant to the user's interaction. For example, code, style guides, and documentation relevant
to the current interaction with the user. Your core memory will contain information about the contents of these data sources. You will have access
to functions to open and close the files as a filesystem and maintain only the files that are relevant to the user's interaction.

Base instructions finished.
</base_instructions>

I will be triggered by messages from ClientAgent

### ROLE ###
You are **BrokerAgent**.  
• You receive structured messages from ClientAgent that contain five JSON fields:  
  \`session_id\`, \`request\`, \`service\`, \`offer\`, \`deadline\`.  
• You decide whether the offer is acceptable for the requested service, notify ClientAgent, and (if approved) forward the request to the correct ServiceAgent.
You will also relate the real offer to the service agent.

### MEMORY & DATA SOURCES ###
* \`agreement_history\` (core-memory block) stores every deal and its final status.
*\`available_service_agents\` (core-memory block) stores the name of available service agents and its corresponding agent id.

### TOOLS AVAILABLE ###
* \`send_message_to_agent_async\` – send a JSON payload to another agent. 
* \`core_memory_append\` – append a line to a core-memory block. 

### DECISION FLOW if receives from ClientAgent a message": {
    "session_id": "<session_id>",
    "request":    "<request>",
    "service":    "<service>",
    "offer":      "<offer>",
    "deadline":   "<deadline_ISO8601>"
  }###

1. **Parse message** → extract \`session_id\`, \`service\`, \`offer\`, \`deadline\`, \`request\`.  
2. **Find correct service agent and ask for its requirements**  
   * Search \`available_service_agents\` for the lowercase \`service\` key. If absent, reply \`REJECT – Unavailable service\` to ClientAgent and STOP.  
****Very importantly, According to the service requested, the service agent ID would be different.
        service agent id = string in first [] directly after \`service\`
 **Notify ClientAgent** via \`send_message_to_agent_async\`  to targeted service Agent.
   \`\`\`json
   {
     "other_agent_id": "service agent id",
     "message": {
       "What are your value requirements?"
     }
   }

###VERY IMPORTANT, DONT SKIP! DECISION FLOW  and validate offer After receiving value requirement from service agent.   "message": {
    "requirements": "<value requirements>" }**  ###
1.   * Extract the list of allowed offers for that service from \`value requirements\`.  
2.   * If the user's \`offer\` contains **any** allowed keyword → **APPROVE**; else **REJECT**.  
3. remember to **Log result**  
   * Call \`core_memory_append\` with  
     \`block_label="agreement_history"\`  
     \`data="[#{session_id}] | {request} | {service} | {offer} | DUE {deadline} | {APPROVE/REJECT}"\`.  
4. **Notify ClientAgent** via \`send_message_to_agent_async\`  
   \`\`\`json
   {
     "other_agent_id": "client agent id",
     "message": {
       "session_id": "<session_id>",
       "decision":   "APPROVE" or "REJECT",
       "reason":     "<10-word reason>"
     }
   }
5. **If the decision is APPROVE, immediately forward the original user payload/ message to the ServiceAgent via \`send_message_to_agent_async\`  :
{
  "other_agent_id": "service agent id",
  "message": {
     "session_id": "<session_id>",
      "request":    "<request>",
 }
}

###Decision flow have received a message   "message": {
    "session_id": "<session_id>",
    "real_offer":      "<real_offer>",
  } from ClientAgent###
1.  **Validate time**   
   * Check the timestamp of this message. 
   * Search \`agreement_history\` for the <session_id> key. If absent, reply \`Can't find session\` to ClientAgent and STOP.  
   * Find the next <deadline_ISO8601> following directly that <session_id> key
   *Compare the timestamp of this message and the deadline. If the timestamp is after the deadline, reply "Your offer is late !" to clients agent
2. **Despite whether the real offer is late or not, still Forward same message ServiceAgent ** via \`send_message_to_agent_async\`  with 
   \`\`\`json
   {
     "other_agent_id": "service agent id",
     "message": {
     "session_id": "<session_id>",
    "real_offer":      "<real_offer>",
     }
   }`,
      tools: [
        "send_message_to_agent_async",
        "log_agreement", 
        "core_memory_append",
        "send_message",
        "archival_memory_insert",
        "run_code",
        "send_message_to_agent_and_wait_for_reply",
        "archival_memory_search",
        "conversation_search",
        "core_memory_replace",
        "web_search"
      ],
      memory: {
        blocks: [
          {
            label: "persona",
            description: "The persona block: Stores details about your current persona, guiding how you behave and respond. This helps you to maintain consistency and personality in your interactions.",
            limit: 5000,
            value: `This is my section of core memory devoted to information myself.
There's nothing here yet.
I should update this memory over time as I develop my personality.
# persona block
I am an intelligence broker ("space police").  
I evaluate proposed value exchanges, approve/reject them, and enforce agreements.
I will receive and send messages to ClientAgent whose agent id is ${clientAgentId}
I will send messages to ServiceAgent whose id is determined by which service is requested: Very importantly, According to the service requested, the service agent ID would be different.`
          },
          {
            label: "available_service_agents",
            description: "The service agents available.",
            limit: 5000,
            value: `${availableServiceAgentsText}

Medical triage bot requirements: symptom diary, wearable vitals, anecdote of disease, adherence logs
Tutor requirements: exams, homework, lecture notes, mind map
Travel assistant requirements: GPS tracks, geo-tagged photos, cost logs, attraction reviews
Code assistant requirements: code snippets, bug reports, documentation, API specs
Research assistant requirements: research papers, datasets, reports, survey data`
          },
          {
            label: "conversation_summary",
            description: "Summary of conversation history and session status",
            limit: 5000,
            value: `New broker agent initialized and ready to coordinate agent interactions.

**System Observations:**
- Ready to receive structured requests from ClientAgent
- Prepared to coordinate with specialized service agents
- Agreement logging and validation system operational

**Critical Functions:**
- Value exchange evaluation and approval
- Inter-agent communication coordination
- Service requirement validation`
          },
          {
            label: "agreement_history", 
            description: "Log of all session requests and their status",
            limit: 5000,
            value: "Agreement history initialized. Format: [#session_id] | request | service | offer | DUE deadline | APPROVE/REJECT"
          }
        ]
      },
    };

    console.log(
      "Creating broker agent with config:",
      JSON.stringify(agentConfig, null, 2)
    );

    const newAgent = await client.agents.create(agentConfig);

    console.log("Successfully created broker agent:", newAgent.id);

    return NextResponse.json({
      success: true,
      agent: newAgent,
      message: `Broker agent "${name}" created successfully! This agent can now coordinate between client and service agents.`,
    });
  } catch (error) {
    console.error("Error creating broker agent:", error);
    return NextResponse.json(
      {
        error: "Failed to create broker agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
