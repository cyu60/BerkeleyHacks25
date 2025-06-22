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

interface ServiceSpecialization {
  name: string;
  description: string;
  acceptedDataTypes: string;
  capabilities: string;
  icon: string;
}

export default function CreateServiceAgentPage() {
  const [agents, setAgents] = useState<LettaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [serviceName, setServiceName] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");

  const serviceSpecializations: ServiceSpecialization[] = [
    {
      name: "travel_assistant",
      description: "Provides travel planning, destination information, and itinerary assistance",
      acceptedDataTypes: "GPS tracks, geo-tagged photos, cost logs, attraction reviews, travel itineraries, location data",
      capabilities: "Route planning, destination recommendations, travel cost analysis, activity suggestions, local insights",
      icon: "✈️"
    },
    {
      name: "tutor", 
      description: "Educational assistance and academic support across various subjects",
      acceptedDataTypes: "Exams, homework, lecture notes, mind maps, study materials, academic papers, problem sets",
      capabilities: "Subject tutoring, homework help, study plan creation, concept explanation, exam preparation",
      icon: "📚"
    },
    {
      name: "med_triage_bot",
      description: "Medical information and health monitoring assistance", 
      acceptedDataTypes: "Symptom diary, wearable vitals, health logs, medical history, medication schedules",
      capabilities: "Symptom analysis, health monitoring, medication reminders, wellness tracking, medical information",
      icon: "🏥"
    },
    {
      name: "code_assistant",
      description: "Software development and programming assistance",
      acceptedDataTypes: "Code snippets, bug reports, documentation, API specs, test cases, project files",
      capabilities: "Code review, debugging assistance, documentation generation, best practices guidance, architecture advice",
      icon: "💻"
    },
    {
      name: "research_assistant", 
      description: "Research and data analysis support",
      acceptedDataTypes: "Research papers, datasets, reports, survey data, academic sources, citation lists",
      capabilities: "Literature review, data analysis, research methodology, citation formatting, report writing",
      icon: "🔬"
    }
  ];

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
      persona.includes("human") ||
      name.includes("client") ||
      name.includes("user")
    ) {
      return "client";
    }
    return "other";
  };

  const brokerAgents = agents.filter(agent => categorizeAgent(agent) === "broker");
  const clientAgents = agents.filter(agent => categorizeAgent(agent) === "client");


  const handleCreateAgent = async () => {
    if (!serviceName.trim()) {
      setError("Please enter a service agent name");
      return;
    }
    if (!selectedBroker) {
      setError("Please select a broker agent");
      return;
    }
    if (selectedClients.length === 0) {
      setError("Please select at least one client agent");
      return;
    }
    if (!selectedSpecialization) {
      setError("Please select a service specialization");
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
      const response = await fetch('/api/letta/agents/create-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: serviceName,
          serviceType: selectedSpecialization,
          brokerAgentId: selectedBroker,
          apiKey: apiKey
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create service agent');
      }

      alert(`✅ Success! Service agent "${serviceName}" (${selectedSpecialization}) has been created with ID: ${result.agent.id}`);
      
      // Reset form
      setServiceName("");
      setSelectedBroker("");
      setSelectedClients([]);
      setSelectedSpecialization("");
      
      // Refresh agents list
      fetchAgents();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service agent");
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-green-400 bg-clip-text text-transparent mb-4">
              Create Service Agent
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Generate a new specialized service agent configuration with broker and client connections
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateAgent(); }} className="space-y-6">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Agent Name
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., travel_service, math_tutor, health_assistant"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Service Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Specialization
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {serviceSpecializations.map((spec) => (
                    <div
                      key={spec.name}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSpecialization === spec.name
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }`}
                      onClick={() => setSelectedSpecialization(spec.name)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{spec.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{spec.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{spec.description}</p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Accepts:</span> {spec.acceptedDataTypes.split(',').slice(0, 3).join(', ')}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broker Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Broker Agent
                </label>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
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

              {/* Client Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Agents
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                  {clientAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={agent.id}
                        checked={selectedClients.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, agent.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== agent.id));
                          }
                        }}
                        className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor={agent.id} className="text-gray-300 text-sm flex-1">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-gray-400 block text-xs">{agent.id}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedClients.length} of {clientAgents.length} client agents selected
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Preview */}
              {serviceName && selectedBroker && selectedClients.length > 0 && selectedSpecialization && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Configuration Preview</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><span className="text-cyan-400">Name:</span> {serviceName}</p>
                    <p><span className="text-purple-400">Broker:</span> {brokerAgents.find(a => a.id === selectedBroker)?.name} ({selectedBroker})</p>
                    <p><span className="text-teal-400">Specialization:</span> {selectedSpecialization} {serviceSpecializations.find(s => s.name === selectedSpecialization)?.icon}</p>
                    <div>
                      <span className="text-green-400">Client Agents ({selectedClients.length}):</span>
                      <ul className="ml-4 mt-1 space-y-1">
                        {selectedClients.map(clientId => {
                          const agent = clientAgents.find(a => a.id === clientId);
                          return (
                            <li key={clientId} className="text-xs">
                              • {agent?.name} ({clientId})
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creating || !serviceName || !selectedBroker || selectedClients.length === 0 || !selectedSpecialization}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                  creating || !serviceName || !selectedBroker || selectedClients.length === 0 || !selectedSpecialization
                    ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:opacity-80"
                }`}
              >
                {creating ? "Creating Agent..." : "Create Service Agent"}
              </button>
            </form>
          </div>

          <div className="mt-8 bg-slate-800/30 rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">How it Works</h3>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Select your service specialization and configure connections</li>
              <li>Click "Create Service Agent" and provide your Letta API key</li>
              <li>The agent will be created directly in your Letta system</li>
              <li>Test the service agent with broker-routed requests</li>
              <li>Monitor offer logging and client response delivery</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}