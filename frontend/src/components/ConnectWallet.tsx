"use client";

import { useEffect, useState } from 'react'; // Add these
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { LogOut, Wallet } from 'lucide-react';

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // This ensures the component only shows up after the browser is fully ready
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Don't render anything until mounted

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-xl border border-gray-200">
        <span className="text-sm font-mono font-bold bg-white px-2 py-1 rounded shadow-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button onClick={() => disconnect()} className="text-red-500 hover:text-red-700">
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => {
            console.log("Connecting to:", connector.name); // Add this log to your terminal
            connect({ connector });
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <Wallet size={20} />
          {connector.name === 'Injected' ? 'MetaMask' : connector.name}
        </button>
      ))}
    </div>
  );
}