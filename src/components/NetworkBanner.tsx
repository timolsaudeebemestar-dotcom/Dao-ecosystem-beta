import React from 'react';
import { ShieldAlert, RefreshCw, ExternalLink } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { ARC_TESTNET_CONFIG } from '../constants/network';

export const NetworkBanner: React.FC = () => {
  const { isConnected, isArcNetwork, switchNetworkToArc, chainId } = useWallet();

  if (!isConnected || isArcNetwork) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b border-rose-800/80 px-4 py-3 text-rose-100 text-sm shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-900/60 text-rose-400 border border-rose-700/50">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-white">
              Rede incorreta detectada (Chain ID: {chainId || 'Desconhecido'})
            </p>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Para votar e receber suas recompensas instantâneas em USDC, você precisa estar conectado à{' '}
              <strong className="text-white">Arc Testnet (Chain ID 5042002)</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => switchNetworkToArc()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white text-rose-950 hover:bg-rose-100 shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Trocar para Arc Testnet</span>
          </button>

          <a
            href={ARC_TESTNET_CONFIG.blockExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-xs text-rose-300 hover:text-white transition-colors"
            title="Ver Explorador ArcScan"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
