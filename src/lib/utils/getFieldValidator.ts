import type { z } from 'zod';

/**
 * Extracts a field's schema from a Zod object schema for use in field-level validation.
 * Preserves all modifiers (optional, nullable, transform, etc.) from the original schema.
 */
export function getFieldValidator<S extends z.ZodRawShape, K extends keyof S>(
  formSchema: z.ZodObject<S>,
  fieldName: K,
) {
  return formSchema.shape[fieldName];
}
