'use client';

import React from 'react';
import type { Product } from '@/types/product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageSearch, AlertTriangle } from 'lucide-react'; // Default icon, Low stock icon

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

// Format currency (Client-side only)
const formatCurrency = (value: number | undefined | null) => {
    if (typeof value !== 'number' || typeof window === 'undefined') return ''; // Avoid server-side errors
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5; // Example threshold

  return (
    <Card className={`flex flex-col justify-between items-center p-4 h-full w-full text-center shadow-md hover:shadow-lg transition-shadow ${isOutOfStock ? 'opacity-50 bg-muted cursor-not-allowed' : 'cursor-pointer bg-card'}`}>
      <CardHeader className="p-2 w-full relative">
         {/* Stock Indicator */}
        {isOutOfStock && (
            <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Fora
            </div>
        )}
         {isLowStock && !isOutOfStock && (
            <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Baixo ({product.quantity})
            </div>
        )}

        {/* Default Icon */}
        <div className="flex justify-center items-center h-16 w-full mb-2"> {/* Reduced height */}
           <PackageSearch className={`h-12 w-12 ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`} />
        </div>
        <CardTitle className="text-base font-semibold truncate w-full pt-1" title={product.name}>
            {product.name}
        </CardTitle>
         <p className="text-xs text-muted-foreground">({product.code})</p> {/* Display code */}
      </CardHeader>
       <CardContent className="p-1 flex-grow w-full">
         {/* Removed description */}
       </CardContent>
      <CardFooter className="p-2 mt-auto w-full flex flex-col items-center space-y-2">
         {/* Use salePrice */}
        <span className={`text-lg font-bold ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>{formatCurrency(product.salePrice)}</span>
        <Button
          onClick={() => !isOutOfStock && onAddToCart(product)} // Prevent adding if out of stock
          className={`w-full text-accent-foreground ${isOutOfStock ? 'bg-muted hover:bg-muted cursor-not-allowed' : 'bg-accent hover:bg-accent/90'}`}
          aria-label={isOutOfStock ? `${product.name} fora de estoque` : `Adicionar ${product.name} ao carrinho`}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Indisponível' : 'Adicionar'}
        </Button>
      </CardFooter>
    </Card>
  );
};
