
// Define allowed units of measure
export const unitsOfMeasure = ["UN", "KG", "LT", "CX", "PC", "MT"] as const;
export type UnitOfMeasure = typeof unitsOfMeasure[number];


export type Product = {
  id: string;
  code: string; // Código do produto
  name: string; // Nome do produto
  purchasePrice: number; // Valor de compra
  salePrice: number; // Valor de venda (replaces 'price')
  quantity: number; // Quantidade em estoque (for recipes, this might be calculated)
  unitOfMeasure: UnitOfMeasure; // Unidade de medida
  recipeId?: string; // Optional: Link to the Recipe ID if this product is generated from a recipe
};
