
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Utensils } from 'lucide-react'; // Import Utensils
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

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

  // Show loading skeleton ONLY if loading AND NOT on the login page
  if (isLoading && pathname !== '/login') {
    return (
        // You can customize this skeleton further
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

  // If on login page, just render the children (the login form)
   // Handle the case where user is logged in but somehow navigated to /login
   if (pathname === '/login') {
      if (user && !isLoading) {
          // User is logged in, redirect away from login
          router.push('/');
          return null; // Render nothing while redirecting
      }
      // User is not logged in or still loading, render login page
      return <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="font-bold text-primary">SnackTrack</span>
          </Link>          
        </div>
      </header>
      {children}</>;
   }

  // If authenticated and not on login, render children and the protected header elements
  if (user) {
      return (
        <>
            {/* Conditionally render header elements for authenticated users */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    {/* Logo/Brand link remains */}
                     <Link href="/" className="mr-6 flex items-center space-x-2">
                          <Utensils className="h-6 w-6 text-primary"/>
                          <span className="font-bold text-primary">SnackTrack</span>
                     </Link>

                     {/* Navigation Links for Authenticated Users */}
                     <nav className="flex items-center space-x-4 md:space-x-6 text-sm font-medium flex-grow">
                        <Link href="/vendas" className={`transition-colors hover:text-foreground/80 ${pathname?.startsWith('/vendas') ? 'text-foreground' : 'text-foreground/60'}`}>
                            Mesas
                        </Link>
                        <Link href="/produtos" className={`transition-colors hover:text-foreground/80 ${pathname === '/produtos' ? 'text-foreground' : 'text-foreground/60'}`}>
                            Produtos
                        </Link>
                         <Link href="/insumos" className={`transition-colors hover:text-foreground/80 ${pathname === '/insumos' ? 'text-foreground' : 'text-foreground/60'}`}>
                            Insumos
                        </Link>
                         <Link href="/receitas" className={`transition-colors hover:text-foreground/80 ${pathname === '/receitas' ? 'text-foreground' : 'text-foreground/60'}`}> {/* Added Receitas link */}
                            Receitas
                        </Link>
                         <Link href="/relatorios" className={`transition-colors hover:text-foreground/80 ${pathname === '/relatorios' ? 'text-foreground' : 'text-foreground/60'}`}>
                            Relatórios
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
