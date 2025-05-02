
'use client';

import React, { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useInsumos } from '@/hooks/useInsumos';
import { type Recipe, type RecipeIngredient } from '@/types/recipe';
import { type Insumo } from '@/types/insumo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, BookCopy, CookingPot, MinusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/dateUtils';
import { Separator } from '@/components/ui/separator';

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

// Helper function to parse positive integer
const parsePositiveInt = (val: unknown): number | undefined => {
    const num = parseInt(String(val), 10);
    return isNaN(num) || num <= 0 ? undefined : num;
};

// Zod schema for a single ingredient in the form
const recipeIngredientSchema = z.object({
  insumoId: z.string().min(1, { message: "Selecione um insumo" }),
  quantity: z.preprocess(
    parsePositiveInt,
    z.number({ invalid_type_error: "Quantidade deve ser um número" }).int().positive({ message: "Quantidade deve ser maior que zero" })
  ),
});

// Schema for the entire recipe form validation
const recipeSchema = z.object({
  code: z.string().min(1, { message: "Código é obrigatório" }),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  yieldAmount: z.preprocess(
    parsePositiveInt,
    z.number({ invalid_type_error: "Rendimento deve ser um número" }).int().positive({ message: "Rendimento deve ser maior que zero" })
  ),
  // yieldUnit: z.literal('UN'), // Fixed for now
  salePrice: z.preprocess(
    parseCurrency,
    z.number({ invalid_type_error: "Valor de venda deve ser um número" }).positive({ message: "Valor de venda deve ser positivo" })
  ),
  ingredients: z.array(recipeIngredientSchema).min(1, { message: "Adicione pelo menos um ingrediente." }),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

export default function ReceitasPage() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, produceRecipeBatch, isLoading, getRecipeByCode, calculateRecipePurchasePrice } = useRecipes();
  const { insumos, isLoading: isLoadingInsumos, getInsumoById } = useInsumos();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null); // State for code validation error
  const [isProduceDialogOpen, setIsProduceDialogOpen] = useState(false);
  const [recipeToProduce, setRecipeToProduce] = useState<Recipe | null>(null);
  const [produceQuantity, setProduceQuantity] = useState<number>(1);
  const [isProducing, setIsProducing] = useState(false);
  const [produceError, setProduceError] = useState<string | null>(null);


  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      code: '',
      name: '',
      yieldAmount: 1,
      // yieldUnit: 'UN',
      salePrice: 0,
      ingredients: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

   const onSubmit: SubmitHandler<RecipeFormData> = (data) => {
    // Additional check for code uniqueness before submitting to the hook
    const existingRecipeWithCode = getRecipeByCode(data.code);
    if (existingRecipeWithCode && (!editingRecipe || editingRecipe.id !== existingRecipeWithCode.id)) {
      setErrorCode('Código de receita já existe.');
      form.setError('code', { type: 'manual', message: 'Código de receita já existe.' });
      return; // Prevent submission
    }
    setErrorCode(null); // Clear error if validation passes

    const recipeData = {
        ...data,
        yieldUnit: 'UN' as const, // Ensure yieldUnit is added
        batchesMade: editingRecipe ? editingRecipe.batchesMade : 0, // Preserve batchesMade if editing
    };


    try {
        if (editingRecipe) {
          updateRecipe({ ...editingRecipe, ...recipeData });
          toast({
            title: "Sucesso!",
            description: "Receita atualizada com sucesso.",
          });
        } else {
          // For adding, we need Omit<Recipe, 'id' | 'batchesMade'>
          const { code, name, yieldAmount, yieldUnit, salePrice, ingredients } = recipeData;
          addRecipe({ code, name, yieldAmount, yieldUnit, salePrice, ingredients });
          toast({
            title: "Sucesso!",
            description: "Receita cadastrada com sucesso.",
          });
        }
        closeDialog();
    } catch (error: any) {
        console.error("Erro ao salvar receita:", error);
        toast({
            title: "Erro!",
            description: error.message || `Não foi possível ${editingRecipe ? 'atualizar' : 'cadastrar'} a receita. Tente novamente.`,
            variant: "destructive",
        });
        // If error is about code uniqueness, set it in the form
        if (error.message && error.message.toLowerCase().includes('código')) {
             setErrorCode(error.message);
             form.setError('code', { type: 'manual', message: error.message });
        }
    }
  };


  const openEditDialog = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setErrorCode(null); // Clear code error when opening edit
    form.reset({
      code: recipe.code,
      name: recipe.name,
      yieldAmount: recipe.yieldAmount,
      salePrice: recipe.salePrice,
      ingredients: recipe.ingredients.map(ing => ({ insumoId: ing.insumoId, quantity: ing.quantity })),
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRecipe(null);
    setErrorCode(null); // Clear code error when opening new
    form.reset({ // Reset to defaults
        code: '',
        name: '',
        yieldAmount: 1,
        salePrice: 0,
        ingredients: [],
    });
    replace([]); // Ensure field array is empty
    setIsDialogOpen(true);
  };

   const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRecipe(null);
    setErrorCode(null); // Clear code error on close
    form.reset(); // Reset form fields and errors
    replace([]); // Explicitly clear the field array on close
  };

  const handleDelete = (recipeId: string, recipeName: string) => {
     // Confirmation Dialog for Delete
     // Using alert for simplicity, replace with a proper dialog if needed
     if (confirm(`Tem certeza que deseja excluir a receita "${recipeName}"? Esta ação não pode ser desfeita e excluirá o produto associado.`)) {
        try {
            deleteRecipe(recipeId);
            toast({
                title: "Sucesso!",
                description: `Receita "${recipeName}" excluída com sucesso.`,
                 variant: "destructive",
            });
        } catch(error: any){
             console.error("Erro ao excluir receita:", error);
             toast({
                title: "Erro!",
                description: error.message || "Não foi possível excluir a receita. Tente novamente.",
                variant: "destructive",
            });
        }
     }
  };

  const openProduceDialog = (recipe: Recipe) => {
    setRecipeToProduce(recipe);
    setProduceQuantity(1); // Default to 1 batch
    setProduceError(null);
    setIsProduceDialogOpen(true);
  };

  const closeProduceDialog = () => {
    setIsProduceDialogOpen(false);
    setRecipeToProduce(null);
    setProduceQuantity(1);
    setProduceError(null);
    setIsProducing(false);
  };

  const handleProduceBatch = async () => {
    if (!recipeToProduce || produceQuantity <= 0) return;

    setIsProducing(true);
    setProduceError(null);

    try {
      await produceRecipeBatch(recipeToProduce.id, produceQuantity);
      toast({
        title: "Produção Concluída!",
        description: `${produceQuantity} lote(s) de ${recipeToProduce.name} produzido(s) com sucesso.`,
      });
      closeProduceDialog();
    } catch (error: any) {
      console.error("Erro ao produzir lote:", error);
      setProduceError(error.message || "Erro desconhecido durante a produção.");
      toast({
        title: "Erro na Produção!",
        description: error.message || "Não foi possível produzir o lote. Verifique o estoque de insumos.",
        variant: "destructive",
      });
    } finally {
      setIsProducing(false);
    }
  };

  // Calculate total cost for display
  const calculateDisplayCost = (ingredients: RecipeIngredient[]) => {
      if (!ingredients || ingredients.length === 0) return 0;
      return calculateRecipePurchasePrice(ingredients);
  };

  // Watch ingredients changes to update cost display in the form
  const watchedIngredients = form.watch('ingredients');
  const currentFormCost = useMemo(() => calculateDisplayCost(watchedIngredients), [watchedIngredients, calculateDisplayCost]);
  const currentYield = form.watch('yieldAmount') || 1;
  const costPerUnit = currentYield > 0 ? currentFormCost / currentYield : 0;

  return (
     <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookCopy className="h-7 w-7 text-primary" /> Cadastro de Receitas</h1>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) closeDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => {
              // Prevent closing if interacting with SelectContent
              const target = e.target as HTMLElement;
               if (target.closest('[data-radix-select-content-wrapper]')) {
                   e.preventDefault();
               } else {
                  closeDialog();
               }
             }}>
            <DialogHeader>
              <DialogTitle>{editingRecipe ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
              <DialogDescription>
                {editingRecipe ? 'Atualize os detalhes da receita e seus ingredientes.' : 'Preencha as informações da nova receita e adicione os ingredientes.'}
              </DialogDescription>
            </DialogHeader>

            {/* Recipe Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    {/* Recipe Details */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Code */}
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Código</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Ex: REC001" className={errorCode ? 'border-destructive focus-visible:ring-destructive' : ''} />
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
                                <FormLabel>Nome da Receita</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Ex: Massa de Pão Caseiro" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Yield */}
                        <FormField
                            control={form.control}
                            name="yieldAmount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Rendimento (Unidades)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} placeholder="Ex: 10" min="1" step="1"
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)} // Ensure positive integer
                                    value={field.value ?? 1}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Sale Price per Unit */}
                        <FormField
                            control={form.control}
                            name="salePrice"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Preço Venda (por Unidade R$)</FormLabel>
                                <FormControl>
                                    <Input
                                    type="text"
                                    {...field}
                                    placeholder="Ex: 5,00"
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
                     </div>

                    <Separator className="my-4" />

                    {/* Ingredients Section */}
                    <h3 className="text-lg font-medium mb-2">Ingredientes</h3>
                    <div className="space-y-4">
                        {fields.map((item, index) => (
                             <div key={item.id} className="flex items-start gap-4 border p-4 rounded-md relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    {/* Insumo Select */}
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.insumoId`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Insumo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger disabled={isLoadingInsumos}>
                                                    <SelectValue placeholder={isLoadingInsumos ? "Carregando..." : "Selecione o insumo"} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {insumos.map(insumo => (
                                                    <SelectItem key={insumo.id} value={insumo.id}>
                                                        {insumo.name} ({insumo.unitOfMeasure})
                                                    </SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Quantity */}
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantidade</FormLabel>
                                                <FormControl>
                                                     <Input type="number" {...field} placeholder="Ex: 2" min="0.01" step="any" // Allow decimals
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        value={field.value ?? 0}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="mt-8 text-destructive hover:text-destructive"
                                    onClick={() => remove(index)}
                                    aria-label="Remover Ingrediente"
                                >
                                    <MinusCircle className="h-5 w-5" />
                                </Button>
                             </div>
                        ))}
                         {/* Display error if no ingredients */}
                         <FormField
                            control={form.control}
                            name="ingredients"
                            render={() => (
                                <FormItem>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ insumoId: '', quantity: 1 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Ingrediente
                        </Button>
                    </div>

                    {/* Cost Display */}
                    <div className="mt-6 p-4 border rounded-md bg-muted/50">
                        <p className="text-sm font-medium text-muted-foreground">Custo Total Estimado (por lote): <span className="font-semibold text-foreground">{formatCurrency(currentFormCost)}</span></p>
                        <p className="text-sm font-medium text-muted-foreground">Custo Estimado (por unidade): <span className="font-semibold text-foreground">{formatCurrency(costPerUnit)}</span></p>
                    </div>


                     <DialogFooter className="mt-6 sticky bottom-0 bg-background py-4 border-t">
                       <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeDialog}>
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting || isLoading} className="bg-accent hover:bg-accent/90">
                            {form.formState.isSubmitting ? 'Salvando...' : (editingRecipe ? 'Salvar Alterações' : 'Cadastrar Receita')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recipe List */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas Cadastradas</CardTitle>
          <CardDescription>Visualize, gerencie e produza suas receitas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Rendimento (UN)</TableHead>
                <TableHead className="text-right">Custo/Lote</TableHead>
                <TableHead className="text-right">Preço Venda/UN</TableHead>
                <TableHead className="text-right w-[180px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : recipes.length > 0 ? (
                recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.code}</TableCell>
                    <TableCell>{recipe.name}</TableCell>
                    <TableCell className="text-right">{recipe.yieldAmount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculateRecipePurchasePrice(recipe.ingredients))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(recipe.salePrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                         {/* Produce Button */}
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => openProduceDialog(recipe)}>
                                    <CookingPot className="h-4 w-4" />
                                    <span className="sr-only">Produzir</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Produzir Lote</p>
                            </TooltipContent>
                        </Tooltip>
                         {/* Edit Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(recipe)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Editar</p>
                            </TooltipContent>
                         </Tooltip>
                         {/* Delete Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(recipe.id, recipe.name)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Excluir</p>
                            </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                   ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma receita cadastrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       {/* Produce Batch Dialog */}
        <Dialog open={isProduceDialogOpen} onOpenChange={closeProduceDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Produzir Receita: {recipeToProduce?.name}</DialogTitle>
                    <DialogDescription>
                        Quantos lotes desta receita você deseja produzir? Isso consumirá os insumos do estoque.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="produce-quantity" className="text-left">
                        Número de Lotes
                    </Label>
                    <Input
                        id="produce-quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={produceQuantity}
                        onChange={(e) => setProduceQuantity(parseInt(e.target.value, 10) || 1)}
                        className={produceError ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                     {produceError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                             <AlertCircle className="h-4 w-4" /> {produceError}
                         </p>
                     )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={closeProduceDialog} disabled={isProducing}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleProduceBatch}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isProducing || produceQuantity <= 0}
                    >
                        {isProducing ? (
                             <>
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 Produzindo...
                             </>
                         ) : (
                            <>
                                <CookingPot className="mr-2 h-4 w-4" />
                                Confirmar Produção
                            </>
                         )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
    </TooltipProvider>
  );
}
