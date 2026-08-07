import { ethers } from 'ethers';
import { ARC_TESTNET_CONFIG, VAULT_CONTRACT_ABI, ERC20_ABI } from '../constants/network';

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function generateTxHash(): string {
  const characters = 'abcdef0123456789';
  let result = '0x';
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function checkArcNetworkConnection(): Promise<{
  isArc: boolean;
  blockNumber: number;
  latencyMs: number;
}> {
  const startTime = Date.now();
  try {
    const provider = new ethers.JsonRpcProvider(ARC_TESTNET_CONFIG.rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    const latencyMs = Date.now() - startTime;
    return { isArc: true, blockNumber, latencyMs };
  } catch (err) {
    console.warn('Failed to reach Arc Testnet RPC directly:', err);
    return { isArc: false, blockNumber: 0, latencyMs: 0 };
  }
}

/**
 * Reads getVaultBalance() directly from ArcPollsRewardVault contract (0xCe9D02bB42ef0cE8144358c364e381df33a819DD)
 */
export async function fetchVaultBalance(): Promise<string> {
  const vaultAddress = ARC_TESTNET_CONFIG.vaultContractAddress;
  const usdcAddress = ARC_TESTNET_CONFIG.usdcContractAddress;

  // 1. Try window.ethereum direct eth_call first
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const ethereum = (window as any).ethereum;
      // getVaultBalance() function selector: 0x22be4ffc
      const [vaultBalHex, decimalsHex] = await Promise.all([
        ethereum.request({
          method: 'eth_call',
          params: [{ to: vaultAddress, data: '0x22be4ffc' }, 'latest'],
        }).catch(() => '0x0'),
        ethereum.request({
          method: 'eth_call',
          params: [{ to: usdcAddress, data: '0x313ce567' }, 'latest'],
        }).catch(() => '0x6'),
      ]);

      const rawVal = BigInt(vaultBalHex && vaultBalHex !== '0x' ? vaultBalHex : '0');
      let decimals = parseInt(decimalsHex && decimalsHex !== '0x' ? decimalsHex : '0x6', 16);
      if (isNaN(decimals) || decimals <= 0 || decimals > 18) decimals = 6;

      if (rawVal > 0n) {
        const usedDecimals = (decimals === 18 && rawVal < 100000000000000n) ? 6 : decimals;
        return parseFloat(ethers.formatUnits(rawVal, usedDecimals)).toFixed(2);
      }
    } catch (e) {
      console.warn('Injected window.ethereum getVaultBalance error:', e);
    }
  }

  // 2. Try JsonRpcProvider fallback
  try {
    const provider = new ethers.JsonRpcProvider(ARC_TESTNET_CONFIG.rpcUrl);
    const vaultContract = new ethers.Contract(vaultAddress, VAULT_CONTRACT_ABI, provider);

    const rawBal = await vaultContract.getVaultBalance().catch(() => 0n);
    const rawBigInt = BigInt(rawBal);
    if (rawBigInt > 0n) {
      // Standard 6 decimals or 18 fallback
      const dec = rawBigInt < 100000000000000n ? 6 : 18;
      return parseFloat(ethers.formatUnits(rawBigInt, dec)).toFixed(2);
    }
  } catch (err) {
    console.warn('Error fetching vault balance via JsonRpcProvider:', err);
  }

  return '0.00';
}

/**
 * Checks if a user address has already voted on a specific poll on-chain in ArcPollsRewardVault
 */
export async function checkHasVotedOnChain(pollId: number, userAddress: string): Promise<boolean> {
  if (!userAddress) return false;
  try {
    const provider = new ethers.JsonRpcProvider(ARC_TESTNET_CONFIG.rpcUrl);
    const vaultContract = new ethers.Contract(
      ARC_TESTNET_CONFIG.vaultContractAddress,
      VAULT_CONTRACT_ABI,
      provider
    );
    return await vaultContract.hasVotedPoll(pollId, userAddress);
  } catch (err) {
    console.warn('Error checking hasVotedPoll on-chain:', err);
    return false;
  }
}

/**
 * 2-step Owner Deposit flow:
 * Step 1: approve USDC for ArcPollsRewardVault (0xCe9D02bB42ef0cE8144358c364e381df33a819DD)
 * Step 2: depositUSDC(amount)
 *
 * Strictly uses 6 decimals for Arc Testnet USDC (0x3600000000000000000000000000000000000000)
 */
