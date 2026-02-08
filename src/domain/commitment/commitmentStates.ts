export const commitmentStates = [
  'active',
  'fulfilled',
  'released',
] as const;

export type CommitmentState = (typeof commitmentStates)[number];
