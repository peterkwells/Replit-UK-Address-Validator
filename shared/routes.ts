import { z } from 'zod';
import { insertValidationSchema, validations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  validations: {
    create: {
      method: 'POST' as const,
      path: '/api/validations' as const,
      input: insertValidationSchema,
      responses: {
        200: z.custom<typeof validations.$inferSelect>(), // Returns the saved validation record
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/validations' as const,
      responses: {
        200: z.array(z.custom<typeof validations.$inferSelect>()),
      },
    },
  },
};
