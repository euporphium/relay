import type { z } from 'zod';

/**
 * Extracts a field's schema from a Zod object schema for use in field-level validation.
 * Preserves all modifiers (optional, nullable, transform, etc.) from the original schema.
 */
export function getFieldValidator<T extends z.ZodObject<any>>(
  formSchema: T,
  fieldName: keyof z.infer<T>,
) {
  return formSchema.shape[fieldName];
}
