'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';
import { ProductCard } from '@/components/ProductCard'; // Adjust ProductCard if needed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ShoppingCart, Search, Trash2, PackageSearch } from 'lucide-react'; // Keep PackageSearch as fallback
import { AutocompleteInput } from '@/components/AutocompleteInput';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";


type CartItem = Product & { quantity: number };

export default function VendasPage() {
  const { products: allProducts, isLoading: isLoadingProducts } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();


  const addToCart = useCallback((product: Product) => {
     if (product.quantity <= 0) {
      toast({
        title: "Produto indisponível",
        description: `${product.name} está fora de estoque.`,
        variant: "destructive",
      });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
       const currentCartQuantity = existingItem ? existingItem.quantity : 0;

        // Check if adding exceeds stock
        if (currentCartQuantity + 1 > product.quantity) {
            toast({
                title: "Limite de estoque atingido",
                description: `Você não pode adicionar mais ${product.name} (Estoque: ${product.quantity}).`,
                variant: "destructive",
            });
            return prevCart; // Return previous cart without changes
        }


      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
     toast({
      title: `${product.name} adicionado`,
      description: `Quantidade no carrinho: ${ (cart.find(item => item.id === product.id)?.quantity ?? 0) + 1 }`,
    });
  }, [cart, toast]); // Add cart and toast to dependencies


  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        return prevCart.filter((item) => item.id !== productId);
      }
    });
     const product = allProducts.find(p => p.id === productId);
      if (product) {
        toast({
          title: `${product.name} removido`,
           variant: "destructive",
        });
      }
  };

  const clearCart = () => {
    setCart([]);
     toast({
          title: "Carrinho limpo!",
          variant: "destructive",
        });
  };

  const calculateTotal = useMemo(() => {
    // Use salePrice for total calculation
    return cart.reduce((total, item) => total + item.salePrice * item.quantity, 0);
  }, [cart]);

  // Filter products based on search term (name or code)
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

   // Filter function for Autocomplete (name or code)
  const autocompleteFilter = useCallback((product: Product, query: string): boolean => {
    const lowerCaseQuery = query.toLowerCase();
    return product.name.toLowerCase().includes(lowerCaseQuery) ||
           product.code.toLowerCase().includes(lowerCaseQuery);
  }, []);

  // Render suggestion for Autocomplete
  const renderAutocompleteSuggestion = useCallback((product: Product): React.ReactNode => {
    return (
      <div className="flex items-center gap-2">
         <PackageSearch className="h-4 w-4 text-muted-foreground" /> {/* Default icon */}
         <span>{product.name} ({product.code})</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatCurrency(product.salePrice)}</span>
      </div>
    );
  }, []);

  // Handle selection from Autocomplete
  const handleAutocompleteSelect = useCallback((product: Product) => {
    addToCart(product);
    setSearchTerm(''); // Clear search input after selection
  }, [addToCart]);


  // Format currency (Client-side only)
  const formatCurrency = (value: number | undefined | null) => {
    if (typeof value !== 'number' || typeof window === 'undefined') return ''; // Avoid server-side errors & handle undefined/null
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const finalizeSale = () => {
      // TODO: Implement stock reduction logic here
      // 1. Iterate through the cart
      // 2. For each item, call updateProduct to decrease the quantity in the main product list
      //    Ensure sufficient stock before proceeding. If not, show an error and stop.
      // 3. If all stock updates are successful, proceed with the toast and clearing the cart.

      // Example (needs proper error handling and potentially making updates atomic):
      // try {
      //   for (const item of cart) {
      //     const productToUpdate = allProducts.find(p => p.id === item.id);
      //     if (!productToUpdate || productToUpdate.quantity < item.quantity) {
      //       throw new Error(`Estoque insuficiente para ${item.name}`);
      //     }
      //     updateProduct({ ...productToUpdate, quantity: productToUpdate.quantity - item.quantity });
      //   }

          toast({
              title: "Venda Finalizada!",
              description: `Total: ${formatCurrency(calculateTotal)}`,
              duration: 5000, // Show for longer
          });
          clearCart(); // Clear the cart after successful sale simulation

      // } catch (error: any) {
      //    console.error("Erro ao finalizar venda:", error);
      //    toast({
      //        title: "Erro na Venda!",
      //        description: error.message || "Não foi possível finalizar a venda devido a problemas de estoque.",
      //        variant: "destructive",
      //    });
      //    // Do NOT clear the cart if the sale failed
      // }
  }


  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)]"> {/* Adjust height based on header/footer */}
      {/* Products Section */}
      <div className="flex-1 md:w-2/3 flex flex-col">
         <div className="mb-4 flex items-center gap-2">
             <Search className="text-muted-foreground" />
             {/* Autocomplete Input */}
             <AutocompleteInput<Product>
                items={allProducts.filter(p => p.quantity > 0)} // Only suggest items in stock
                filterFn={autocompleteFilter}
                renderSuggestion={renderAutocompleteSuggestion}
                onSelect={handleAutocompleteSelect}
                placeholder="Buscar por nome ou código..." // Updated placeholder
                inputClassName="text-lg"
                labelKey="name" // Keep name for display after selection, or change if needed
                value={searchTerm} // Control the input value
                onChange={setSearchTerm} // Update search term for grid filtering as well
            />
         </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 pr-4">
          {isLoadingProducts ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                     <Card key={`skel-${index}`} className="p-4 h-52 flex flex-col items-center justify-between"> {/* Adjusted height */}
                        <Skeleton className="h-12 w-12 rounded-md mb-2"/> {/* Default icon placeholder */}
                        <Skeleton className="h-5 w-3/4 mb-1"/>
                        <Skeleton className="h-4 w-1/2 mb-2"/> {/* Remove description skeleton */}
                        <Skeleton className="h-6 w-16 mb-2"/> {/* Price skeleton */}
                        <Skeleton className="h-10 w-full"/>
                     </Card>
                 ))}
             </div>
          ) : filteredProducts.length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {/* Only show products with quantity > 0 */}
                {filteredProducts.filter(p => p.quantity > 0).map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
             </div>
          ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                 {allProducts.length === 0 ? 'Nenhum produto cadastrado.' : (searchTerm ? `Nenhum produto encontrado para "${searchTerm}".` : 'Nenhum produto em estoque.')}
             </div>
          )}
           {/* Optionally show out-of-stock items separately or greyed out */}
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
            <ShoppingCart className="h-5 w-5" /> Carrinho
          </CardTitle>
           {cart.length > 0 && (
             <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpar
             </Button>
            )}
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Seu carrinho está vazio.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                       <PackageSearch className="h-5 w-5 text-primary flex-shrink-0" /> {/* Default icon */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={item.name}>{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.salePrice)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                       {/* Use salePrice for item total */}
                       <span className="font-semibold w-16 text-right">{formatCurrency(item.salePrice * item.quantity)}</span>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.id)}>
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
                <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg" onClick={finalizeSale}>
                 Finalizar Venda
                </Button>
            </CardFooter>
         </>
        )}
      </Card>
    </div>
  );
}
