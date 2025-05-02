import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

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
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M19.06 2.1a1 1 0 0 0-.9.2L12 8.5 5.84 2.3a1 1 0 0 0-.9-.2 1 1 0 0 0-1 .9L6.5 12l-2.6 8.8a1 1 0 0 0 .9.2L12 15.5l6.16 6.2a1 1 0 0 0 .9.2 1 1 0 0 0 1-.9L17.5 12l2.6-8.8a1 1 0 0 0-1.04-1.1Z"/><path d="m16.5 12-5.5 5.5-5.5-5.5"/></svg>
                <span className="font-bold text-primary">SnackTrack</span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link href="/vendas" className="text-foreground/60 transition-colors hover:text-foreground/80">
                  Vendas
                </Link>
                <Link href="/produtos" className="text-foreground/60 transition-colors hover:text-foreground/80">
                  Produtos
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 container py-8">{children}</main>
           <Toaster /> {/* Add Toaster here */}
          <footer className="py-6 md:px-8 md:py-0 border-t bg-secondary/50">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © {new Date().getFullYear()} SnackTrack. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
