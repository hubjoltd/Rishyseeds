
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
export const userRoleEnum = z.enum(["admin", "manager", "hr", "godown_operator", "production_operator", "dispatch_operator"]);
export const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleEnum,
  fullName: z.string().optional(),
});
export const updateUserSchema = z.object({
  password: z.string().min(6).optional(),
  role: userRoleEnum.optional(),
  fullName: z.string().optional(),
});

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

// === PACKAGING SIZES MASTER ===
export const packagingSizes = pgTable("packaging_sizes", {
  id: serial("id").primaryKey(),
  size: decimal("size").notNull(), // e.g., 10, 25, 50
  unit: text("unit").notNull().default("Kg"), // Kg, g
  label: text("label").notNull(), // e.g., "10 Kg", "500 g"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPackagingSizeSchema = createInsertSchema(packagingSizes).omit({ id: true, createdAt: true });
export type PackagingSize = typeof packagingSizes.$inferSelect;
export type InsertPackagingSize = typeof packagingSizes.$inferInsert;

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
  batchId: integer("batch_id"), // Legacy field - deprecated
  lotId: integer("lot_id"), // Reference to lots table
  packagingSizeId: integer("packaging_size_id"), // Reference to packaging_sizes table
  packetSize: text("packet_size").notNull(), // e.g., "1kg", "500g"
  numberOfPackets: integer("number_of_packets").notNull(),
  totalQuantityKg: decimal("total_quantity_kg"), // Total packed quantity in KG
  wasteQuantity: decimal("waste_quantity").default("0"),
  productionDate: date("production_date").defaultNow(),
  packedBy: text("packed_by"),
  remarks: text("remarks"),
  createdBy: integer("created_by"),
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
  hra: decimal("hra").default("0"), // House Rent Allowance
  da: decimal("da").default("0"), // Dearness Allowance
  travelAllowance: decimal("travel_allowance").default("0"),
  medicalAllowance: decimal("medical_allowance").default("0"),
  otherAllowances: decimal("other_allowances").default("0"),
  pfDeduction: decimal("pf_deduction").default("0"), // Provident Fund
  esiDeduction: decimal("esi_deduction").default("0"), // ESI
  tdsDeduction: decimal("tds_deduction").default("0"), // TDS
  otherDeductions: decimal("other_deductions").default("0"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  ifscCode: text("ifsc_code"),
  panNumber: text("pan_number"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
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

export type PackagingOutput = typeof packagingOutputs.$inferSelect;
export type InsertPackagingOutput = z.infer<typeof insertPackagingOutputSchema>;

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

// === LOTS (INWARD STOCK WITH AUTO-GENERATED LOT NUMBERS) ===
export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  lotNumber: text("lot_number").notNull().unique(), // Auto-generated: CROP-VARIETY-YYYYMMDD-XXX
  productId: integer("product_id").notNull(), // Reference to products table
  sourceType: text("source_type").notNull(), // inward, processing_output
  sourceReferenceId: integer("source_reference_id"), // Optional link to processing record
  sourceName: text("source_name"), // Supplier/Party name (optional)
  initialQuantity: decimal("initial_quantity").notNull(), // Quantity in KG
  quantityUnit: text("quantity_unit").notNull().default("kg"), // kg, tons
  stockForm: text("stock_form").notNull().default("loose"), // loose, packed
  status: text("status").notNull().default("active"), // active, exhausted, expired
  inwardDate: date("inward_date").defaultNow(),
  expiryDate: date("expiry_date"),
  remarks: text("remarks"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLotSchema = createInsertSchema(lots).omit({ id: true, createdAt: true });

export type Lot = typeof lots.$inferSelect;
export type InsertLot = z.infer<typeof insertLotSchema>;

// === STOCK BALANCES (LOT-WISE, LOCATION-WISE TRACKING) ===
export const stockBalances = pgTable("stock_balances", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull(),
  locationId: integer("location_id").notNull(),
  stockForm: text("stock_form").notNull().default("loose"), // loose, packed
  packetSize: text("packet_size"), // Only for packed: 1kg, 500g, etc.
  quantity: decimal("quantity").notNull(), // KG for loose, count for packed
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertStockBalanceSchema = createInsertSchema(stockBalances).omit({ id: true, lastUpdated: true });

export type StockBalance = typeof stockBalances.$inferSelect;
export type InsertStockBalance = z.infer<typeof insertStockBalanceSchema>;

// === PROCESSING RECORDS (RAW TO PROCESSED CONVERSION) ===
export const processingRecords = pgTable("processing_records", {
  id: serial("id").primaryKey(),
  inputLotId: integer("input_lot_id").notNull(), // Source lot
  inputQuantity: decimal("input_quantity").notNull(),
  outputLotId: integer("output_lot_id"), // Created after processing
  outputQuantity: decimal("output_quantity"),
  wasteQuantity: decimal("waste_quantity").default("0"),
  processingType: text("processing_type").notNull(), // cleaning, grading, treatment
  processingDate: date("processing_date").defaultNow(),
  processedBy: text("processed_by"),
  remarks: text("remarks"),
  status: text("status").notNull().default("pending"), // pending, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProcessingRecordSchema = createInsertSchema(processingRecords).omit({ id: true, createdAt: true });

export type ProcessingRecord = typeof processingRecords.$inferSelect;
export type InsertProcessingRecord = z.infer<typeof insertProcessingRecordSchema>;

// === OUTWARD RECORDS (DISPATCH TRACKING) ===
export const outwardRecords = pgTable("outward_records", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull(),
  locationId: integer("location_id").notNull(), // Source warehouse
  stockForm: text("stock_form").notNull(), // loose, packed
  packetSize: text("packet_size"), // For packed
  quantity: decimal("quantity").notNull(), // KG for loose, count for packed
  destinationType: text("destination_type").notNull(), // dealer, farmer, own_use, transfer
  destinationName: text("destination_name"),
  invoiceNumber: text("invoice_number"),
  vehicleNumber: text("vehicle_number"),
  dispatchDate: date("dispatch_date").defaultNow(),
  dispatchedBy: text("dispatched_by"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOutwardRecordSchema = createInsertSchema(outwardRecords).omit({ id: true, createdAt: true });

export type OutwardRecord = typeof outwardRecords.$inferSelect;
export type InsertOutwardRecord = z.infer<typeof insertOutwardRecordSchema>;

// Analytics Response Types
export interface DashboardStats {
  totalStock: number;
  activeBatches: number;
  totalEmployees: number;
  monthlyPayroll: number;
}
