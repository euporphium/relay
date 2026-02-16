export const shareInvitationStatuses = [
  'pending',
  'accepted',
  'rejected',
  'revoked',
  'left',
] as const;

export type ShareInvitationStatus = (typeof shareInvitationStatuses)[number];
