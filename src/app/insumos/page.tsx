
'use client';

import React, { useState } from 'react';
import { useInsumos } from '@/hooks/useInsumos';
import { type Insumo } from '@/types/insumo';
import { unitsOfMeasure, type UnitOfMeasure } from '@/types/product'; // Reuse from product types
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
import { PlusCircle, Edit, Trash2, ClipboardPaste, AlertCircle } from 'lucide-react'; // Changed icon
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/dateUtils';

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
const insumoSchema = z.object({
  code: z.string().min(1, { message: "Código é obrigatório" }),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  purchasePrice: z.preprocess(
    parseCurrency,
    z.number({ invalid_type_error: "Valor deve ser um número" }).positive({ message: "Valor de compra deve ser positivo" }).optional().or(z.literal(0)) // Allow 0 or positive
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

type InsumoFormData = z.infer<typeof insumoSchema>;

export default function InsumosPage() {
  const { insumos, addInsumo, updateInsumo, deleteInsumo, isLoading, getInsumoByCode } = useInsumos();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null); // State for code validation error

  const form = useForm<InsumoFormData>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      code: '',
      name: '',
      purchasePrice: 0,
      quantity: 0,
      unitOfMeasure: 'UN',
    },
  });

   const onSubmit: SubmitHandler<InsumoFormData> = (data) => {
    // Additional check for code uniqueness before submitting to the hook
    const existingInsumoWithCode = getInsumoByCode(data.code);
    if (existingInsumoWithCode && (!editingInsumo || editingInsumo.id !== existingInsumoWithCode.id)) {
      setErrorCode('Código de insumo já existe.');
      form.setError('code', { type: 'manual', message: 'Código de insumo já existe.' });
      return; // Prevent submission
    }
    setErrorCode(null); // Clear error if validation passes

    try {
        if (editingInsumo) {
          // Ensure the ID is included when updating
          updateInsumo({ ...editingInsumo, ...data });
          toast({
            title: "Sucesso!",
            description: "Insumo atualizado com sucesso.",
          });
        } else {
          addInsumo(data);
          toast({
            title: "Sucesso!",
            description: "Insumo cadastrado com sucesso.",
          });
        }
        closeDialog();
    } catch (error: any) {
        console.error("Erro ao salvar insumo:", error);
        toast({
            title: "Erro!",
            description: error.message || `Não foi possível ${editingInsumo ? 'atualizar' : 'cadastrar'} o insumo. Tente novamente.`,
            variant: "destructive",
        });
        // If error is about code uniqueness, set it in the form
        if (error.message && error.message.includes('Código de insumo')) {
             setErrorCode(error.message);
             form.setError('code', { type: 'manual', message: error.message });
        }
    }
  };


  const openEditDialog = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setErrorCode(null); // Clear code error when opening edit
    form.reset({
      code: insumo.code,
      name: insumo.name,
      purchasePrice: insumo.purchasePrice,
      quantity: insumo.quantity,
      unitOfMeasure: insumo.unitOfMeasure,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingInsumo(null);
    setErrorCode(null); // Clear code error when opening new
    form.reset({ // Reset to defaults
        code: '',
        name: '',
        purchasePrice: 0,
        quantity: 0,
        unitOfMeasure: 'UN',
    });
    setIsDialogOpen(true);
  };

   const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingInsumo(null);
    setErrorCode(null); // Clear code error on close
    form.reset(); // Reset form fields and errors
  };

  const handleDelete = (insumoId: string) => {
    try {
        deleteInsumo(insumoId);
        toast({
            title: "Sucesso!",
            description: "Insumo excluído com sucesso.",
        });
    } catch(error){
         console.error("Erro ao excluir insumo:", error);
         toast({
            title: "Erro!",
            description: "Não foi possível excluir o insumo. Tente novamente.",
            variant: "destructive",
        });
    }
  };

  // Handle potential low stock (example threshold: 5)
  const isLowStock = (quantity: number, threshold: number = 5): boolean => {
    return quantity <= threshold;
  }

  return (
     <TooltipProvider>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cadastro de Insumos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" onInteractOutside={closeDialog}>
            <DialogHeader>
              <DialogTitle>{editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle>
              <DialogDescription>
                {editingInsumo ? 'Atualize os detalhes do insumo.' : 'Preencha as informações do novo insumo.'}
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
                                <Input {...field} placeholder="Ex: INSUMO001" className={errorCode ? 'border-destructive focus-visible:ring-destructive' : ''} />
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
                                <Input {...field} placeholder="Ex: Farinha de Trigo" />
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
                                placeholder="Ex: 5,50"
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

                    {/* Quantity */}
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} placeholder="Ex: 50" min="0" step="1"
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
                            {form.formState.isSubmitting ? 'Salvando...' : (editingInsumo ? 'Salvar Alterações' : 'Cadastrar Insumo')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insumos Cadastrados</CardTitle>
          <CardDescription>Visualize e gerencie os insumos/ingredientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Vlr. Compra</TableHead>
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
                    <TableCell className="text-right"><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : insumos.length > 0 ? (
                insumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.code}</TableCell>
                    <TableCell>{insumo.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(insumo.purchasePrice)}</TableCell>
                    <TableCell className={`text-right ${isLowStock(insumo.quantity) ? 'text-destructive font-semibold' : ''}`}>
                       {isLowStock(insumo.quantity) ? (
                           <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center justify-end gap-1">
                                  <AlertCircle className="h-4 w-4" /> {insumo.quantity}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Estoque baixo!</p>
                              </TooltipContent>
                            </Tooltip>
                       ) : insumo.quantity}
                    </TableCell>
                    <TableCell className="text-right">{insumo.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(insumo)}>
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
                                    Tem certeza que deseja excluir o insumo "{insumo.name}" ({insumo.code})? Esta ação não pode ser desfeita.
                                </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDelete(insumo.id)}>
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
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum insumo cadastrado ainda.
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