export async function depositUSDCtoVault(
  amountUSDC: number | string,
  onStepChange?: (step: 'approving' | 'depositing' | 'done') => void
): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Nenhuma carteira Web3 encontrada. Instale MetaMask, Rabby ou Coinbase Wallet.');
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const vaultAddress = ARC_TESTNET_CONFIG.vaultContractAddress;
  const usdcAddress = ARC_TESTNET_CONFIG.usdcContractAddress;

  const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
  const vaultContract = new ethers.Contract(vaultAddress, VAULT_CONTRACT_ABI, signer);

  // 1. Sanitize user input and format to max 6 decimals
  const amountStr = typeof amountUSDC === 'number' ? amountUSDC.toString() : amountUSDC;
  const cleanAmountStr = (amountStr || '').replace(',', '.').trim();

  if (!cleanAmountStr || isNaN(Number(cleanAmountStr)) || Number(cleanAmountStr) <= 0) {
    throw new Error('Por favor, insira um valor de depósito válido maior que zero.');
  }

  // Truncate to max 6 decimal places to prevent fractional component parse overflow
  const parts = cleanAmountStr.split('.');
  let formattedAmountStr = parts[0];
  if (parts.length > 1) {
    formattedAmountStr += '.' + parts[1].slice(0, 6);
  }

  // Strictly convert using 6 decimals (e.g. "2" -> 2000000n)
  const amountInUnits = ethers.parseUnits(formattedAmountStr, 6);

  // 2. Validate user's wallet USDC balance on-chain before triggering transaction
  let walletUsdcUnits = 0n;
  try {
    const rawBal = await usdcContract.balanceOf(userAddress);
    walletUsdcUnits = BigInt(rawBal);
  } catch (err) {
    console.warn('Error fetching token balanceOf in depositUSDCtoVault:', err);
    try {
      const nativeBal = await provider.getBalance(userAddress);
      walletUsdcUnits = BigInt(nativeBal);
    } catch (err2) {
      console.warn('Error fetching native getBalance in depositUSDCtoVault:', err2);
    }
  }

  if (walletUsdcUnits < amountInUnits) {
    const userBalFormatted = ethers.formatUnits(walletUsdcUnits, 6);
    const attemptedFormatted = ethers.formatUnits(amountInUnits, 6);
    throw new Error(
      `Saldo de USDC insuficiente na carteira. Você possui ${userBalFormatted} USDC, mas tentou depositar ${attemptedFormatted} USDC no cofre. Resgate mais tokens no Faucet Arc antes de tentar novamente.`
    );
  }

  // Ensure user is connected to Arc Testnet (Chain ID 5042002) before executing
  try {
    await switchOrAddArcNetwork();
  } catch (netErr) {
    console.warn('[Vault Deposit] Network switch warning:', netErr);
  }

  // Step 1: Approve USDC spend for Vault
  onStepChange?.('approving');
  const currentAllowance: bigint = await usdcContract.allowance(userAddress, vaultAddress).catch(() => 0n);

  if (currentAllowance >= amountInUnits) {
    console.log(`[Vault Deposit] Sufficient allowance already active (${currentAllowance.toString()} >= ${amountInUnits.toString()}). Skipping approve step.`);
  } else {
    // If allowance > 0 but less than needed, reset allowance to 0 first to comply with strict ERC20 security rules
    if (currentAllowance > 0n) {
      console.log(`[Vault Deposit] Current allowance is ${currentAllowance.toString()} units. Resetting to 0 before setting new limit...`);
      try {
        const resetTx = await usdcContract.approve(vaultAddress, 0n);
        await resetTx.wait();
      } catch (resetErr: any) {
        console.warn('[Vault Deposit] Warning resetting allowance to 0:', resetErr);
      }
    }

    // Approve the required amount
    console.log(`[Vault Deposit] Requesting USDC Approval for ${formattedAmountStr} USDC (${amountInUnits.toString()} units)...`);
    try {
      // Try standard approve without forcing gas limit so MetaMask uses node defaults
      const approveTx = await usdcContract.approve(vaultAddress, amountInUnits);
      await approveTx.wait();
    } catch (approveErr: any) {
      console.warn('[Vault Deposit] Standard approve failed, attempting with fallback gas limit...', approveErr);
      if (approveErr.code === 4001 || approveErr.message?.includes('user rejected') || approveErr.message?.includes('User denied')) {
        throw new Error('Aprovação de USDC cancelada na carteira.');
      }
      try {
        let fallbackGas = 120000n;
        try {
          const est = await usdcContract.approve.estimateGas(vaultAddress, amountInUnits);
          fallbackGas = (BigInt(est) * 130n) / 100n;
        } catch { /* use default 120000n */ }

        const approveTx2 = await usdcContract.approve(vaultAddress, amountInUnits, { gasLimit: fallbackGas });
        await approveTx2.wait();
      } catch (approveErr2: any) {
        console.error('[Vault Deposit] Final approve attempt failed:', approveErr2);
        if (approveErr2.code === 4001 || approveErr2.message?.includes('user rejected') || approveErr2.message?.includes('User denied')) {
          throw new Error('Aprovação de USDC cancelada na carteira.');
        }
        throw new Error('Falha na aprovação: verifique se você está na rede Arc Testnet (Chain ID 5042002) e possui saldo suficiente para o gás ou tente aprovar novamente.');
      }
    }
  }

  // Step 2: Deposit USDC into Vault
  onStepChange?.('depositing');
  console.log(`[Vault Deposit] Executing depositUSDC(${formattedAmountStr} USDC / ${amountInUnits.toString()} units) on ${vaultAddress}...`);
  let depositGasLimit: bigint | undefined = undefined;
  try {
    const estDeposit = await vaultContract.depositUSDC.estimateGas(amountInUnits);
    depositGasLimit = (estDeposit * 130n) / 100n; // 30% safety margin above estimate
  } catch (estErr) {
    console.warn('[Vault Deposit] Dynamic estimateGas failed for depositUSDC, using fallback 250000:', estErr);
    depositGasLimit = 250000n;
  }

  try {
    const depositTx = await vaultContract.depositUSDC(amountInUnits, { gasLimit: depositGasLimit });
    const receipt = await depositTx.wait();

    onStepChange?.('done');
    return receipt.hash || depositTx.hash;
  } catch (depositErr: any) {
    console.error('[Vault Deposit] Error during depositUSDC execution:', depositErr);
    if (depositErr.code === 4001 || depositErr.message?.includes('user rejected') || depositErr.message?.includes('User denied')) {
      throw new Error('Depósito no cofre cancelado na carteira.');
    }
    throw new Error('Falha no depósito no cofre: verifique se possui saldo de USDC e gás na rede Arc Testnet.');
  }
}

