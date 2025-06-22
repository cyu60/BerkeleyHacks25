'use client';

import { useState, useEffect } from 'react';

export default function AgentFlowDiagram() {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const clientAgents = [
    { name: 'User Alice', type: 'Letta Agent', request: 'Travel advice', value: 'Local insights', memory: 'Past trips' },
    { name: 'Research Bot', type: 'Letta Agent', request: 'Data analysis', value: 'Raw datasets', memory: 'Research history' },
    { name: 'Dev Assistant', type: 'Letta Agent', request: 'Code review', value: 'Bug reports', memory: 'Code patterns' },
  ];

  const serviceAgents = [
    { name: 'OpenAI GPT', type: 'Letta Service Agent', specialty: 'General AI', memory: 'User preferences' },
    { name: 'Claude', type: 'Letta Service Agent', specialty: 'Analysis', memory: 'Task patterns' },
    { name: 'Gemini', type: 'Letta Service Agent', specialty: 'Multimodal', memory: 'Media history' },
    { name: 'Perplexity', type: 'Letta Service Agent', specialty: 'Research', memory: 'Query context' },
    { name: 'GitHub Copilot', type: 'Letta Service Agent', specialty: 'Development', memory: 'Code context' },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-900/30 rounded-2xl p-8 border border-slate-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        
        {/* Client Agents */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400 text-center mb-6">Letta Client Agents</h3>
          {clientAgents.map((agent) => (
            <div
              key={agent.name}
              className={`bg-blue-900/30 border border-blue-700 rounded-lg p-4 transition-all duration-500 ${
                animationStep === 1 ? 'scale-105 shadow-lg shadow-blue-500/20' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white font-medium">{agent.name}</span>
                <span className="text-xs bg-blue-800 text-blue-200 px-2 py-1 rounded">
                  {agent.type}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                <div>Request: {agent.request}</div>
                <div>Offers: {agent.value}</div>
                <div className="text-xs text-purple-300 mt-1">📝 Memory: {agent.memory}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Vow Broker */}
        <div className="relative">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-purple-400">Vow Broker</h3>
            <p className="text-sm text-gray-400">Intelligence Layer</p>
          </div>
          
          <div className={`bg-purple-900/40 border-2 border-purple-500 rounded-xl p-6 transition-all duration-500 ${
            animationStep === 2 ? 'scale-110 shadow-2xl shadow-purple-500/30' : ''
          }`}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="text-white font-bold text-lg">VOW</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-800/50 rounded p-2 text-center">
                <div className="text-purple-200">Trust</div>
                <div className="text-white font-semibold">Scoring</div>
              </div>
              <div className="bg-purple-800/50 rounded p-2 text-center">
                <div className="text-purple-200">Value</div>
                <div className="text-white font-semibold">Assessment</div>
              </div>
              <div className="bg-purple-800/50 rounded p-2 text-center">
                <div className="text-purple-200">Agreement</div>
                <div className="text-white font-semibold">Enforcement</div>
              </div>
              <div className="bg-purple-800/50 rounded p-2 text-center">
                <div className="text-purple-200">Request</div>
                <div className="text-white font-semibold">Routing</div>
              </div>
            </div>
          </div>

          {/* Flow Arrows */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 hidden lg:block">
            <div className={`text-blue-400 transition-all duration-500 ${
              animationStep >= 1 ? 'animate-pulse' : 'opacity-30'
            }`}>
              <svg width="32" height="24" viewBox="0 0 32 24" fill="currentColor">
                <path d="M0 12l8-8v5h16v6H8v5l-8-8z" />
              </svg>
            </div>
          </div>
          
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 hidden lg:block">
            <div className={`text-cyan-400 transition-all duration-500 ${
              animationStep >= 3 ? 'animate-pulse' : 'opacity-30'
            }`}>
              <svg width="32" height="24" viewBox="0 0 32 24" fill="currentColor">
                <path d="M32 12l-8 8v-5H8V9h16V4l8 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Service Agents */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-cyan-400 text-center mb-6">Letta Service Agents</h3>
          {serviceAgents.map((agent) => (
            <div
              key={agent.name}
              className={`bg-cyan-900/30 border border-cyan-700 rounded-lg p-3 transition-all duration-500 ${
                animationStep === 3 ? 'scale-105 shadow-lg shadow-cyan-500/20' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <span className="text-white font-medium text-sm">{agent.name}</span>
              </div>
              <div className="text-xs text-gray-400 ml-6">
                <div>{agent.type}</div>
                <div className="text-cyan-300">{agent.specialty}</div>
                <div className="text-purple-300 mt-1">📝 {agent.memory}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-8 pt-6 border-t border-slate-700">
        <div className="flex justify-center items-center gap-4">
          <div className={`flex items-center gap-2 ${animationStep >= 1 ? 'text-blue-400' : 'text-gray-600'}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span className="text-sm">Request Submitted</span>
          </div>
          <div className="w-8 h-px bg-gray-600"></div>
          <div className={`flex items-center gap-2 ${animationStep >= 2 ? 'text-purple-400' : 'text-gray-600'}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span className="text-sm">Broker Evaluation</span>
          </div>
          <div className="w-8 h-px bg-gray-600"></div>
          <div className={`flex items-center gap-2 ${animationStep >= 3 ? 'text-cyan-400' : 'text-gray-600'}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span className="text-sm">Service Routing</span>
          </div>
          <div className="w-8 h-px bg-gray-600"></div>
          <div className={`flex items-center gap-2 ${animationStep >= 0 ? 'text-green-400' : 'text-gray-600'}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span className="text-sm">Value Exchange</span>
          </div>
        </div>
      </div>
    </div>
  );
}