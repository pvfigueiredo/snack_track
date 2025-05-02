
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Use next/navigation
import { useTables } from '@/hooks/useTables';
import type { Table } from '@/types/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, Trash2, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function VendasPage() {
  const { tables, isLoading, addTable, deleteTable } = useTables();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState<number | ''>('');
  const [addTableError, setAddTableError] = useState<string | null>(null);


  const handleTableClick = (tableId: string) => {
    router.push(`/vendas/${tableId}`);
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'occupied':
        return 'border-primary text-primary'; // Orange border/text
      case 'reserved':
        return 'border-yellow-500 text-yellow-500'; // Yellow border/text
      case 'available':
      default:
        return 'border-accent text-accent'; // Green border/text
    }
  };

   const handleAddTable = () => {
        if (newTableNumber === '' || newTableNumber <= 0) {
            setAddTableError("Número da mesa inválido.");
            return;
        }
        try {
            addTable(newTableNumber);
            toast({
                title: "Sucesso!",
                description: `Mesa ${newTableNumber} adicionada.`,
            });
            closeAddDialog();
        } catch (error: any) {
            console.error("Erro ao adicionar mesa:", error);
            setAddTableError(error.message || "Erro ao adicionar mesa.");
             toast({
                title: "Erro!",
                description: error.message || "Não foi possível adicionar a mesa.",
                variant: "destructive",
            });
        }
   };

   const handleDeleteTable = (tableId: string, tableNumber: number) => {
        try {
            deleteTable(tableId);
            toast({
                title: "Sucesso!",
                description: `Mesa ${tableNumber} excluída.`,
                 variant: "destructive",
            });
        } catch (error: any) {
             console.error("Erro ao excluir mesa:", error);
             toast({
                title: "Erro!",
                description: error.message || "Não foi possível excluir a mesa.",
                variant: "destructive",
            });
        }
   };


   const closeAddDialog = () => {
       setIsAddDialogOpen(false);
       setNewTableNumber('');
       setAddTableError(null);
   }

  return (
     <TooltipProvider>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gerenciamento de Mesas</h1>
                 {/* Add Table Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-accent hover:bg-accent/90">
                        <PlusCircle className="mr-2 h-4 w-4" /> Nova Mesa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" onInteractOutside={closeAddDialog}>
                        <DialogHeader>
                        <DialogTitle>Adicionar Nova Mesa</DialogTitle>
                        <DialogDescription>
                            Digite o número da nova mesa.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="table-number" className="text-right">
                            Número
                            </Label>
                            <Input
                                id="table-number"
                                type="number"
                                value={newTableNumber}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewTableNumber(val === '' ? '' : parseInt(val, 10));
                                    setAddTableError(null); // Clear error on change
                                }}
                                className={`col-span-3 ${addTableError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                min="1"
                            />
                        </div>
                         {addTableError && <p className="text-sm text-destructive col-span-4 text-center">{addTableError}</p>}
                        </div>
                        <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={closeAddDialog}>
                                Cancelar
                            </Button>
                         </DialogClose>
                        <Button type="button" onClick={handleAddTable} className="bg-accent hover:bg-accent/90">Adicionar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                    <Card key={`skel-${index}`} className="relative flex flex-col items-center justify-center aspect-square p-4 border-dashed border-muted">
                         <Skeleton className="h-10 w-10 mb-2 rounded-full" />
                         <Skeleton className="h-6 w-16" />
                    </Card>
                ))}
                </div>
            ) : tables.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tables.map((table) => (
                    <Card
                        key={table.id}
                        onClick={() => handleTableClick(table.id)}
                        className={`relative flex flex-col items-center justify-center aspect-square p-4 cursor-pointer transition-all duration-150 ease-in-out hover:shadow-lg hover:scale-105 group ${getStatusColor(table.status)} bg-card`}
                    >
                     {/* Delete Button */}
                     <Dialog>
                        <DialogTrigger asChild>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={(e) => e.stopPropagation()} // Prevent card click
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Excluir Mesa</span>
                                    </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                    <p>Excluir Mesa {table.number}</p>
                                 </TooltipContent>
                              </Tooltip>
                        </DialogTrigger>
                         <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Confirmar Exclusão</DialogTitle>
                                <DialogDescription>
                                    Tem certeza que deseja excluir a Mesa {table.number}?
                                    {table.order.length > 0 && <span className="block text-destructive font-semibold mt-2"><AlertCircle className="inline h-4 w-4 mr-1"/>Esta mesa tem uma comanda ativa!</span>}
                                </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.number); }}>
                                    Excluir
                                    </Button>
                                </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                     </Dialog>


                        <Utensils className={`h-10 w-10 mb-2 ${table.status === 'occupied' ? 'text-primary' : table.status === 'reserved' ? 'text-yellow-500' : 'text-accent'}`} />
                        <span className="text-xl font-bold text-foreground">Mesa {table.number}</span>
                        <span className="text-sm capitalize text-muted-foreground">{table.status === 'available' ? 'Livre' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}</span>
                    </Card>
                ))}
                </div>
            ) : (
                 <Card className="col-span-full flex flex-col items-center justify-center py-12 border-dashed border-muted">
                    <CardHeader>
                        <CardTitle className="text-center text-muted-foreground">Nenhuma Mesa Cadastrada</CardTitle>
                         <CardDescription className="text-center text-muted-foreground">
                            Clique em "Nova Mesa" para começar.
                         </CardDescription>
                    </CardHeader>
                     <CardContent>
                          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-accent hover:bg-accent/90">
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Primeira Mesa
                                </Button>
                            </DialogTrigger>
                            {/* Reuse the same DialogContent as above */}
                            <DialogContent className="sm:max-w-[425px]" onInteractOutside={closeAddDialog}>
                                <DialogHeader>
                                <DialogTitle>Adicionar Nova Mesa</DialogTitle>
                                <DialogDescription>
                                    Digite o número da nova mesa.
                                </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="table-number-modal" className="text-right">
                                    Número
                                    </Label>
                                    <Input
                                        id="table-number-modal" // Different ID for modal input
                                        type="number"
                                        value={newTableNumber}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewTableNumber(val === '' ? '' : parseInt(val, 10));
                                            setAddTableError(null); // Clear error on change
                                        }}
                                        className={`col-span-3 ${addTableError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                        min="1"
                                    />
                                </div>
                                {addTableError && <p className="text-sm text-destructive col-span-4 text-center">{addTableError}</p>}
                                </div>
                                <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary" onClick={closeAddDialog}>
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button type="button" onClick={handleAddTable} className="bg-accent hover:bg-accent/90">Adicionar</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                     </CardContent>
                </Card>
            )}
        </div>
    </TooltipProvider>
  );
}
