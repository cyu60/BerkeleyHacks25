"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [agents, setAgents] = useState<LettaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableServices] = useState<string[]>([
    "travel_assistant",
    "tutor",
    "med_triage_bot",
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

  const brokerAgents = agents.filter(
    (agent) => categorizeAgent(agent) === "broker"
  );
  const serviceAgents = agents.filter(
    (agent) => categorizeAgent(agent) === "service"
  );

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

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/letta/agents/create-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: clientName,
          brokerAgentId: selectedBroker,
          serviceAgentIds: selectedServices,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create client agent");
      }

      // Redirect to the newly created agent's page
      router.push(`/agents/${result.agent.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create client agent"
      );
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
              Generate a new client agent configuration with selected broker and
              service agent connections
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateAgent();
              }}
              className="space-y-6"
            >
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
                            setSelectedServices([
                              ...selectedServices,
                              agent.id,
                            ]);
                          } else {
                            setSelectedServices(
                              selectedServices.filter((id) => id !== agent.id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor={agent.id}
                        className="text-gray-300 text-sm flex-1"
                      >
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-gray-400 block text-xs">
                          {agent.id}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedServices.length} of {serviceAgents.length} service
                  agents selected
                </p>
              </div>

              {/* Available Services */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Services
                </label>
                <div className="space-y-2">
                  {availableServices.map((service) => (
                    <div key={service} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={service}
                        checked={true}
                        readOnly
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
                  <h3 className="text-white font-medium mb-2">
                    Configuration Preview
                  </h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>
                      <span className="text-cyan-400">Name:</span> {clientName}
                    </p>
                    <p>
                      <span className="text-purple-400">Broker:</span>{" "}
                      {brokerAgents.find((a) => a.id === selectedBroker)?.name}{" "}
                      ({selectedBroker})
                    </p>
                    <div>
                      <span className="text-green-400">
                        Service Agents ({selectedServices.length}):
                      </span>
                      <ul className="ml-4 mt-1 space-y-1">
                        {selectedServices.map((serviceId) => {
                          const agent = serviceAgents.find(
                            (a) => a.id === serviceId
                          );
                          return (
                            <li key={serviceId} className="text-xs">
                              • {agent?.name} ({serviceId})
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <p>
                      <span className="text-yellow-400">
                        Available Services:
                      </span>{" "}
                      {availableServices.join(", ")}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  creating ||
                  !clientName ||
                  !selectedBroker ||
                  selectedServices.length === 0
                }
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                  creating ||
                  !clientName ||
                  !selectedBroker ||
                  selectedServices.length === 0
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
              <li>
                Fill out the form with client agent details and connections
              </li>
              <li>Click &quot;Create Client Agent&quot; to create the agent</li>
              <li>The agent will be created directly in your Letta system</li>
              <li>
                Test the agent with a &quot;new session&quot; request format
              </li>
              <li>
                The agent will coordinate with your selected broker and service
                agents
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
