
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useTables } from '@/hooks/useTables';
import type { Product } from '@/types/product';
import type { CartItem, Table } from '@/types/table';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ShoppingCart, Search, Trash2, PackageSearch, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AutocompleteInput } from '@/components/AutocompleteInput';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link'; // Import Link


export default function TableOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string; // Get tableId from URL parameters

  const { products: allProducts, isLoading: isLoadingProducts, updateProduct: decreaseStock } = useProducts(); // Use updateProduct for stock
  const { tables, getTableById, addItemToTableOrder, removeItemFromTableOrder, clearTableOrder, isLoading: isLoadingTables } = useTables();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);


  useEffect(() => {
     if (!isLoadingTables && tableId) {
       const foundTable = getTableById(tableId);
       if (foundTable) {
         setCurrentTable(foundTable);
       } else {
          // Handle table not found (e.g., redirect or show error)
          console.error(`Table with ID ${tableId} not found.`);
          toast({ title: "Erro", description: "Mesa não encontrada.", variant: "destructive" });
          router.push('/vendas'); // Redirect back to tables list
       }
     }
   }, [tableId, tables, isLoadingTables, getTableById, router, toast]);

  const cart = useMemo(() => currentTable?.order ?? [], [currentTable]);

   const addToCart = useCallback((product: Product) => {
      if (!currentTable) return;

      const productInStock = allProducts.find(p => p.id === product.id);
       if (!productInStock || productInStock.quantity <= 0) {
           toast({
               title: "Produto indisponível",
               description: `${product.name} está fora de estoque.`,
               variant: "destructive",
           });
           return;
       }

       const currentCartQuantity = cart.find(item => item.id === product.id)?.quantity ?? 0;

        // Check if adding exceeds stock
        if (currentCartQuantity + 1 > productInStock.quantity) {
            toast({
                title: "Limite de estoque atingido",
                description: `Você não pode adicionar mais ${product.name} (Estoque: ${productInStock.quantity}).`,
                variant: "destructive",
            });
            return; // Return previous cart without changes
        }


        addItemToTableOrder(currentTable.id, product);

        toast({
            title: `${product.name} adicionado`,
            description: `Quantidade na comanda: ${currentCartQuantity + 1}`,
        });

    }, [currentTable, addItemToTableOrder, toast, allProducts, cart]);


   const removeFromCart = useCallback((productId: string) => {
       if (!currentTable) return;
       const product = allProducts.find(p => p.id === productId);
       if (product) {
           toast({
            title: `${product.name} removido`,
            variant: "destructive", // Use default or slightly less alarming variant
           });
       }
       removeItemFromTableOrder(currentTable.id, productId);
    }, [currentTable, removeItemFromTableOrder, toast, allProducts]);

   const clearCart = useCallback(() => {
       if (!currentTable) return;
        if(cart.length > 0){
             toast({
                title: "Comanda limpa!",
                variant: "destructive",
             });
        }
       clearTableOrder(currentTable.id);
   }, [currentTable, clearTableOrder, toast, cart]);

  const calculateTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.salePrice * item.quantity, 0);
  }, [cart]);

   const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return allProducts;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.code.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [allProducts, searchTerm]);

   const autocompleteFilter = useCallback((product: Product, query: string): boolean => {
    const lowerCaseQuery = query.toLowerCase();
    return product.name.toLowerCase().includes(lowerCaseQuery) ||
           product.code.toLowerCase().includes(lowerCaseQuery);
  }, []);

   const renderAutocompleteSuggestion = useCallback((product: Product): React.ReactNode => {
    return (
      <div className="flex items-center gap-2">
         <PackageSearch className="h-4 w-4 text-muted-foreground" />
         <span>{product.name} ({product.code})</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatCurrency(product.salePrice)}</span>
      </div>
    );
  }, []);

   const handleAutocompleteSelect = useCallback((product: Product) => {
    addToCart(product);
    setSearchTerm('');
  }, [addToCart]);


  const formatCurrency = (value: number | undefined | null) => {
    if (typeof value !== 'number' || typeof window === 'undefined') return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

   const finalizeSale = async () => {
        if (!currentTable || cart.length === 0) return;
        setIsFinalizing(true);

        try {
            // Simulate stock reduction - In a real app, this might be an API call
            // that handles updates atomically.
            let stockSufficient = true;
            const stockUpdates: Product[] = [];

            for (const item of cart) {
                const productInStock = allProducts.find(p => p.id === item.id);
                if (!productInStock || productInStock.quantity < item.quantity) {
                    stockSufficient = false;
                    toast({
                        title: "Erro de Estoque!",
                        description: `Estoque insuficiente para ${item.name}. Venda não finalizada.`,
                        variant: "destructive",
                        duration: 5000,
                    });
                    break; // Stop processing if any item is out of stock
                }
                 // Prepare updated product data for stock reduction
                 stockUpdates.push({
                     ...productInStock,
                     quantity: productInStock.quantity - item.quantity
                 });
            }

            if (stockSufficient) {
                // Perform stock updates (replace with your actual update logic)
                // This is a simplified example; consider batch updates or transactions
                 stockUpdates.forEach(updatedProd => decreaseStock(updatedProd));


                toast({
                    title: "Venda Finalizada!",
                    description: `Mesa ${currentTable.number} | Total: ${formatCurrency(calculateTotal)}`,
                    duration: 5000,
                    className: "bg-accent text-accent-foreground border-accent", // Success style
                });
                clearTableOrder(currentTable.id); // Clear order and set status to available
                router.push('/vendas'); // Redirect back to table list after successful sale
            }

        } catch (error: any) {
            console.error("Erro ao finalizar venda:", error);
            toast({
                title: "Erro na Venda!",
                description: error.message || "Não foi possível finalizar a venda. Verifique o estoque e tente novamente.",
                variant: "destructive",
            });
        } finally {
           setIsFinalizing(false);
        }
    }

  // Loading state for the entire page until table data is confirmed
  if (isLoadingTables || isLoadingProducts || !currentTable) {
     return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
             <Loader2 className="h-16 w-16 animate-spin text-primary" />
         </div>
        );
  }

  return (
     <div className="space-y-6">
         {/* Header with Back Button and Table Info */}
         <div className="flex items-center justify-between mb-4">
            <Link href="/vendas" passHref>
                 <Button variant="outline" size="sm">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Mesas
                 </Button>
            </Link>
            <h1 className="text-2xl font-bold text-center">
                Comanda - Mesa {currentTable.number}
            </h1>
             {/* Placeholder for potential actions */}
             <div></div>
         </div>

        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-14rem)]"> {/* Adjust height */}
            {/* Products Section */}
            <div className="flex-1 md:w-2/3 flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                    <Search className="text-muted-foreground" />
                    <AutocompleteInput<Product>
                        items={allProducts.filter(p => p.quantity > 0)}
                        filterFn={autocompleteFilter}
                        renderSuggestion={renderAutocompleteSuggestion}
                        onSelect={handleAutocompleteSelect}
                        placeholder="Buscar produto por nome ou código..."
                        inputClassName="text-lg"
                        labelKey="name"
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                </div>

                <ScrollArea className="flex-1 pr-4">
                {isLoadingProducts ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <Card key={`skel-${index}`} className="p-4 h-52 flex flex-col items-center justify-between">
                                <Skeleton className="h-12 w-12 rounded-md mb-2"/>
                                <Skeleton className="h-5 w-3/4 mb-1"/>
                                <Skeleton className="h-4 w-1/2 mb-2"/>
                                <Skeleton className="h-6 w-16 mb-2"/>
                                <Skeleton className="h-10 w-full"/>
                            </Card>
                        ))}
                    </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.filter(p => p.quantity > 0).map((product) => (
                            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                        ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                        {allProducts.length === 0 ? 'Nenhum produto cadastrado.' : (searchTerm ? `Nenhum produto encontrado para "${searchTerm}".` : 'Nenhum produto em estoque.')}
                        </div>
                    )}
                    {/* Out of stock items */}
                    {filteredProducts.filter(p => p.quantity <= 0).length > 0 && (
                    <div className="mt-6 opacity-50">
                        <Separator />
                        <h3 className="text-sm text-muted-foreground my-2 px-1">Fora de estoque</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.filter(p => p.quantity <= 0).map((product) => (
                                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                            ))}
                        </div>
                    </div>
                    )}
                </ScrollArea>
            </div>

            {/* Cart Section */}
            <Card className="md:w-1/3 flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" /> Comanda
                    </CardTitle>
                    {cart.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearCart} disabled={isFinalizing}>
                            <Trash2 className="h-4 w-4 mr-1" /> Limpar
                        </Button>
                    )}
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4">
                        {cart.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">Nenhum item na comanda.</p>
                        ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                <PackageSearch className="h-5 w-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate" title={item.name}>{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                    {formatCurrency(item.salePrice)} x {item.quantity}
                                    </p>
                                </div>
                                </div>
                                <div className="flex items-center gap-1">
                                <span className="font-semibold w-16 text-right">{formatCurrency(item.salePrice * item.quantity)}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.id)} disabled={isFinalizing}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remover item</span>
                                </Button>
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                    </ScrollArea>
                </CardContent>
                {cart.length > 0 && (
                    <>
                        <Separator />
                        <CardFooter className="p-4 flex flex-col space-y-4">
                            <div className="flex justify-between w-full text-lg font-semibold">
                                <span>Total:</span>
                                <span>{formatCurrency(calculateTotal)}</span>
                            </div>
                            <Button
                                size="lg"
                                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg"
                                onClick={finalizeSale}
                                disabled={isFinalizing}
                             >
                             {isFinalizing ? (
                                 <>
                                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                     Finalizando...
                                 </>
                             ) : (
                                <>
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    Finalizar Venda
                                </>
                             )}
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    </div>
  );
}
