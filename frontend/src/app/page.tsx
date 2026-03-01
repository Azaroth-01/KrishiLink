import { RegisterForm } from "../components/RegisterForm";
import { Leaf } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Updated Navbar */}
      <nav className="border-b bg-white p-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-700 font-bold text-2xl">
            <Leaf className="fill-green-600" />
            <span>KrishiLink</span>
          </div>
          <div className="flex gap-4 items-center">
             <a href="/marketplace" className="text-gray-600 hover:text-green-700 font-medium">Marketplace</a>
             <a href="/admin" className="text-sm text-gray-400 hover:text-gray-600 underline border-l pl-4">Admin Login</a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-16 px-4 grid md:grid-cols-2 gap-16 items-center">
        {/* Left Side: Branding */}
        <div>
          <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
            Phase 1: Direct Trade
          </span>
          <h1 className="text-6xl font-black text-gray-900 leading-tight mt-6">
            Connecting <span className="text-green-600">Farmers</span> directly to India.
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            Eliminate middlemen and get the best price for your hard-earned crops. 
            Secure transactions powered by blockchain, simple enough for anyone.
          </p>
          
          <div className="mt-10 flex gap-4 text-sm font-medium text-gray-500">
             <div className="flex items-center gap-2">✓ No Middlemen</div>
             <div className="flex items-center gap-2">✓ Direct Payments</div>
             <div className="flex items-center gap-2">✓ Verified Buyers</div>
          </div>
        </div>
        
        {/* Right Side: The Form */}
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-200 rounded-full blur-3xl opacity-50"></div>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}