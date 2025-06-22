"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

interface LettaTool {
  id?: string;
  name?: string;
  tool_type?: string;
  description?: string;
  source_type?: string;
  organization_id?: string;
  tags?: string[];
  source_code?: string;
  json_schema?: object;
  args_json_schema?: object;
  return_char_limit?: number;
  pip_requirements?: string[];
  created_by_id?: string;
  last_updated_by_id?: string;
  metadata_?: object;
}

interface LettaMemoryBlock {
  id: string;
  label: string;
  value: string;
  limit: number;
  block_type: string;
}

interface LettaAgent {
  id: string;
  name: string;
  created_at: string;
  last_updated_at: string;
  memory?: {
    human?: string;
    persona?: string;
  };
  core_memory?: LettaMemoryBlock[];
  system?: string;
  tools?: (string | LettaTool)[];
  metadata?: object;
}

interface LettaMessage {
  id: string;
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

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<LettaAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<LettaMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [showCoreMemory, setShowCoreMemory] = useState(false);
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        // Fetch agent details
        const agentResponse = await fetch(`/api/letta/agents/${agentId}`);
        if (!agentResponse.ok) {
          throw new Error(`Failed to fetch agent: ${agentResponse.statusText}`);
        }
        const agentData = await agentResponse.json();

        // Fetch core memory blocks
        try {
          const memoryResponse = await fetch(
            `/api/letta/agents/${agentId}/memory`
          );
          if (memoryResponse.ok) {
            const memoryData = await memoryResponse.json();
            console.log("Raw memory data from API:", memoryData);
            agentData.core_memory = memoryData;
            console.log("Agent data after adding core memory:", agentData);
          } else {
            console.warn(
              "Memory API returned:",
              memoryResponse.status,
              memoryResponse.statusText
            );
          }
        } catch (memErr) {
          console.warn("Could not fetch memory blocks:", memErr);
          // Fallback: use the agent's existing memory structure if available
          if (agentData.memory) {
            const fallbackBlocks = [];
            if (agentData.memory.persona) {
              fallbackBlocks.push({
                id: "persona-fallback",
                label: "persona",
                value: agentData.memory.persona,
                limit: 2000,
                block_type: "core_memory",
              });
            }
            if (agentData.memory.human) {
              fallbackBlocks.push({
                id: "human-fallback",
                label: "human",
                value: agentData.memory.human,
                limit: 2000,
                block_type: "core_memory",
              });
            }
            if (fallbackBlocks.length > 0) {
              agentData.core_memory = fallbackBlocks;
            }
          }
        }

