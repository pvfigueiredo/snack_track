
import { type UnitOfMeasure } from './product'; // Reuse UnitOfMeasure from product types

export type Insumo = {
  id: string;
  code: string; // Código do insumo
  name: string; // Nome do insumo
  purchasePrice: number; // Valor de compra
  quantity: number; // Quantidade em estoque
  unitOfMeasure: UnitOfMeasure; // Unidade de medida
};
