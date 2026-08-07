import React, { useState } from 'react';
import { Vote, Wallet, ShieldAlert, Sparkles, Code2, Droplets, RefreshCw, Layers, ExternalLink, Globe, CheckCircle2, Shield } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { usePolls } from '../context/PollsContext';
import { shortenAddress } from '../utils/web3';
import { ARC_TESTNET_CONFIG } from '../constants/network';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenContractModal: () => void;
  onOpenFaucetModal: () => void;
  onOpenActivityModal: () => void;
  onOpenVaultModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenContractModal,
  onOpenFaucetModal,
  onOpenActivityModal,
  onOpenVaultModal,
}) => {
  const {
    address,
    isConnected,
    isArcNetwork,
    usdcBalance,
    isConnecting,
    connectInjectedWallet,
    disconnectWallet,
    switchNetworkToArc,
    blockNumber,
    rpcLatency,
  } = useWallet();

  const { language, setLanguage, vaultBalance } = usePolls();
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  const isPt = language === 'pt';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
            <Vote className="w-6 h-6 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                Arc Polls
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Opinião Recompensada
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-cyan-400 font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                Arc Testnet (5042002)
              </span>
              <span>•</span>
              <span className="font-mono text-slate-500">#{blockNumber}</span>
              <span className="font-mono text-xs text-slate-500">({rpcLatency}ms)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Navigation */}
        <div className="flex items-center gap-3">
          
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(isPt ? 'en' : 'pt')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Mudar idioma / Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{isPt ? 'PT 🇧🇷' : 'EN 🇺🇸'}</span>
          </button>

          {/* Reward Vault Button */}
          <button
            onClick={onOpenVaultModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 transition-all shadow-sm shadow-purple-950/50"
            title={isPt ? 'Ver saldo e abastecer o Cofre de Recompensas' : 'View balance and top-up Reward Vault'}
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">{isPt ? 'Cofre:' : 'Vault:'}</span>
            <span className="font-mono font-bold text-white">{vaultBalance} USDC</span>
          </button>

          {/* Smart Contract Inspector */}
          <button
            onClick={onOpenContractModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Contrato & ABI</span>
          </button>

          {/* Faucet */}
          <button
            onClick={onOpenFaucetModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/50 transition-colors"
            title="Receber USDC de teste na Arc Testnet"
          >
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{isPt ? 'Torneira USDC' : 'USDC Faucet'}</span>
          </button>

          {/* Create Poll Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isPt ? 'Criar Enquete' : 'Create Poll'}</span>
          </button>

          {/* Wallet Connection */}
          <div className="relative">
            {!isConnected ? (
              <button
                onClick={connectInjectedWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all"
              >
                <Wallet className="w-4 h-4 text-white" />
                <span>{isConnecting ? (isPt ? 'Conectando...' : 'Connecting...') : (isPt ? 'Conectar Carteira EVM' : 'Connect EVM Wallet')}</span>
              </button>
            ) : (
              <div>
                <button
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                    !isArcNetwork
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/40'
                      : 'bg-slate-800/90 border-slate-700 hover:bg-slate-800 text-slate-100'
                  }`}
                >
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-cyan-300 font-mono">
                        {usdcBalance} USDC
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {shortenAddress(address || '')}
                    </span>
                  </div>

                  {!isArcNetwork ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
                  )}
                </button>

                {/* Dropdown Drawer */}
                {showWalletDropdown && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Carteira Conectada
                      </span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                        Arc Testnet
                      </span>
                    </div>

                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Endereço:</span>
                        <a
                          href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/address/${address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          {shortenAddress(address || '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Saldo USDC:</span>
                        <span className="font-mono text-white font-bold">{usdcBalance} USDC</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Saldo Cofre:</span>
                        <span className="font-mono text-purple-300 font-bold">{vaultBalance} USDC</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Assinatura Web3:</span>
                        <span className="font-mono text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Assinado
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Rede:</span>
                        <span className={`font-mono ${isArcNetwork ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isArcNetwork ? 'Arc Testnet (5042002)' : 'Incorreta'}
                        </span>
                      </div>
                    </div>

                    {!isArcNetwork && (
                      <button
                        onClick={() => {
                          switchNetworkToArc();
                          setShowWalletDropdown(false);
                        }}
                        className="w-full mb-2 py-2 px-3 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mudar para Arc Testnet
                      </button>
                    )}

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <button
                        onClick={() => {
                          onOpenVaultModal();
                          setShowWalletDropdown(false);
                        }}
                        className="w-full py-2 px-3 text-xs font-medium rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 transition-colors flex items-center justify-between border border-purple-800/60"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-purple-400" />
                          {isPt ? 'Abastecer Cofre (Deposit)' : 'Deposit Vault Funds'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenActivityModal();
                          setShowWalletDropdown(false);
                        }}
                        className="w-full py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          Meu Histórico & Badges
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          disconnectWallet();
                          setShowWalletDropdown(false);
                        }}
                        className="w-full py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 transition-colors text-center"
                      >
                        Desconectar Carteira
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

