import React, { useState } from 'react';
import { X, Droplets, ExternalLink, Copy, Check, RefreshCw, Loader2, Coins, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { usePolls } from '../context/PollsContext';
import { ARC_TESTNET_CONFIG } from '../constants/network';

interface ArcFaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArcFaucetModal: React.FC<ArcFaucetModalProps> = ({ isOpen, onClose }) => {
  const { address, isConnected, connectInjectedWallet, usdcBalance, refetchBalance } = useWallet();
  const { language } = usePolls();

  const isPt = language === 'pt';
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const CIRCLE_FAUCET_URL = 'https://faucet.circle.com/?_gl=1*ta59ym*_gcl_au*MTIxNTUyMDA0My4xNzYzMTQ0MTc0';

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchBalance();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Torneira Oficial USDC • Arc Testnet
              </h2>
              <p className="text-xs text-slate-400">
                Obtenha USDC oficial de teste via Circle Faucet para pagar taxas de rede e interagir
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

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Important Network Notice */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              <span>USDC é o Token Nativo para Taxas na Arc Testnet</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Na rede Arc, o token USDC é utilizado diretamente para pagar taxas de transação (gas fees) e financiar recompensas das enquetes. Não existem tokens simulados fictícios neste dApp.
            </p>
          </div>

          {/* Wallet Address & On-Chain Balance */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Sua Carteira EVM:</span>
              {isConnected && address ? (
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold">{address}</span>
                  <button
                    onClick={() => handleCopy(address, setCopiedAddress)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copiar endereço"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-rose-400 font-semibold">Desconectada</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Saldo On-Chain Atual:</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">{usdcBalance} USDC</span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || !isConnected}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                  title="Atualizar saldo na blockchain"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Official USDC Token Contract Address */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Contrato Oficial do Token USDC (Arc Network):</span>
              <button
                onClick={() => handleCopy(ARC_TESTNET_CONFIG.usdcContractAddress, setCopiedContract)}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
              >
                {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedContract ? 'Copiado' : 'Copiar Contrato'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 break-all select-all">
              {ARC_TESTNET_CONFIG.usdcContractAddress}
            </div>
          </div>

          {/* Action Step-by-Step Instructions */}
          <div className="space-y-2 text-xs text-slate-300">
            <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
              Como solicitar USDC na Torneira Circle:
            </span>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-400">
              <li>Copie o seu endereço de carteira EVM exibido acima.</li>
              <li>Acesse o Faucet Oficial da Circle pelo botão abaixo.</li>
              <li>Selecione a rede <strong className="text-cyan-300 font-mono">Arc Testnet</strong> ou insira seu endereço de carteira.</li>
              <li>Confirme a solicitação de teste para receber seu saldo de USDC.</li>
            </ol>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            {!isConnected ? (
              <button
                type="button"
                onClick={connectInjectedWallet}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-sm border border-slate-700 transition-colors"
              >
                Conectar Carteira Primeiro
              </button>
            ) : (
              <a
                href={CIRCLE_FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5 text-amber-300" />
                <span>Abrir Torneira Oficial Circle (faucet.circle.com)</span>
                <ExternalLink className="w-4 h-4 text-white" />
              </a>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

