import { ChevronRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-purple-100/10">
        <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">V</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    VOW
                  </span>
                </div>
                
                <div className="mt-24 sm:mt-32 lg:mt-16">
                  <div className="inline-flex space-x-6">
                    <span className="rounded-full bg-purple-600/20 px-3 py-1 text-sm/6 font-semibold text-purple-300 ring-1 ring-inset ring-purple-500/30">
                      Built with Letta
                    </span>
                    <span className="inline-flex items-center space-x-2 text-sm/6 font-medium text-gray-400">
                      <span>Beta v0.1.0</span>
                      <ChevronRightIcon className="size-5 text-gray-500" aria-hidden="true" />
                    </span>
                  </div>
                </div>
                
                <h1 className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                  VOW: Verified Operations Wrapper
                </h1>
                
                <p className="mt-8 text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                  A trust layer for AI.
                </p>
                
                <p className="mt-4 text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                  VOW revolutionizes AI interactions by turning information, promises, and insights into currency.
                </p>
                
                <div className="mt-10 flex items-center gap-x-6">
                  <Link
                    href="/agents"
                    className="rounded-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                  >
                    Explore Agents
                  </Link>
                  <Link href="/vow-broker-flow" className="text-sm/6 font-semibold text-gray-300 hover:text-white transition-colors">
                    Visualise VOW Broker Agent Flow <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
            <div
              className="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-gradient-to-r from-slate-900 to-purple-900 shadow-xl shadow-purple-600/10 ring-1 ring-purple-500/20 md:-mr-20 lg:-mr-36"
              aria-hidden="true"
            />
            <div className="shadow-lg md:rounded-3xl">
              <div className="bg-gradient-to-br from-purple-600 to-blue-700 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                <div
                  className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-purple-300/20 ring-1 ring-inset ring-white/10 md:ml-20 lg:ml-36"
                  aria-hidden="true"
                />
                <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                  <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                    <div className="w-screen overflow-hidden rounded-tl-xl bg-slate-900">
                      <div className="flex bg-slate-800/60 ring-1 ring-white/10">
                        <div className="-mb-px flex text-sm/6 font-medium text-gray-400">
                          <div className="border-b border-r border-b-white/20 border-r-white/10 bg-white/10 px-4 py-2 text-white">
                            VowBrokerAgent.py
                          </div>
                          <div className="border-r border-gray-600/20 px-4 py-2">ClientAgent.py</div>
                          <div className="border-r border-gray-600/20 px-4 py-2">ServiceAgent.py</div>
                        </div>
                      </div>
                      <div className="px-6 pb-14 pt-6">
                        <div className="text-gray-300 font-mono text-sm space-y-2">
                          <div className="text-purple-400"># Vow Intelligence Broker</div>
                          <div className="text-blue-400">class VowBrokerAgent(LettaAgent):</div>
                          <div className="pl-4 text-gray-300">def evaluate_value_proposition(self, request, offer):</div>
                          <div className="pl-8 text-gray-400">&quot;Assess if proposed value exchange is acceptable&quot;</div>
                          <div className="pl-8 text-cyan-400">return self.memory.assess_trust_score(offer)</div>
                          <div className="mt-4 text-gray-300">def enforce_agreement(self, agreement_id):</div>
                          <div className="pl-4 text-gray-400">&quot;Track and verify commitment fulfillment&quot;</div>
                          <div className="pl-4 text-green-400">status = self.monitor_commitment(agreement_id)</div>
                          <div className="pl-4 text-yellow-400">self.update_reputation(status)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 md:rounded-3xl"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-slate-900 sm:h-32" />
      </div>
    </div>
  )
}