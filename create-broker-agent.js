require('dotenv').config();
const { LettaClient } = require('@letta-ai/letta-client');

// TODO: Replace with your actual Letta Cloud API key
const LETTA_API_KEY = process.env.LETTA_API_KEY || 'YOUR_LETTA_API_KEY';

async function main() {
  const client = new LettaClient({ token: LETTA_API_KEY });

  // Enhanced memory blocks with agent registry and preferences
  const memoryBlocks = [
    {
      label: 'human',
      value: "The user is an agent developer interested in value-based AI transactions."
    },
    {
      label: 'persona',
      value: "I am the Intelligence Broker, mediating value-based exchanges between agents. I evaluate offers, enforce agreements, and track trust. I can use web_search and run_code tools to help with my decisions."
    },
    {
      label: 'broker_policies',
      value: "Track agent agreements, verify fulfillment, assign trust scores, and enforce access rules. Use time-based evaluation and preference matching for offer assessment.",
      description: "Stores the broker's rules and logic for evaluating and enforcing value-based exchanges."
    },
    {
      label: 'agent_registry',
      value: "OpenAI Agent: prefers travel_data, code_samples, feedback. Trust score: 0.9. User Agent: trust score: 0.7, history: 3 agreements, 2 fulfilled.",
      description: "Registry of known agents, their preferences, trust scores, and interaction history."
    },
    {
      label: 'agreement_templates',
      value: "Standard agreement format: {id, userAgent, serviceAgent, offer, promise, deadline, status}. Verification process: check fulfillment within 5 minutes of deadline. Use time calculations and preference matching for evaluation.",
      description: "Templates and processes for creating and managing value-based agreements."
    },
    {
      label: 'evaluation_criteria',
      value: "Score offers: travel_data +50, code_samples +40, feedback +30, quick_delivery +20. Approve if score >=50, request clarification if >=30, reject if <30. Use current time for deadline calculations.",
      description: "Criteria for evaluating value-based offers and making approval decisions."
    }
  ];

  const agent = await client.agents.create({
    memoryBlocks,
    tools: ['web_search', 'run_code'],
    model: 'openai/gpt-4.1',
    embedding: 'openai/text-embedding-3-small'
  });

  console.log('Enhanced broker agent created:', agent.id);
  console.log('Available tools: web_search, run_code');
  console.log('Save this agent ID for future use.');
  
  return agent;
}

// Test the agent with a sample message
async function testBrokerAgent(agentId) {
  const client = new LettaClient({ token: LETTA_API_KEY });
  
  const response = await client.agents.messages.create(agentId, {
    messages: [{ 
      role: "user", 
      content: "A user offers to share their travel itinerary within 30 minutes in exchange for an answer about France. Should we approve this agreement? Please evaluate the offer and explain your reasoning." 
    }]
  });

  console.log('\n--- Broker Response ---');
  for (const msg of response.messages) {
    if (msg.messageType === "assistant_message") {
      console.log('Assistant:', msg.content);
    } else if (msg.messageType === "tool_call_message") {
      console.log('Tool called:', msg.toolCall.name);
      if (msg.toolCall.arguments) {
        console.log('Arguments:', msg.toolCall.arguments);
      }
    } else if (msg.messageType === "tool_return_message") {
      console.log('Tool result:', msg.toolReturn);
    }
  }
}

// Run the setup
async function runSetup() {
  try {
    const agent = await main();
    console.log('\n--- Testing Agent ---');
    await testBrokerAgent(agent.id);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSetup();
}

module.exports = { main, testBrokerAgent }; 