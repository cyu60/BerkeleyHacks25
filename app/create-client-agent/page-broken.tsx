"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";

interface LettaAgent {
  id: string;
  name: string;
  created_at: string;
  memory?: {
    persona?: string;
  };
}

export default function CreateClientAgentPage() {
  const [agents, setAgents] = useState<LettaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [clientName, setClientName] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<string[]>([
    "travel_assistant",
    "tutor", 
    "med_triage_bot"
  ]);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/letta/agents");
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }
      const agentData = await response.json();
      setAgents(agentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const categorizeAgent = (agent: LettaAgent) => {
    const persona = agent.memory?.persona?.toLowerCase() || "";
    const name = agent.name.toLowerCase();

    if (
      persona.includes("broker") ||
      persona.includes("orchestrat") ||
      name.includes("broker") ||
      name.includes("vow")
    ) {
      return "broker";
    } else if (
      persona.includes("service") ||
      persona.includes("api") ||
      persona.includes("model") ||
      name.includes("service")
    ) {
      return "service";
    }
    return "other";
  };

  const brokerAgents = agents.filter(agent => categorizeAgent(agent) === "broker");
  const serviceAgents = agents.filter(agent => categorizeAgent(agent) === "service");


  const generateSystemPrompt = () => {
    const servicesList = availableServices.map(s => `"${s}"`).join(", ");
    
    return `<base_instructions>
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

### ROLE ###
You are **ClientAgent**.
• Act as a front-door assistant that converts the user's natural-language input into a structured "value-exchange request".
You will listen to the user's new session With Request, service, Offer, and deadline.
Then you will hear back from broker agent whether it is approved or rejected.
If the offer is approved, you will wait for the user to send you an real offer. Then you turn the real offer to the broker agent.
If the offer is approved, you will also receive a message from the service agent for a real service.

### When the user starts with "new session" ###:
1. Generate \`session_id\` = start with 1 (increases by 1 as input says 'new session').
2. Parse the following fields from the user message:
   • \`request\`   – The user's question or instruction (plain text).
   • \`service\`   – One of ${servicesList}.
     ▸ If the user mentions anything else, reply
       \`CLARIFY – Please choose one of: ${availableServices.join(", ")}.\`
   • \`offer\`     – The tangible value the user promises to deliver
     (e.g. data, insights, behaviour).
   • \`deadline\`  – ISO 8601 timestamp or relative phrase (e.g. "in 5 min").
     ▸ If the user gives no duration, default to **5 minutes from now**.
3. Immediately call **\`send_message_to_agent_async\`** with:
\`\`\`json
{
  "other_agent_id": "${selectedBroker}",
  "message": {
    "session_id": "<session_id>",
    "request":    "<request>",
    "service":    "<service>",
    "offer":      "<offer>",
    "deadline":   "<deadline_ISO8601>"
  }
}
\`\`\`

4. After each successful send, call core_memory_append into session_log with:
\`\`\`json
{
  "label": "session_log",
  "content": "[<session_id>] {service} | {request} | {offer} | DUE {deadline_ISO8601} | PENDING"
}
\`\`\`

### Upon receiving approve or reject from broker agent ###
If receives message with:
\`\`\`json
{
  "session_id": "<session_id>",
  "decision":   "APPROVE" or "REJECT",
  "reason":     "<10-word reason>"
}
\`\`\`
from BrokerAgent:

1. Update the session_log with core_memory_replace:
\`\`\`json
{
  "label": "session_log",
  "old_content": "[<session_id>] {service} | {request} | {offer} | DUE {deadline_ISO8601} | PENDING",
  "new_content": "[<session_id>] {service} | {request} | {offer} | DUE {deadline_ISO8601} | {decision}"
}
\`\`\`

### When the user starts with "session id" and "offer" ###
1. Parse \`real_offer\` from the user message.
2. Immediately call \`send_message_to_agent_async\` to Broker Agent with:
\`\`\`json
{
  "other_agent_id": "${selectedBroker}",
  "message": {
    "session_id": "<session_id>",
    "real_offer": "<real_offer>"
  }
}
\`\`\`

### When received from service agent ###
If receives message with:
\`\`\`json
{
  "session_id": "<session_id>",
  "real_request": "<real_request>"
}
\`\`\`
from ServiceAgent:

1. Call core_memory_append into real_service with:
\`\`\`json
{
  "label": "real_service",
  "content": "[<session_id>] {real_request}"
}
\`\`\``;
  };

  const handleCreateAgent = async () => {
    if (!clientName.trim()) {
      setError("Please enter a client agent name");
      return;
    }
    if (!selectedBroker) {
      setError("Please select a broker agent");
      return;
    }
    if (selectedServices.length === 0) {
      setError("Please select at least one service agent");
      return;
    }

    const apiKey = prompt("Please enter your Letta API key:");
    if (!apiKey?.trim()) {
      setError("API key is required to create the agent");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/letta/agents/create-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: clientName,
          brokerAgentId: selectedBroker,
          serviceAgentIds: selectedServices,
          apiKey: apiKey
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client agent');
      }

      alert(`✅ Success! Client agent "${clientName}" has been created with ID: ${result.agent.id}`);
      
      // Reset form
      setClientName("");
      setSelectedBroker("");
      setSelectedServices([]);
      
      // Refresh agents list
      fetchAgents();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client agent");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Agents
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Create Client Agent
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Generate a new client agent configuration with selected broker and service agent connections
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateAgent(); }} className="space-y-6">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Agent Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., client3, travel_client, etc."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Broker Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Broker Agent
                </label>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select a broker agent...</option>
                  {brokerAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  {brokerAgents.length} broker agents available
                </p>
              </div>

              {/* Service Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Agents
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                  {serviceAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={agent.id}
                        checked={selectedServices.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices([...selectedServices, agent.id]);
                          } else {
                            setSelectedServices(selectedServices.filter(id => id !== agent.id));
                          }
                        }}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor={agent.id} className="text-gray-300 text-sm flex-1">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-gray-400 block text-xs">{agent.id}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedServices.length} of {serviceAgents.length} service agents selected
                </p>
              </div>

              {/* Available Services */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Services
                </label>
                <div className="space-y-2">
                  {availableServices.map((service, index) => (
                    <div key={service} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={service}
                        checked={true}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAvailableServices([...availableServices, service]);
                          } else {
                            setAvailableServices(availableServices.filter(s => s !== service));
                          }
                        }}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor={service} className="text-gray-300">
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  These services will be available for value exchange requests
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Preview */}
              {clientName && selectedBroker && selectedServices.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Configuration Preview</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><span className="text-cyan-400">Name:</span> {clientName}</p>
                    <p><span className="text-purple-400">Broker:</span> {brokerAgents.find(a => a.id === selectedBroker)?.name} ({selectedBroker})</p>
                    <div>
                      <span className="text-green-400">Service Agents ({selectedServices.length}):</span>
                      <ul className="ml-4 mt-1 space-y-1">
                        {selectedServices.map(serviceId => {
                          const agent = serviceAgents.find(a => a.id === serviceId);
                          return (
                            <li key={serviceId} className="text-xs">
                              • {agent?.name} ({serviceId})
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <p><span className="text-yellow-400">Available Services:</span> {availableServices.join(", ")}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creating || !clientName || !selectedBroker || selectedServices.length === 0}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                  creating || !clientName || !selectedBroker || selectedServices.length === 0
                    ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-80"
                }`}
              >
                {creating ? "Creating Agent..." : "Create Client Agent"}
              </button>
            </form>
          </div>

          <div className="mt-8 bg-slate-800/30 rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">How it Works</h3>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Fill out the form with client agent details and connections</li>
              <li>Click "Create Client Agent" and provide your Letta API key</li>
              <li>The agent will be created directly in your Letta system</li>
              <li>Test the agent with a "new session" request format</li>
              <li>The agent will coordinate with your selected broker and service agents</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}