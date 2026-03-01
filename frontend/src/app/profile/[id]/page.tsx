'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserCircle, MapPin, CheckCircle, Shield, ArrowLeft, Star } from 'lucide-react';

export default function PublicProfile() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/users/${params.id}/profile`);
        setProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchProfile();
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-gray-50 p-8 text-center text-black animate-pulse">Loading Profile...</div>;
  if (!profile || !profile.user) return <div className="min-h-screen bg-gray-50 p-8 text-center text-black">User not found.</div>;

  const { user, history } = profile;
  const isFarmer = user.role === 'FARMER';

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <div className="bg-white p-8 rounded-lg shadow-sm border flex items-start space-x-6">
          <UserCircle className="w-24 h-24 text-gray-300" />
          <div className="space-y-3 flex-grow">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${isFarmer ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {user.role}
              </span>
            </div>
            
            {/* ---> NEW: ON-CHAIN STAR RATING RENDERER <--- */}
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-5 h-5 ${star <= (user.onChainRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
              <span className="text-gray-600 text-sm ml-2 font-medium">
                {user.reviewCount > 0 ? `${user.onChainRating}/5 (${user.reviewCount} Reviews)` : 'No ratings yet'}
              </span>
              {user.reviewCount > 0 && (
                <span className="ml-3 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200">
                  Verified on Blockchain
                </span>
              )}
            </div>

            <p className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" /> {user.city}, {user.state}
            </p>
            <div className="flex items-center mt-4 text-sm bg-gray-50 p-2 rounded border inline-block">
              <Shield className="w-4 h-4 text-green-600 mr-2 inline" />
              <span className="font-mono text-gray-500">Wallet: {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            {isFarmer ? 'Verified Sales History' : 'Verified Purchase History'}
          </h2>

          {history.length === 0 ? (
            <p className="text-gray-500">No completed transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 font-semibold">Produce</th>
                    <th className="p-3 font-semibold">{isFarmer ? 'Bought By' : 'Sold By'}</th>
                    <th className="p-3 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record: any) => {
                    const produceName = record.produce.name;
                    const counterpartName = isFarmer ? record.buyer.name : record.produce.farmer.name;
                    const counterpartCity = isFarmer ? record.buyer.city : record.produce.farmer.city;
                    
                    return (
                      <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium">{produceName} <span className="text-sm text-gray-500">({record.produce.quantity}kg)</span></td>
                        <td className="p-3 text-gray-600">{counterpartName}</td>
                        <td className="p-3 text-gray-600">{counterpartCity}</td>
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