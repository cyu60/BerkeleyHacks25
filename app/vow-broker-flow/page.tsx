import Spline from '@splinetool/react-spline/next';
import Link from 'next/link';
import { ArrowLeftIcon, UsersIcon } from '@heroicons/react/20/solid';

export default function VowBrokerFlow() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          {/* Back to Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 text-white hover:from-slate-700/80 hover:to-slate-600/80 hover:border-slate-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </Link>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            VOW Broker Agent Flow
          </h1>

          {/* View Agents Button */}
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/80 to-blue-600/80 backdrop-blur-sm border border-purple-500/50 text-white hover:from-purple-500/80 hover:to-blue-500/80 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <UsersIcon className="w-4 h-4" />
            <span className="text-sm font-medium">View Agents</span>
          </Link>
        </div>
      </div>

      {/* Spline 3D Scene */}
      <main className="w-full h-screen">
        <Spline
          scene="https://prod.spline.design/KTseLKPmUaJFfDA0/scene.splinecode" 
        />
      </main>
    </div>
  );
}