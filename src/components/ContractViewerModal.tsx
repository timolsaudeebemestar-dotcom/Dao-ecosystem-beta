import React, { useState } from 'react';
import { X, Code2, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { SOLIDITY_CONTRACT_CODE } from '../contracts/ArcPolls.sol';
import { ARC_TESTNET_CONFIG, CONTRACT_ABI, VAULT_CONTRACT_ABI } from '../constants/network';

interface ContractViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractViewerModal: React.FC<ContractViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'solidity' | 'abi' | 'vault_abi' | 'network'>('vault_abi');
  const [copiedSol, setCopiedSol] = useState(false);
  const [copiedAbi, setCopiedAbi] = useState(false);
  const [copiedVaultAbi, setCopiedVaultAbi] = useState(false);

  if (!isOpen) return null;

  const handleCopySol = () => {
    navigator.clipboard.writeText(SOLIDITY_CONTRACT_CODE);
    setCopiedSol(true);
    setTimeout(() => setCopiedSol(false), 2000);
  };

  const handleCopyAbi = () => {
    navigator.clipboard.writeText(JSON.stringify(CONTRACT_ABI, null, 2));
    setCopiedAbi(true);
    setTimeout(() => setCopiedAbi(false), 2000);
  };

  const handleCopyVaultAbi = () => {
    navigator.clipboard.writeText(JSON.stringify(VAULT_CONTRACT_ABI, null, 2));
    setCopiedVaultAbi(true);
    setTimeout(() => setCopiedVaultAbi(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Contratos Inteligentes Arc & Explorer
              </h2>
              <p className="text-xs text-slate-400">
                ArcPollsRewardVault (0xCe9D...19DD) • Arc Testnet (5042002)
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

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-4 px-6 pt-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('vault_abi')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'vault_abi'
                ? 'text-purple-400 border-purple-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            ABI do Cofre (ArcPollsRewardVault)
          </button>

          <button
            onClick={() => setActiveTab('solidity')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'solidity'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Solidity (.sol)
          </button>

          <button
            onClick={() => setActiveTab('abi')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'abi'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Interface ABI Standard
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'network'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Parâmetros da Rede Arc
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* TAB: VAULT ABI */}
          {activeTab === 'vault_abi' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300 space-y-1">
                <div className="font-bold text-sm text-purple-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>ArcPollsRewardVault Smart Contract</span>
                </div>
                <p className="font-mono text-[11px] text-purple-300/80">
                  Endereço do Cofre: <strong>{ARC_TESTNET_CONFIG.vaultContractAddress}</strong>
                </p>
                <p className="text-[11px] opacity-80">
                  Funções principais: <code className="text-purple-200">getVaultBalance()</code>, <code className="text-purple-200">depositUSDC(amount)</code>, <code className="text-purple-200">voteAndClaim(pollId, rewardAmount)</code>, <code className="text-purple-200">hasVoted(pollId, voter)</code>.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Vault Contract JSON ABI</span>
                <button
                  onClick={handleCopyVaultAbi}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedVaultAbi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVaultAbi ? 'Copiado!' : 'Copiar ABI do Cofre'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 max-h-96 overflow-y-auto">
                <pre>{JSON.stringify(VAULT_CONTRACT_ABI, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB: SOLIDITY CODE */}
          {activeTab === 'solidity' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">ArcPollsAndFeedback.sol</span>
                <button
                  onClick={handleCopySol}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedSol ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSol ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto leading-relaxed">
                <pre>{SOLIDITY_CONTRACT_CODE}</pre>
              </div>
            </div>
          )}

          {/* TAB: STANDARD ABI */}
          {activeTab === 'abi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Human-Readable ABI JSON</span>
                <button
                  onClick={handleCopyAbi}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedAbi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAbi ? 'Copiado!' : 'Copiar ABI'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 max-h-96 overflow-y-auto">
                <pre>{JSON.stringify(CONTRACT_ABI, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB: NETWORK PARAMETERS */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Network Name
                  </span>
                  <p className="text-lg font-bold text-white font-mono">{ARC_TESTNET_CONFIG.chainName}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Chain ID
                  </span>
                  <p className="text-lg font-bold text-cyan-400 font-mono">
                    {ARC_TESTNET_CONFIG.chainIdDecimal} ({ARC_TESTNET_CONFIG.chainIdHex})
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 bg-purple-950/20 space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider block">
                    ArcPollsRewardVault Contract (Cofre de Recompensas)
                  </span>
                  <div className="flex items-center justify-between font-mono text-sm text-purple-200">
                    <span>{ARC_TESTNET_CONFIG.vaultContractAddress}</span>
                    <a
                      href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/address/${ARC_TESTNET_CONFIG.vaultContractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:text-white flex items-center gap-1 text-xs"
                    >
                      ArcScan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    USDC Contract Address (Arc Testnet)
                  </span>
                  <div className="flex items-center justify-between font-mono text-sm text-cyan-300">
                    <span>{ARC_TESTNET_CONFIG.usdcContractAddress}</span>
                    <a
                      href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/address/${ARC_TESTNET_CONFIG.usdcContractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
                    >
                      ArcScan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Native Currency / Gas Token
                  </span>
                  <p className="text-lg font-bold text-amber-400 font-mono">USDC (Decimals: 18)</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    RPC URL
                  </span>
                  <p className="text-sm font-bold text-slate-200 font-mono truncate">{ARC_TESTNET_CONFIG.rpcUrl}</p>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

