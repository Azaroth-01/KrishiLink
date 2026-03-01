import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat],
  connectors: [
    injected(), // Supports MetaMask and other browser-injected wallets
  ],
  ssr: true, // Crucial for Next.js to prevent "hydration mismatch" errors
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
});