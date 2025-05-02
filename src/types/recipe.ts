
import type { Insumo } from './insumo';

/**
 * Represents an ingredient used in a recipe, linking to an Insumo.
 */
export type RecipeIngredient = {
  insumoId: string; // ID of the Insumo used
  quantity: number; // Quantity of the Insumo needed for one batch of the recipe
};

/**
 * Represents a recipe for creating a product.
 */
export type Recipe = {
  id: string; // Unique ID for the recipe
  code: string; // Unique code for the recipe (will also be the product code)
  name: string; // Name of the recipe (will also be the product name)
  yieldAmount: number; // How many units of the product this recipe produces per batch
  yieldUnit: 'UN'; // Unit of the yield (currently fixed to 'UN')
  ingredients: RecipeIngredient[]; // List of ingredients and their quantities
  batchesMade: number; // How many times this recipe has been prepared
  salePrice: number; // Selling price for ONE unit of the resulting product
  // purchasePrice will be calculated based on ingredient costs
};
