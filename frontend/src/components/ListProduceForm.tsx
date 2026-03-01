'use client';
import { useState } from 'react';
import api from '@/lib/api'; // <-- IMPORT YOUR CUSTOM API CLIENT

export default function ListProduceForm({ farmerId }: { farmerId: string }) {
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // ---> USE YOUR NEW API CLIENT INSTEAD OF FETCH <---
      const response = await api.post('/api/produce', {
        name: formData.name,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        farmerId: farmerId 
      });

      // Axios automatically throws an error if the status isn't 2xx, 
      // so we don't need the !response.ok check anymore!
      
      // Axios puts the response data inside the .data property
      setTxHash(response.data.blockchainTx); 
      setStatus('success');
      
    } catch (error: any) {
      // Axios errors put the backend's message inside error.response.data
      const backendMessage = error.response?.data?.error || error.message;
      console.error("Backend Error:", backendMessage);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm max-w-md bg-white">
      <h2 className="text-xl font-bold mb-4">List New Crop</h2>
      
      <input 
        type="text" placeholder="Crop Name (e.g., Organic Wheat)" required
        className="w-full mb-3 p-2 border rounded text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input 
        type="number" placeholder="Quantity (kg)" required
        className="w-full mb-3 p-2 border rounded text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
      />
      <input 
        type="number" placeholder="Price (₹)" required
        className="w-full mb-4 p-2 border rounded text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
      />

      <button 
        type="submit" disabled={status === 'loading'}
        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
      >
        {status === 'loading' ? 'Minting to Blockchain...' : 'List Produce'}
      </button>

      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded text-sm break-all border border-green-200">
          ✅ Successfully listed!<br/>
          <strong>Blockchain Tx:</strong> {txHash}
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded text-sm border border-red-200">
          ❌ Failed to list produce. Check console.
        </div>
      )}
    </form>
  );
}