/**
 * Executes voteAndClaim(uint256 pollId, uint256 rewardAmount) on ArcPollsRewardVault
 */
export async function voteAndClaimOnChain(
  pollId: number,
  rewardAmountUSDC: number
): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Nenhuma carteira Web3 encontrada. Instale MetaMask, Rabby ou Coinbase Wallet.');
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const vaultAddress = ARC_TESTNET_CONFIG.vaultContractAddress;
  const vaultContract = new ethers.Contract(vaultAddress, VAULT_CONTRACT_ABI, signer);

  // Read decimals from USDC contract
  const usdcContract = new ethers.Contract(ARC_TESTNET_CONFIG.usdcContractAddress, ERC20_ABI, signer);
  const decimals = await usdcContract.decimals().catch(() => 6);
  const rewardUnits = ethers.parseUnits(rewardAmountUSDC.toFixed(6), decimals);

  console.log(`[Vote & Claim On-Chain] Executing voteAndClaim(pollId=${pollId}, reward=${rewardAmountUSDC} USDC) on ${vaultAddress}...`);
  const tx = await vaultContract.voteAndClaim(pollId, rewardUnits);
  const receipt = await tx.wait();

  return receipt.hash || tx.hash;
}

export async function fetchLiveUsdcBalance(address: string): Promise<string> {
  if (!address) return '0.00';

  const cleanAddr = address.toLowerCase();
  const usdcAddr = ARC_TESTNET_CONFIG.usdcContractAddress.toLowerCase();

  // Strategy 1: Direct query via window.ethereum (bypasses CORS & uses active wallet network connection)
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const ethereum = (window as any).ethereum;

      // eth_call for balanceOf(address) on 0x3600000000000000000000000000000000000000
      const paddedAddr = cleanAddr.replace('0x', '').padStart(64, '0');
      const balanceOfData = '0x70a08231' + paddedAddr;

      const [contractBalHex, decimalsHex, nativeBalHex] = await Promise.all([
        ethereum.request({
          method: 'eth_call',
          params: [{ to: usdcAddr, data: balanceOfData }, 'latest'],
        }).catch(() => '0x0'),
        ethereum.request({
          method: 'eth_call',
          params: [{ to: usdcAddr, data: '0x313ce567' }, 'latest'],
        }).catch(() => '0x6'), // default 6 decimals for Circle USDC
        ethereum.request({
          method: 'eth_getBalance',
          params: [cleanAddr, 'latest'],
        }).catch(() => '0x0'),
      ]);

      const contractRaw = BigInt(contractBalHex && contractBalHex !== '0x' ? contractBalHex : '0');
      const nativeRaw = BigInt(nativeBalHex && nativeBalHex !== '0x' ? nativeBalHex : '0');

      let decimals = parseInt(decimalsHex && decimalsHex !== '0x' ? decimalsHex : '0x6', 16);
      if (isNaN(decimals) || decimals <= 0 || decimals > 18) decimals = 6;

      // Evaluate contract USDC balance first
      if (contractRaw > 0n) {
        const usedDecimals = (decimals === 18 && contractRaw < 100000000000000n) ? 6 : decimals;
        const formatted = ethers.formatUnits(contractRaw, usedDecimals);
        return parseFloat(formatted).toFixed(2);
      }

      // If contract balance is zero, evaluate native gas balance
      if (nativeRaw > 0n) {
        const nativeDecimals = nativeRaw < 100000000000000n ? 6 : 18;
        const formatted = ethers.formatUnits(nativeRaw, nativeDecimals);
        return parseFloat(formatted).toFixed(2);
      }
    } catch (e) {
      console.warn('Injected window.ethereum USDC balance fetch error:', e);
    }
  }

  // Strategy 2: Fallback to JsonRpcProvider query
  try {
    const provider = new ethers.JsonRpcProvider(ARC_TESTNET_CONFIG.rpcUrl);
    const usdcContract = new ethers.Contract(
      usdcAddr,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ],
      provider
    );

    const [rawBal, decimals] = await Promise.all([
      usdcContract.balanceOf(cleanAddr).catch(() => 0n),
      usdcContract.decimals().catch(() => 6),
    ]);

    const rawBigInt = BigInt(rawBal);
    if (rawBigInt > 0n) {
      const dec = decimals && decimals > 0 && decimals <= 18 ? decimals : 6;
      const usedDecimals = (dec === 18 && rawBigInt < 100000000000000n) ? 6 : dec;
      const formatted = ethers.formatUnits(rawBigInt, usedDecimals);
      return parseFloat(formatted).toFixed(2);
    }

    const nativeBal = await provider.getBalance(cleanAddr).catch(() => 0n);
    if (nativeBal > 0n) {
      const nativeDecimals = nativeBal < 100000000000000n ? 6 : 18;
      const formatted = ethers.formatUnits(nativeBal, nativeDecimals);
      return parseFloat(formatted).toFixed(2);
    }
  } catch (err) {
    console.warn('Error querying live USDC balance via JsonRpcProvider:', err);
  }

  return '0.00';
}

