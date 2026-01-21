
import { pgTable, text, serial, integer, boolean, timestamp, date, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS & AUTH ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Will be hashed
  role: text("role").notNull().default("admin"), // admin, manager, hr
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// === LOCATIONS ===
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // storage, packaging, processing, sale
  capacity: integer("capacity"), // Optional
  address: text("address"),
  isActive: boolean("is_active").default(true),
});

export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });

// === BATCHES (SEED STOCK) ===
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull().unique(),
  crop: text("crop").notNull(),
  variety: text("variety").notNull(),
  lotSize: decimal("lot_size").notNull(), // Quantity in KG
  productionDate: date("production_date"),
  currentQuantity: decimal("current_quantity").notNull(), // Track current stock
  status: text("status").default("active"), // active, empty
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBatchSchema = createInsertSchema(batches).omit({ id: true, currentQuantity: true, createdAt: true });

// === STOCK ENTRIES (INWARD) ===
export const stockEntries = pgTable("stock_entries", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(), // Link to batch
  locationId: integer("location_id").notNull(), // Where it entered
  quantity: decimal("quantity").notNull(),
  entryDate: date("entry_date").defaultNow(),
  responsiblePerson: text("responsible_person"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStockEntrySchema = createInsertSchema(stockEntries).omit({ id: true, createdAt: true });

// === STOCK MOVEMENTS (STORAGE -> PACKAGING) ===
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  fromLocationId: integer("from_location_id").notNull(),
  toLocationId: integer("to_location_id").notNull(),
  quantity: decimal("quantity").notNull(),
  movementDate: date("movement_date").defaultNow(),
  responsiblePerson: text("responsible_person"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });

// === PACKAGING OUTPUTS ===
export const packagingOutputs = pgTable("packaging_outputs", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  packetSize: text("packet_size").notNull(), // e.g., "1kg", "500g"
  numberOfPackets: integer("number_of_packets").notNull(),
  wasteQuantity: decimal("waste_quantity").default("0"),
  productionDate: date("production_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPackagingOutputSchema = createInsertSchema(packagingOutputs).omit({ id: true, createdAt: true });

// === HRMS: EMPLOYEES ===
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // designation
  department: text("department"),
  workLocation: text("work_location"),
  salaryType: text("salary_type").notNull(), // monthly, daily
  basicSalary: decimal("basic_salary").notNull(),
  status: text("status").default("active"),
  joinDate: date("join_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });

// === HRMS: ATTENDANCE ===
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, half_day
  shift: text("shift"), // day, night, packaging
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });

// === PAYROLL ===
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  month: text("month").notNull(), // YYYY-MM
  totalDays: integer("total_days").notNull(),
  presentDays: decimal("present_days").notNull(),
  basicPay: decimal("basic_pay").notNull(),
  allowances: decimal("allowances").default("0"),
  overtimeAmount: decimal("overtime_amount").default("0"),
  deductions: decimal("deductions").default("0"),
  netSalary: decimal("net_salary").notNull(),
  status: text("status").default("generated"), // generated, paid
  generatedDate: date("generated_date").defaultNow(),
});

export const insertPayrollSchema = createInsertSchema(payrolls).omit({ id: true, generatedDate: true });

// === RELATIONS ===
// (Simplified relations for now, can be expanded)

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

// API TYPES
export type CreateStockMovementRequest = InsertStockMovement;
export type CreatePackagingOutputRequest = z.infer<typeof insertPackagingOutputSchema>;

// === PRODUCTS / CROPS MASTER ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  variety: text("variety").notNull(),
  type: text("type").notNull().default("notified"), // notified, private_research
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Analytics Response Types
export interface DashboardStats {
  totalStock: number;
  activeBatches: number;
  totalEmployees: number;
  monthlyPayroll: number;
}