        setAgent(agentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch agent");
        console.error("Error fetching agent:", err);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/letta/agents/${agentId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      } else {
        console.warn(
          "Could not fetch message history:",
          response.status,
          response.statusText
        );
        // Start with empty messages if history can't be loaded
        setMessages([]);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      // Start with empty messages if there's an error
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);

    // Add user message to local state immediately
    const userMessage: LettaMessage = {
      id: `user-${Date.now()}`,
      message_type: "user_message",
      content: newMessage,
      date: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage("");

    try {
      const response = await fetch(`/api/letta/agents/${agentId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Add agent's response messages to the conversation
        if (result.messages) {
          const agentMessages = result.messages.map(
            (msg: LettaMessage, index: number) => ({
              ...msg,
              id: msg.id || `agent-${Date.now()}-${index}`,
            })
          );
          setMessages((prev) => [...prev, ...agentMessages]);
        }
      } else {
        console.error("Failed to send message");
        // Remove the user message if sending failed
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove the user message if sending failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const startConversation = () => {
    setShowConversation(true);
    // Fetch existing conversation history from Letta
    fetchMessages();
  };

  const deleteAgent = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${agent?.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingAgent(true);
    try {
      const response = await fetch(`/api/letta/agents/${agentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Redirect to agents list after successful deletion
        window.location.href = "/agents";
      } else {
        const error = await response.json();
        alert(`Failed to delete agent: ${error.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting agent:", err);
      alert("Failed to delete agent. Please try again.");
    } finally {
      setDeletingAgent(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getCoreMemoryValue = (agent: LettaAgent, label: string): string => {
    if (!agent.core_memory) {
      console.log(`No core_memory found for agent ${agent.id}`);
      return "";
    }

    console.log(`Looking for memory block '${label}' in agent ${agent.id}`);
    console.log(
      "Available memory blocks:",
      agent.core_memory.map((b) => ({ label: b.label, hasValue: !!b.value }))
    );

    const block = agent.core_memory.find(
      (block) => block.label.toLowerCase() === label.toLowerCase()
    );
    const value = block?.value || "";

    console.log(
      `Memory block '${label}' value:`,
      value ? `Found (${value.length} chars)` : "Not found"
    );
    return value;
  };

  const getPersona = (agent: LettaAgent): string => {
    const corePersona = getCoreMemoryValue(agent, "persona");
    return corePersona || agent.memory?.persona || "Letta AI Agent";
  };

  const getRealOffer = (agent: LettaAgent): string => {
    // Try multiple possible memory block names for service offerings
    const possibleLabels = [
      "real_offer",
      "real_service",
      "service_offering",
      "service_description",
      "offering",
      "services",
    ];

    for (const label of possibleLabels) {
      const value = getCoreMemoryValue(agent, label);
      if (value) {
        console.log(`Found service offering in '${label}' block:`, value);
        return formatServiceOffering(value);
      }
    }

    // If no dedicated service offering block, check agent_registry for service info
    const agentRegistry = getCoreMemoryValue(agent, "agent_registry");
    if (agentRegistry) {
      console.log("Checking agent_registry for service info:", agentRegistry);
      // Extract service info from agent registry
      const lines = agentRegistry.split("\n");
      for (const line of lines) {
        if (
          line.includes("openai:") ||
          line.includes("gemini:") ||
          line.includes("booking.com:")
        ) {
          const serviceInfo = line.split(":")[1]?.trim();
          if (serviceInfo) {
            return `Service: ${serviceInfo}`;
          }
        }
      }
    }

    return "No service offering defined";
  };

  const formatServiceOffering = (rawText: string): string => {
    if (!rawText) return "No service offering defined";

    // Clean up the text and format numbered items
    const lines = rawText.split("\n").filter((line) => line.trim());
    const formattedLines = lines.map((line) => {
      // Check if line starts with [number]
      const match = line.match(/^\[(\d+)\]\s*(.+)$/);
      if (match) {
        const [, number, content] = match;
        return `${number}. ${content.trim()}`;
      }
      return line.trim();
    });

    return formattedLines.join("\n");
  };

  const getSessionLog = (agent: LettaAgent): string => {
    return (
      getCoreMemoryValue(agent, "session_log") || "No session logs available"
    );
  };

  const getConversationSummary = (agent: LettaAgent): string => {
    return (
      getCoreMemoryValue(agent, "conversation_summary") ||
      "No conversation summary available"
    );
  };

  const getAgreementHistory = (agent: LettaAgent): string => {
    return (
      getCoreMemoryValue(agent, "agreement_history") ||
      "No agreement history available"
    );
  };

  const getAgentRegistry = (agent: LettaAgent): string => {
    return (
      getCoreMemoryValue(agent, "agent_registry") ||
      "No agent registry available"
    );
  };

  const formatAgreementHistory = (rawText: string): string => {
    if (!rawText || rawText === "No agreement history available")
      return rawText;

    const lines = rawText.split("\n").filter((line) => line.trim());
    const formattedEntries = lines.map((line) => {
      // Parse format: [#number] | question | service | offer | deadline | status
      const match = line.match(
        /^\[#(\d+)\]\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/
      );
      if (match) {
        const [, number, question, service, offer, deadline, status] = match;
        const statusIcon = status.trim() === "APPROVE" ? "✅" : "❌";
        const deadlineFormatted = deadline.includes("DUE")
          ? deadline.replace("DUE ", "").trim()
          : deadline.trim();

        let formattedDeadline = deadlineFormatted;
        try {
          if (
            deadlineFormatted.includes("T") &&
            deadlineFormatted.includes("Z")
          ) {
            const date = new Date(deadlineFormatted);
            formattedDeadline = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          }
        } catch {
          // Keep original if parsing fails
        }

        return `**#${number.trim()}** ${statusIcon} **${service
          .trim()
          .toUpperCase()}**
📝 **Query:** ${question.trim()}
💼 **Offer:** ${offer.trim()}
⏰ **Deadline:** ${formattedDeadline}
🔄 **Status:** ${status.trim()}`;
      }
      return line.trim();
    });

    return formattedEntries.join("\n\n");
  };

  const formatAgentRegistry = (rawText: string): string => {
    if (!rawText || rawText === "No agent registry available") return rawText;

    const lines = rawText.split("\n").filter((line) => line.trim());
    const formattedLines = lines.map((line) => {
      if (line.startsWith("#")) {
        return `**${line.trim()}**`;
      } else if (line.includes(":")) {
        const [service, description] = line.split(":");
        return `🤖 **${service.trim()}:** ${description.trim()}`;
      }
      return line.trim();
    });

    return formattedLines.join("\n");
  };

  const formatSessionLog = (rawText: string): string => {
    if (!rawText || rawText === "No session logs available") return rawText;

    // Parse session log entries
    const lines = rawText.split("\n").filter((line) => line.trim());
    const formattedEntries = lines.map((line) => {
      // Parse format: [number] service | question | offer | deadline | status
      const match = line.match(
        /^\[(\d+)\]\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/
      );
      if (match) {
        const [, , service, question, offer, deadline, status] = match;
        const statusIcon =
          status.trim() === "APPROVE" ? "✅ APPROVED" : "❌ REJECTED";
        const deadlineFormatted = deadline.includes("DUE")
          ? deadline.replace("DUE ", "").trim()
          : deadline.trim();

        // Format the date nicely if it's an ISO string
        let formattedDeadline = deadlineFormatted;
        try {
          if (
            deadlineFormatted.includes("T") &&
            deadlineFormatted.includes("Z")
          ) {
            const date = new Date(deadlineFormatted);
            formattedDeadline = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          }
        } catch {
          // Keep original if parsing fails
        }

        return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔸 **${service.trim().toUpperCase()}** ${statusIcon}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **Query:** ${question.trim()}
💼 **Offer Context:** ${offer.trim()}
⏰ **Deadline:** ${formattedDeadline}`;
      }
      return line.trim();
    });

    return formattedEntries.join("\n\n");
  };

  // Get agent-specific memory blocks based on agent type
  const getAgentSpecificMemoryBlocks = (agent: LettaAgent) => {
    const agentType = categorizeAgent(agent);
    console.log(`Agent ${agent.name} categorized as: ${agentType}`);

    const baseBlocks = [
      {
        label: "Persona",
        value: getPersona(agent),
        show: true,
      },
    ];

    // // Check for real_offer specifically for service agents
    // const realOfferValue = getRealOffer(agent);
    // console.log(`Real offer for ${agent.name} (${agentType}):`, realOfferValue);

    // // Add agent-type specific blocks
    // if (agentType === 'client') {
    //   if (realOfferValue) {
    //     baseBlocks.push({
    //       label: 'Services Received',
    //       value: realOfferValue,
    //       show: true
    //     });
    //   }

    //   // Add session logs for client agents
    //   const sessionLogValue = getSessionLog(agent);
    //   if (sessionLogValue && sessionLogValue !== 'No session logs available') {
    //     baseBlocks.push({
    //       label: 'Session Activity',
    //       value: formatSessionLog(sessionLogValue),
    //       show: true
    //     });
    //   }
    // } else if (agentType === 'service') {
    //   // Always show service offering section for service agents, even if empty
    //   baseBlocks.push({
    //     label: 'Service Offering',
    //     value: realOfferValue || 'No service offering defined',
    //     show: true
    //   });
    //   console.log(`Added Service Offering block for ${agent.name}:`, realOfferValue || 'No service offering defined');
    // } else if (agentType === 'broker') {
    //   if (realOfferValue) {
    //     baseBlocks.push({
    //       label: 'Brokerage Focus',
    //       value: realOfferValue,
    //       show: true
    //     });
    //   }
    // }

    // console.log(`Final memory blocks for ${agent.name}:`, baseBlocks);
    return baseBlocks;
  };

  const parseSessionLog = (sessionLog: string) => {
    if (!sessionLog) return [];

    const lines = sessionLog.split("\n").filter((line) => line.trim());
    return lines
      .map((line) => {
        // Parse format: [number] service | question | offer | deadline | status
        const match = line.match(
          /^\[(\d+)\]\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/
        );
        if (match) {
          const [, , service, question, offer, deadline, status] = match;
          const deadlineFormatted = deadline.includes("DUE")
            ? deadline.replace("DUE ", "").trim()
            : deadline.trim();

          return {
            number: match[1].trim(),
            service: service.trim(),
            question: question.trim(),
            offer: offer.trim(),
            deadline: deadlineFormatted,
            status: status.trim(),
            approved: status.trim() === "APPROVE",
          };
        }
        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  };

  const getMessageDate = (message: LettaMessage): string => {
    const dateStr = message.date || message.created_at;
    if (!dateStr) return "Unknown time";

    try {
      return new Date(dateStr).toLocaleTimeString();
    } catch {
      console.warn("Invalid date format:", dateStr);
      return "Invalid date";
    }
  };

  const getAgentImageUrl = (agent: LettaAgent) => {
    const avatarStyles = [
      "avataaars",
      "bottts",
      "personas",
      "lorelei",
      "notionists",
      "rings",
    ];
    const styleIndex =
      agent.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      avatarStyles.length;
    const selectedStyle = avatarStyles[styleIndex];
    return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${agent.id}&size=128`;
  };

  const categorizeAgent = (agent: LettaAgent) => {
    const persona = agent.memory?.persona?.toLowerCase() || "";
    const name = agent.name.toLowerCase();

    if (
      persona.includes("client") ||
      persona.includes("user") ||
      persona.includes("human") ||
      name.includes("client") ||
      name.includes("user")
    ) {
      return "client";
    } else if (
      persona.includes("service") ||
      persona.includes("api") ||
      persona.includes("model") ||
      name.includes("service") ||
      name.includes("gpt") ||
      name.includes("claude")
    ) {
      return "service";
    } else if (
      persona.includes("broker") ||
      persona.includes("orchestrat") ||
      name.includes("broker") ||
      name.includes("vow")
    ) {
      return "broker";
    }
    return "general";
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case "client":
        return "from-blue-500 to-cyan-500";
      case "service":
        return "from-cyan-500 to-teal-500";
      case "broker":
        return "from-purple-500 to-blue-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-red-400 text-xl font-semibold mb-2">
            Agent Not Found
          </h2>
          <p className="text-gray-300 mb-4">
            {error || "The requested agent could not be found."}
          </p>
          <Link
            href="/agents"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
          >
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  const agentType = categorizeAgent(agent);
  const colorScheme = getAgentTypeColor(agentType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
      {/* Header */}
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Agents
          </Link>
        </div>
      </div>

      {/* Agent Profile */}
      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div
            className={`bg-gradient-to-r ${colorScheme} p-1 rounded-2xl mb-8`}
          >
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <img
                  alt={agent.name}
                  src={getAgentImageUrl(agent)}
                  width={128}
                  height={128}
                  className="rounded-full border-4 border-white/20"
                />
                <div className="text-center md:text-left">
                  <h1 className="text-4xl font-bold text-white mb-4">
                    {agent.name}
                  </h1>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${colorScheme} text-white`}
                    >
                      {agentType.charAt(0).toUpperCase() + agentType.slice(1)}{" "}
                      Agent
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                      Letta Framework
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Agent ID
                  </label>
                  <p className="text-white font-mono text-sm mt-1 bg-slate-700/50 p-2 rounded break-all">
                    {agent.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Created
                  </label>
                  <p className="text-white mt-1">
                    {new Date(agent.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Last Updated
                  </label>
                  <p className="text-white mt-1">
                    {new Date(agent.last_updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Available Tools
                  </label>
                  <p className="text-white mt-1">
                    {agent.tools?.length || 0} tools configured
                  </p>
                </div>
              </div>
            </div>

            {/* Core Memory Blocks */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Core Memory
              </h2>
              <div className="space-y-4">
                {getAgentSpecificMemoryBlocks(agent).map((block, index) => (
                  <div key={index}>
                    <label className="text-sm font-medium text-gray-400">
                      {block.label}
                    </label>
                    <div className="mt-1 bg-slate-700/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {block.value}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Additional Memory Blocks - Collapsible */}
                {(() => {
                  if (!agent.core_memory) return null;

                  // Get unique additional blocks (excluding persona)
                  const additionalBlocks = agent.core_memory
                    .filter(
                      (block) =>
                        !["persona"].includes(block.label.toLowerCase())
                    )
                    // Remove duplicates based on label
                    .filter(
                      (block, index, arr) =>
                        arr.findIndex(
                          (b) =>
                            b.label.toLowerCase() === block.label.toLowerCase()
                        ) === index
                    );

                  if (additionalBlocks.length === 0) return null;

                  return (
                    <div>
                      <button
                        onClick={() => setShowCoreMemory(!showCoreMemory)}
                        className="flex items-center justify-between w-full p-2 hover:bg-slate-700/30 rounded-lg transition-colors"
                      >
                        <label className="text-sm font-medium text-gray-400">
                          Additional Memory Blocks
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {additionalBlocks.length} blocks
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              showCoreMemory ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {showCoreMemory && (
                        <div className="mt-2 space-y-2">
                          {additionalBlocks.map((block) => (
                            <div
                              key={`${block.label}-${block.id || block.label}`}
                              className="bg-slate-700/50 rounded-lg p-3"
                            >
                              <h4 className="text-sm font-medium mb-2 text-purple-400">
                                {block.label}
                              </h4>
                              <div className="bg-slate-600/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                                  {block.value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Session Log - Only for Client Agents */}
            {categorizeAgent(agent) === "client" &&
              (() => {
                const sessionLog = getSessionLog(agent);
                const sessionEntries = parseSessionLog(sessionLog);

                if (sessionEntries.length === 0) return null;

                return (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      📋 Session Activity Log
                      <span className="text-sm text-blue-400 font-normal">
                        ({sessionEntries.length} entries)
                      </span>
                    </h2>
                    <div className="max-h-80 overflow-y-auto space-y-3">
                      {sessionEntries.map((entry, index) => (
                        <div
                          key={index}
                          className={`bg-slate-700/50 rounded-lg p-4 border-l-4 ${
                            entry.approved
                              ? "border-green-500"
                              : "border-red-500"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-slate-600 px-2 py-1 rounded text-gray-300">
                                #{entry.number}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded text-white font-medium ${
                                  entry.service === "openai"
                                    ? "bg-green-600"
                                    : entry.service === "gemini"
                                    ? "bg-purple-600"
                                    : "bg-blue-600"
                                }`}
                              >
                                {entry.service.toUpperCase()}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium ${
                                  entry.approved
                                    ? "bg-green-600 text-white"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                {entry.approved ? "✅ APPROVED" : "❌ REJECTED"}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {(() => {
                                try {
                                  if (
                                    entry.deadline.includes("T") &&
                                    entry.deadline.includes("Z")
                                  ) {
                                    return new Date(
                                      entry.deadline
                                    ).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    });
                                  }
                                  return entry.deadline;
                                } catch {
                                  return entry.deadline;
                                }
                              })()}
                            </span>
                          </div>
                          <div className="mb-2">
                            <p className="text-sm text-white leading-relaxed">
                              <span className="text-blue-400 font-medium">
                                Q:
                              </span>{" "}
                              {entry.question}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-400 font-medium">
                              Offer Context:
                            </span>
                            <span className="text-xs text-gray-300 bg-slate-600/50 px-2 py-1 rounded">
                              {entry.offer}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            {/* Agent-Specific Information */}
            {(() => {
              const agentType = categorizeAgent(agent);
              const agentSpecificBlocks = [];

              // Check for real_offer/real_service content
              const realOfferValue = getRealOffer(agent);

              if (agentType === "client") {
                if (
                  realOfferValue &&
                  realOfferValue !== "No service offering defined"
                ) {
                  agentSpecificBlocks.push({
                    label: "Services Received",
                    value: realOfferValue,
                    id: `${agent.id}-services-received`,
                  });
                }

                // Add session logs for client agents
                const sessionLogValue = getSessionLog(agent);
                if (
                  sessionLogValue &&
                  sessionLogValue !== "No session logs available"
                ) {
                  agentSpecificBlocks.push({
                    label: "Session Activity",
                    value: formatSessionLog(sessionLogValue),
                    id: `${agent.id}-session-activity`,
                  });
                }
              } else if (agentType === "service") {
                // Always show service offering section for service agents
                agentSpecificBlocks.push({
                  label: "Service Offering",
                  value: realOfferValue || "No service offering defined",
                  id: `${agent.id}-service-offering`,
                });
              } else if (agentType === "broker") {
                if (
                  realOfferValue &&
                  realOfferValue !== "No service offering defined"
                ) {
                  agentSpecificBlocks.push({
                    label: "Brokerage Focus",
                    value: realOfferValue,
                    id: `${agent.id}-brokerage-focus`,
                  });
                }

                // Add conversation summary for broker agents
                const conversationSummary = getConversationSummary(agent);
                if (
                  conversationSummary &&
                  conversationSummary !== "No conversation summary available"
                ) {
                  agentSpecificBlocks.push({
                    label: "Session Processing Overview",
                    value: conversationSummary,
                    id: `${agent.id}-conversation-summary`,
                    isBrokerSummary: true,
                  });
                }

                // Add agreement history for broker agents
                const agreementHistory = getAgreementHistory(agent);
                if (
                  agreementHistory &&
                  agreementHistory !== "No agreement history available"
                ) {
                  agentSpecificBlocks.push({
                    label: "Agreement History",
                    value: formatAgreementHistory(agreementHistory),
                    id: `${agent.id}-agreement-history`,
                    isBrokerSummary: true,
                  });
                }

                // Add agent registry for broker agents
                const agentRegistry = getAgentRegistry(agent);
                if (
                  agentRegistry &&
                  agentRegistry !== "No agent registry available"
                ) {
                  agentSpecificBlocks.push({
                    label: "Agent Registry",
                    value: formatAgentRegistry(agentRegistry),
                    id: `${agent.id}-agent-registry`,
                    isBrokerSummary: true,
                  });
                }
              }

              if (agentSpecificBlocks.length === 0) return null;

              return (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 md:col-span-2">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    🎯 {agentType.charAt(0).toUpperCase() + agentType.slice(1)}{" "}
                    Agent Information
                  </h2>
                  <div className="space-y-4">
                    {agentSpecificBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="bg-slate-700/50 rounded-lg p-4"
                      >
                        <h3 className="text-cyan-400 font-medium mb-3 flex items-center gap-2">
                          {block.label === "Session Processing Overview" && (
                            <span>📊</span>
                          )}
                          {block.label === "Agreement History" && (
                            <span>📋</span>
                          )}
                          {block.label === "Agent Registry" && <span>🗂️</span>}
                          {!block.isBrokerSummary &&
                            block.label === "Brokerage Focus" && (
                              <span>🎯</span>
                            )}
                          {block.label}
                        </h3>
                        <div
                          className={`rounded-lg p-4 ${
                            block.isBrokerSummary
                              ? "bg-purple-900/20 border border-purple-700/30"
                              : "bg-slate-600/50"
                          }`}
                        >
                          {block.isBrokerSummary ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                              <div
                                className="text-sm text-gray-200 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: block.value
                                    .replace(
                                      /\*\*(.*?)\*\*/g,
                                      '<strong class="text-purple-300">$1</strong>'
                                    )
                                    .replace(/^- /gm, "• ")
                                    .replace(/^  - /gm, "  ◦ ")
                                    .replace(/\n/g, "<br>"),
                                }}
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                              {block.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* System Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl md:col-span-2">
              <button
                onClick={() => setShowSystemConfig(!showSystemConfig)}
                className="w-full p-6 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    System Configuration
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {agent.system ? "Available" : "Not configured"}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        showSystemConfig ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {showSystemConfig && (
                <div className="px-6 pb-6 border-t border-slate-600">
                  <div className="pt-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                        {agent.system || "No system configuration available"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tools & Capabilities */}
            {agent.tools && agent.tools.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl md:col-span-2">
                <button
                  onClick={() => setShowTools(!showTools)}
                  className="w-full p-6 text-left hover:bg-slate-700/30 transition-colors rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      Tools & Capabilities
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {agent.tools.length} tools available
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          showTools ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {showTools && (
                  <div className="px-6 pb-6 border-t border-slate-600">
                    <div className="pt-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        {agent.tools.map((tool, index) => (
                          <div
                            key={index}
                            className="bg-slate-700/50 rounded-lg p-4"
                          >
                            <h3 className="text-white font-medium mb-2">
                              {typeof tool === "string"
                                ? tool
                                : tool.name ||
                                  tool.tool_type ||
                                  `Tool ${index + 1}`}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {typeof tool === "object" && tool.description
                                ? tool.description.substring(0, 80) +
                                  (tool.description.length > 80 ? "..." : "")
                                : "Available tool"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            {agent.metadata && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 md:col-span-2">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Metadata
                </h2>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(agent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href="/agents"
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to All Agents
            </Link>
            {!showConversation ? (
              <button
                onClick={startConversation}
                className={`bg-gradient-to-r ${colorScheme} hover:opacity-80 text-white px-6 py-3 rounded-lg transition-opacity`}
              >
                View Conversation
              </button>
            ) : (
              <button
                onClick={() => setShowConversation(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Hide Conversation
              </button>
            )}
            <button
              onClick={deleteAgent}
              disabled={deletingAgent}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                deletingAgent
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {deletingAgent ? "Deleting..." : "Delete Agent"}
            </button>
          </div>

          {/* Conversation Interface */}
          {showConversation && (
            <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  💬 Conversation with {agent.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Chat with this Letta agent in real-time
                </p>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p>Loading conversation history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">👋</div>
                    <p>Start a conversation with {agent.name}!</p>
                    <p className="text-sm">
                      Messages will appear here as you chat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show conversation history indicator if there are messages */}
                    {messages.length > 0 && !loadingMessages && (
                      <div className="text-center mb-4">
                        <span className="text-xs text-gray-500 bg-slate-700/50 px-3 py-1 rounded-full">
                          💬 Conversation History ({messages.length} messages)
                        </span>
                      </div>
                    )}
                    {messages.map((message, index) => (
                      <div
                        key={`message-${message.id}-${index}`}
                        className={`flex ${
                          message.message_type === "user_message"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.message_type === "user_message"
                              ? `bg-gradient-to-r ${colorScheme} text-white`
                              : message.message_type === "assistant_message"
                              ? "bg-slate-700 text-gray-200"
                              : message.message_type === "reasoning_message"
                              ? "bg-purple-800/30 text-purple-200 border border-purple-700/50"
                              : message.message_type === "tool_call_message"
                              ? "bg-blue-800/30 text-blue-200 border border-blue-700/50"
                              : message.message_type === "tool_return_message"
                              ? "bg-green-800/30 text-green-200 border border-green-700/50"
                              : "bg-slate-600 text-gray-300 italic"
                          }`}
                        >
                          {/* Message type indicator */}
                          {message.message_type === "reasoning_message" && (
                            <p className="text-xs mb-1 opacity-70 font-medium">
                              🧠 Thinking
                            </p>
                          )}
                          {message.message_type === "tool_call_message" && (
                            <p className="text-xs mb-1 opacity-70 font-medium">
                              🔧 Tool: {message.tool_call?.name}
                            </p>
                          )}
                          {message.message_type === "tool_return_message" && (
                            <p className="text-xs mb-1 opacity-70 font-medium">
                              📤 Tool Result
                            </p>
                          )}

                          {/* Message content */}
                          {message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.reasoning && (
                            <p className="text-sm italic">
                              {message.reasoning}
                            </p>
                          )}
                          {message.tool_call && (
                            <div className="text-sm">
                              <p className="font-medium">
                                {message.tool_call.name}
                              </p>
                              {message.tool_call.arguments && (
                                <pre className="text-xs mt-1 opacity-70 overflow-x-auto">
                                  {JSON.stringify(
                                    message.tool_call.arguments,
                                    null,
                                    2
                                  )}
                                </pre>
                              )}
                            </div>
                          )}
                          {message.tool_return && (
                            <p className="text-sm">{message.tool_return}</p>
                          )}

                          <p className="text-xs mt-1 opacity-70">
                            {getMessageDate(message)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-600 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                      sendingMessage || !newMessage.trim()
                        ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                        : `bg-gradient-to-r ${colorScheme} text-white hover:opacity-80`
                    }`}
                  >
                    {sendingMessage ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
