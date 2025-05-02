'use client';

import React from 'react';
import type { Product } from '@/types/product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PackageSearch } from 'lucide-react'; // Default icon

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

// Format currency (Client-side only)
const formatCurrency = (value: number) => {
    if (typeof window === 'undefined') return ''; // Avoid server-side errors
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const Icon = product.icon || PackageSearch;

  return (
    <Card className="flex flex-col justify-between items-center p-4 h-full w-full text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-card">
      <CardHeader className="p-2 w-full">
        {/* Icon takes precedence, then image, then default */}
        <div className="flex justify-center items-center h-20 w-full mb-2">
          {product.icon ? (
             <Icon className="h-16 w-16 text-primary" />
          ) : product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={80}
              height={80}
              className="object-contain"
              data-ai-hint="product image"
            />
          ) : (
             <PackageSearch className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="text-lg font-semibold truncate w-full" title={product.name}>{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-grow w-full">
        <p className="text-muted-foreground text-sm truncate" title={product.description}>{product.description || ''}</p>
      </CardContent>
      <CardFooter className="p-2 mt-auto w-full flex flex-col items-center space-y-2">
        <span className="text-xl font-bold text-primary">{formatCurrency(product.price)}</span>
        <Button
          onClick={() => onAddToCart(product)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label={`Adicionar ${product.name} ao carrinho`}
        >
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
};
