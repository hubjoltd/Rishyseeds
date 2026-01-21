
import { db } from "./db";
import { 
  users, batches, locations, stockEntries, stockMovements, 
  packagingOutputs, employees, attendance, payrolls,
  type User, type InsertUser,
  type Batch, type InsertBatch,
  type Location, type InsertLocation,
  type StockMovement, type InsertStockMovement,
  type InsertStockEntrySchema,
  type InsertPackagingOutputSchema,
  type Employee, type InsertEmployee,
  type InsertAttendanceSchema,
  type Payroll, type InsertPayroll
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Locations
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Batches
  getBatches(): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatchQuantity(id: number, quantityChange: number): Promise<void>;

  // Stock
  createStockEntry(entry: typeof stockEntries.$inferInsert): Promise<typeof stockEntries.$inferSelect>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(): Promise<StockMovement[]>;

  // Packaging
  createPackagingOutput(output: typeof packagingOutputs.$inferInsert): Promise<typeof packagingOutputs.$inferSelect>;
  getPackagingOutputs(): Promise<typeof packagingOutputs.$inferSelect[]>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;

  // Attendance
  markAttendance(attendance: typeof attendance.$inferInsert): Promise<typeof attendance.$inferSelect>;
  getAttendance(date?: string): Promise<typeof attendance.$inferSelect[]>;

  // Payroll
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayrolls(): Promise<Payroll[]>;
  
  // Stats
  getDashboardStats(): Promise<{
    totalStock: number;
    activeBatches: number;
    totalEmployees: number;
    monthlyPayroll: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  // Batches
  async getBatches(): Promise<Batch[]> {
    return await db.select().from(batches).orderBy(desc(batches.createdAt));
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [newBatch] = await db.insert(batches).values({ ...batch, currentQuantity: batch.lotSize }).returning();
    return newBatch;
  }

  async updateBatchQuantity(id: number, quantityChange: number): Promise<void> {
    await db.execute(sql`
      UPDATE batches 
      SET current_quantity = current_quantity + ${quantityChange}
      WHERE id = ${id}
    `);
  }

  // Stock
  async createStockEntry(entry: typeof stockEntries.$inferInsert): Promise<typeof stockEntries.$inferSelect> {
    // Also update batch quantity
    await this.updateBatchQuantity(entry.batchId, Number(entry.quantity));
    const [newEntry] = await db.insert(stockEntries).values(entry).returning();
    return newEntry;
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    // Deduct from source? 
    // Logic: If moving from storage to packaging, we might deduct from 'storage' stock?
    // SRS says: "Cannot move quantity greater than available stock. Automatic stock deduction from source location"
    // For now, we assume batch quantity tracks overall stock or we need location-based stock.
    // Simplified: Just update batch current quantity if it's leaving the system, or track location transfers.
    // We'll just record movement for traceability as per MVP scope.
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async getStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.movementDate));
  }

  // Packaging
  async createPackagingOutput(output: typeof packagingOutputs.$inferInsert): Promise<typeof packagingOutputs.$inferSelect> {
    // Finished stock auto-calculated (maybe handled in frontend or separate table?)
    // SRS: "Packaging stock updated accordingly"
    const [newOutput] = await db.insert(packagingOutputs).values(output).returning();
    return newOutput;
  }

  async getPackagingOutputs(): Promise<typeof packagingOutputs.$inferSelect[]> {
    return await db.select().from(packagingOutputs).orderBy(desc(packagingOutputs.productionDate));
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  // Attendance
  async markAttendance(att: typeof attendance.$inferInsert): Promise<typeof attendance.$inferSelect> {
    const [newAttendance] = await db.insert(attendance).values(att).returning();
    return newAttendance;
  }

  async getAttendance(dateStr?: string): Promise<typeof attendance.$inferSelect[]> {
    if (dateStr) {
      return await db.select().from(attendance).where(eq(attendance.date, dateStr));
    }
    return await db.select().from(attendance).orderBy(desc(attendance.date));
  }

  // Payroll
  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const [newPayroll] = await db.insert(payrolls).values(payroll).returning();
    return newPayroll;
  }

  async getPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls).orderBy(desc(payrolls.generatedDate));
  }

  // Stats
  async getDashboardStats() {
    const [stock] = await db.select({ 
      total: sql<number>`sum(current_quantity)` 
    }).from(batches);

    const [activeBatches] = await db.select({
      count: sql<number>`count(*)`
    }).from(batches).where(eq(batches.status, 'active'));

    const [emp] = await db.select({
      count: sql<number>`count(*)`
    }).from(employees).where(eq(employees.status, 'active'));

    // Mock payroll sum for now
    const monthlyPayroll = 0; 

    return {
      totalStock: Number(stock?.total || 0),
      activeBatches: Number(activeBatches?.count || 0),
      totalEmployees: Number(emp?.count || 0),
      monthlyPayroll
    };
  }
}

export const storage = new DatabaseStorage();
