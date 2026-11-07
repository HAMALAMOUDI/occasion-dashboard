// What Hikayati costs: one payment per occasion, no subscription.
// Shown on the landing page and quoted in the policies.

export const CONTACT_EMAIL = "hikayati@gmail.com";

export const PLANS = {
  standard: { id: "standard", price: 189 },
  custom: { id: "custom", price: 375 },
} as const;

export type PlanId = keyof typeof PLANS;
