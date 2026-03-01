'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Activity, Search, ShieldCheck, Box, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublicLedger() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get('/api/ledger');
        setTransactions(res.data);
      } catch (error) {
        console.error("Error fetching ledger", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  // Client-side search filtering
  const filteredTxs = transactions.filter(tx => 
    tx.produce.blockchainTx?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.produce.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.produce.farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold tracking-wider">KrishiLink <span className="text-slate-400 font-light">Explorer</span></span>
          </div>
          <Link href="/login" className="text-sm font-semibold text-green-400 hover:text-green-300 transition flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to App
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6 mt-4">
        
        {/* Header & Search */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold mb-2">Public Supply Chain Ledger</h1>
          <p className="text-slate-500 mb-6">Transparent, immutable records of all agricultural escrows and deliveries.</p>
          
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Produce Name, Farmer, or Transaction Hash..."
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-2">
            <Box className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-700">Latest Blockchain Blocks</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Syncing with blockchain network...</div>
          ) : filteredTxs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No matching transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-medium">Txn Hash (Mint)</th>
                    <th className="p-4 font-medium">Block Date</th>
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium">From (Farmer)</th>
                    <th className="p-4 font-medium">To (Wholesaler)</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredTxs.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-green-500" />
                          <span className="font-mono text-blue-600 hover:underline cursor-pointer">
                            {tx.produce.blockchainTx ? `${tx.produce.blockchainTx.slice(0, 10)}...${tx.produce.blockchainTx.slice(-8)}` : 'Pending...'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {tx.produce.name} <span className="text-slate-400 font-normal">({tx.produce.quantity}kg)</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{tx.produce.farmer.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{tx.buyer.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          tx.status === 'DELIVERED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}