import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ARC_TESTNET_CONFIG } from '../constants/network';
import { TransactionHistory, WalletState } from '../types';
import { shortenAddress, generateTxHash, checkArcNetworkConnection, switchOrAddArcNetwork, fetchLiveUsdcBalance, requestPersonalSignature } from '../utils/web3';

interface WalletContextType extends WalletState {
  connectInjectedWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetworkToArc: () => Promise<void>;
  addTokensToWallet: (amount: number) => void;
  txHistory: TransactionHistory[];
  addTxHistory: (tx: Omit<TransactionHistory, 'id' | 'timestamp'>) => void;
  blockNumber: number;
  rpcLatency: number;
  refetchBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    isArcNetwork: false,
    usdcBalance: '0.00',
    nativeBalance: '0.00',
    isConnecting: false,
    providerType: 'none',
  });

  const [txHistory, setTxHistory] = useState<TransactionHistory[]>(() => {
    const saved = localStorage.getItem('arc_polls_tx_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [blockNumber, setBlockNumber] = useState<number>(1045890);
  const [rpcLatency, setRpcLatency] = useState<number>(42);

  // Sync tx history to local storage
  useEffect(() => {
    localStorage.setItem('arc_polls_tx_history', JSON.stringify(txHistory));
  }, [txHistory]);

  // Check live RPC status
  const updateRpcInfo = useCallback(async () => {
    const info = await checkArcNetworkConnection();
    if (info.isArc) {
      setBlockNumber(info.blockNumber);
      setRpcLatency(info.latencyMs);
    }
  }, []);

  useEffect(() => {
    updateRpcInfo();
    const interval = setInterval(() => {
      updateRpcInfo();
      setBlockNumber((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, [updateRpcInfo]);

  // Refetch USDC Balance
  const refetchBalance = useCallback(async () => {
    if (!wallet.address) return;
    const balance = await fetchLiveUsdcBalance(wallet.address);
    setWallet((prev) => ({
      ...prev,
      usdcBalance: balance,
      nativeBalance: balance,
    }));
  }, [wallet.address]);

  // Auto-refetch balance on connection or network change, and periodically
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      refetchBalance();
      const interval = setInterval(() => {
        refetchBalance();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [wallet.isConnected, wallet.address, wallet.isArcNetwork, refetchBalance]);

  // Initialize Injected Wallet Listener if window.ethereum present
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddress = accounts[0];
        setWallet((prev) => ({
          ...prev,
          address: newAddress,
          isConnected: true,
          providerType: 'injected',
        }));
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const chainIdDecimal = parseInt(hexChainId, 16);
      const isArc = chainIdDecimal === ARC_TESTNET_CONFIG.chainIdDecimal;
      setWallet((prev) => ({
        ...prev,
        chainId: chainIdDecimal,
        isArcNetwork: isArc,
      }));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Connect Injected EVM Wallet (MetaMask, Rabby, Coinbase, etc.)
  const connectInjectedWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('Nenhuma carteira Web3 (como MetaMask, Rabby ou Coinbase Wallet) foi encontrada no seu navegador. Por favor, instale uma extensão de carteira para conectar.');
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true }));

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainIdHex, 16);
      const isArc = chainIdDecimal === ARC_TESTNET_CONFIG.chainIdDecimal;

      const userAddr = accounts[0];

      // Mandatory SIWE / Wallet Signature request
      const authMsg = `Web3 Auth - On-Chain Feedback & Rewards dApp\n\n` +
        `Solicitação de assinatura para conectar sua carteira com segurança à rede Arc Testnet.\n\n` +
        `Endereço da Carteira: ${userAddr}\n` +
        `Chain ID: ${chainIdDecimal}\n` +
        `Data e Hora: ${new Date().toLocaleString('pt-BR')}`;

      const signature = await requestPersonalSignature(userAddr, authMsg);

      const liveBal = isArc ? await fetchLiveUsdcBalance(userAddr) : '0.00';

      setWallet({
        address: userAddr,
        isConnected: true,
        chainId: chainIdDecimal,
        isArcNetwork: isArc,
        usdcBalance: liveBal,
        nativeBalance: liveBal,
        isConnecting: false,
        providerType: 'injected',
        authSignature: signature,
      });

      if (!isArc) {
        // Automatically attempt switch or prompt
        try {
          await switchOrAddArcNetwork();
        } catch (e) {
          console.warn('User delayed switching to Arc Testnet');
        }
      }
    } catch (err: any) {
      console.error('Wallet connection or signature rejected:', err);
      setWallet((prev) => ({ ...prev, isConnecting: false }));
      alert(err.message || 'Falha ao conectar e assinar com a carteira.');
      throw err;
    }
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      isConnected: false,
      chainId: null,
      isArcNetwork: false,
      usdcBalance: '0.00',
      nativeBalance: '0.00',
      isConnecting: false,
      providerType: 'none',
    });
  };

  const switchNetworkToArc = async () => {
    await switchOrAddArcNetwork();
    setWallet((prev) => ({
      ...prev,
      chainId: ARC_TESTNET_CONFIG.chainIdDecimal,
      isArcNetwork: true,
    }));
    setTimeout(() => refetchBalance(), 500);
  };

  const addTokensToWallet = (amount: number) => {
    setWallet((prev) => {
      const current = parseFloat(prev.usdcBalance) || 0;
      const next = (current + amount).toFixed(2);
      return {
        ...prev,
        usdcBalance: next,
        nativeBalance: next,
      };
    });
  };

  const addTxHistory = (tx: Omit<TransactionHistory, 'id' | 'timestamp'>) => {
    const newTx: TransactionHistory = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setTxHistory((prev) => [newTx, ...prev]);
  };

  return (
    <WalletContext.Provider
      value={{
        ...wallet,
        connectInjectedWallet,
        disconnectWallet,
        switchNetworkToArc,
        addTokensToWallet,
        txHistory,
        addTxHistory,
        blockNumber,
        rpcLatency,
        refetchBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
