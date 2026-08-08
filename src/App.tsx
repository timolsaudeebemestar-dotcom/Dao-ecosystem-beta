import React, { useState } from 'react';
import { Search, Filter, Sparkles, Plus, CheckCircle2, Vote, ArrowUpDown, ShieldCheck, ExternalLink, RefreshCw, Coins, Wallet } from 'lucide-react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { PollsProvider, usePolls } from './context/PollsContext';
import { Header } from './components/Header';
import { NetworkBanner } from './components/NetworkBanner';
import { StatsBar } from './components/StatsBar';
import { PollCard } from './components/PollCard';
import { PollDetailModal } from './components/PollDetailModal';
import { CreatePollModal } from './components/CreatePollModal';
import { ContractViewerModal } from './components/ContractViewerModal';
import { ArcFaucetModal } from './components/ArcFaucetModal';
import { MyActivityModal } from './components/MyActivityModal';
import { VaultDepositModal } from './components/VaultDepositModal';
import { Poll } from './types';
import { ARC_TESTNET_CONFIG } from './constants/network';

function MainApp() {
  const {
    polls,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    language,
  } = usePolls();

  const { address, isConnected, connectInjectedWallet, isConnecting } = useWallet();

  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const isPt = language === 'pt';

  const categories = ['All', 'Web3', 'DAO', 'Feedback', 'Social', 'Ecosystem'];

  const handleRequireWallet = (action: () => void) => {
    if (!isConnected || !address) {
      connectInjectedWallet();
    } else {
      action();
    }
  };

  // Filter & Sort logic
  const filteredPolls = polls.filter((poll) => {
    // Category match
    if (selectedCategory !== 'All' && poll.category !== selectedCategory) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = poll.title.toLowerCase().includes(q);
      const descMatch = poll.description.toLowerCase().includes(q);
      const catMatch = poll.category.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !catMatch) return false;
    }

    // Status Filter
    const now = Date.now();
    const isExpired = poll.expiresAt < now;
    const isFullyClaimed = poll.claimedParticipants >= poll.maxParticipants;
    const isActive = poll.isActive && !isExpired && !isFullyClaimed;

    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'ended' && isActive) return false;

    if (statusFilter === 'my_created') {
      if (!address || poll.creator.toLowerCase() !== address.toLowerCase()) return false;
    }

    if (statusFilter === 'my_voted') {
      if (!address) return false;
      const voted = poll.voters.some((v) => v.voterAddress.toLowerCase() === address.toLowerCase());
      if (!voted) return false;
    }

    return true;
  });

  // Sort
  const sortedPolls = [...filteredPolls].sort((a, b) => {
    if (sortBy === 'highest_reward') {
      return b.rewardPerVote - a.rewardPerVote;
    }
    if (sortBy === 'most_votes') {
      const aVotes = a.options.reduce((sum, o) => sum + o.votes, 0);
      const bVotes = b.options.reduce((sum, o) => sum + o.votes, 0);
      return bVotes - aVotes;
    }
    if (sortBy === 'ending_soon') {
      return a.expiresAt - b.expiresAt;
    }
    // 'newest' default
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      
      {/* Top Navigation */}
      <Header
        onOpenCreateModal={() => handleRequireWallet(() => setIsCreateOpen(true))}
        onOpenContractModal={() => setIsContractOpen(true)}
        onOpenFaucetModal={() => handleRequireWallet(() => setIsFaucetOpen(true))}
        onOpenActivityModal={() => handleRequireWallet(() => setIsActivityOpen(true))}
        onOpenVaultModal={() => handleRequireWallet(() => setIsVaultOpen(true))}
      />

      {/* Network Warning Banner if needed */}
      <NetworkBanner />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Mandatory Wallet Connection Gate when disconnected */}
        {!isConnected && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-2 border-cyan-500/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                <Wallet className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">
                  {isPt ? 'Conecte sua Carteira Web3 para Interagir' : 'Connect Web3 Wallet to Participate'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isPt
                    ? 'O modo de simulação foi totalmente removido. Para responder enquetes, resgatar recompensas em USDC, usar a torneira ou criar novas pesquisas on-chain na Arc Testnet, é obrigatório conectar uma carteira EVM real (MetaMask, Rabby, Coinbase Wallet, etc.).'
                    : 'Simulation mode is completely removed. Connect a real EVM wallet (MetaMask, Rabby, Coinbase Wallet, etc.) to vote, claim USDC rewards, or create polls.'}
                </p>
              </div>
            </div>

            <button
              onClick={connectInjectedWallet}
              disabled={isConnecting}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <Wallet className="w-4 h-4 text-white" />
              <span>
                {isConnecting
                  ? (isPt ? 'Conectando...' : 'Connecting...')
                  : (isPt ? 'Conectar Carteira EVM' : 'Connect EVM Wallet')}
              </span>
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <section className="relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>{isPt ? 'Pesquisas & Opinião Recompensada On-Chain' : 'Arc On-Chain Rewarded Surveys'}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {isPt
                ? 'Responda enquetes, expresse sua opinião e ganhe USDC na Arc Testnet.'
                : 'Vote in polls, share feedback, and claim instant USDC rewards.'}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isPt
                ? 'Plataforma descentralizada onde criadores definem pools de recompensas e participantes recebem micro-recompensas instantâneas diretamente em suas carteiras EVM. Sem intermediários e com imutabilidade on-chain.'
                : 'Decentralized polling protocol with smart contract escrow pools, instant micro-rewards, and transparent immutable voting on the Arc Network.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <button
                onClick={() => handleRequireWallet(() => setIsCreateOpen(true))}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isPt ? 'Criar Enquete' : 'Create Poll'}</span>
              </button>

              <button
                onClick={() => handleRequireWallet(() => setIsFaucetOpen(true))}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{isPt ? 'Torneira Circle (USDC Gas)' : 'Circle Faucet (USDC)'}</span>
              </button>

              <a
                href={ARC_TESTNET_CONFIG.blockExplorerUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-medium border border-slate-700/60 transition-colors flex items-center gap-1.5"
              >
                <span>{isPt ? 'Explorador ArcScan' : 'ArcScan Explorer'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

          {/* Decorative Background Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        </section>

        {/* Stats Bar */}
        <StatsBar />

        {/* Filters & Search Toolbar */}
        <div className="space-y-4">
          
          {/* Search Input & Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isPt ? 'Buscar enquetes por título ou palavra-chave...' : 'Search polls by title or topic...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Status Filter Tabs & Sort */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              
              {/* Status Filters */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isPt ? 'Todas' : 'All'}
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'active'
                      ? 'bg-slate-800 text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isPt ? 'Ativas' : 'Active'}
                </button>

                <button
                  onClick={() => setStatusFilter('ended')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'ended'
                      ? 'bg-slate-800 text-rose-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isPt ? 'Encerradas' : 'Ended'}
                </button>

                {address && (
                  <>
                    <button
                      onClick={() => setStatusFilter('my_voted')}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                        statusFilter === 'my_voted'
                          ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isPt ? 'Minhas Votadas' : 'My Votes'}
                    </button>

                    <button
                      onClick={() => setStatusFilter('my_created')}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                        statusFilter === 'my_created'
                          ? 'bg-slate-800 text-indigo-300 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isPt ? 'Minhas Enquetes' : 'My Polls'}
                    </button>
                  </>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="newest">{isPt ? 'Mais Recentes' : 'Newest First'}</option>
                  <option value="highest_reward">{isPt ? 'Maior Recompensa' : 'Highest Reward'}</option>
                  <option value="most_votes">{isPt ? 'Mais Votadas' : 'Most Votes'}</option>
                  <option value="ending_soon">{isPt ? 'Expirando em Breve' : 'Ending Soon'}</option>
                </select>
              </div>

            </div>

          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'All' ? (isPt ? 'Todas as Categorias' : 'All Categories') : cat}
              </button>
            ))}
          </div>

        </div>

        {/* Polls Grid */}
        <div>
          {sortedPolls.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Vote className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-300">
                {isPt ? 'Nenhuma enquete encontrada' : 'No polls found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isPt
                  ? 'Tente ajustar seus filtros de busca ou seja o primeiro a criar uma enquete com recompensas para a comunidade.'
                  : 'Try adjusting your filter or create a new poll with an active USDC reward pool.'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs mt-2 hover:bg-cyan-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isPt ? 'Criar Enquete Agora' : 'Create Poll Now'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onSelectPoll={(p) => setSelectedPoll(p)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">On-Chain Feedback & Rewards</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">Arc Testnet (Chain ID 5042002)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>USDC: 0x3600...0000</span>
            <a
              href={ARC_TESTNET_CONFIG.blockExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              testnet.arcscan.app
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PollDetailModal
        poll={selectedPoll}
        onClose={() => setSelectedPoll(null)}
        onOpenVaultModal={() => handleRequireWallet(() => setIsVaultOpen(true))}
      />

      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <ContractViewerModal
        isOpen={isContractOpen}
        onClose={() => setIsContractOpen(false)}
      />

      <ArcFaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
      />

      <MyActivityModal
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />

      <VaultDepositModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <PollsProvider>
        <MainApp />
      </PollsProvider>
    </WalletProvider>
  );
}
