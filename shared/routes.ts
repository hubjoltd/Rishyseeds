
import { z } from 'zod';
import { 
  insertUserSchema, 
  insertBatchSchema, 
  insertLocationSchema, 
  insertStockEntrySchema,
  insertStockMovementSchema,
  insertPackagingOutputSchema,
  insertEmployeeSchema,
  insertAttendanceSchema,
  insertPayrollSchema,
  users,
  batches,
  locations,
  stockEntries,
  stockMovements,
  packagingOutputs,
  employees,
  attendance,
  payrolls
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === AUTH ===
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
  },

  // === DASHBOARD ===
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalStock: z.number(),
          activeBatches: z.number(),
          totalEmployees: z.number(),
          pendingPayroll: z.number(),
          lowStockBatches: z.array(z.custom<typeof batches.$inferSelect>()),
        }),
      },
    },
  },

  // === LOCATIONS ===
  locations: {
    list: {
      method: 'GET' as const,
      path: '/api/locations',
      responses: {
        200: z.array(z.custom<typeof locations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/locations',
      input: insertLocationSchema,
      responses: {
        201: z.custom<typeof locations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // === BATCHES ===
  batches: {
    list: {
      method: 'GET' as const,
      path: '/api/batches',
      responses: {
        200: z.array(z.custom<typeof batches.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/batches',
      input: insertBatchSchema,
      responses: {
        201: z.custom<typeof batches.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/batches/:id',
      input: insertBatchSchema.partial(),
      responses: {
        200: z.custom<typeof batches.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/batches/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/batches/:id',
      responses: {
        200: z.custom<typeof batches.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // === STOCK OPERATIONS ===
  stock: {
    entry: { // Stock In
      method: 'POST' as const,
      path: '/api/stock/entry',
      input: insertStockEntrySchema,
      responses: {
        201: z.custom<typeof stockEntries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    move: { // Movement
      method: 'POST' as const,
      path: '/api/stock/move',
      input: insertStockMovementSchema,
      responses: {
        201: z.custom<typeof stockMovements.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/stock/history',
      responses: {
        200: z.array(z.custom<typeof stockMovements.$inferSelect>()),
      },
    },
  },

  // === PACKAGING ===
  packaging: {
    create: {
      method: 'POST' as const,
      path: '/api/packaging',
      input: insertPackagingOutputSchema,
      responses: {
        201: z.custom<typeof packagingOutputs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/packaging',
      responses: {
        200: z.array(z.custom<typeof packagingOutputs.$inferSelect>()),
      },
    },
  },

  // === HRMS: EMPLOYEES ===
  employees: {
    list: {
      method: 'GET' as const,
      path: '/api/employees',
      responses: {
        200: z.array(z.custom<typeof employees.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/employees',
      input: insertEmployeeSchema,
      responses: {
        201: z.custom<typeof employees.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/employees/:id',
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // === HRMS: ATTENDANCE ===
  attendance: {
    mark: {
      method: 'POST' as const,
      path: '/api/attendance',
      input: insertAttendanceSchema,
      responses: {
        201: z.custom<typeof attendance.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/attendance',
      input: z.object({ date: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect>()),
      },
    },
  },

  // === PAYROLL ===
  payroll: {
    generate: {
      method: 'POST' as const,
      path: '/api/payroll/generate',
      input: z.object({ month: z.string(), employeeId: z.number().optional() }), // Generate for all or one
      responses: {
        201: z.array(z.custom<typeof payrolls.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/payroll',
      responses: {
        200: z.array(z.custom<typeof payrolls.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Re-export types from schema for convenience
export type { 
  User, InsertUser,
  Batch, InsertBatch,
  Location, InsertLocation,
  Employee, InsertEmployee,
  Payroll, InsertPayroll,
  StockMovement, InsertStockMovement,
  CreateStockMovementRequest,
  CreatePackagingOutputRequest
} from './schema';

// Inline attendance type
export type InsertAttendance = {
  employeeId: number;
  date: string;
  status: string;
  shift?: string;
  checkIn?: string;
  checkOut?: string;
};
