/**
 * Inventory Service
 * Material and product management
 */

import { supabase } from '@/lib/supabase';

export interface Material {
  id: string;
  org_id: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  coverage_rate?: number;
  coverage_unit?: string;
  supplier?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  material_id: string;
  movement_type: 'purchase' | 'usage' | 'adjustment' | 'return';
  quantity: number;
  unit_cost?: number;
  job_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

// Get materials
export async function getMaterials(orgId: string, category?: string): Promise<Material[]> {
  let query = supabase
    .from('material_products')
    .select('*')
    .eq('org_id', orgId)
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get low stock materials
export async function getLowStockMaterials(orgId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('material_products')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .filter('current_stock', 'lte', supabase.rpc('get_min_stock'));

  // Fallback: get all and filter
  const materials = await getMaterials(orgId);
  return materials.filter((m) => m.current_stock <= m.min_stock);
}

// Create material
export async function createMaterial(orgId: string, data: Partial<Material>): Promise<Material> {
  const { data: material, error } = await supabase
    .from('material_products')
    .insert({
      org_id: orgId,
      name: data.name || 'New Material',
      category: data.category || 'general',
      unit: data.unit || 'gallon',
      current_stock: 0,
      min_stock: 10,
      cost_per_unit: 0,
      is_active: true,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return material;
}

// Update material
export async function updateMaterial(materialId: string, data: Partial<Material>): Promise<Material> {
  const { data: material, error } = await supabase
    .from('material_products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', materialId)
    .select()
    .single();

  if (error) throw error;
  return material;
}

// Record stock movement
export async function recordStockMovement(
  materialId: string,
  userId: string,
  movement: Omit<StockMovement, 'id' | 'material_id' | 'created_by' | 'created_at'>
): Promise<void> {
  // Get current stock
  const { data: material } = await supabase
    .from('material_products')
    .select('current_stock')
    .eq('id', materialId)
    .single();

  if (!material) throw new Error('Material not found');

  // Calculate new stock
  let newStock = material.current_stock;
  if (movement.movement_type === 'purchase') {
    newStock += movement.quantity;
  } else if (movement.movement_type === 'usage') {
    newStock -= movement.quantity;
  } else if (movement.movement_type === 'return') {
    newStock += movement.quantity;
  } else {
    newStock = movement.quantity; // adjustment sets absolute value
  }

  // Update stock
  await supabase
    .from('material_products')
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', materialId);

  // Record movement
  await supabase.from('stock_movements').insert({
    material_id: materialId,
    created_by: userId,
    ...movement,
  });
}

// Calculate materials needed for job
export function calculateMaterialsNeeded(
  squareFeet: number,
  materials: Material[]
): Array<{ material: Material; quantityNeeded: number; cost: number }> {
  return materials
    .filter((m) => m.coverage_rate && m.coverage_rate > 0)
    .map((material) => {
      const quantityNeeded = Math.ceil(squareFeet / (material.coverage_rate || 1));
      return {
        material,
        quantityNeeded,
        cost: quantityNeeded * material.cost_per_unit,
      };
    });
}

export default {
  getMaterials,
  getLowStockMaterials,
  createMaterial,
  updateMaterial,
  recordStockMovement,
  calculateMaterialsNeeded,
};
