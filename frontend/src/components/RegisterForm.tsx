"use client";
import { useState } from 'react';
import api from '@/lib/api';
import { UserPlus, CheckCircle } from 'lucide-react';
import Link from 'next/link'; // <-- NEW: Import Next.js Link
import { useRouter } from 'next/navigation'; // <-- NEW: Import Router for dynamic redirects

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'FARMER',
    state: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter(); // Initialize the router

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fakeWallet = "0x" + Math.random().toString(16).slice(2, 42);
      
      const response = await api.post('/api/users', {
        ...formData,
        walletAddress: fakeWallet
      });
      
      // Save the complete user object to match your login flow!
      localStorage.setItem('krishilink_user', JSON.stringify(response.data));

      setSuccess(true);
      
      alert(`Registration Successful! Your ID is: ${response.data.id}`);
      
    } catch (error) {
      console.error(error);
      alert("Registration failed. This phone number might already be registered.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic routing based on role
  const handleSuccessRedirect = () => {
    if (formData.role === 'WHOLESALER') {
      router.push('/marketplace');
    } else {
      router.push('/dashboard');
    }
  };

  if (success) {
    const isFarmer = formData.role === 'FARMER';
    return (
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-green-100 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-green-500" size={60} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Registration Complete!</h2>
        <p className="text-gray-600 mt-2">
          Your {formData.role.toLowerCase()} profile is ready. 
          {isFarmer ? " Now, let's list your first batch of produce." : " Explore the marketplace to find fresh produce."}
        </p>
        <button 
          onClick={handleSuccessRedirect} 
          className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
        >
          {isFarmer ? "Go to My Dashboard →" : "Go to Marketplace →"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-2xl text-green-700">
          <UserPlus size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Join KrishiLink</h2>
          <p className="text-sm text-gray-500">Create your account in 30 seconds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Full Name</label>
          <input 
            type="text" placeholder="e.g. Ramesh Kumar" required
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Phone Number</label>
          <input 
            type="tel" placeholder="10-digit mobile number" required
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Who are you?</label>
          <select 
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="FARMER">I am a Farmer (Selling Produce)</option>
            <option value="WHOLESALER">I am a Wholesaler (Buying in Bulk)</option>
            <option value="RETAILER">I am a Retailer (Selling to Consumers)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">State</label>
            <input 
              type="text" placeholder="e.g. Maharashtra" required
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => setFormData({...formData, state: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">City</label>
            <input 
              type="text" placeholder="e.g. Pune" required
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}
        >
          {loading ? 'Registering...' : 'Create My Account'}
        </button>

        {/* ---> NEW: SIGN IN LINK BELOW THE BUTTON <--- */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-green-600 hover:text-green-700 hover:underline transition-all">
            Sign in here
          </Link>
        </div>

      </form>
    </div>
  );
}