"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LettaAgent {
  id: string;
  name: string;
  created_at: string;
  memory?: {
    persona?: string;
  };
}

export default function CreateBrokerAgentPage() {
  const router = useRouter();
  const [brokerName, setBrokerName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<LettaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientAgents, setSelectedClientAgents] = useState<string[]>([]);
  const [selectedServiceAgents, setSelectedServiceAgents] = useState<string[]>([]);

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
      persona.includes("client") ||
      persona.includes("user") ||
      name.includes("client")
    ) {
      return "client";
    } else if (
      persona.includes("service") ||
      persona.includes("api") ||
      persona.includes("model") ||
      name.includes("service") ||
      name.includes("travel") ||
      name.includes("tutor") ||
      name.includes("medical") ||
      name.includes("code") ||
      name.includes("research")
    ) {
      return "service";
    }
    return "other";
  };

  const clientAgents = agents.filter(agent => categorizeAgent(agent) === "client");
  const serviceAgents = agents.filter(agent => categorizeAgent(agent) === "service");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brokerName.trim()) {
      setError("Broker name is required");
      return;
    }


    setCreating(true);
    setError(null);

    try {
      const requestBody = { 
        name: brokerName,
        clientAgentIds: selectedClientAgents,
        serviceAgentIds: selectedServiceAgents
      };

      const response = await fetch("/api/letta/agents/create-broker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to the newly created agent's page
        router.push(`/agents/${result.agent.id}`);
      } else {
        setError(result.error || "Failed to create broker agent");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create broker agent"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
      {/* Header */}
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Create Broker Agent
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create a Vow Intelligence Broker agent to coordinate between
              client and service agents
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Broker Agent Name
                </label>
                <input
                  type="text"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  placeholder="e.g., Vow Intelligence Broker"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  disabled={creating}
                />
                <p className="text-sm text-gray-400 mt-2">
                  Choose a descriptive name for your broker agent
                </p>
              </div>

              {/* Client Agents Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assign Client Agents
                </label>
                {loading ? (
                  <div className="text-gray-400">Loading agents...</div>
                ) : clientAgents.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-700/30 rounded-lg p-3">
                    {clientAgents.map((agent) => (
                      <label key={agent.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClientAgents.includes(agent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClientAgents([...selectedClientAgents, agent.id]);
                            } else {
                              setSelectedClientAgents(selectedClientAgents.filter(id => id !== agent.id));
                            }
                          }}
                          className="rounded border-slate-600 bg-slate-700 text-purple-500"
                          disabled={creating}
                        />
                        <span className="text-sm text-gray-300">{agent.name}</span>
                        <span className="text-xs text-gray-500">({agent.id})</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No client agents found</div>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  Select which client agents this broker will coordinate with
                </p>
              </div>

              {/* Service Agents Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assign Service Agents
                </label>
                {loading ? (
                  <div className="text-gray-400">Loading agents...</div>
                ) : serviceAgents.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-700/30 rounded-lg p-3">
                    {serviceAgents.map((agent) => (
                      <label key={agent.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServiceAgents.includes(agent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServiceAgents([...selectedServiceAgents, agent.id]);
                            } else {
                              setSelectedServiceAgents(selectedServiceAgents.filter(id => id !== agent.id));
                            }
                          }}
                          className="rounded border-slate-600 bg-slate-700 text-purple-500"
                          disabled={creating}
                        />
                        <span className="text-sm text-gray-300">{agent.name}</span>
                        <span className="text-xs text-gray-500">({agent.id})</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No service agents found</div>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  Select which service agents this broker will coordinate with
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={creating || !brokerName.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  creating || !brokerName.trim()
                    ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-80"
                }`}
              >
                {creating ? "Creating Broker Agent..." : "Create Broker Agent"}
              </button>
            </form>
          </div>

          <div className="mt-8 bg-slate-800/30 rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">
              Broker Agent Capabilities
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-purple-400 font-medium mb-3">
                  Core Functions
                </h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Request analysis and routing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Agent coordination and management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Trust assessment and scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Value exchange facilitation
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-purple-400 font-medium mb-3">
                  System Integration
                </h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Agreement enforcement
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Quality monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    System optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Multi-agent orchestration
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-800/30 rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">How it Works</h3>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Enter a name for your broker agent</li>
              <li>Click &quot;Create Broker Agent&quot; to create the agent</li>
              <li>The agent will be created directly in your Letta system</li>
              <li>
                The broker can now coordinate between client and service agents
              </li>
              <li>
                Monitor orchestration through the agent&apos;s memory and
                conversation logs
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
