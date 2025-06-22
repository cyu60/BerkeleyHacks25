"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import React from "react";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";

export default function GoogleGeminiEffectDemo() {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  // SVG paths with exact start and end coordinates
  const clientAgents = [
    { name: "User Alice", type: "Human Agent", color: "from-blue-500 to-cyan-500", x: 0, y: 663, pathIndex: 0 },
    { name: "Research Bot", type: "AI Agent", color: "from-green-500 to-emerald-500", x: 0, y: 587.5, pathIndex: 1 },
    { name: "Dev Assistant", type: "Code Agent", color: "from-purple-500 to-violet-500", x: 0, y: 514, pathIndex: 2 },
    { name: "Data Analyst", type: "Analytics Agent", color: "from-yellow-500 to-orange-500", x: 0, y: 438.5, pathIndex: 3 },
    { name: "Content Creator", type: "Creative Agent", color: "from-pink-500 to-purple-500", x: 0.5, y: 364, pathIndex: 4 },
  ];

  // SVG paths end coordinates (extracted from the actual path endpoints)
  const serviceAgents = [
    { name: "OpenAI GPT", type: "LLM Service", color: "from-orange-500 to-red-500", x: 1440, y: 662.5, pathIndex: 0 },
    { name: "Claude", type: "AI Assistant", color: "from-pink-500 to-rose-500", x: 1440, y: 588, pathIndex: 1 },
    { name: "Gemini", type: "Multimodal AI", color: "from-indigo-500 to-blue-500", x: 1440, y: 513.235, pathIndex: 2 },
    { name: "Perplexity", type: "Search AI", color: "from-teal-500 to-cyan-500", x: 1439.5, y: 439, pathIndex: 3 },
    { name: "GitHub Copilot", type: "Code AI", color: "from-green-500 to-emerald-500", x: 1439, y: 364, pathIndex: 4 },
  ];

  // Convert SVG coordinates to CSS positioning
  const svgToCSS = (svgX: number, svgY: number) => {
    // SVG viewBox is 1440x890
    const svgWidth = 1440;
    const svgHeight = 890;
    
    // The SVG is positioned with absolute -top-60 md:-top-40
    const svgTopOffset = 60; // Approximate offset in pixels
    
    // Convert to percentages relative to the container
    const xPercent = (svgX / svgWidth) * 100;
    const yPercent = ((svgY + svgTopOffset) / svgHeight) * 100;
    
    return { left: `${xPercent}%`, top: `${Math.max(15, Math.min(85, yPercent))}%` };
  };

  return (
    <div
      className="h-[200vh] bg-gradient-to-b from-slate-900 to-black w-full rounded-xl relative pt-20 overflow-clip border border-slate-700"
      ref={ref}
    >
      {/* Client Agents - Anchored to exact SVG path start points */}
      {clientAgents.map((agent, index) => {
        const position = svgToCSS(agent.x, agent.y);
        
        return (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            className={`absolute z-20 bg-gradient-to-r ${agent.color} p-3 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm max-w-[140px] -translate-x-full -translate-y-1/2`}
            style={{ 
              left: position.left, 
              top: position.top,
              marginLeft: '-12px' // Offset to position next to the path start
            }}
          >
            <div className="text-white text-xs font-semibold mb-1">{agent.name}</div>
            <div className="text-white/80 text-xs">{agent.type}</div>
            {/* Connection line to path */}
            <div className="w-3 h-0.5 bg-white absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2"></div>
            <div className="w-2 h-2 bg-white rounded-full absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 translate-x-3"></div>
          </motion.div>
        );
      })}

      {/* Service Agents - Anchored to exact SVG path end points */}
      {serviceAgents.map((agent, index) => {
        const position = svgToCSS(agent.x, agent.y);
        
        return (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
            className={`absolute z-20 bg-gradient-to-r ${agent.color} p-3 rounded-lg shadow-lg border border-white/10 backdrop-blur-sm max-w-[140px] -translate-y-1/2`}
            style={{ 
              left: position.left, 
              top: position.top,
              marginLeft: '12px' // Offset to position next to the path end
            }}
          >
            {/* Connection line from path */}
            <div className="w-3 h-0.5 bg-white absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2"></div>
            <div className="w-2 h-2 bg-white rounded-full absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 -translate-x-3"></div>
            <div className="text-white text-xs font-semibold mb-1">{agent.name}</div>
            <div className="text-white/80 text-xs">{agent.type}</div>
          </motion.div>
        );
      })}

      {/* Labels */}
      <div className="absolute left-4 md:left-8 top-[15%] z-20">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">Client Agents</h3>
      </div>
      <div className="absolute right-4 md:right-8 top-[15%] z-20">
        <h3 className="text-sm font-semibold text-cyan-400 mb-2">Service Agents</h3>
      </div>

      <GoogleGeminiEffect
        title="VOW Intelligence Broker"
        description="Scroll to see how Letta agents create value exchanges through sophisticated pathways of trust, verification, and mutual benefit."
        pathLengths={[
          pathLengthFirst,
          pathLengthSecond,
          pathLengthThird,
          pathLengthFourth,
          pathLengthFifth,
        ]}
      />
    </div>
  );
}