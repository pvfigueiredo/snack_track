'use client';

import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, PackageSearch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Schema for form validation
const productSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        // Allow comma as decimal separator
        const cleanedVal = val.replace(',', '.');
        const num = parseFloat(cleanedVal);
        return isNaN(num) ? undefined : num;
      }
      return val;
    },
    z.number({ invalid_type_error: "Preço deve ser um número" }).positive({ message: "Preço deve ser positivo" })
  ),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProdutosPage() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useProducts();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
    },
  });

   const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    try {
        if (editingProduct) {
        updateProduct({ ...editingProduct, ...data });
        toast({
            title: "Sucesso!",
            description: "Produto atualizado com sucesso.",
        });
        } else {
        addProduct(data);
        toast({
            title: "Sucesso!",
            description: "Produto cadastrado com sucesso.",
        });
        }
        closeDialog();
    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        toast({
            title: "Erro!",
            description: `Não foi possível ${editingProduct ? 'atualizar' : 'cadastrar'} o produto. Tente novamente.`,
            variant: "destructive",
        });
    }
  };


  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingProduct(null);
    form.reset({
      name: '',
      description: '',
      price: 0,
    });
    setIsDialogOpen(true);
  };

   const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    form.reset(); // Reset form fields and errors
  };

  const handleDelete = (productId: string) => {
    // Consider adding a confirmation dialog here
    try {
        deleteProduct(productId);
        toast({
            title: "Sucesso!",
            description: "Produto excluído com sucesso.",
        });
    } catch(error){
         console.error("Erro ao excluir produto:", error);
         toast({
            title: "Erro!",
            description: "Não foi possível excluir o produto. Tente novamente.",
            variant: "destructive",
        });
    }
  };

  // Format currency (Client-side only)
  const formatCurrency = (value: number) => {
    if (typeof window === 'undefined') return ''; // Avoid server-side errors
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cadastro de Produtos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={closeDialog}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Atualize os detalhes do produto.' : 'Preencha as informações do novo produto.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Nome</FormLabel>
                        <FormControl className="col-span-3">
                            <Input {...field} placeholder="Ex: X-Burger Especial" />
                        </FormControl>
                        <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Descrição</FormLabel>
                        <FormControl className="col-span-3">
                            <Textarea {...field} placeholder="Ex: Pão, carne 180g, queijo, alface, tomate, molho especial" />
                        </FormControl>
                        <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Preço (R$)</FormLabel>
                            <FormControl className="col-span-3">
                                <Input
                                type="text" // Use text to allow comma
                                {...field}
                                placeholder="Ex: 25,50"
                                onChange={(e) => {
                                    // Basic input masking for currency-like format (optional)
                                    let value = e.target.value;
                                    value = value.replace(/[^0-9,]/g, ''); // Remove non-numeric/comma chars
                                    // Replace multiple commas with one
                                    value = value.replace(/,{2,}/g, ',');
                                    // Ensure only one comma
                                     const parts = value.split(',');
                                     if (parts.length > 2) {
                                         value = parts[0] + ',' + parts.slice(1).join('');
                                     }
                                    field.onChange(value); // Update form state
                                }}
                                // value={field.value === 0 ? '' : field.value.toString().replace('.',',')} // Format display value
                                />
                            </FormControl>
                            <FormMessage className="col-span-3 col-start-2" />
                            </FormItem>
                        )}
                        />
                     <DialogFooter>
                       <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeDialog}>
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                            {form.formState.isSubmitting ? 'Salvando...' : (editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>Visualize e gerencie os produtos da sua lanchonete.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ícone</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => {
                  const Icon = product.icon;
                  return (
                  <TableRow key={product.id}>
                     <TableCell>
                        {Icon ? <Icon className="h-6 w-6 text-primary" /> : <PackageSearch className="h-6 w-6 text-muted-foreground" />}
                      </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{product.description || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                         {/* Confirmation Dialog for Delete */}
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Confirmar Exclusão</DialogTitle>
                                <DialogDescription>
                                    Tem certeza que deseja excluir o produto "{product.name}"? Esta ação não pode ser desfeita.
                                </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDelete(product.id)}>
                                    Excluir
                                    </Button>
                                </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                   );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum produto cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
