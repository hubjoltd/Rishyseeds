
import { db } from "./db";
import { 
  users, batches, locations, stockEntries, stockMovements, 
  packagingOutputs, employees, attendance, payrolls, products,
  lots, stockBalances, processingRecords, outwardRecords, packagingSizes,
  type User, type InsertUser,
  type Batch, type InsertBatch,
  type Location, type InsertLocation,
  type StockMovement, type InsertStockMovement,
  type Employee, type InsertEmployee,
  type Payroll, type InsertPayroll,
  type Product, type InsertProduct,
  type Lot, type InsertLot,
  type StockBalance, type InsertStockBalance,
  type ProcessingRecord, type InsertProcessingRecord,
  type OutwardRecord, type InsertOutwardRecord,
  type PackagingSize, type InsertPackagingSize
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

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
  deleteLocation(id: number): Promise<boolean>;

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
  updateStockMovement(id: number, updates: Partial<InsertStockMovement>): Promise<StockMovement | undefined>;
  deleteStockMovement(id: number): Promise<boolean>;

  // Packaging
  createPackagingOutput(output: typeof packagingOutputs.$inferInsert): Promise<typeof packagingOutputs.$inferSelect>;
  getPackagingOutputs(): Promise<typeof packagingOutputs.$inferSelect[]>;
  updatePackagingOutput(id: number, updates: Partial<typeof packagingOutputs.$inferInsert>): Promise<typeof packagingOutputs.$inferSelect | undefined>;
  deletePackagingOutput(id: number): Promise<boolean>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;

  // Attendance
  markAttendance(record: typeof attendance.$inferInsert): Promise<typeof attendance.$inferSelect>;
  getAttendance(date?: string): Promise<typeof attendance.$inferSelect[]>;

  // Payroll
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayrolls(): Promise<Payroll[]>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Lots
  getLots(): Promise<Lot[]>;
  getLot(id: number): Promise<Lot | undefined>;
  createLot(lot: InsertLot): Promise<Lot>;
  updateLot(id: number, updates: Partial<InsertLot>): Promise<Lot | undefined>;
  deleteLot(id: number): Promise<boolean>;
  generateLotNumber(productId: number): Promise<string>;

  // Stock Balances
  getStockBalances(): Promise<StockBalance[]>;
  getStockBalancesByLot(lotId: number): Promise<StockBalance[]>;
  getStockBalanceByLotAndLocation(lotId: number, locationId: number, stockForm: string, packetSize?: string): Promise<StockBalance | undefined>;
  createStockBalance(balance: InsertStockBalance): Promise<StockBalance>;
  updateStockBalance(id: number, quantity: string): Promise<StockBalance | undefined>;
  adjustStockBalance(lotId: number, locationId: number, stockForm: string, quantityChange: number, packetSize?: string): Promise<void>;

  // Processing Records
  getProcessingRecords(): Promise<ProcessingRecord[]>;
  getProcessingRecord(id: number): Promise<ProcessingRecord | undefined>;
  createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord>;
  updateProcessingRecord(id: number, updates: Partial<InsertProcessingRecord>): Promise<ProcessingRecord | undefined>;
  deleteProcessingRecord(id: number): Promise<boolean>;

  // Outward Records
  getOutwardRecords(): Promise<OutwardRecord[]>;
  getOutwardRecord(id: number): Promise<OutwardRecord | undefined>;
  createOutwardRecord(record: InsertOutwardRecord): Promise<OutwardRecord>;
  updateOutwardRecord(id: number, updates: Partial<InsertOutwardRecord>): Promise<OutwardRecord | undefined>;
  deleteOutwardRecord(id: number): Promise<boolean>;

  // Packaging Sizes Master
  getPackagingSizes(): Promise<PackagingSize[]>;
  getPackagingSize(id: number): Promise<PackagingSize | undefined>;
  createPackagingSize(size: InsertPackagingSize): Promise<PackagingSize>;
  updatePackagingSize(id: number, updates: Partial<InsertPackagingSize>): Promise<PackagingSize | undefined>;
  deletePackagingSize(id: number): Promise<boolean>;

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

  async deleteLocation(id: number): Promise<boolean> {
    await db.delete(locations).where(eq(locations.id, id));
    return true;
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
    // Use lot-based stock movement
    if (!movement.lotId) {
      throw new Error("Lot is required for stock movement");
    }

    const requestedQty = Number(movement.quantity);
    if (requestedQty <= 0) {
      throw new Error("Quantity must be positive");
    }

    // Get available stock at source location (loose stock)
    const sourceBalance = await this.getStockBalanceByLotAndLocation(
      movement.lotId, 
      movement.fromLocationId, 
      'loose'
    );
    const availableQty = sourceBalance ? Number(sourceBalance.quantity) : 0;

    // Server-side validation: Cannot move more than available
    if (requestedQty > availableQty) {
      throw new Error(`Cannot move ${requestedQty}kg. Only ${availableQty.toFixed(2)}kg available at source location.`);
    }

    // Decrease stock at source location
    await this.adjustStockBalance(movement.lotId, movement.fromLocationId, 'loose', -requestedQty);
    
    // Increase stock at destination location
    await this.adjustStockBalance(movement.lotId, movement.toLocationId, 'loose', requestedQty);
    
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async getStockMovements(): Promise<StockMovement[]> {
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.movementDate));
  }

  async updateStockMovement(id: number, updates: Partial<InsertStockMovement>): Promise<StockMovement | undefined> {
    const [updated] = await db.update(stockMovements).set(updates).where(eq(stockMovements.id, id)).returning();
    return updated;
  }

  async deleteStockMovement(id: number): Promise<boolean> {
    await db.delete(stockMovements).where(eq(stockMovements.id, id));
    return true;
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

  async updatePackagingOutput(id: number, updates: Partial<typeof packagingOutputs.$inferInsert>): Promise<typeof packagingOutputs.$inferSelect | undefined> {
    const [updated] = await db.update(packagingOutputs).set(updates).where(eq(packagingOutputs.id, id)).returning();
    return updated;
  }

  async deletePackagingOutput(id: number): Promise<boolean> {
    await db.delete(packagingOutputs).where(eq(packagingOutputs.id, id));
    return true;
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

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Lots
  async getLots(): Promise<Lot[]> {
    return await db.select().from(lots).orderBy(desc(lots.createdAt));
  }

  async getLot(id: number): Promise<Lot | undefined> {
    const [lot] = await db.select().from(lots).where(eq(lots.id, id));
    return lot;
  }

  async createLot(lot: InsertLot): Promise<Lot> {
    const [newLot] = await db.insert(lots).values(lot).returning();
    return newLot;
  }

  async updateLot(id: number, updates: Partial<InsertLot>): Promise<Lot | undefined> {
    const [updated] = await db.update(lots).set(updates).where(eq(lots.id, id)).returning();
    return updated;
  }

  async deleteLot(id: number): Promise<boolean> {
    await db.delete(lots).where(eq(lots.id, id));
    return true;
  }

  async generateLotNumber(productId: number): Promise<string> {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) throw new Error("Product not found");
    
    // Format: MA-[variety last 2 digits]-26(year)-001
    const varietyCode = product.variety.slice(-2).toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2); // "26" for 2026
    const prefix = `MA-${varietyCode}-${year}`;
    
    const [countResult] = await db.select({
      count: sql<number>`count(*)`
    }).from(lots).where(sql`lot_number LIKE ${prefix + '%'}`);
    
    const sequence = String(Number(countResult?.count || 0) + 1).padStart(3, '0');
    return `${prefix}-${sequence}`;
  }

  // Stock Balances
  async getStockBalances(): Promise<StockBalance[]> {
    return await db.select().from(stockBalances);
  }

  async getStockBalancesByLot(lotId: number): Promise<StockBalance[]> {
    return await db.select().from(stockBalances).where(eq(stockBalances.lotId, lotId));
  }

  async getStockBalanceByLotAndLocation(
    lotId: number, 
    locationId: number, 
    stockForm: string, 
    packetSize?: string
  ): Promise<StockBalance | undefined> {
    if (stockForm === 'packed' && packetSize) {
      const [balance] = await db.select().from(stockBalances)
        .where(and(
          eq(stockBalances.lotId, lotId),
          eq(stockBalances.locationId, locationId),
          eq(stockBalances.stockForm, stockForm),
          eq(stockBalances.packetSize, packetSize)
        ));
      return balance;
    }
    const [balance] = await db.select().from(stockBalances)
      .where(and(
        eq(stockBalances.lotId, lotId),
        eq(stockBalances.locationId, locationId),
        eq(stockBalances.stockForm, stockForm)
      ));
    return balance;
  }

  async createStockBalance(balance: InsertStockBalance): Promise<StockBalance> {
    const [newBalance] = await db.insert(stockBalances).values(balance).returning();
    return newBalance;
  }

  async updateStockBalance(id: number, quantity: string): Promise<StockBalance | undefined> {
    const [updated] = await db.update(stockBalances)
      .set({ quantity, lastUpdated: new Date() })
      .where(eq(stockBalances.id, id))
      .returning();
    return updated;
  }

  async adjustStockBalance(
    lotId: number, 
    locationId: number, 
    stockForm: string, 
    quantityChange: number, 
    packetSize?: string
  ): Promise<void> {
    const existing = await this.getStockBalanceByLotAndLocation(lotId, locationId, stockForm, packetSize);
    
    if (existing) {
      const newQty = Number(existing.quantity) + quantityChange;
      if (newQty < 0) {
        throw new Error("Insufficient stock balance");
      }
      await this.updateStockBalance(existing.id, String(newQty));
    } else {
      if (quantityChange < 0) {
        throw new Error("Cannot create negative stock balance");
      }
      await this.createStockBalance({
        lotId,
        locationId,
        stockForm,
        packetSize: packetSize || null,
        quantity: String(quantityChange)
      });
    }
  }

  // Processing Records
  async getProcessingRecords(): Promise<ProcessingRecord[]> {
    return await db.select().from(processingRecords).orderBy(desc(processingRecords.processingDate));
  }

  async getProcessingRecord(id: number): Promise<ProcessingRecord | undefined> {
    const [record] = await db.select().from(processingRecords).where(eq(processingRecords.id, id));
    return record;
  }

  async createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord> {
    const [newRecord] = await db.insert(processingRecords).values(record).returning();
    return newRecord;
  }

  async updateProcessingRecord(id: number, updates: Partial<InsertProcessingRecord>): Promise<ProcessingRecord | undefined> {
    const [updated] = await db.update(processingRecords).set(updates).where(eq(processingRecords.id, id)).returning();
    return updated;
  }

  async deleteProcessingRecord(id: number): Promise<boolean> {
    await db.delete(processingRecords).where(eq(processingRecords.id, id));
    return true;
  }

  // Outward Records
  async getOutwardRecords(): Promise<OutwardRecord[]> {
    return await db.select().from(outwardRecords).orderBy(desc(outwardRecords.dispatchDate));
  }

  async getOutwardRecord(id: number): Promise<OutwardRecord | undefined> {
    const [record] = await db.select().from(outwardRecords).where(eq(outwardRecords.id, id));
    return record;
  }

  async createOutwardRecord(record: InsertOutwardRecord): Promise<OutwardRecord> {
    const [newRecord] = await db.insert(outwardRecords).values(record).returning();
    return newRecord;
  }

  async updateOutwardRecord(id: number, updates: Partial<InsertOutwardRecord>): Promise<OutwardRecord | undefined> {
    const [updated] = await db.update(outwardRecords).set(updates).where(eq(outwardRecords.id, id)).returning();
    return updated;
  }

  async deleteOutwardRecord(id: number): Promise<boolean> {
    await db.delete(outwardRecords).where(eq(outwardRecords.id, id));
    return true;
  }

  // Packaging Sizes Master
  async getPackagingSizes(): Promise<PackagingSize[]> {
    return await db.select().from(packagingSizes).orderBy(packagingSizes.size);
  }

  async getPackagingSize(id: number): Promise<PackagingSize | undefined> {
    const [size] = await db.select().from(packagingSizes).where(eq(packagingSizes.id, id));
    return size;
  }

  async createPackagingSize(size: InsertPackagingSize): Promise<PackagingSize> {
    const [newSize] = await db.insert(packagingSizes).values(size).returning();
    return newSize;
  }

  async updatePackagingSize(id: number, updates: Partial<InsertPackagingSize>): Promise<PackagingSize | undefined> {
    const [updated] = await db.update(packagingSizes).set(updates).where(eq(packagingSizes.id, id)).returning();
    return updated;
  }

  async deletePackagingSize(id: number): Promise<boolean> {
    await db.delete(packagingSizes).where(eq(packagingSizes.id, id));
    return true;
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
