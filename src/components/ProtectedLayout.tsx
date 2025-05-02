
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while loading or if already on the login page
    if (isLoading || pathname === '/login') {
      return;
    }

    // If not loading and no user, redirect to login
    if (!user) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  // If loading or no user (and not on login page), don't render children yet
  // The AuthProvider handles the loading state display
  if ((isLoading || !user) && pathname !== '/login') {
    return null; // Or return a minimal loading state if preferred
  }

   // If on login page, just render the children (the login form)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If authenticated and not on login, render children and the protected header elements
  return (
    <>
        {/* Conditionally render header elements for authenticated users */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                {/* Logo/Brand link remains */}
                 <Link href="/" className="mr-6 flex items-center space-x-2">
                     {/* Placeholder for Utensils icon if needed */}
                     {/* <Utensils className="h-6 w-6 text-primary"/> */}
                     {/* <span className="font-bold text-primary">SnackTrack</span> */}
                 </Link>

                 {/* Navigation Links for Authenticated Users */}
                 <nav className="flex items-center space-x-6 text-sm font-medium flex-grow">
                    <Link href="/vendas" className="text-foreground/60 transition-colors hover:text-foreground/80">
                    Mesas
                    </Link>
                    <Link href="/produtos" className="text-foreground/60 transition-colors hover:text-foreground/80">
                    Produtos
                    </Link>
                    {/* Add other navigation links if needed */}
                </nav>

                 {/* Logout Button */}
                <Button variant="ghost" size="sm" onClick={logout} className="ml-auto">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </div>
        </header>
        {/* Render the main content */}
        {children}
    </>
  );
};

export default ProtectedLayout;
