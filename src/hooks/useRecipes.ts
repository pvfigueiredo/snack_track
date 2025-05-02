
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Recipe, RecipeIngredient } from '@/types/recipe';
import type { Insumo } from '@/types/insumo';
import type { Product } from '@/types/product';
import { loadRecipesFromStorage, saveRecipesToStorage } from '@/lib/storage';
import { useInsumos } from './useInsumos'; // Need insumos for cost calculation and validation
import { useProducts } from './useProducts'; // Need products to manage derived products

// Function to generate a simple unique ID for recipes
const generateRecipeId = (): string => `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { insumos, getInsumoById: getInsumoDataById, isLoading: isLoadingInsumos, updateInsumo: decreaseInsumoStock } = useInsumos();
  const { products, addProduct: addProductToHook, updateProduct: updateProductInHook, deleteProduct: deleteProductFromHook, getProductByCode: getProductDataByCode, isLoading: isLoadingProducts } = useProducts();

  // Load recipes from storage on initial mount
  useEffect(() => {
    const loadedRecipes = loadRecipesFromStorage();
    setRecipes(loadedRecipes);
    setIsLoading(false); // Set loading to false after recipes are loaded
  }, []);

  // Save recipes to storage whenever the recipes state changes
  useEffect(() => {
    if (!isLoading) {
      saveRecipesToStorage(recipes);
    }
  }, [recipes, isLoading]);

  // Calculate purchase price for a recipe based on its ingredients
  const calculateRecipePurchasePrice = useCallback((ingredients: RecipeIngredient[]): number => {
    let totalCost = 0;
    for (const ingredient of ingredients) {
      const insumo = getInsumoDataById(ingredient.insumoId);
      if (insumo) {
        // Assuming purchasePrice is per unitOfMeasure
        totalCost += insumo.purchasePrice * ingredient.quantity;
      } else {
        console.warn(`Insumo with ID ${ingredient.insumoId} not found for cost calculation.`);
        // Handle error? Maybe return NaN or throw? For now, just skip.
      }
    }
    return totalCost;
  }, [getInsumoDataById]);

    // Add a new recipe and automatically create/update the corresponding product
    const addRecipe = useCallback((newRecipeData: Omit<Recipe, 'id' | 'batchesMade' | 'code'> & { code: string }) => {
        setIsLoading(true); // Indicate loading state
        setRecipes((prevRecipes) => {
            // Ensure recipe code uniqueness
            if (prevRecipes.some(r => r.code === newRecipeData.code)) {
                throw new Error(`Código de receita ${newRecipeData.code} já existe.`);
            }
            // Ensure the code doesn't conflict with existing non-recipe products
             const existingProduct = getProductDataByCode(newRecipeData.code);
             if (existingProduct && !existingProduct.recipeId) {
                 throw new Error(`Código ${newRecipeData.code} já existe como um produto não derivado de receita.`);
             }


            const newRecipe: Recipe = {
                ...newRecipeData,
                id: generateRecipeId(),
                batchesMade: 0, // Start with 0 batches made
                yieldUnit: 'UN', // Fixed yield unit
            };

            const purchasePricePerBatch = calculateRecipePurchasePrice(newRecipe.ingredients);
            const purchasePricePerUnit = newRecipe.yieldAmount > 0 ? purchasePricePerBatch / newRecipe.yieldAmount : 0;

            const productData: Omit<Product, 'id'> = {
                code: newRecipe.code,
                name: newRecipe.name,
                purchasePrice: purchasePricePerUnit,
                salePrice: newRecipe.salePrice, // Sale price per unit
                quantity: 0, // Initial quantity is 0
                unitOfMeasure: 'UN',
                recipeId: newRecipe.id, // Link product to the recipe
            };

             try {
                 // Check if a product derived from this recipe code already exists
                 if (existingProduct && existingProduct.recipeId) {
                      // Update existing derived product
                     updateProductInHook({...existingProduct, ...productData});
                 } else {
                      // Add new derived product
                      addProductToHook(productData);
                 }
             } catch (productError: any) {
                 console.error("Erro ao adicionar/atualizar produto derivado:", productError);
                 // Handle product addition error (e.g., show toast), maybe revert recipe add?
                 throw new Error(`Erro ao criar produto associado: ${productError.message}`);
             }


            setIsLoading(false); // Loading finished
            return [...prevRecipes, newRecipe];
        });
    }, [calculateRecipePurchasePrice, addProductToHook, updateProductInHook, getProductDataByCode]);



  // Update an existing recipe (ingredients, yield, name, salePrice) and its corresponding product
  const updateRecipe = useCallback((updatedRecipe: Recipe) => {
    setIsLoading(true);
    setRecipes((prevRecipes) => {
      const originalRecipe = prevRecipes.find(r => r.id === updatedRecipe.id);
       if (!originalRecipe) {
          setIsLoading(false);
          throw new Error("Receita original não encontrada para atualização.");
       }

      // Check if code is being changed and if it conflicts
       if (originalRecipe.code !== updatedRecipe.code) {
            if (prevRecipes.some(r => r.id !== updatedRecipe.id && r.code === updatedRecipe.code)) {
                setIsLoading(false);
                throw new Error(`Código de receita ${updatedRecipe.code} já existe.`);
            }
             const existingProduct = getProductDataByCode(updatedRecipe.code);
             if (existingProduct && (!existingProduct.recipeId || existingProduct.recipeId !== updatedRecipe.id)) {
                  setIsLoading(false);
                 throw new Error(`Código ${updatedRecipe.code} já existe como um produto não derivado desta receita.`);
             }
       }


      const updatedRecipes = prevRecipes.map((recipe) =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      );

      // Recalculate purchase price and update the corresponding product
      const purchasePricePerBatch = calculateRecipePurchasePrice(updatedRecipe.ingredients);
      const purchasePricePerUnit = updatedRecipe.yieldAmount > 0 ? purchasePricePerBatch / updatedRecipe.yieldAmount : 0;
      const productQuantity = updatedRecipe.batchesMade * updatedRecipe.yieldAmount;

      const productToUpdate = products.find(p => p.recipeId === updatedRecipe.id);

      if (productToUpdate) {
          try {
              updateProductInHook({
                  ...productToUpdate,
                  code: updatedRecipe.code, // Update code if changed
                  name: updatedRecipe.name,
                  purchasePrice: purchasePricePerUnit,
                  salePrice: updatedRecipe.salePrice,
                  quantity: productQuantity, // Update quantity based on batchesMade
                  unitOfMeasure: 'UN', // Keep as UN
              });
          } catch (productError: any) {
             console.error("Erro ao atualizar produto derivado:", productError);
              // Handle product update error
             // Potentially revert recipe update if product update fails critically?
             // For now, we let the recipe update proceed but log the error.
             // throw new Error(`Erro ao atualizar produto associado: ${productError.message}`);
          }
      } else if (originalRecipe.code !== updatedRecipe.code) {
           // If code changed and product didn't exist under old code,
           // try to find product by old code and update its code/recipeId or delete old / create new
           const productWithOldCode = products.find(p => p.code === originalRecipe.code && p.recipeId === originalRecipe.id);
           if (productWithOldCode) {
                // Delete the old product entry (associated with the old code)
                try {
                    deleteProductFromHook(productWithOldCode.id);
                } catch (deleteError: any) {
                     console.error("Erro ao remover produto com código antigo:", deleteError);
                     // Decide how to proceed - maybe prevent the recipe code change?
                }
           }
            // Create a new product entry with the new code
           const productData: Omit<Product, 'id'> = {
                code: updatedRecipe.code,
                name: updatedRecipe.name,
                purchasePrice: purchasePricePerUnit,
                salePrice: updatedRecipe.salePrice,
                quantity: productQuantity,
                unitOfMeasure: 'UN',
                recipeId: updatedRecipe.id,
           };
           try {
                addProductToHook(productData);
           } catch (addError: any) {
                console.error("Erro ao criar novo produto com código atualizado:", addError);
                // Revert recipe code change?
                // throw new Error(`Erro ao criar produto associado com novo código: ${addError.message}`);
           }

      }
      else {
         console.warn(`Produto correspondente à receita ${updatedRecipe.name} não encontrado para atualização.`);
         // Product might have been deleted manually, maybe try creating it again?
          const productData: Omit<Product, 'id'> = {
                code: updatedRecipe.code,
                name: updatedRecipe.name,
                purchasePrice: purchasePricePerUnit,
                salePrice: updatedRecipe.salePrice,
                quantity: productQuantity,
                unitOfMeasure: 'UN',
                recipeId: updatedRecipe.id,
           };
           try {
                addProductToHook(productData);
            } catch (addError: any) {
                 console.error("Erro ao recriar produto associado:", addError);
            }
      }

      setIsLoading(false);
      return updatedRecipes;
    });
  }, [calculateRecipePurchasePrice, updateProductInHook, products, getProductDataByCode, addProductToHook, deleteProductFromHook]);


  // Delete a recipe and its corresponding product
    const deleteRecipe = useCallback((recipeId: string) => {
        setIsLoading(true);
        const recipeToDelete = recipes.find(r => r.id === recipeId);
        if (!recipeToDelete) {
             setIsLoading(false);
            throw new Error("Receita não encontrada para exclusão.");
        }

        setRecipes((prevRecipes) => prevRecipes.filter((recipe) => recipe.id !== recipeId));

        // Find and delete the associated product
        const productToDelete = products.find(p => p.recipeId === recipeId);
        if (productToDelete) {
             try {
                deleteProductFromHook(productToDelete.id);
             } catch (productError: any) {
                  console.error("Erro ao excluir produto derivado:", productError);
                  // Maybe add the recipe back if product deletion fails? Or just log.
                  // Consider implications if the product is in active orders etc.
                  // For now, just log the error.
             }
        } else {
            console.warn(`Produto correspondente à receita ${recipeToDelete.name} não encontrado para exclusão.`);
        }
        setIsLoading(false);
    }, [recipes, products, deleteProductFromHook]);

  // "Produce" a batch of a recipe: decrease insumo stock, increase recipe batchesMade, update product quantity
  const produceRecipeBatch = useCallback((recipeId: string, numberOfBatches: number = 1) => {
    setIsLoading(true);
    setRecipes((prevRecipes) => {
      const recipeToProduce = prevRecipes.find(r => r.id === recipeId);
      if (!recipeToProduce) {
        setIsLoading(false);
        throw new Error("Receita não encontrada para produção.");
      }
      if (numberOfBatches <= 0) {
         setIsLoading(false);
         throw new Error("Número de lotes deve ser positivo.");
      }

      const requiredInsumos: { insumo: Insumo, requiredQty: number }[] = [];
      let canProduce = true;

      // 1. Check stock availability for all ingredients
      for (const ingredient of recipeToProduce.ingredients) {
        const insumo = getInsumoDataById(ingredient.insumoId);
        const requiredQty = ingredient.quantity * numberOfBatches;
        if (!insumo) {
          canProduce = false;
          setIsLoading(false);
          throw new Error(`Insumo ID ${ingredient.insumoId} não encontrado.`);
        }
        if (insumo.quantity < requiredQty) {
          canProduce = false;
          setIsLoading(false);
          throw new Error(`Estoque insuficiente para ${insumo.name}. Necessário: ${requiredQty}, Disponível: ${insumo.quantity}`);
        }
        requiredInsumos.push({ insumo, requiredQty });
      }

      if (!canProduce) {
        // Error already thrown, just return previous state
        return prevRecipes;
      }

      // 2. Decrease Insumo Stock
      try {
        requiredInsumos.forEach(({ insumo, requiredQty }) => {
           decreaseInsumoStock({ ...insumo, quantity: insumo.quantity - requiredQty });
        });
      } catch (insumoError: any) {
          console.error("Erro ao atualizar estoque de insumo:", insumoError);
          // !!! Rollback potentially needed here if some insumos were updated before error
          setIsLoading(false);
          throw new Error(`Erro ao diminuir estoque de insumo: ${insumoError.message}`);
          // For simplicity, we don't implement rollback now.
      }


      // 3. Update Recipe's batchesMade
      const updatedRecipe = {
        ...recipeToProduce,
        batchesMade: recipeToProduce.batchesMade + numberOfBatches,
      };
      const updatedRecipes = prevRecipes.map(r => r.id === recipeId ? updatedRecipe : r);


      // 4. Update Product Quantity
      const productToUpdate = products.find(p => p.recipeId === recipeId);
      if (productToUpdate) {
          try {
            updateProductInHook({
                ...productToUpdate,
                quantity: updatedRecipe.batchesMade * updatedRecipe.yieldAmount,
            });
          } catch(productError: any) {
               console.error("Erro ao atualizar quantidade do produto derivado:", productError);
               // !!! Rollback potentially needed here (recipe batches, insumo stock)
                setIsLoading(false);
               throw new Error(`Erro ao atualizar estoque do produto: ${productError.message}`);
               // For simplicity, we don't implement rollback now.
          }
      } else {
         console.error(`Produto associado à receita ${recipeToProduce.name} não encontrado durante a produção.`);
         // Maybe attempt to create the product here?
          setIsLoading(false);
         throw new Error(`Produto associado não encontrado.`); // Throw error if product missing
      }

      setIsLoading(false);
      return updatedRecipes;
    });
  }, [getInsumoDataById, decreaseInsumoStock, products, updateProductInHook]);

   const getRecipeById = useCallback((recipeId: string): Recipe | undefined => {
    return recipes.find((recipe) => recipe.id === recipeId);
  }, [recipes]);

  const getRecipeByCode = useCallback((recipeCode: string): Recipe | undefined => {
    return recipes.find((recipe) => recipe.code === recipeCode);
  }, [recipes]);

  const isLoadingCombined = isLoading || isLoadingInsumos || isLoadingProducts;


  return {
    recipes,
    isLoading: isLoadingCombined,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    produceRecipeBatch,
    getRecipeById,
    getRecipeByCode,
    calculateRecipePurchasePrice,
  };
};
