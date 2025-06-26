// Romanian tax constants for 2024
export const TAX_CONSTANTS_2024 = {
  // Personal deduction - 3000 RON annually
  PERSONAL_DEDUCTION_ANNUAL: 3000,
  
  // Income tax rate - 10%
  INCOME_TAX_RATE: 0.10,
  
  // Health insurance rate - 10%
  HEALTH_INSURANCE_RATE: 0.10,
  
  // Social insurance rate - 25%
  SOCIAL_INSURANCE_RATE: 0.25,
  
  // Social insurance ceiling - maximum annual income subject to social insurance
  SOCIAL_INSURANCE_CEILING: 132000, // RON for 2024
} as const;

// Type for tax constants
export type TaxConstants = typeof TAX_CONSTANTS_2024;