
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, PackagePlus, ClipboardList, ClipboardPaste } from "lucide-react"; // Added ClipboardPaste icon for Insumos
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl text-primary">
        Bem-vindo ao SnackTrack!
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Gerencie sua lanchonete de forma fácil e eficiente. Controle mesas, produtos e insumos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"> {/* Changed grid to 3 cols */}
         {/* Vendas/Mesas */}
        <Link href="/vendas" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <ClipboardList className="h-6 w-6 text-accent" />
                Gerenciar Mesas
              </CardTitle>
              <CardDescription>
                Visualize o status das mesas, adicione itens às comandas e finalize vendas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
               <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">Ir para Mesas</Button>
            </CardContent>
          </Card>
        </Link>
        {/* Produtos */}
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
         {/* Insumos */}
         <Link href="/insumos" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <ClipboardPaste className="h-6 w-6 text-secondary-foreground" /> {/* Changed Icon and Color */}
                Cadastro de Insumos
              </CardTitle>
              <CardDescription>
                Gerencie os ingredientes e materiais utilizados na sua lanchonete.
              </CardDescription>
            </CardHeader>
             <CardContent className="flex justify-center">
               <Button variant="outline" className="border-secondary text-secondary-foreground hover:bg-secondary hover:text-primary-foreground">Gerenciar Insumos</Button> {/* Adjusted button style */}
             </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
