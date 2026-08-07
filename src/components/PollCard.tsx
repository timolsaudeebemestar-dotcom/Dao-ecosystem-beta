import React, { useState } from 'react';
import { Clock, Coins, CheckCircle2, Award, ChevronRight, Users, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { Poll } from '../types';
import { useWallet } from '../context/WalletContext';
import { usePolls } from '../context/PollsContext';
import { shortenAddress } from '../utils/web3';
import { ARC_TESTNET_CONFIG } from '../constants/network';
import { DeletePollModal } from './DeletePollModal';

interface PollCardProps {
  poll: Poll;
  onSelectPoll: (poll: Poll) => void;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onSelectPoll }) => {
  const { address } = useWallet();
  const { language } = usePolls();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isPt = language === 'pt';
  const isOwner = address && poll.creator.toLowerCase() === address.toLowerCase();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return;
    setIsDeleteModalOpen(true);
  };

  const userHasVoted = address
    ? poll.voters.some((v) => v.voterAddress.toLowerCase() === address.toLowerCase())
    : false;

  const isExpired = poll.expiresAt < Date.now();
  const isFullyClaimed = poll.claimedParticipants >= poll.maxParticipants;
  const isAvailable = poll.isActive && !isExpired && !isFullyClaimed;

  // Calculate total votes across options
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

  // Time remaining calculation
  const getDaysLeft = (timeMs: number) => {
    const diff = timeMs - Date.now();
    if (diff <= 0) return isPt ? 'Encerrada' : 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ${isPt ? 'restantes' : 'left'}`;
    const days = Math.floor(hours / 24);
    return `${days}d ${isPt ? 'restantes' : 'left'}`;
  };

  // Distribution progress percentage
  const claimPercent = Math.min(
    100,
    Math.round((poll.claimedParticipants / poll.maxParticipants) * 100)
  );

  // Category Colors
  const categoryStyles: Record<Poll['category'], string> = {
    Web3: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    DAO: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60',
    Feedback: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    Social: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    Ecosystem: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  };

  return (
    <div
      onClick={() => onSelectPoll(poll)}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 shadow-xl hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                categoryStyles[poll.category]
              }`}
            >
              {poll.category}
            </span>

            {poll.hasNFTBadge && (
              <span
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
                title={`Esta enquete também premia um Badge/NFT On-Chain: ${poll.nftBadgeName}`}
              >
                <Award className="w-3 h-3 text-indigo-400" />
                <span>Badge NFT</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/80 transition-colors flex items-center gap-1 font-sans text-xs font-semibold mr-1"
                title={isPt ? 'Excluir esta enquete (Apenas Criador)' : 'Delete this poll (Owner only)'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPt ? 'Excluir' : 'Delete'}</span>
              </button>
            )}

            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className={isExpired ? 'text-slate-500' : 'text-slate-300'}>
              {getDaysLeft(poll.expiresAt)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-2">
          {poll.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {poll.description}
        </p>

        {/* Options preview */}
        <div className="space-y-1.5 mb-5">
          {poll.options.slice(0, 3).map((opt) => {
            const optPercent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <div key={opt.id} className="relative overflow-hidden rounded-lg bg-slate-800/60 p-2.5 text-xs text-slate-300 flex items-center justify-between border border-slate-700/40">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-cyan-950/50 border-r border-cyan-800/30 transition-all duration-500"
                  style={{ width: `${optPercent}%` }}
                />
                <span className="relative z-10 truncate pr-2 font-medium">{opt.text}</span>
                <span className="relative z-10 font-mono text-[11px] text-slate-400">{optPercent}%</span>
              </div>
            );
          })}
          {poll.options.length > 3 && (
            <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
              + {poll.options.length - 3} {isPt ? 'outras opções...' : 'more options...'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        
        {/* Reward Pool Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Pool:</span>
              <strong className="text-white">{poll.rewardPoolTotal} USDC</strong>
            </span>

            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{poll.claimedParticipants}/{poll.maxParticipants} {isPt ? 'votos' : 'voters'}</span>
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${claimPercent}%` }}
            />
          </div>
        </div>

        {/* Creator & Status Action Button */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <span>Criador:</span>
            <a
              href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/address/${poll.creator}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-cyan-300 flex items-center gap-0.5 hover:underline"
            >
              {shortenAddress(poll.creator)}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div>
            {userHasVoted ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isPt ? 'Votado' : 'Voted'}</span>
              </span>
            ) : isAvailable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPoll(poll);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all group-hover:scale-105"
              >
                <span>+{poll.rewardPerVote.toFixed(2)} USDC</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700/50">
                {isExpired ? (isPt ? 'Encerrada' : 'Ended') : (isPt ? 'Pool Esgotada' : 'Depleted')}
              </span>
            )}
          </div>
        </div>

      </div>

      <DeletePollModal
        poll={poll}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
