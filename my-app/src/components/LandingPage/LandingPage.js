import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold text-gray-900">Teach & Serve</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-8 py-20">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Status Badge */}
          <div className="inline-block mb-12">
            <span className="bg-white/95 text-indigo-600 px-12 py-6 rounded-2xl font-bold text-2xl md:text-3xl border-3 border-indigo-200 backdrop-blur-sm animate-pulse shadow-lg">
              Currently Building - Coming Soon!
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Teach & Serve
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-8 leading-relaxed">
            Connecting Students with Mentors Who Care
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            An online platform built to connect students from underrepresented and underserved backgrounds 
            with mentors who care. Our mission is to foster growth, guidance, and belonging in a focused, 
            friendly environment designed for learning, not just casual conversation.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 bg-white/10 backdrop-blur-sm">
        <p>&copy; 2025 Teach & Serve. Building something meaningful.</p>
      </footer>
    </div>
  );
}