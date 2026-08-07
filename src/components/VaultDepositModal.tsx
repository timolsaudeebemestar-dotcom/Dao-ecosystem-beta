import React, { useState } from 'react';
import { X, Shield, ArrowRight, Loader2, CheckCircle2, AlertCircle, Coins, Lock, ExternalLink, RefreshCw } from 'lucide-react';
import { usePolls } from '../context/PollsContext';
import { useWallet } from '../context/WalletContext';
import { ARC_TESTNET_CONFIG } from '../constants/network';
import { shortenAddress } from '../utils/web3';

interface VaultDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultDepositModal: React.FC<VaultDepositModalProps> = ({ isOpen, onClose }) => {
  const { vaultBalance, isFetchingVault, refetchVaultBalance, depositToVault, language } = usePolls();
  const { address, usdcBalance, isConnected, isArcNetwork, connectInjectedWallet, switchNetworkToArc } = useWallet();

  const [amountInput, setAmountInput] = useState<string>('50');
  const [depositStep, setDepositStep] = useState<'idle' | 'approving' | 'depositing' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPt = language === 'pt';
  const amountNumber = parseFloat(amountInput) || 0;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessTxHash(null);

    if (!isConnected) {
      try {
        await connectInjectedWallet();
      } catch (err: any) {
        setErrorMsg(err.message);
      }
      return;
    }

    if (!isArcNetwork) {
      try {
        await switchNetworkToArc();
      } catch (err: any) {
        setErrorMsg('Por favor alterne para a Arc Testnet no MetaMask/Wallet.');
      }
      return;
    }

    if (amountNumber <= 0) {
      setErrorMsg(isPt ? 'Digite um valor de depósito maior que zero.' : 'Enter a deposit amount greater than zero.');
      return;
    }

    const userUsdcVal = parseFloat(usdcBalance) || 0;
    if (userUsdcVal < amountNumber) {
      setErrorMsg(
        isPt
          ? `Saldo de USDC insuficiente na sua carteira (${usdcBalance} USDC). Você tentou depositar ${amountInput} USDC. Obtenha mais tokens no Faucet antes de depositar no cofre.`
          : `Insufficient USDC balance in your wallet (${usdcBalance} USDC). You tried to deposit ${amountInput} USDC. Claim more tokens from the Faucet first.`
      );
      return;
    }

    try {
      setDepositStep('approving');
      const txHash = await depositToVault(amountInput, (step) => {
        setDepositStep(step);
      });
      setSuccessTxHash(txHash);
      setDepositStep('done');
    } catch (err: any) {
      console.error('Vault deposit error:', err);
      setDepositStep('idle');
      setErrorMsg(err.message || (isPt ? 'Falha no processo de depósito no cofre.' : 'Failed vault deposit process.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isPt ? 'Cofre de Recompensas (Vault)' : 'Reward Vault Management'}
              </h3>
              <p className="text-xs text-slate-400">
                {isPt ? 'Abastecimento On-Chain • ArcPollsRewardVault' : 'On-Chain Deposit • ArcPollsRewardVault'}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Current Vault Status Panel */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-sky-950/40 border border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-purple-400" />
                {isPt ? 'Saldo do Cofre (getVaultBalance)' : 'Vault Balance (getVaultBalance)'}
              </span>
              <button
                onClick={() => refetchVaultBalance()}
                disabled={isFetchingVault}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                title={isPt ? 'Atualizar saldo' : 'Refresh balance'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingVault ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {vaultBalance}
              </span>
              <span className="text-sm font-semibold text-purple-400">USDC</span>
            </div>

            <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{isPt ? 'Contrato:' : 'Contract:'}</span>
              <a
                href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/address/${ARC_TESTNET_CONFIG.vaultContractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline flex items-center gap-1"
              >
                {shortenAddress(ARC_TESTNET_CONFIG.vaultContractAddress, 6)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleDeposit} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-300">
                <label htmlFor="amount-input">{isPt ? 'Valor do Depósito no Cofre (USDC)' : 'Vault Deposit Amount (USDC)'}</label>
                <span className="text-slate-400 font-mono">
                  {isPt ? 'Seu Saldo: ' : 'Your Balance: '}
                  <strong className="text-emerald-400">{usdcBalance} USDC</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  id="amount-input"
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={depositStep !== 'idle' && depositStep !== 'done'}
                  placeholder="50.00"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors text-lg"
                />
                <button
                  type="button"
                  onClick={() => setAmountInput(usdcBalance)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Step Progress Visualizer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {isPt ? 'Fluxo em 2 Passos On-Chain' : '2-Step On-Chain Execution'}
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Step 1: Approve */}
                <div
                  className={`p-3 rounded-lg border text-xs flex flex-col gap-1 ${
                    depositStep === 'approving'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 animate-pulse'
                      : depositStep === 'depositing' || depositStep === 'done'
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>1. {isPt ? 'Aprovação USDC' : 'USDC Approve'}</span>
                    {depositStep === 'approving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {(depositStep === 'depositing' || depositStep === 'done') && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] opacity-80 font-mono">
                    approve(0xCe9D..., {amountInput || '0'} USDC)
                  </span>
                </div>

                {/* Step 2: Deposit */}
                <div
                  className={`p-3 rounded-lg border text-xs flex flex-col gap-1 ${
                    depositStep === 'depositing'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 animate-pulse'
                      : depositStep === 'done'
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>2. {isPt ? 'Depósito no Cofre' : 'Vault Deposit'}</span>
                    {depositStep === 'depositing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {depositStep === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] opacity-80 font-mono">
                    depositUSDC({amountInput || '0'} USDC)
                  </span>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Success banner */}
            {successTxHash && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isPt ? 'Depósito no Cofre Confirmado!' : 'Vault Deposit Confirmed!'}</span>
                </div>
                <div className="font-mono text-[11px] break-all opacity-90 pt-1">
                  Tx Hash:{' '}
                  <a
                    href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${successTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-300 hover:text-white"
                  >
                    {successTxHash}
                  </a>
                </div>
              </div>
            )}

            {/* Submit action button */}
            <button
              type="submit"
              disabled={depositStep === 'approving' || depositStep === 'depositing'}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              {depositStep === 'approving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isPt ? 'Passo 1/2: Aprovando USDC na Carteira...' : 'Step 1/2: Approving USDC in Wallet...'}</span>
                </>
              ) : depositStep === 'depositing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isPt ? 'Passo 2/2: Depositando no Cofre...' : 'Step 2/2: Depositing to Vault...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isPt ? 'Executar Depósito On-Chain (2 Passos)' : 'Execute On-Chain Deposit (2 Steps)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
