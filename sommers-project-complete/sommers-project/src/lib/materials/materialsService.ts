/**
 * Materials Service
 * Material estimation and cost calculation
 */

// Material coverage rates (per gallon/unit)
export const MATERIAL_COVERAGE = {
  sealcoat: { sqft_per_gallon: 80, cost_per_gallon: 25 },
  crack_filler: { linear_feet_per_gallon: 150, cost_per_gallon: 35 },
  primer: { sqft_per_gallon: 200, cost_per_gallon: 45 },
  sand: { sqft_per_lb: 10, cost_per_lb: 0.50 },
  paint_traffic: { linear_feet_per_gallon: 200, cost_per_gallon: 55 },
};

export interface MaterialEstimate {
  material: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface JobMaterialsEstimate {
  materials: MaterialEstimate[];
  totalCost: number;
  laborCost: number;
  grandTotal: number;
}

// Calculate materials for sealcoating job
export function calculateSealcoatingMaterials(
  sqft: number,
  coats: number = 2
): MaterialEstimate[] {
  const materials: MaterialEstimate[] = [];
  
  // Sealcoat
  const sealcoatGallons = Math.ceil((sqft / MATERIAL_COVERAGE.sealcoat.sqft_per_gallon) * coats);
  materials.push({
    material: 'Coal Tar Sealcoat',
    quantity: sealcoatGallons,
    unit: 'gallon',
    unitCost: MATERIAL_COVERAGE.sealcoat.cost_per_gallon,
    totalCost: sealcoatGallons * MATERIAL_COVERAGE.sealcoat.cost_per_gallon,
  });

  // Sand additive (20% of sealcoat by weight)
  const sandLbs = Math.ceil(sealcoatGallons * 2.5);
  materials.push({
    material: 'Silica Sand',
    quantity: sandLbs,
    unit: 'lb',
    unitCost: MATERIAL_COVERAGE.sand.cost_per_lb,
    totalCost: sandLbs * MATERIAL_COVERAGE.sand.cost_per_lb,
  });

  return materials;
}

// Calculate materials for crack filling
export function calculateCrackFillingMaterials(linearFeet: number): MaterialEstimate[] {
  const gallons = Math.ceil(linearFeet / MATERIAL_COVERAGE.crack_filler.linear_feet_per_gallon);

  return [{
    material: 'Hot Pour Crack Filler',
    quantity: gallons,
    unit: 'gallon',
    unitCost: MATERIAL_COVERAGE.crack_filler.cost_per_gallon,
    totalCost: gallons * MATERIAL_COVERAGE.crack_filler.cost_per_gallon,
  }];
}

// Calculate materials for line striping
export function calculateStripingMaterials(
  lines: number,
  avgLineLength: number = 18
): MaterialEstimate[] {
  const totalLinearFeet = lines * avgLineLength * 2; // 2 lines per stall
  const gallons = Math.ceil(totalLinearFeet / MATERIAL_COVERAGE.paint_traffic.linear_feet_per_gallon);

  return [{
    material: 'Traffic Paint (Yellow)',
    quantity: Math.ceil(gallons * 0.3), // 30% yellow
    unit: 'gallon',
    unitCost: MATERIAL_COVERAGE.paint_traffic.cost_per_gallon,
    totalCost: Math.ceil(gallons * 0.3) * MATERIAL_COVERAGE.paint_traffic.cost_per_gallon,
  }, {
    material: 'Traffic Paint (White)',
    quantity: Math.ceil(gallons * 0.7), // 70% white
    unit: 'gallon',
    unitCost: MATERIAL_COVERAGE.paint_traffic.cost_per_gallon,
    totalCost: Math.ceil(gallons * 0.7) * MATERIAL_COVERAGE.paint_traffic.cost_per_gallon,
  }];
}

// Calculate complete job estimate
export function calculateJobEstimate(
  sqft: number,
  crackLinearFeet: number,
  parkingLines: number,
  laborRate: number = 50
): JobMaterialsEstimate {
  const sealcoatMaterials = calculateSealcoatingMaterials(sqft);
  const crackMaterials = calculateCrackFillingMaterials(crackLinearFeet);
  const stripingMaterials = calculateStripingMaterials(parkingLines);

  const allMaterials = [...sealcoatMaterials, ...crackMaterials, ...stripingMaterials];
  const totalCost = allMaterials.reduce((sum, m) => sum + m.totalCost, 0);

  // Estimate labor hours
  const sealcoatHours = sqft / 5000; // 5000 sqft per hour with equipment
  const crackHours = crackLinearFeet / 500;
  const stripingHours = parkingLines / 20;
  const totalHours = sealcoatHours + crackHours + stripingHours + 2; // +2 for setup/cleanup

  const laborCost = totalHours * laborRate;

  return {
    materials: allMaterials,
    totalCost,
    laborCost,
    grandTotal: totalCost + laborCost,
  };
}

export default {
  MATERIAL_COVERAGE,
  calculateSealcoatingMaterials,
  calculateCrackFillingMaterials,
  calculateStripingMaterials,
  calculateJobEstimate,
};
