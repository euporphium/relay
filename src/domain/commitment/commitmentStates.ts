export const commitmentStates = ['active', 'fulfilled', 'released'] as const;

/**
 * Lifecycle status for a commitment.
 * - `active`: Ongoing commitment that is still in progress
 * - `fulfilled`: Commitment that has been completed
 * - `released`: Commitment that has been intentionally let go
 */
export type CommitmentState = (typeof commitmentStates)[number];
