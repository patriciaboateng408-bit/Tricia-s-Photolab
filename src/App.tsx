/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, login, logout, db } from './lib/firebase';
import { Toaster, toast } from 'sonner';
import { Gallery } from './components/Gallery';
import { Button } from './components/ui/button';
import { LogIn, LogOut, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await login();
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log in.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log out.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      <Toaster position="top-center" expand={false} richColors />
      
      {!user ? (
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-zinc-100">
                <ImageIcon className="w-12 h-12 text-zinc-800" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">Photo Gallery</h1>
              <p className="text-zinc-500">
                A clean, minimal space for your memories. Upload, organize, and view your photos in high resolution.
              </p>
            </div>
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="w-full h-14 rounded-2xl text-lg font-medium bg-zinc-900 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Get Started with Google
            </Button>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-zinc-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-zinc-50" />
                </div>
                <span className="font-semibold text-lg hidden sm:block">Gallery</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-zinc-100">
                  <img 
                    src={user.photoURL || ''} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-zinc-200"
                  />
                  <span className="text-sm font-medium hidden md:block">{user.displayName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
            <Gallery user={user} />
          </main>
        </div>
      )}
    </div>
  );
}
