import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, PackagePlus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl text-primary">
        Bem-vindo ao SnackTrack!
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Gerencie sua lanchonete de forma fácil e eficiente. Cadastre seus produtos e realize vendas rapidamente.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/vendas" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-accent" />
                Tela de Vendas
              </CardTitle>
              <CardDescription>
                Acesse a interface otimizada para vendas rápidas, ideal para telas touchscreen.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
               <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">Ir para Vendas</Button>
            </CardContent>
          </Card>
        </Link>
        <Link href="/produtos" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <PackagePlus className="h-6 w-6 text-primary" />
                Cadastro de Produtos
              </CardTitle>
              <CardDescription>
                Adicione novos produtos ao seu cardápio ou edite os existentes.
              </CardDescription>
            </CardHeader>
             <CardContent className="flex justify-center">
               <Button variant="outline">Gerenciar Produtos</Button>
             </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
