
'use client';

import React, { useState, useMemo } from 'react';
import { useSalesHistory, type SalesPeriod } from '@/hooks/useSalesHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, CalendarDays, BarChart, TrendingUp, Package } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/dateUtils';

export default function SalesReportPage() {
  const { salesHistory, isLoading, getSalesByPeriod, calculateTotalSales, getTopSellingProducts } = useSalesHistory();
  const [activePeriod, setActivePeriod] = useState<SalesPeriod>('day');

  const handlePeriodChange = (period: string) => {
    setActivePeriod(period as SalesPeriod);
  };

  const filteredSales = useMemo(() => getSalesByPeriod(activePeriod), [getSalesByPeriod, activePeriod]);
  const totalSalesAmount = useMemo(() => calculateTotalSales(activePeriod), [calculateTotalSales, activePeriod]);
  const topProducts = useMemo(() => getTopSellingProducts(activePeriod, 5), [getTopSellingProducts, activePeriod]);

  const renderSkeletons = (count: number) => (
    Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
      </TableRow>
    ))
  );

  const renderTopProductSkeletons = (count: number) => (
     Array.from({ length: count }).map((_, index) => (
        <li key={`top-skel-${index}`} className="flex justify-between items-center py-1">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-1/5" />
        </li>
     ))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
         <BarChart className="h-8 w-8 text-primary" /> Relatório de Vendas
      </h1>

      <Tabs defaultValue="day" onValueChange={handlePeriodChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="day">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="all">Total</TabsTrigger>
        </TabsList>

        {/* Content for each tab */}
        {(['day', 'week', 'month', 'all'] as SalesPeriod[]).map((period) => (
          <TabsContent key={period} value={period}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Summary Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendas ({period === 'day' ? 'Hoje' : period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Total'})</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                             <Skeleton className="h-8 w-32" />
                        ) : (
                            <div className="text-2xl font-bold">{formatCurrency(totalSalesAmount)}</div>
                        )}
                         <p className="text-xs text-muted-foreground">
                            {isLoading ? <Skeleton className="h-3 w-24 mt-1" /> : `Total de ${filteredSales.length} vendas no período`}
                        </p>
                    </CardContent>
                </Card>

                 {/* Top Selling Products Card */}
                 <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produtos Mais Vendidos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                     <CardContent>
                        {isLoading ? (
                            <ul className="space-y-2">{renderTopProductSkeletons(3)}</ul>
                        ) : topProducts.length > 0 ? (
                            <ul className="space-y-1">
                            {topProducts.map(prod => (
                                <li key={prod.name} className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground"/>
                                        {prod.name}
                                    </span>
                                    <span className="font-semibold">{prod.quantity}</span>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda registrada no período.</p>
                        )}
                    </CardContent>
                 </Card>
            </div>

            {/* Sales History Table Card */}
             <Card className="mt-6 col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" /> Histórico de Vendas
                    </CardTitle>
                    <CardDescription>Detalhes das vendas realizadas no período selecionado.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <ScrollArea className="h-[400px] w-full"> {/* Adjust height as needed */}
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[180px]">Data/Hora</TableHead>
                                <TableHead className="w-[100px]">Mesa</TableHead>
                                <TableHead className="text-right w-[120px]">Valor Total</TableHead>
                                <TableHead>Itens</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {isLoading ? (
                                renderSkeletons(5)
                            ) : filteredSales.length > 0 ? (
                                filteredSales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">{formatDate(sale.timestamp)}</TableCell>
                                    <TableCell>{sale.tableNumber}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                                    <TableCell>
                                        <ul className="list-disc list-inside text-xs">
                                            {sale.items.map(item => (
                                                <li key={item.id}>{item.quantity}x {item.name}</li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhuma venda registrada neste período.
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
