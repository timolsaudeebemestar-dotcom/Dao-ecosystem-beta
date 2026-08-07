import React, { useState } from 'react';
import { X, Plus, Trash2, Coins, Sparkles, Award, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { usePolls } from '../context/PollsContext';
import { Poll } from '../types';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose }) => {
  const { isConnected, isArcNetwork, usdcBalance, connectInjectedWallet, switchNetworkToArc } = useWallet();
  const { createPoll, language } = usePolls();

  const isPt = language === 'pt';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Poll['category']>('Web3');
  const [options, setOptions] = useState<string[]>(['Opção 1', 'Opção 2']);
  const [rewardPoolTotal, setRewardPoolTotal] = useState<number>(50);
  const [maxParticipants, setMaxParticipants] = useState<number>(50);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [hasNFTBadge, setHasNFTBadge] = useState<boolean>(true);
  const [nftBadgeName, setNftBadgeName] = useState<string>('Arc Opinion Badge');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const rewardPerVote = maxParticipants > 0 ? rewardPoolTotal / maxParticipants : 0;
  const currentUsdc = parseFloat(usdcBalance) || 0;
  const hasSufficientBalance = currentUsdc >= rewardPoolTotal;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, `Opção ${options.length + 1}`]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg(isPt ? 'Preencha o título e a descrição da enquete.' : 'Fill title and description.');
      return;
    }

    if (options.some((o) => !o.trim())) {
      setErrorMsg(isPt ? 'Preencha todos os campos das opções.' : 'Fill all choice options.');
      return;
    }

    if (rewardPoolTotal <= 0 || maxParticipants <= 0) {
      setErrorMsg(isPt ? 'A pool de recompensas e o número de participantes devem ser maiores que zero.' : 'Invalid pool numbers.');
      return;
    }

    if (!hasSufficientBalance) {
      setErrorMsg(isPt ? `Saldo insuficiente em USDC. Você possui ${usdcBalance} USDC e precisa de ${rewardPoolTotal} USDC.` : 'Insufficient USDC balance.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createPoll({
        title,
        description,
        category,
        options,
        rewardPoolTotal,
        maxParticipants,
        durationDays,
        hasNFTBadge,
        nftBadgeName,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar enquete on-chain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isPt ? 'Criar Enquete Recompensada On-Chain' : 'Create On-Chain Poll'}
              </h2>
              <p className="text-xs text-slate-400">
                {isPt ? 'Deposite USDC para recompensar participantes da Arc Testnet' : 'Fund USDC pool to reward Arc voters'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {isPt ? 'Título da Enquete' : 'Poll Title'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isPt ? 'ex: Qual recurso de DeFi você mais utiliza?' : 'e.g. Which DeFi feature do you use?'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Poll['category'])}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="Web3">Web3</option>
                <option value="DAO">DAO</option>
                <option value="Feedback">Feedback</option>
                <option value="Social">Social</option>
                <option value="Ecosystem">Ecosystem</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {isPt ? 'Descrição Detalhada / Contexto' : 'Description'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={isPt ? 'Explique os objetivos desta votação para a comunidade...' : 'Explain the context for voters...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          {/* Poll Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {isPt ? 'Opções de Resposta' : 'Choice Options'} (Min 2, Max 6)
              </label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isPt ? 'Adicionar Opção' : 'Add Option'}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Opção ${idx + 1}`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reward Pool Config */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                {isPt ? 'Configuração da Pool de Recompensas (USDC)' : 'Reward Pool Settings'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Seu Saldo: <strong className="text-white">{usdcBalance} USDC</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Pool Total (USDC)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rewardPoolTotal}
                  onChange={(e) => setRewardPoolTotal(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">{isPt ? 'Máx. Votantes' : 'Max Voters'}</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">{isPt ? 'Duração (Dias)' : 'Duration (Days)'}</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  <option value={1}>1 Dia</option>
                  <option value={3}>3 Dias</option>
                  <option value={7}>7 Dias</option>
                  <option value={14}>14 Dias</option>
                  <option value={30}>30 Dias</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs">
              <span className="text-cyan-200">
                {isPt ? 'Micro-recompensa por participante:' : 'Calculated reward per vote:'}
              </span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                +{rewardPerVote.toFixed(2)} USDC / voto
              </span>
            </div>
          </div>

          {/* NFT Badge Checkbox */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-900/50">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-indigo-200">Emitir Badge NFT de Opinião?</p>
                <p className="text-[11px] text-indigo-300/70">Emitir badge comemorativa para os votantes</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={hasNFTBadge}
              onChange={(e) => setHasNFTBadge(e.target.checked)}
              className="w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            {!isConnected ? (
              <button
                type="button"
                onClick={connectInjectedWallet}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-sm border border-slate-700 transition-colors"
              >
                Conectar Carteira para Criar Enquete
              </button>
            ) : !isArcNetwork ? (
              <button
                type="button"
                onClick={switchNetworkToArc}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors"
              >
                Mudar para Arc Testnet
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !hasSufficientBalance}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Aguardando Assinatura On-Chain na Carteira...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-amber-300" />
                    <span>Assinar & Criar Enquete On-Chain ({rewardPoolTotal} USDC)</span>
                  </>
                )}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