export async function requestPersonalSignature(address: string, message: string): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Nenhuma carteira Web3 encontrada. Por favor instale MetaMask, Rabby ou Coinbase Wallet.');
  }

  const ethereum = (window as any).ethereum;

  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);
  const hexMessage = '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

  try {
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [hexMessage, address],
    });
    return signature;
  } catch (err: any) {
    if (err.code === 4001 || err.message?.includes('user rejected') || err.message?.includes('User denied')) {
      throw new Error('Assinatura cancelada/rejeitada pelo usuário na carteira.');
    }
    console.error('Erro na assinatura personal_sign:', err);
    throw new Error(err.message || 'Falha ao solicitar assinatura na carteira.');
  }
}

export async function switchOrAddArcNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Nenhuma carteira Web3 encontrada. Instale uma extensão como MetaMask, Rabby ou Coinbase Wallet.');
  }

  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_TESTNET_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARC_TESTNET_CONFIG.chainIdHex,
              chainName: ARC_TESTNET_CONFIG.chainName,
              nativeCurrency: ARC_TESTNET_CONFIG.nativeCurrency,
              rpcUrls: [ARC_TESTNET_CONFIG.rpcUrl],
              blockExplorerUrls: [ARC_TESTNET_CONFIG.blockExplorerUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Arc Testnet to wallet:', addError);
        throw addError;
      }
    }
    console.error('Failed to switch to Arc Testnet:', switchError);
    throw switchError;
  }
}

