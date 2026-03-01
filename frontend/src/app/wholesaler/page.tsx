'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ShoppingBag, Wallet, Clock, CheckCircle, LogOut, Truck } from 'lucide-react';

export default function WholesalerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundingId, setFundingId] = useState<string | null>(null); 
  const router = useRouter();

  const fetchOrders = async (userId: string) => {
    try {
      const res = await api.get(`/api/orders/buyer/${userId}`);
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching wholesaler orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('krishilink_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'WHOLESALER') {
      router.push('/'); 
      return;
    }
    setUser(parsedUser);
    fetchOrders(parsedUser.id);
  }, [router]);
  
  const handleFundEscrow = async (orderId: string) => {
    try {
      setFundingId(orderId); 
      const res = await api.post(`/api/orders/${orderId}/fund`);
      alert(`Success! Funds locked. Transaction Hash: ${res.data.txHash}`);
      if (user) fetchOrders(user.id);
    } catch (error: any) {
  const backendMsg = error.response?.data?.error || error.message;
  console.error("Fund error", backendMsg);
  alert(`Error: ${backendMsg}`);
} finally {
  setFundingId(null);
}
  };

  // ---> THE FINAL BLOCKCHAIN FUNCTION <---
  const handleConfirmDelivery = async (orderId: string) => {
    const ratingStr = window.prompt("Rate the Farmer's produce (1 to 5 stars):", "5");
    if (!ratingStr) return; // User cancelled
    
    const rating = parseInt(ratingStr);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      alert("Invalid rating. Must be a number between 1 and 5.");
      return;
    }

    try {
      setFundingId(orderId); // Reuse the loading state to lock the button
      alert("Confirming delivery and releasing funds on the blockchain...");
      const res = await api.post(`/api/orders/${orderId}/confirm`, { rating });
      
      alert(`🎉 Success! Funds released to Farmer. \nTransaction Hash: ${res.data.txHash}`);
      if (user) fetchOrders(user.id);
    } catch (error) {
      console.error("Failed to confirm delivery", error);
      alert("Failed to release funds. Check terminal logs.");
    } finally {
      setFundingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('krishilink_user');
    router.push('/login');
  };

  if (!user) return <div className="p-8 text-center">Loading Wholesaler Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">{user.name} Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border mt-8">
          <h2 className="text-xl font-bold mb-6">Your Purchase History</h2>
          
          {loading ? (
            <p className="text-gray-500 animate-pulse">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">You haven't placed any orders yet. Visit the Marketplace to buy crops!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 font-semibold">Order ID</th>
                    <th className="p-3 font-semibold">Produce</th>
                    <th className="p-3 font-semibold">Farmer</th>
                    <th className="p-3 font-semibold">Total Cost (₹)</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const totalCost = order.produce.quantity * order.produce.price;
                    return (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm text-gray-500 font-mono">...{order.id.slice(-6)}</td>
                        <td className="p-3 font-medium">{order.produce.name} <span className="text-sm text-gray-500">({order.produce.quantity}kg)</span></td>
                        <td className="p-3 text-gray-600">{order.produce.farmer.name}</td>
                        <td className="p-3 font-bold">₹{totalCost.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-bold w-max ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                            order.status === 'ESCROW_FUNDED' ? 'bg-blue-100 text-blue-800' : 
                            order.status === 'ACCEPTED' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>{order.status}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          {/* DYNAMIC BUTTON LOGIC */}
                          {order.status === 'ACCEPTED' ? (
                            <button 
                              onClick={() => handleFundEscrow(order.id)} 
                              disabled={fundingId === order.id}
                              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                            >
                              <Wallet className="w-4 h-4" />
                              <span>{fundingId === order.id ? 'Locking...' : 'Fund Escrow'}</span>
                            </button>
                          ) : order.status === 'ESCROW_FUNDED' ? (
                            <button 
                              onClick={() => handleConfirmDelivery(order.id)} 
                              disabled={fundingId === order.id}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                            >
                              <Truck className="w-4 h-4" />
                              <span>{fundingId === order.id ? 'Confirming...' : 'Confirm Delivery'}</span>
                            </button>
                          ) : order.status === 'DELIVERED' ? (
                            <span className="text-green-600 text-sm font-bold flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" /> Complete
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Waiting for Farmer...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}