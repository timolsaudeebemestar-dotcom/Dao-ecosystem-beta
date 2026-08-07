import React, { useState } from 'react';
import { X, CheckCircle2, Coins, Clock, Award, ExternalLink, ShieldCheck, Share2, Copy, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Poll } from '../types';
import { useWallet } from '../context/WalletContext';
import { usePolls } from '../context/PollsContext';
import { shortenAddress } from '../utils/web3';
import { ARC_TESTNET_CONFIG } from '../constants/network';
import { DeletePollModal } from './DeletePollModal';

interface PollDetailModalProps {
  poll: Poll | null;
  onClose: () => void;
  onOpenVaultModal?: () => void;
}

export const PollDetailModal: React.FC<PollDetailModalProps> = ({ poll, onClose, onOpenVaultModal }) => {
  const { address, isConnected, isArcNetwork, connectInjectedWallet, switchNetworkToArc } = useWallet();
  const { voteInPoll, language } = usePolls();

  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<{ rewardAmount: number; txHash: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'vote' | 'audit'>('vote');
  const [copied, setCopied] = useState(false);

  if (!poll) return null;

  const isPt = language === 'pt';
  const isOwner = address && poll.creator.toLowerCase() === address.toLowerCase();

  const handleDeleteClick = () => {
    if (!isOwner) return;
    setIsDeleteModalOpen(true);
  };

  const userVoterRecord = address
    ? poll.voters.find((v) => v.voterAddress.toLowerCase() === address.toLowerCase())
    : null;
  const userHasVoted = !!userVoterRecord;

  const isExpired = poll.expiresAt < Date.now();
  const isFullyClaimed = poll.claimedParticipants >= poll.maxParticipants;
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

  const handleVoteSubmit = async () => {
    if (selectedOptionId === null) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await voteInPoll(poll.id, selectedOptionId);
      setSuccessTx({ rewardAmount: result.rewardAmount, txHash: result.txHash });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar voto na blockchain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-xs font-semibold">
              {poll.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              On-Chain ID: #{poll.onChainId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title={isPt ? 'Apagar esta enquete' : 'Delete this poll'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPt ? 'Apagar Enquete (Dono)' : 'Delete Poll (Owner)'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Title & Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug">
              {poll.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {poll.description}
            </p>
          </div>

          {/* Reward & Expiry Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-800/40">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{isPt ? 'Recompensa / Voto' : 'Micro-Reward / Vote'}</p>
                <p className="text-sm font-bold text-amber-400 font-mono">
                  {poll.rewardPerVote.toFixed(2)} USDC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{isPt ? 'Pool Restante' : 'Pool Remaining'}</p>
                <p className="text-sm font-bold text-white font-mono">
                  {poll.maxParticipants - poll.claimedParticipants} / {poll.maxParticipants} {isPt ? 'votos' : 'slots'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-950/50 text-indigo-400 border border-indigo-800/40">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Badge NFT</p>
                <p className="text-sm font-bold text-indigo-300 truncate">
                  {poll.hasNFTBadge ? poll.nftBadgeName : (isPt ? 'Nenhum' : 'None')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Opções vs Audit On-Chain) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('vote')}
                className={`pb-2 text-sm font-semibold transition-all relative ${
                  activeTab === 'vote'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isPt ? 'Opções de Votação' : 'Voting Choices'}
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-2 text-sm font-semibold transition-all relative ${
                  activeTab === 'audit'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isPt ? 'Auditoria de Votos On-Chain' : 'On-Chain Audit Log'}{' '}
                <span className="ml-1 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {poll.voters.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center gap-1 transition-colors"
                title="Copiar link"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? (isPt ? 'Copiado!' : 'Copied!') : (isPt ? 'Compartilhar' : 'Share')}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: VOTING OPTIONS */}
          {activeTab === 'vote' && (
            <div className="space-y-4">
              
              {/* Success Notification after Voting */}
              {successTx && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/60 text-emerald-200 space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{isPt ? 'Voto Registrado na Blockchain!' : 'Vote Cast Successfully!'}</span>
                  </div>
                  <p className="text-xs text-emerald-200/80">
                    Sua recompensa de <strong>+{successTx.rewardAmount.toFixed(2)} USDC</strong> foi transferida instantaneamente para sua carteira.
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span>Tx Hash:</span>
                    <a
                      href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${successTx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      {shortenAddress(successTx.txHash, 8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Already Voted Banner */}
              {userHasVoted && !successTx && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isPt
                        ? `Você já votou nesta enquete (${poll.options.find(o => o.id === userVoterRecord?.optionId)?.text}). Recompensa recebida: ${userVoterRecord?.rewardAmount} USDC`
                        : `You have already voted in this poll. Reward claimed.`}
                    </span>
                  </div>
                  {userVoterRecord?.txHash && (
                    <a
                      href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${userVoterRecord.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {shortenAddress(userVoterRecord.txHash)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Error Notification */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  {(errorMsg.includes('Cofre') || errorMsg.includes('Vault')) && onOpenVaultModal && (
                    <div className="pl-8 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenVaultModal();
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                      >
                        <Coins className="w-4 h-4" />
                        <span>{isPt ? 'Abastecer Cofre de Recompensas' : 'Top-up Reward Vault'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* List of Options */}
              <div className="space-y-3">
                {poll.options.map((opt) => {
                  const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  const isSelected = selectedOptionId === opt.id;
                  const isUserChosen = userVoterRecord?.optionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (!userHasVoted && !isExpired && !isFullyClaimed) {
                          setSelectedOptionId(opt.id);
                        }
                      }}
                      className={`relative overflow-hidden p-4 rounded-2xl border transition-all ${
                        isUserChosen
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                          : isSelected
                          ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : userHasVoted || isExpired || isFullyClaimed
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 cursor-pointer'
                      }`}
                    >
                      {/* Background Progress Fill */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-25 ${
                          isUserChosen ? 'bg-emerald-500' : isSelected ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${percent}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {!userHasVoted && !isExpired && !isFullyClaimed && (
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                                  : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>}
                            </div>
                          )}

                          {isUserChosen && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}

                          <div>
                            <p className="text-sm font-semibold text-white">{opt.text}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {opt.votes} {isPt ? 'votos' : 'votes'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono font-bold text-sm text-slate-200">
                          {percent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Vote / Connect Wallet Action Bar */}
              {!userHasVoted && (
                <div className="pt-4">
                  {!isConnected ? (
                    <button
                      onClick={connectInjectedWallet}
                      className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {isPt ? 'Conectar Carteira EVM para Votar' : 'Connect EVM Wallet to Vote'}
                    </button>
                  ) : !isArcNetwork ? (
                    <button
                      onClick={switchNetworkToArc}
                      className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isPt ? 'Mudar para Arc Testnet para Assinar Voto' : 'Switch to Arc Testnet to Sign Vote'}
                    </button>
                  ) : (
                    <button
                      onClick={handleVoteSubmit}
                      disabled={selectedOptionId === null || isSubmitting || isExpired || isFullyClaimed}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{isPt ? 'Aguardando Assinatura na Carteira EVM...' : 'Awaiting EVM Wallet Signature...'}</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 text-amber-300" />
                          <span>
                            {isPt
                              ? `Assinar & Confirmar Voto (+${poll.rewardPerVote.toFixed(2)} USDC)`
                              : `Sign & Cast Vote (+${poll.rewardPerVote.toFixed(2)} USDC)`}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: ON-CHAIN AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Contrato: <strong className="font-mono text-cyan-300">{ARC_TESTNET_CONFIG.pollContractAddress}</strong></span>
                <a
                  href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/address/${ARC_TESTNET_CONFIG.pollContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                >
                  ArcScan Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {poll.voters.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {isPt ? 'Nenhum voto registrado ainda. Seja o primeiro a votar e receber a recompensa!' : 'No votes recorded yet. Be the first to vote!'}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  {poll.voters.map((v, idx) => {
                    const optionName = poll.options.find((o) => o.id === v.optionId)?.text || `Opção #${v.optionId}`;
                    return (
                      <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-900/60 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span className="font-mono text-slate-300">{shortenAddress(v.voterAddress)}</span>
                          <span className="text-slate-500">votou em</span>
                          <span className="font-semibold text-white truncate max-w-xs">{optionName}</span>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-slate-400">
                          <span className="text-amber-400 font-semibold">+{v.rewardAmount} USDC</span>
                          <a
                            href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${v.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            {shortenAddress(v.txHash, 6)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      <DeletePollModal
        poll={poll}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => onClose()}
      />
    </div>
  );
};
