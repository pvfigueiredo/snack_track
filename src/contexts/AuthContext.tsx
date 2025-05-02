
'use client';

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state

interface User {
  id: string;
  username: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user credentials (replace with actual authentication)
const MOCK_USER = { id: '1', username: 'admin' };
const MOCK_PASSWORD = 'password';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const pathname = usePathname();

  // Check local storage or session for existing auth state on mount (client-side only)
  useEffect(() => {
    // Simulate checking authentication status (e.g., token in localStorage)
    const checkAuthStatus = async () => {
      setIsLoading(true); // Ensure loading is true at the start of the check
      try {
        // In a real app, you'd validate a token here
        const storedUser = localStorage.getItem('snacktrack_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          // If user is found and on login page, redirect to home
          if (pathname === '/login') {
            router.push('/');
          }
        } else {
            setUser(null);
            // Redirect to login if not authenticated and not on login page
            if (pathname !== '/login') {
                router.push('/login');
            }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
         if (pathname !== '/login') {
            router.push('/login');
         }
      } finally {
        // Set loading to false after the check is complete
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // Add router to dependency array


  const login = async (username: string, password: string): Promise<void> => {
     return new Promise((resolve, reject) => {
        // Simulate API call delay
        setTimeout(() => {
            if (username === MOCK_USER.username && password === MOCK_PASSWORD) {
                setUser(MOCK_USER);
                localStorage.setItem('snacktrack_user', JSON.stringify(MOCK_USER)); // Persist user
                resolve();
            } else {
                reject(new Error('Usuário ou senha inválidos.'));
            }
         }, 500); // Simulate network latency
     });
  };

  const logout = () => {
    setIsLoading(true); // Set loading while logging out
    setUser(null);
    localStorage.removeItem('snacktrack_user'); // Clear persisted user
    router.push('/login'); // Redirect to login page after logout
    // Set loading false slightly after push to ensure redirect starts
    setTimeout(() => setIsLoading(false), 50);
  };

   // Use useMemo to prevent unnecessary re-renders of consumers
   const contextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
   }), [user, isLoading]); // Only update context value when user or isLoading changes

  // Render a loading indicator or skeleton while checking auth status, but only on the client
  // and not on the login page itself.
  if (isLoading && pathname !== '/login') {
    // Basic full-page loading skeleton
     return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Skeleton className="h-6 w-32" />
             <nav className="ml-auto flex items-center space-x-6">
               <Skeleton className="h-6 w-16" />
               <Skeleton className="h-6 w-16" />
             </nav>
          </div>
        </header>
        <main className="flex-1 container py-8">
           <div className="space-y-6">
             <Skeleton className="h-10 w-64" />
             <Skeleton className="h-4 w-full max-w-xl" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Skeleton className="h-40 rounded-lg" />
               <Skeleton className="h-40 rounded-lg" />
             </div>
           </div>
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t bg-secondary/50">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <Skeleton className="h-4 w-72" />
          </div>
        </footer>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
