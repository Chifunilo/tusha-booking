export const MEAL_PLANS = [
  { value: 'room_only', label: 'Room only', detail: 'No meals included' },
  { value: 'bed_breakfast', label: 'Bed & breakfast', detail: 'Breakfast included' },
  { value: 'half_board', label: 'Half board', detail: 'Breakfast and dinner included' },
  { value: 'full_board', label: 'Full board', detail: 'All meals included' },
] as const;

export type MealPlan = (typeof MEAL_PLANS)[number]['value'];
export type Residency = 'resident' | 'non_resident';

export function mealPlanLabel(value: string | null | undefined): string {
  return MEAL_PLANS.find((m) => m.value === value)?.label ?? 'Room only';
}

export function formatZMW(amount: number | string): string {
  return `ZMW ${Number(amount).toLocaleString()}`;
}
