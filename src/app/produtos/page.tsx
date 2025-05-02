'use client';

import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { type Product, unitsOfMeasure, type UnitOfMeasure } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, PackageSearch, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// Helper function to parse currency string (allows comma or dot)
const parseCurrency = (val: unknown): number | undefined => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleanedVal = val.replace(',', '.').replace(/[^0-9.]/g, ''); // Keep only numbers and dot
    const num = parseFloat(cleanedVal);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
};

// Schema for form validation
const productSchema = z.object({
  code: z.string().min(1, { message: "Código é obrigatório" }),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  purchasePrice: z.preprocess(
    parseCurrency,
    z.number({ invalid_type_error: "Valor deve ser um número" }).positive({ message: "Valor de compra deve ser positivo" }).optional().or(z.literal(0)) // Allow 0 or positive
  ),
  salePrice: z.preprocess(
    parseCurrency,
    z.number({ invalid_type_error: "Valor deve ser um número" }).positive({ message: "Valor de venda deve ser positivo" }).optional().or(z.literal(0)) // Allow 0 or positive
  ),
  quantity: z.preprocess(
    (val) => {
        const num = parseInt(String(val), 10);
        return isNaN(num) ? undefined : num;
    },
    z.number({ invalid_type_error: "Quantidade deve ser um número inteiro" }).int({ message: "Quantidade deve ser um número inteiro" }).nonnegative({ message: "Quantidade não pode ser negativa" })
  ),
  unitOfMeasure: z.enum(unitsOfMeasure, { required_error: "Unidade de medida é obrigatória" }),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProdutosPage() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading, getProductByCode } = useProducts();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null); // State for code validation error

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      name: '',
      purchasePrice: 0,
      salePrice: 0,
      quantity: 0,
      unitOfMeasure: 'UN',
    },
  });

   const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    // Additional check for code uniqueness before submitting to the hook
    const existingProductWithCode = getProductByCode(data.code);
    if (existingProductWithCode && (!editingProduct || editingProduct.id !== existingProductWithCode.id)) {
      setErrorCode('Código de produto já existe.');
      form.setError('code', { type: 'manual', message: 'Código de produto já existe.' });
      return; // Prevent submission
    }
    setErrorCode(null); // Clear error if validation passes

    try {
        if (editingProduct) {
          // Ensure the ID is included when updating
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
    } catch (error: any) {
        console.error("Erro ao salvar produto:", error);
        toast({
            title: "Erro!",
            description: error.message || `Não foi possível ${editingProduct ? 'atualizar' : 'cadastrar'} o produto. Tente novamente.`,
            variant: "destructive",
        });
        // If error is about code uniqueness, set it in the form
        if (error.message && error.message.includes('Código de produto')) {
             setErrorCode(error.message);
             form.setError('code', { type: 'manual', message: error.message });
        }
    }
  };


  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setErrorCode(null); // Clear code error when opening edit
    form.reset({
      code: product.code,
      name: product.name,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      quantity: product.quantity,
      unitOfMeasure: product.unitOfMeasure,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingProduct(null);
    setErrorCode(null); // Clear code error when opening new
    form.reset({ // Reset to defaults
        code: '',
        name: '',
        purchasePrice: 0,
        salePrice: 0,
        quantity: 0,
        unitOfMeasure: 'UN',
    });
    setIsDialogOpen(true);
  };

   const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setErrorCode(null); // Clear code error on close
    form.reset(); // Reset form fields and errors
  };

  const handleDelete = (productId: string) => {
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
  const formatCurrency = (value: number | undefined | null): string => {
    if (typeof value !== 'number' || typeof window === 'undefined') return ''; // Avoid server-side errors & handle undefined/null
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // Handle potential low stock (example threshold: 5)
  const isLowStock = (quantity: number, threshold: number = 5): boolean => {
    return quantity <= threshold;
  }

  return (
     <TooltipProvider>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cadastro de Produtos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" onInteractOutside={closeDialog}> {/* Adjusted width */}
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Atualize os detalhes do produto.' : 'Preencha as informações do novo produto.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                     {/* Code */}
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ex: PROD001" className={errorCode ? 'border-destructive focus-visible:ring-destructive' : ''} />
                            </FormControl>
                             {errorCode && <FormMessage>{errorCode}</FormMessage>}
                            {!errorCode && <FormMessage />}
                            </FormItem>
                        )}
                    />
                    {/* Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ex: X-Burger Especial" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     {/* Purchase Price */}
                     <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Valor de Compra (R$)</FormLabel>
                            <FormControl>
                                <Input
                                type="text" // Use text to allow comma
                                {...field}
                                placeholder="Ex: 15,00"
                                onChange={(e) => {
                                    let value = e.target.value;
                                    value = value.replace(/[^0-9,]/g, ''); // Remove non-numeric/comma chars
                                    value = value.replace(/,{2,}/g, ',');
                                     const parts = value.split(',');
                                     if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
                                    field.onChange(value);
                                }}
                                value={field.value === undefined ? '' : String(field.value).replace('.',',')} // Format display value
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    {/* Sale Price */}
                    <FormField
                        control={form.control}
                        name="salePrice"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Valor de Venda (R$)</FormLabel>
                            <FormControl>
                                <Input
                                type="text"
                                {...field}
                                placeholder="Ex: 25,50"
                                 onChange={(e) => {
                                    let value = e.target.value;
                                    value = value.replace(/[^0-9,]/g, '');
                                    value = value.replace(/,{2,}/g, ',');
                                     const parts = value.split(',');
                                     if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
                                    field.onChange(value);
                                }}
                                value={field.value === undefined ? '' : String(field.value).replace('.',',')}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    {/* Quantity */}
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} placeholder="Ex: 100" min="0" step="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} // Ensure integer
                                  value={field.value ?? 0}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     {/* Unit of Measure */}
                    <FormField
                        control={form.control}
                        name="unitOfMeasure"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Unidade de Medida</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a unidade" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {unitsOfMeasure.map(unit => (
                                    <SelectItem key={unit} value={unit}>
                                        {unit}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
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
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Vlr. Compra</TableHead>
                <TableHead className="text-right">Vlr. Venda</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Un.</TableHead>
                <TableHead className="text-right w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.purchasePrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.salePrice)}</TableCell>
                    <TableCell className={`text-right ${isLowStock(product.quantity) ? 'text-destructive font-semibold' : ''}`}>
                       {isLowStock(product.quantity) ? (
                           <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center justify-end gap-1">
                                  <AlertCircle className="h-4 w-4" /> {product.quantity}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Estoque baixo!</p>
                              </TooltipContent>
                            </Tooltip>
                       ) : product.quantity}
                    </TableCell>
                    <TableCell className="text-right">{product.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Editar</p>
                            </TooltipContent>
                         </Tooltip>

                         {/* Confirmation Dialog for Delete */}
                         <Dialog>
                            <DialogTrigger asChild>
                               <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Excluir</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Excluir</p>
                                    </TooltipContent>
                                </Tooltip>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Confirmar Exclusão</DialogTitle>
                                <DialogDescription>
                                    Tem certeza que deseja excluir o produto "{product.name}" ({product.code})? Esta ação não pode ser desfeita.
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
                   ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum produto cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
