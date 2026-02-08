export const sharePermissions = ['view', 'edit'] as const;

/**
 * Generic permissions for shared resources.
 * - `view`: Can read the resource
 * - `edit`: Can modify the resource
 */
export type SharePermission = (typeof sharePermissions)[number];
