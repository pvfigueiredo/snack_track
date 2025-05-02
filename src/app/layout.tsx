import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Toaster } from "@/components/ui/toaster";
import { Utensils } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import ProtectedLayout from '@/components/ProtectedLayout'; // Import ProtectedLayout

const inter = Inter({ subsets: ['latin'], variable: "--font-sans" });

export const metadata: Metadata = {
  title: 'SnackTrack',
  description: 'Gerenciamento para sua lanchonete',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <ProtectedLayout> {/* Wrap content with ProtectedLayout */}
            <div className="flex flex-col min-h-screen">
              {/* Header remains, but navigation might be conditional inside ProtectedLayout */}
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                  <Link href="/" className="mr-6 flex items-center space-x-2">
                    <Utensils className="h-6 w-6 text-primary"/>
                    <span className="font-bold text-primary">SnackTrack</span>
                  </Link>
                  {/* Navigation and Logout button are now inside ProtectedLayout */}
                </div>
              </header>
              <main className="flex-1 container py-8">{children}</main>
              <Toaster />
              <footer className="py-6 md:px-8 md:py-0 border-t bg-secondary/50">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                  <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} SnackTrack. Todos os direitos reservados.
                  </p>
                </div>
              </footer>
            </div>
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
