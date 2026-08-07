import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Poll } from '../types';
import { usePolls } from '../context/PollsContext';
import { useWallet } from '../context/WalletContext';

interface DeletePollModalProps {
  poll: Poll | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeletePollModal: React.FC<DeletePollModalProps> = ({
  poll,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { deletePoll, language } = usePolls();
  const { isConnected } = useWallet();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !poll) return null;

  const isPt = language === 'pt';

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg(null);
    setIsDeleting(true);

    try {
      await deletePoll(poll.id);
      setIsDeleting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error deleting poll:', err);
      setIsDeleting(false);
      setErrorMsg(
        err.message ||
          (isPt
            ? 'Não foi possível excluir a enquete. Tente novamente.'
            : 'Could not delete the poll. Please try again.')
      );
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isPt ? 'Excluir Enquete' : 'Delete Poll'}
              </h3>
              <p className="text-xs text-slate-400">
                {isPt ? 'Ação irreversível de criador' : 'Irreversible owner action'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {isPt
              ? 'Tem certeza de que deseja apagar esta enquete permanentemente?'
              : 'Are you sure you want to permanently delete this poll?'}
          </p>

          {/* Poll Summary Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span>On-Chain ID #{poll.onChainId}</span>
              <span className="text-slate-400">{poll.category}</span>
            </div>
            <h4 className="font-bold text-white text-sm line-clamp-2">
              {poll.title}
            </h4>
            <p className="text-xs text-slate-400 pt-1 font-mono">
              Pool Total: <strong className="text-amber-400">{poll.rewardPoolTotal} USDC</strong>
            </p>
          </div>

          {!isConnected && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isPt
                  ? 'Conecte sua carteira para autorizar a exclusão.'
                  : 'Connect your wallet to authorize deletion.'}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isPt ? 'Excluindo...' : 'Deleting...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{isPt ? 'Sim, Excluir Enquete' : 'Yes, Delete Poll'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
