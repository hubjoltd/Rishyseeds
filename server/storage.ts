
import { db } from "./db";
import { 
  users, batches, locations, stockEntries, stockMovements, 
  packagingOutputs, employees, attendance, payrolls, products,
  type User, type InsertUser,
  type Batch, type InsertBatch,
  type Location, type InsertLocation,
  type StockMovement, type InsertStockMovement,
  type InsertStockEntrySchema,
  type InsertPackagingOutputSchema,
  type Employee, type InsertEmployee,
  type InsertAttendanceSchema,
  type Payroll, type InsertPayroll,
  type Product, type InsertProduct
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, updates: Partial<InsertLocation>): Promise<Location | undefined>;

  // Batches
  getBatches(): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, updates: Partial<InsertBatch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<boolean>;
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
  updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;

  // Attendance
  markAttendance(attendance: typeof attendance.$inferInsert): Promise<typeof attendance.$inferSelect>;
  getAttendance(date?: string): Promise<typeof attendance.$inferSelect[]>;

  // Payroll
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayrolls(): Promise<Payroll[]>;
  
  // Products
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: number, updates: Partial<InsertLocation>): Promise<Location | undefined> {
    const [updated] = await db.update(locations).set(updates).where(eq(locations.id, id)).returning();
    return updated;
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

  async updateBatch(id: number, updates: Partial<InsertBatch>): Promise<Batch | undefined> {
    const [updated] = await db.update(batches).set(updates).where(eq(batches.id, id)).returning();
    return updated;
  }

  async deleteBatch(id: number): Promise<boolean> {
    const batch = await this.getBatch(id);
    if (!batch) return false;
    await db.delete(batches).where(eq(batches.id, id));
    return true;
  }

  // Stock
  async createStockEntry(entry: typeof stockEntries.$inferInsert): Promise<typeof stockEntries.$inferSelect> {
    // Also update batch quantity
    await this.updateBatchQuantity(entry.batchId, Number(entry.quantity));
    const [newEntry] = await db.insert(stockEntries).values(entry).returning();
    return newEntry;
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    // Get current batch to validate
    const batch = await this.getBatch(movement.batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    const availableQty = Number(batch.currentQuantity);
    const requestedQty = Number(movement.quantity);

    // Server-side validation: Cannot move more than available
    if (requestedQty > availableQty) {
      throw new Error(`Cannot move ${requestedQty}kg. Only ${availableQty}kg available in this batch.`);
    }

    if (requestedQty <= 0) {
      throw new Error("Quantity must be positive");
    }

    // Deduct from batch stock atomically
    await this.updateBatchQuantity(movement.batchId, -requestedQty);
    
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

  async updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    return updated;
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

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
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
