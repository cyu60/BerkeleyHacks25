"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useState, useEffect, useCallback } from "react";

interface LettaAgent {
  id: string;
  name: string;
  created_at: string;
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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [cacheStatus, setCacheStatus] = useState<string>("enabled");

  // Utility to check localStorage usage
  const checkStorageUsage = () => {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      const sizeInMB = totalSize / (1024 * 1024);
      console.log(`Total localStorage usage: ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 8) { // Close to 10MB limit
        setCacheStatus("near_limit");
      } else if (sizeInMB > 4) {
        setCacheStatus("moderate");
      } else {
        setCacheStatus("enabled");
      }
    } catch (error) {
      console.warn("Failed to check storage usage:", error);
      setCacheStatus("disabled");
    }
  };

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const cacheKey = `conversations_${selectedTimeRange}`;
    const cacheTimestampKey = `conversations_${selectedTimeRange}_timestamp`;
    const cacheDuration = 5 * 60 * 1000; // 5 minutes
    
    try {
      // 1. Check if we have fresh cached data first
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      
      if (cachedData && cacheTimestamp) {
        const isRecentCache = Date.now() - parseInt(cacheTimestamp) < cacheDuration;
        if (isRecentCache) {
          console.log("✅ Loading from cache - data is fresh");
          setConversations(JSON.parse(cachedData));
          setLoading(false);
          checkStorageUsage();
          return;
        } else {
          console.log("🕒 Cache expired, fetching fresh data");
        }
      } else {
        console.log("🆕 No cache found, fetching fresh data");
      }

      // 2. Fetch fresh data from API
      console.log("📡 Fetching conversations from API...");
      
      const conversationsResponse = await fetch(`/api/letta/conversations?timeRange=${selectedTimeRange}`);
      if (!conversationsResponse.ok) {
        throw new Error(`Failed to fetch conversations: ${conversationsResponse.statusText}`);
      }
      
      const conversationsData = await conversationsResponse.json();
      console.log(`📊 Received ${conversationsData.length} conversation flows`);
      
      // 3. Successfully loaded - now set the data
      setConversations(conversationsData);
      
      // 4. Try to cache the successfully loaded data
      try {
        const dataString = JSON.stringify(conversationsData);
        const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
        
        if (sizeInMB < 3) { // Increased limit to 3MB
          localStorage.setItem(cacheKey, dataString);
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
          console.log(`💾 Cached successfully (${sizeInMB.toFixed(2)} MB)`);
        } else {
          console.warn(`⚠️ Data too large to cache (${sizeInMB.toFixed(2)} MB), will fetch fresh each time`);
        }
      } catch (storageError) {
        console.warn("💾 Storage quota exceeded, clearing old cache and skipping new cache", storageError);
        // Clear old conversation cache if storage is full
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('conversations_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversations");
      console.error("❌ Error fetching conversations:", err);
    } finally {
      setLoading(false);
      checkStorageUsage();
    }
  }, [selectedTimeRange]);

  const clearCacheAndRefresh = useCallback(() => {
    // Clear all conversation cache (including old format)
    ['1h', '24h', '7d', '30d'].forEach(timeRange => {
      localStorage.removeItem(`conversations_${timeRange}`);
      localStorage.removeItem(`conversations_${timeRange}_timestamp`);
    });
    
    // Also clear any old cache keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('conversations_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('All conversation cache cleared');
    
    // Fetch fresh data
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    // Clear cache to ensure new debugging format - force clear this time
    const hasNewDebugFormat = localStorage.getItem('conversations_debug_format_v2');
    if (!hasNewDebugFormat) {
      console.log('🔧 Clearing cache to get new API debugging format');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('conversations_')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('conversations_debug_format_v2', 'true');
    }
    
    fetchConversations();
  }, [selectedTimeRange, fetchConversations]);


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
        return {
          bg: "from-blue-500 to-cyan-500",
          border: "border-blue-500/30",
          text: "text-blue-400",
          icon: "👤"
        };
      case "service":
        return {
          bg: "from-cyan-500 to-teal-500",
          border: "border-cyan-500/30",
          text: "text-cyan-400",
          icon: "⚙️"
        };
      case "broker":
        return {
          bg: "from-purple-500 to-blue-500",
          border: "border-purple-500/30",
          text: "text-purple-400",
          icon: "🧠"
        };
      default:
        return {
          bg: "from-gray-500 to-slate-500",
          border: "border-gray-500/30",
          text: "text-gray-400",
          icon: "🤖"
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return timestamp;
    }
  };

  const getMessageContent = (message: LettaMessage) => {
    if (message.content) {
      // Try to parse JSON content for better formatting
      try {
        const parsed = JSON.parse(message.content);
        if (parsed.type === "heartbeat") {
          return `💓 Heartbeat - ${parsed.reason || "System maintenance"}`;
        }
        // Format other JSON objects nicely
        return JSON.stringify(parsed, null, 2);
      } catch {
        // Not JSON, return as is
        return message.content;
      }
    }
    if (message.reasoning) return message.reasoning;
    if (message.tool_call) {
      const args = message.tool_call.arguments;
      if (args && typeof args === 'object') {
        // Format tool call arguments nicely
        const formattedArgs = Object.entries(args)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
        return `${message.tool_call.name}(${formattedArgs})`;
      }
      return `${message.tool_call.name}()`;
    }
    if (message.tool_return) {
      // Format tool returns
      if (message.tool_return.includes("Successfully sent message")) {
        return "✅ Message sent successfully";
      }
      return message.tool_return;
    }
    return "No content";
  };

  const getMessageIcon = (message: LettaMessage) => {
    if (message.content) {
      try {
        const parsed = JSON.parse(message.content);
        if (parsed.type === "heartbeat") {
          return "💓";
        }
      } catch {
        // Not JSON
      }
    }
    
    switch (message.message_type) {
      case "user_message":
        return "👤";
      case "assistant_message":
        return "🤖";
      case "reasoning_message":
        return "💭";
      case "tool_call_message":
        return "🔧";
      case "tool_return_message":
        return "📤";
      default:
        return "💬";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading conversations...</p>
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
            Error Loading Conversations
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
            href="/agents"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Agents
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Multi-Agent Conversations
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
              View the complete conversation flows between client agents, broker agents, and service agents
            </p>
            
            {/* Time Range Filter */}
            <div className="flex justify-center gap-2 mb-8">
              {[
                { value: "1h", label: "Last Hour" },
                { value: "24h", label: "Last 24 Hours" },
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setSelectedTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedTimeRange === range.value
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                No Conversations Found
              </h3>
              <p className="text-gray-400">
                No multi-agent conversations found for the selected time range.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {conversations.map((conversation, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
                >
                  {/* Conversation Header */}
                  <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        💬 Conversation Flow
                        {conversation.session_id && (
                          <span className="text-sm font-mono bg-slate-600 px-2 py-1 rounded text-gray-300">
                            #{conversation.session_id}
                          </span>
                        )}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {formatTimestamp(conversation.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {conversation.messages.length} messages across {new Set(conversation.messages.map(m => m.agent.id)).size} agents
                    </p>
                  </div>

                  {/* Message Flow */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {conversation.messages.map((item, msgIndex) => {
                        const agentType = categorizeAgent(item.agent);
                        const colors = getAgentTypeColor(agentType);
                        
                        const messageContent = getMessageContent(item.message);
                        const messageIcon = getMessageIcon(item.message);
                        const isHeartbeat = item.message.content?.includes('"type": "heartbeat"');
                        const isToolMessage = item.message.message_type === "tool_call_message" || item.message.message_type === "tool_return_message";
                        
                        return (
                          <div key={msgIndex} className={`flex items-start gap-4 ${isHeartbeat ? 'opacity-60' : ''}`}>
                            {/* Sequence Number */}
                            <div className="flex-shrink-0 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {item.sequence}
                            </div>

                            {/* Agent Avatar */}
                            <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${colors.bg} rounded-full flex items-center justify-center text-xl ${colors.border} border-2`}>
                              {colors.icon}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className={`font-semibold ${colors.text}`}>
                                  {item.agent.name}
                                </h4>
                                <span className="text-xs text-gray-500 bg-slate-700 px-2 py-1 rounded capitalize">
                                  {agentType} Agent
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  {messageIcon} {item.message.message_type.replace('_', ' ')}
                                </span>
                                {isHeartbeat && (
                                  <span className="text-xs text-gray-600 bg-slate-800 px-2 py-1 rounded">
                                    System
                                  </span>
                                )}
                              </div>

                              <div className={`rounded-lg p-4 border ${
                                isHeartbeat 
                                  ? 'bg-slate-800/30 border-slate-600/50' 
                                  : isToolMessage
                                  ? 'bg-blue-900/20 border-blue-700/50'
                                  : `bg-slate-700/50 ${colors.border}`
                              }`}>
                                {item.message.message_type === "tool_call_message" && item.message.tool_call ? (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-mono bg-blue-800 px-2 py-1 rounded text-blue-200">
                                        {item.message.tool_call.name}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                      {messageContent}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-200 leading-relaxed">
                                    {messageContent.includes('\n') ? (
                                      <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-800/50 p-2 rounded">
                                        {messageContent}
                                      </pre>
                                    ) : (
                                      <span>{messageContent}</span>
                                    )}
                                  </div>
                                )}
                                
                                {item.message.created_at && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {formatTimestamp(item.message.created_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refresh Section */}
      <div className="px-6 py-8 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto text-center">
          <button
            onClick={clearCacheAndRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          
          <div className="text-sm text-gray-400 space-y-1">
            <p>
              Data is cached for 5 minutes. Use refresh to get the latest conversations.
            </p>
            {cacheStatus === "near_limit" && (
              <p className="text-yellow-400">
                ⚠️ Cache storage nearly full. Large datasets may not be cached.
              </p>
            )}
            {cacheStatus === "moderate" && (
              <p className="text-blue-400">
                📊 Moderate cache usage. Some data is being cached for faster loading.
              </p>
            )}
            {cacheStatus === "disabled" && (
              <p className="text-red-400">
                🚫 Caching disabled due to storage limitations.
              </p>
            )}
            {cacheStatus === "enabled" && (
              <p className="text-green-400">
                ✅ Caching enabled for faster loading.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-700">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            Monitoring multi-agent conversations in the Vow intelligence brokerage system.
          </p>
        </div>
      </footer>
    </div>
  );
}