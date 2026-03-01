'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ListProduceForm from "@/components/ListProduceForm";
import { LayoutDashboard, Package, Inbox, CheckCircle, LogOut, Star, Trash2, Menu, X, Activity } from 'lucide-react';
import Link from 'next/link';

export default function FarmerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ---> NEW SIDEBAR STATE <---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const router = useRouter();

  const fetchData = async (farmerId: string) => {
    try {
      const [inventoryRes, ordersRes] = await Promise.all([
        api.get(`/api/produce/farmer/${farmerId}`),
        api.get(`/api/orders/farmer/${farmerId}`)
      ]);
      setInventory(inventoryRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
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
    setUser(parsedUser);
    fetchData(parsedUser.id);
  }, [router]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.put(`/api/orders/${orderId}/accept`);
      if (user) fetchData(user.id);
    } catch (error) {
      console.error("Failed to accept order", error);
    }
  };

  const handleRateBuyer = async (orderId: string) => {
    const ratingStr = window.prompt("Rate the Wholesaler (1 to 5 stars):", "5");
    if (!ratingStr) return;
    
    const rating = parseInt(ratingStr);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      alert("Invalid rating. Must be 1-5.");
      return;
    }

    try {
      alert("Submitting rating to the blockchain...");
      const res = await api.post(`/api/orders/${orderId}/rate-buyer`, { rating });
      alert(`🎉 Rating submitted! Tx Hash: ${res.data.txHash}`);
      if (user) fetchData(user.id);
    } catch (error) {
      console.error("Rating error", error);
      alert("Failed to submit rating. You may have already rated this order!");
    }
  };

  const handleDelistProduce = async (produceId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delist this crop from the marketplace?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/produce/${produceId}`);
      alert("Crop successfully delisted!");
      if (user) fetchData(user.id); 
    } catch (error: any) {
      console.error("Delist error", error);
      alert(error.response?.data?.error || "Failed to delist the crop.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('krishilink_user');
    router.push('/login');
  };

  if (!user) return <div className="p-8 text-center">Loading KrishiLink...</div>;

  // ---> NEW LOGIC: Filter out items that have been DELIVERED <---
  const displayedInventory = inventory.filter((item) => {
    // Check if there is an order for this specific item that is marked as DELIVERED
    const isDelivered = orders.some(order => order.produce.id === item.id && order.status === 'DELIVERED');
    return !isDelivered; // Keep the item only if it has NOT been delivered
  });

  return (
    <div className="min-h-screen bg-gray-50 text-black relative">
      
      {/* ---> NEW SIDEBAR OVERLAY & DRAWER <--- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-red-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col space-y-2">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50 p-3 rounded-lg transition font-medium w-full text-left"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>My Dashboard</span>
          </button>

          {/* Public Ledger Link */}
          <Link 
            href="/ledger" 
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50 p-3 rounded-lg transition font-medium mt-4 border-t pt-4"
          >
            <Activity className="w-5 h-5" />
            <span>Public Ledger</span>
          </Link>
        </div>
      </div>
      {/* ------------------------------------- */}

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            {/* Hamburger Button */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border rounded-md shadow-sm text-gray-600 hover:text-green-600 hover:border-green-300 transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            <LayoutDashboard className="w-8 h-8 text-green-600 hidden sm:block" />
            <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* TOP SECTION: Form & Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <ListProduceForm farmerId={user.id} />
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2 mb-6">
              <Package className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold">Your Digital Inventory</h2>
            </div>
            {loading ? (
              <p className="text-gray-500 animate-pulse">Loading inventory...</p>
            ) : displayedInventory.length === 0 ? (
              <p className="text-gray-500">You have no active crops listed in your inventory.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 font-semibold">Crop</th>
                      <th className="p-3 font-semibold">Quantity</th>
                      <th className="p-3 font-semibold">Blockchain Proof</th>
                      <th className="p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInventory.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-gray-600">{item.quantity} kg</td>
                        <td className="p-3">
                          {item.blockchainTx ? (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-mono">
                              {item.blockchainTx.slice(0, 6)}...{item.blockchainTx.slice(-4)}
                            </span>
                          ) : (
                            <span className="text-yellow-600 text-xs">Pending...</span>
                          )}
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => handleDelistProduce(item.id)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Delist Crop"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Incoming Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-8">
          <div className="flex items-center space-x-2 mb-6">
            <Inbox className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Incoming Orders</h2>
          </div>
          
          {loading ? (
            <p className="text-gray-500 animate-pulse">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">No pending orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 font-semibold">Produce</th>
                    <th className="p-3 font-semibold">Buyer Name</th>
                    <th className="p-3 font-semibold">Contact</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{order.produce.name}</td>
                      <td className="p-3 text-gray-600">
                        <Link href={`/profile/${order.buyer.id}`} className="text-blue-600 hover:underline font-semibold">
                          {order.buyer.name}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-600">{order.buyer.phone}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold w-max inline-block ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'ESCROW_FUNDED' ? 'bg-purple-100 text-purple-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {order.status === 'PENDING' ? (
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                        ) : order.status === 'DELIVERED' ? (
                          <button
                            onClick={() => handleRateBuyer(order.id)}
                            className="flex items-center space-x-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition font-bold"
                          >
                            <Star className="w-4 h-4 fill-current" />
                            <span>Rate Buyer</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            {order.status === 'ESCROW_FUNDED' ? 'Shipping...' : 'Waiting for Buyer...'}
                          </span>
                        )}
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