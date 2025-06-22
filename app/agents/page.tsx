"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useState, useEffect } from "react";

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

export default function AgentsPage() {
  const [lettaAgents, setLettaAgents] = useState<LettaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLettaAgents = async () => {
      try {
        const response = await fetch("/api/letta/agents");
        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.statusText}`);
        }
        const agents = await response.json();
        setLettaAgents(agents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch agents");
        console.error("Error fetching Letta agents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLettaAgents();
  }, []);

  // Categorize agents based on their persona or name patterns
  const categorizeAgent = (agent: LettaAgent) => {
    const persona = agent.memory?.persona?.toLowerCase() || "";
    const name = agent.name.toLowerCase();

    // Only categorize agents that explicitly match the categories
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

    // Return null for agents that don't match any category
    return null;
  };

  // Filter agents that actually match the categories (exclude null/uncategorized)
  const clientAgents = (lettaAgents || []).filter(
    (agent) => categorizeAgent(agent) === "client"
  );
  const serviceAgents = (lettaAgents || []).filter(
    (agent) => categorizeAgent(agent) === "service"
  );
  const brokerAgents = (lettaAgents || []).filter(
    (agent) => categorizeAgent(agent) === "broker"
  );

  const getAgentImageUrl = (agent: LettaAgent) => {
    // Use DiceBear to generate consistent avatars based on agent ID
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

    // Use agent ID as seed for consistent avatar generation
    return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${agent.id}&size=64`;
  };

  const getCoreMemoryValue = (agent: LettaAgent, label: string): string => {
    if (!agent.core_memory) return "";
    const block = agent.core_memory.find(
      (block) => block.label.toLowerCase() === label.toLowerCase()
    );
    return block?.value || "";
  };

  const getAgentRole = (agent: LettaAgent) => {
    const corePersona = getCoreMemoryValue(agent, "persona");
    const persona = corePersona || agent.memory?.persona || "";
    if (persona.length > 50) {
      return persona.substring(0, 50) + "...";
    }
    return persona || "AI Agent";
  };

  const getRealOffer = (agent: LettaAgent): string => {
    const offer = getCoreMemoryValue(agent, "real_offer");
    if (offer.length > 80) {
      return offer.substring(0, 80) + "...";
    }
    return offer || "No value proposition available";
  };

  const getAgentDescription = (agent: LettaAgent) => {
    const system = agent.system || "";
    if (system.length > 100) {
      return system.substring(0, 100) + "...";
    }
    return (
      system ||
      "A Letta-powered agent with persistent memory and stateful conversations."
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading Letta agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-red-400 text-xl font-semibold mb-2">
            Error Loading Agents
          </h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
      {/* Header */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Agent Ecosystem
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
              Explore the diverse network of Letta-powered agents that
              participate in Vow&rsquo;s intelligence brokerage system
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/create-client-agent"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-80 text-white px-6 py-3 rounded-lg font-medium transition-opacity"
              >
                <span className="text-lg">👤</span>
                Create Client Agent
              </Link>
              <Link
                href="/create-service-agent"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:opacity-80 text-white px-6 py-3 rounded-lg font-medium transition-opacity"
              >
                <span className="text-lg">⚙️</span>
                Create Service Agent
              </Link>
              <Link
                href="/create-broker-agent"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-80 text-white px-6 py-3 rounded-lg font-medium transition-opacity"
              >
                <span className="text-lg">🧠</span>
                Create Broker Agent
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Client Agents Section */}
      <section className="bg-slate-800/30 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
          <div className="max-w-xl">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-blue-400 sm:text-4xl">
              Client Agents
            </h2>
            <p className="mt-6 text-lg/8 text-gray-300">
              Letta-powered agents that initiate value exchanges by submitting
              requests along with alternative value propositions instead of
              traditional payments.
            </p>
            <div className="mt-6 space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2">
                  How They Work
                </h4>
                <p className="text-sm text-gray-400">
                  Each client agent maintains persistent memory of past
                  interactions, building reputation and trust over time through
                  successful value exchanges.
                </p>
              </div>
            </div>
          </div>
          <ul
            role="list"
            className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2"
          >
            {clientAgents.length > 0 ? (
              clientAgents.map((agent) => (
                <li key={agent.id}>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="block bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-x-6 mb-4">
                      <img
                        alt={agent.name}
                        src={getAgentImageUrl(agent)}
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-blue-500/30"
                      />
                      <div>
                        <h3 className="text-base/7 font-semibold tracking-tight text-white">
                          {agent.name}
                        </h3>
                        <p className="text-sm/6 font-semibold text-blue-400">
                          {getAgentRole(agent)}
                        </p>
                        <p className="text-xs text-purple-300">
                          Letta Client Agent
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {getAgentDescription(agent)}
                    </p>
                    <div className="mb-4">
                      <h4 className="text-blue-400 font-medium mb-1 text-sm">
                        Value Proposition:
                      </h4>
                      <p className="text-xs text-gray-400">
                        {getRealOffer(agent)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2 text-sm">
                        Agent Details:
                      </h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                          Created:{" "}
                          {new Date(agent.created_at).toLocaleDateString()}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                          Tools: {agent.tools?.length || 0} available
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                          Memory:{" "}
                          {agent.memory?.human ? "Active" : "Initializing"}
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 text-xs text-blue-400 font-medium">
                      Click to view details →
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="col-span-2 text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p>
                  No client agents found. Create some agents in your Letta
                  dashboard!
                </p>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Service Agents Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
          <div className="max-w-xl">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-cyan-400 sm:text-4xl">
              Service Agents
            </h2>
            <p className="mt-6 text-lg/8 text-gray-300">
              AI services wrapped in Letta&rsquo;s memory framework, providing
              capabilities in exchange for alternative value currencies beyond
              traditional payments.
            </p>
            <div className="mt-6 space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-cyan-400 font-semibold mb-2">
                  Letta Enhancement
                </h4>
                <p className="text-sm text-gray-400">
                  Each service maintains persistent context and learns from
                  interactions, providing increasingly personalized responses.
                </p>
              </div>
            </div>
          </div>
          <ul
            role="list"
            className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2"
          >
            {serviceAgents.length > 0 ? (
              serviceAgents.map((agent) => (
                <li key={agent.id}>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="block bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-x-6 mb-4">
                      <img
                        alt={agent.name}
                        src={getAgentImageUrl(agent)}
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-cyan-500/30"
                      />
                      <div>
                        <h3 className="text-base/7 font-semibold tracking-tight text-white">
                          {agent.name}
                        </h3>
                        <p className="text-sm/6 font-semibold text-cyan-400">
                          {getAgentRole(agent)}
                        </p>
                        <p className="text-xs text-purple-300">
                          Letta Service Agent
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {getAgentDescription(agent)}
                    </p>
                    <div className="mb-4">
                      <h4 className="text-cyan-400 font-medium mb-1 text-sm">
                        Service Offering:
                      </h4>
                      <p className="text-xs text-gray-400">
                        {getRealOffer(agent)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2 text-sm">
                        Agent Details:
                      </h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                          Created:{" "}
                          {new Date(agent.created_at).toLocaleDateString()}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                          Tools: {agent.tools?.length || 0} available
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                          Memory:{" "}
                          {agent.memory?.human ? "Active" : "Initializing"}
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 text-xs text-cyan-400 font-medium">
                      Click to view details →
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="col-span-2 text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">⚙️</div>
                <p>
                  No service agents found. Create some service agents in your
                  Letta dashboard!
                </p>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Broker Agents Section */}
      <section className="bg-slate-800/30 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
          <div className="max-w-xl">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-purple-400 sm:text-4xl">
              Broker Agents
            </h2>
            <p className="mt-6 text-lg/8 text-gray-300">
              Vow Intelligence Brokers that orchestrate and mediate all value
              exchanges, maintaining persistent memory of transactions, trust
              scores, and agent relationships.
            </p>
            <div className="mt-6 space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2">
                  Core Orchestration
                </h4>
                <p className="text-sm text-gray-400">
                  These agents evaluate proposals, assess trust, enforce
                  agreements, and facilitate multi-party negotiations between
                  client and service agents.
                </p>
              </div>
            </div>
          </div>
          <ul
            role="list"
            className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2"
          >
            {brokerAgents.length > 0 ? (
              brokerAgents.map((agent) => (
                <li key={agent.id}>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="block bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-x-6 mb-4">
                      <img
                        alt={agent.name}
                        src={getAgentImageUrl(agent)}
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-purple-500/30"
                      />
                      <div>
                        <h3 className="text-base/7 font-semibold tracking-tight text-white">
                          {agent.name}
                        </h3>
                        <p className="text-sm/6 font-semibold text-purple-400">
                          {getAgentRole(agent)}
                        </p>
                        <p className="text-xs text-purple-300">
                          Vow Broker Agent
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {getAgentDescription(agent)}
                    </p>
                    <div className="mb-4">
                      <h4 className="text-purple-400 font-medium mb-1 text-sm">
                        Brokerage Focus:
                      </h4>
                      <p className="text-xs text-gray-400">
                        {getRealOffer(agent)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2 text-sm">
                        Agent Details:
                      </h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          Created:{" "}
                          {new Date(agent.created_at).toLocaleDateString()}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          Tools: {agent.tools?.length || 0} available
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          Memory:{" "}
                          {agent.memory?.human ? "Active" : "Initializing"}
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 text-xs text-purple-400 font-medium">
                      Click to view details →
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="col-span-2 text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">🧠</div>
                <p>No broker agents found.</p>
                <p className="text-sm">
                  Create agents with &apos;broker&apos;, &apos;vow&apos;, or
                  &apos;orchestrat&apos; in their name/persona!
                </p>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-700">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            Building the future of AI agent interactions, one value exchange at
            a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
