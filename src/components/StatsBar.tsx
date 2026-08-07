import React from 'react';
import { Coins, Vote, CheckCircle2, Cpu, Zap, Activity } from 'lucide-react';
import { usePolls } from '../context/PollsContext';
import { useWallet } from '../context/WalletContext';

export const StatsBar: React.FC = () => {
  const { totalUsdcDistributed, totalVotesCast, polls, language } = usePolls();
  const { blockNumber, rpcLatency } = useWallet();

  const activePollsCount = polls.filter((p) => p.isActive && p.expiresAt > Date.now()).length;
  const isPt = language === 'pt';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
      
      {/* Total Distributed */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800/80 shadow-lg group hover:border-cyan-500/40 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Coins className="w-16 h-16 text-cyan-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
          <Coins className="w-4 h-4" />
          <span>{isPt ? 'Recompensas Pagas' : 'USDC Distributed'}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
          {totalUsdcDistributed.toFixed(2)}{' '}
          <span className="text-sm font-sans font-semibold text-cyan-400">USDC</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {isPt ? 'Transferidos via contrato na Arc' : 'Directly paid on-chain'}
        </div>
      </div>

      {/* Active Polls */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 shadow-lg group hover:border-blue-500/40 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Vote className="w-16 h-16 text-blue-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
          <Vote className="w-4 h-4" />
          <span>{isPt ? 'Enquetes Ativas' : 'Active Polls'}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
          {activePollsCount}{' '}
          <span className="text-sm font-sans font-normal text-slate-400">/ {polls.length} total</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {isPt ? 'Com pools de recompensa abertas' : 'With active USDC reward pools'}
        </div>
      </div>

      {/* Total Votes */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800/80 shadow-lg group hover:border-indigo-500/40 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckCircle2 className="w-16 h-16 text-indigo-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isPt ? 'Votos Registrados' : 'On-Chain Votes'}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
          {totalVotesCast}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {isPt ? 'Sem votos duplicados por carteira' : 'Immutable & double-vote safe'}
        </div>
      </div>

      {/* Network Health */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800/80 shadow-lg group hover:border-emerald-500/40 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-16 h-16 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <Zap className="w-4 h-4" />
          <span>{isPt ? 'Arc Testnet Status' : 'Arc Network Status'}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
          <span className="text-emerald-400 text-lg">●</span>
          <span>{rpcLatency}ms</span>
        </div>
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
          <Cpu className="w-3 h-3 text-slate-500" />
          <span>Bloco #{blockNumber}</span>
        </div>
      </div>

    </div>
  );
};
