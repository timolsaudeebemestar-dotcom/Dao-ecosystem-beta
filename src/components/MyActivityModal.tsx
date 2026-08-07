import React, { useState } from 'react';
import { X, Award, Layers, ExternalLink, Coins, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { usePolls } from '../context/PollsContext';
import { shortenAddress } from '../utils/web3';
import { ARC_TESTNET_CONFIG } from '../constants/network';

interface MyActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyActivityModal: React.FC<MyActivityModalProps> = ({ isOpen, onClose }) => {
  const { address, isConnected, txHistory } = useWallet();
  const { polls, language } = usePolls();

  const [activeTab, setActiveTab] = useState<'txs' | 'badges'>('txs');

  if (!isOpen) return null;

  const isPt = language === 'pt';

  // Extract user's voted polls & earned badges
  const votedPolls = address
    ? polls.filter((p) => p.voters.some((v) => v.voterAddress.toLowerCase() === address.toLowerCase()))
    : [];

  const userBadges = votedPolls
    .filter((p) => p.hasNFTBadge)
    .map((p) => {
      const v = p.voters.find((v) => v.voterAddress.toLowerCase() === address?.toLowerCase());
      return {
        pollTitle: p.title,
        badgeName: v?.badgeMinted || p.nftBadgeName || 'Arc Opinion NFT',
        category: p.category,
        timestamp: v?.timestamp || Date.now(),
        txHash: v?.txHash,
      };
    });

  const totalRewardsEarned = votedPolls.reduce((acc, p) => {
    const v = p.voters.find((v) => v.voterAddress.toLowerCase() === address?.toLowerCase());
    return acc + (v?.rewardAmount || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Meu Painel & Badges On-Chain
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {address ? shortenAddress(address) : 'Não Conectado'} • Arc Testnet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40 grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Recompensas Recebidas</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              +{totalRewardsEarned.toFixed(2)} USDC
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Enquetes Respondidas</span>
            <span className="text-lg font-black text-white font-mono">{votedPolls.length}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Badges/NFTs Conquistados</span>
            <span className="text-lg font-black text-indigo-400 font-mono">{userBadges.length}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 px-6 pt-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('txs')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'txs'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Histórico de Transações ({txHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'badges'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Galeria de Badges / NFTs ({userBadges.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          
          {/* TAB 1: TRANSACTIONS */}
          {activeTab === 'txs' && (
            <div>
              {txHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma transação registrada ainda.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {txHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            tx.type === 'VOTE_REWARD' || tx.type === 'FAUCET'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
                          }`}
                        >
                          {tx.type === 'VOTE_REWARD' || tx.type === 'FAUCET' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-white">{tx.title}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Bloco #{tx.blockNumber} • {new Date(tx.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        {tx.amountUSDC && (
                          <span
                            className={`font-bold block ${
                              tx.type === 'CREATE_POLL' ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {tx.type === 'CREATE_POLL' ? '-' : '+'}{tx.amountUSDC.toFixed(2)} USDC
                          </span>
                        )}

                        <a
                          href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[11px] justify-end mt-0.5"
                        >
                          {shortenAddress(tx.txHash, 4)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BADGES & NFTS */}
          {activeTab === 'badges' && (
            <div>
              {userBadges.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm space-y-2">
                  <Award className="w-10 h-10 text-slate-600 mx-auto" />
                  <p>Você ainda não possui Badges NFTs de Opinião.</p>
                  <p className="text-xs text-slate-600">
                    Vote em enquetes ativas da Arc Network para colecionar suas insígnias on-chain!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userBadges.map((badge, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-800/60 shadow-lg flex items-center gap-3.5"
                    >
                      <div className="p-3 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 shrink-0">
                        <Award className="w-6 h-6 text-indigo-400" />
                      </div>

                      <div className="overflow-hidden">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                          {badge.category}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate mt-1">
                          {badge.badgeName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {badge.pollTitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
