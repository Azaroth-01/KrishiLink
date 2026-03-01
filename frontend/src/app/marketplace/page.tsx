'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Store, ShieldCheck, ShoppingCart, MapPin, LogOut, Bookmark, BookmarkCheck, Menu, X, LayoutDashboard, Activity, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function Marketplace() {
  const [user, setUser] = useState<any>(null);
  const [produce, setProduce] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  
  // Basket State
  const [basket, setBasket] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // ---> NEW SEARCH & FILTER STATE <---
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // SIDEBAR STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('krishilink_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const savedBasket = localStorage.getItem(`krishilink_basket_${parsedUser.id}`);
    if (savedBasket) {
      setBasket(JSON.parse(savedBasket));
    }

    const fetchMarketplace = async () => {
      try {
        const res = await api.get('/api/produce')
        setProduce(res.data);
      } catch (error) {
        console.error("Error fetching marketplace", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, [router]);

  const handlePlaceOrder = async (produceId: string) => {
    if (!user) return;
    try {
      setOrdering(produceId);
      await api.post('/api/orders', {
        produceId: produceId,
        buyerId: user.id
      });
      alert("Order placed successfully! The farmer has been notified.");
    } catch (error) {
      console.error("Failed to place order", error);
      alert("Failed to place order.");
    } finally {
      setOrdering(null);
    }
  };

  const toggleBasket = (produceId: string) => {
    let updatedBasket;
    if (basket.includes(produceId)) {
      updatedBasket = basket.filter(id => id !== produceId);
    } else {
      updatedBasket = [...basket, produceId];
    }
    setBasket(updatedBasket);
    
    if (user) {
      localStorage.setItem(`krishilink_basket_${user.id}`, JSON.stringify(updatedBasket));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('krishilink_user');
    router.push('/login');
  };

  if (!user) return <div className="p-8 text-center">Loading KrishiLink...</div>;

  // ---> NEW DYNAMIC FILTERING LOGIC <---
  // 1. Extract a unique list of all cities currently in the marketplace
  const uniqueLocations = Array.from(new Set(produce.map(p => p.farmer?.city).filter(Boolean)));

  // 2. Filter the crops based on Saved, Search Term, and Location
  const displayedProduce = produce.filter(p => {
    const matchesSaved = showSavedOnly ? basket.includes(p.id) : true;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter ? p.farmer?.city === locationFilter : true;
    
    return matchesSaved && matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-black relative">
      
      {/* SIDEBAR OVERLAY & DRAWER */}
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
          <Link 
            href="/wholesaler" 
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50 p-3 rounded-lg transition font-medium"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>My Dashboard</span>
          </Link>

          <button 
            onClick={() => { setShowSavedOnly(true); setIsSidebarOpen(false); }}
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50 p-3 rounded-lg transition font-medium w-full text-left"
          >
            <BookmarkCheck className="w-5 h-5" />
            <span>Saved for Later ({basket.length})</span>
          </button>

          <button 
            onClick={() => { setShowSavedOnly(false); setIsSidebarOpen(false); }}
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50 p-3 rounded-lg transition font-medium w-full text-left"
          >
            <Store className="w-5 h-5" />
            <span>All Marketplace Items</span>
          </button>

          <Link 
            href="/ledger" 
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-green-50 p-3 rounded-lg transition font-medium mt-4 border-t pt-4"
          >
            <Activity className="w-5 h-5" />
            <span>Public Ledger</span>
          </Link>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border rounded-md shadow-sm text-gray-600 hover:text-green-600 hover:border-green-300 transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Store className="w-8 h-8 text-green-600 hidden sm:block" />
            <h1 className="text-3xl font-bold">Marketplace</h1>
          </div>
          
          <div className="flex items-center space-x-6">
             <button 
               onClick={() => setShowSavedOnly(!showSavedOnly)}
               className={`hidden md:flex items-center space-x-1 font-semibold transition ${
                 showSavedOnly ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
               }`}
             >
               {showSavedOnly ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
               <span>Saved ({basket.length})</span>
             </button>

             <span className="text-gray-600 font-medium border-l pl-6 hidden sm:block">Buyer: {user.name}</span>
             
             <button onClick={handleLogout} className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ---> NEW SEARCH & FILTER SECTION <--- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for crops (e.g., Tomatoes, Wheat)..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Location Dropdown */}
          <div className="md:w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-3 text-gray-700 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer transition"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((city: any, idx) => (
                <option key={idx} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MARKETPLACE GRID */}
        {loading ? (
          <p className="text-gray-500 animate-pulse">Loading verified crops...</p>
        ) : displayedProduce.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              {showSavedOnly 
                ? "Your basket is empty. Save items to view them here." 
                : "No matching crops found. Try changing your search or location filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProduce.map((item) => {
              const isSaved = basket.includes(item.id);
              
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6 flex flex-col relative transition-all hover:shadow-md">
                  
                  {isSaved && (
                    <div className="absolute -top-1 -right-1">
                      <BookmarkCheck className="w-8 h-8 text-green-600 fill-current" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4 pr-6">
                    <h2 className="text-xl font-bold">{item.name}</h2>
                    <span className="bg-green-100 text-green-800 text-sm font-bold px-2 py-1 rounded">
                      ₹{item.price} / kg
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-6 flex-grow">
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                     Farmer: <Link href={`/profile/${item.farmer?.id}`} className="ml-1 text-green-600 hover:underline font-semibold">{item.farmer?.name}</Link>
                    </p>
                    <p><strong>Available:</strong> {item.quantity} kg</p>
                    {item.blockchainTx && (
                      <div className="flex items-center mt-3 text-xs bg-gray-50 p-2 rounded border">
                        <ShieldCheck className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-mono text-gray-500 truncate">
                          Verified: {item.blockchainTx}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {/* BUTTON COLOR CHANGED TO GREEN */}
                    <button 
                      onClick={() => handlePlaceOrder(item.id)}
                      disabled={ordering === item.id || user.role !== 'WHOLESALER'}
                      className="flex-grow flex justify-center items-center space-x-2 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{ordering === item.id ? 'Ordering...' : 'Place Order'}</span>
                    </button>
                    
                    <button
                      onClick={() => toggleBasket(item.id)}
                      className={`px-3 py-2 border rounded transition flex items-center justify-center ${
                        isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                      title={isSaved ? "Remove from Basket" : "Save for Later"}
                    >
                      {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}