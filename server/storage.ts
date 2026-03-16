
import { db } from "./db";
import { 
  users, batches, locations, stockEntries, stockMovements, 
  packagingOutputs, employees, attendance, payrolls, products,
  lots, stockBalances, processingRecords, outwardRecords, outwardReturns, packagingSizes, roles, notifications,
  trips, tripVisits, tripComments, tripAuditHistory, dryerEntries,
  customers, customerCheckins,
  tasks, taskComments,
  expenses, expenseComments, expenseAuditHistory,
  employeeLocations,
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
  type OutwardReturn, type InsertOutwardReturn,
  type PackagingSize, type InsertPackagingSize,
  type Role, type InsertRole,
  type Notification, type InsertNotification,
  type Trip, type InsertTrip,
  type TripVisit, type InsertTripVisit,
  type TripComment, type InsertTripComment,
  type TripAudit, type InsertTripAudit,
  type DryerEntry, type InsertDryerEntry,
  type Customer, type InsertCustomer,
  type CustomerCheckin, type InsertCustomerCheckin,
  type Task, type InsertTask,
  type TaskComment, type InsertTaskComment,
  type Expense, type InsertExpense,
  type ExpenseComment, type InsertExpenseComment,
  type ExpenseAudit, type InsertExpenseAudit,
  type EmployeeLocation, type InsertEmployeeLocation,
} from "@shared/schema";
import { eq, desc, sql, and, or, gte, lte } from "drizzle-orm";

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
  getPackagingOutputsByEmployee(employeeName: string): Promise<typeof packagingOutputs.$inferSelect[]>;
  updatePackagingOutput(id: number, updates: Partial<typeof packagingOutputs.$inferInsert>): Promise<typeof packagingOutputs.$inferSelect | undefined>;
  deletePackagingOutput(id: number): Promise<boolean>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getEmployeeByEmailOrPhone(identifier: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Attendance
  markAttendance(record: typeof attendance.$inferInsert): Promise<typeof attendance.$inferSelect>;
  getAttendance(date?: string): Promise<typeof attendance.$inferSelect[]>;
  getAttendanceByEmployee(employeeId: number): Promise<typeof attendance.$inferSelect[]>;
  getAttendanceByEmployeeAndDate(employeeId: number, date: string): Promise<typeof attendance.$inferSelect | undefined>;
  updateAttendance(id: number, updates: Partial<typeof attendance.$inferInsert>): Promise<typeof attendance.$inferSelect | undefined>;

  // Payroll
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayrolls(): Promise<Payroll[]>;
  getPayroll(id: number): Promise<Payroll | undefined>;
  getPayrollsByEmployee(employeeId: number): Promise<Payroll[]>;

  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

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
  getProcessingRecordsByEmployee(employeeName: string): Promise<ProcessingRecord[]>;
  createProcessingRecord(record: InsertProcessingRecord): Promise<ProcessingRecord>;
  updateProcessingRecord(id: number, updates: Partial<InsertProcessingRecord>): Promise<ProcessingRecord | undefined>;
  deleteProcessingRecord(id: number): Promise<boolean>;

  // Outward Records
  getOutwardRecords(): Promise<OutwardRecord[]>;
  getOutwardRecord(id: number): Promise<OutwardRecord | undefined>;
  getOutwardRecordsByEmployee(employeeName: string): Promise<OutwardRecord[]>;
  createOutwardRecord(record: InsertOutwardRecord): Promise<OutwardRecord>;
  updateOutwardRecord(id: number, updates: Partial<InsertOutwardRecord>): Promise<OutwardRecord | undefined>;
  deleteOutwardRecord(id: number): Promise<boolean>;

  // Outward Returns
  getOutwardReturns(): Promise<OutwardReturn[]>;
  getOutwardReturnsByRecord(outwardRecordId: number): Promise<OutwardReturn[]>;
  createOutwardReturn(ret: InsertOutwardReturn): Promise<OutwardReturn>;
  deleteOutwardReturn(id: number): Promise<boolean>;

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

  // Notifications
  getNotifications(limit?: number): Promise<Notification[]>;
  getUnreadNotificationsCount(): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(): Promise<void>;

  // Trips
  getTrips(): Promise<Trip[]>;
  getTripsByEmployee(employeeId: number): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, updates: Partial<InsertTrip>): Promise<Trip | undefined>;

  // Trip Visits
  getTripVisits(tripId: number): Promise<TripVisit[]>;
  createTripVisit(visit: InsertTripVisit): Promise<TripVisit>;
  updateTripVisit(id: number, updates: Partial<InsertTripVisit>): Promise<TripVisit | undefined>;

  // Trip Comments
  getTripComments(tripId: number): Promise<TripComment[]>;
  createTripComment(comment: InsertTripComment): Promise<TripComment>;

  // Trip Audit History
  getTripAuditHistory(tripId: number): Promise<TripAudit[]>;
  createTripAudit(audit: InsertTripAudit): Promise<TripAudit>;

  // Employee Locations (GPS tracking)
  addEmployeeLocation(data: InsertEmployeeLocation): Promise<EmployeeLocation>;
  getEmployeeLocationsForDate(employeeId: number, date: string): Promise<EmployeeLocation[]>;

  // Dryer
  getDryerEntries(): Promise<DryerEntry[]>;
  getDryerEntry(id: number): Promise<DryerEntry | undefined>;
  createDryerEntry(entry: InsertDryerEntry): Promise<DryerEntry>;
  updateDryerEntry(id: number, updates: Partial<InsertDryerEntry>): Promise<DryerEntry | undefined>;
  deleteDryerEntry(id: number): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  findCustomerByName(name: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  upsertCustomerFromVisit(name: string, address: string | null, ownerEmployeeId: number, ownerName: string, reportingManagerName?: string): Promise<Customer>;
  createCustomerCheckin(data: InsertCustomerCheckin): Promise<CustomerCheckin>;
  getActiveCustomerCheckin(employeeDbId: number): Promise<CustomerCheckin | undefined>;
  checkoutCustomerCheckin(id: number, data: Partial<InsertCustomerCheckin>): Promise<CustomerCheckin | undefined>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByEmployee(employeeDbId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  getTaskComments(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByEmployee(employeeDbId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined>;
  getExpenseComments(expenseId: number): Promise<ExpenseComment[]>;
  createExpenseComment(comment: InsertExpenseComment): Promise<ExpenseComment>;
  getExpenseAuditHistory(expenseId: number): Promise<ExpenseAudit[]>;
  createExpenseAudit(audit: InsertExpenseAudit): Promise<ExpenseAudit>;
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
    if (!movement.lotId) {
      throw new Error("Lot is required for stock movement");
    }

    const requestedQty = Number(movement.quantity);
    if (requestedQty <= 0) {
      throw new Error("Quantity must be positive");
    }

    // Look up location types
    const [fromLoc] = await db.select().from(locations).where(eq(locations.id, movement.fromLocationId));
    const [toLoc] = await db.select().from(locations).where(eq(locations.id, movement.toLocationId));
    const fromIsColdStorage = fromLoc?.type === 'cold_storage';
    const toIsColdStorage = toLoc?.type === 'cold_storage';

    if (fromIsColdStorage) {
      // For cold storage source: validate cs remaining at that location
      const csIn = await this.getStockBalanceByLotAndLocation(movement.lotId, movement.fromLocationId, 'cs_inward');
      const csOut = await this.getStockBalanceByLotAndLocation(movement.lotId, movement.fromLocationId, 'cs_outward');
      const csRemaining = Math.max(0, Number(csIn?.quantity || 0) - Number(csOut?.quantity || 0));
      if (requestedQty > csRemaining + 0.001) {
        throw new Error(`Cannot move ${requestedQty}kg from cold storage. Only ${csRemaining.toFixed(2)}kg remaining.`);
      }
    } else {
      // For regular locations: validate against the loose balance at source location
      // Fall back to lot closing balance if no stock_balance record exists yet
      const sourceBalance = await this.getStockBalanceByLotAndLocation(movement.lotId, movement.fromLocationId, 'loose');
      if (sourceBalance) {
        const available = Math.max(0, Number(sourceBalance.quantity));
        if (requestedQty > available + 0.001) {
          throw new Error(`Cannot move ${requestedQty}kg. Only ${available.toFixed(2)}kg available at source location.`);
        }
      } else {
        // No pre-existing balance record — validate against lot closing balance as fallback
        const [lot] = await db.select().from(lots).where(eq(lots.id, movement.lotId));
        if (!lot) throw new Error("Lot not found");
        const allOutward = await db.select().from(outwardRecords).where(eq(outwardRecords.lotId, movement.lotId));
        const allReturns = await db.select().from(outwardReturns).where(eq(outwardReturns.lotId, movement.lotId));
        const totalDispatched = allOutward.reduce((s, r) => s + Number(r.quantity || 0), 0);
        const totalReturned = allReturns.reduce((s, r) => s + Number(r.quantity || 0), 0);
        const lotClosingBalance = Math.max(0, Number(lot.initialQuantity || 0) - totalDispatched + totalReturned);
        if (requestedQty > lotClosingBalance + 0.001) {
          throw new Error(`Cannot move ${requestedQty}kg. Only ${lotClosingBalance.toFixed(2)}kg available in this lot.`);
        }
      }
    }

    // Update source: if cold storage, increase cs_outward (tracking cumulative outflow)
    // else decrease loose
    if (fromIsColdStorage) {
      await this.adjustStockBalance(movement.lotId, movement.fromLocationId, 'cs_outward', requestedQty);
    } else {
      await this.adjustStockBalance(movement.lotId, movement.fromLocationId, 'loose', -requestedQty);
    }

    // Update destination: if cold storage, increase cs_inward (tracking cumulative inflow)
    // else increase loose
    if (toIsColdStorage) {
      await this.adjustStockBalance(movement.lotId, movement.toLocationId, 'cs_inward', requestedQty);
    } else {
      await this.adjustStockBalance(movement.lotId, movement.toLocationId, 'loose', requestedQty);
    }

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

  async getPackagingOutputsByEmployee(employeeName: string): Promise<typeof packagingOutputs.$inferSelect[]> {
    return await db.select().from(packagingOutputs)
      .where(eq(packagingOutputs.packedBy, employeeName))
      .orderBy(desc(packagingOutputs.productionDate));
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

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async getEmployeeByEmailOrPhone(identifier: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(
      or(eq(employees.email, identifier), eq(employees.phone, identifier))
    );
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

  async deleteEmployee(id: number): Promise<boolean> {
    await db.delete(employees).where(eq(employees.id, id));
    return true;
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

  async getAttendanceByEmployee(employeeId: number): Promise<typeof attendance.$inferSelect[]> {
    return await db.select().from(attendance)
      .where(eq(attendance.employeeId, employeeId))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByEmployeeAndDate(employeeId: number, date: string): Promise<typeof attendance.$inferSelect | undefined> {
    const [record] = await db.select().from(attendance)
      .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, date)));
    return record;
  }

  async updateAttendance(id: number, updates: Partial<typeof attendance.$inferInsert>): Promise<typeof attendance.$inferSelect | undefined> {
    const [updated] = await db.update(attendance).set(updates).where(eq(attendance.id, id)).returning();
    return updated;
  }

  // Payroll
  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const [newPayroll] = await db.insert(payrolls).values(payroll).returning();
    return newPayroll;
  }

  async getPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls).orderBy(desc(payrolls.generatedDate));
  }

  async getPayroll(id: number): Promise<Payroll | undefined> {
    const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, id));
    return payroll;
  }

  async getPayrollsByEmployee(employeeId: number): Promise<Payroll[]> {
    return await db.select().from(payrolls)
      .where(eq(payrolls.employeeId, employeeId))
      .orderBy(desc(payrolls.month));
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db.update(roles).set(updates).where(eq(roles.id, id)).returning();
    return updated;
  }

  async deleteRole(id: number): Promise<boolean> {
    await db.delete(roles).where(eq(roles.id, id));
    return true;
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

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
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
    
    // Format: MA-[variety last 2 chars]-26(year)-001
    // Extract last 2 characters from variety name
    const varietyCode = product.variety.slice(-2).toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2); // "26" for 2026
    const prefix = `MA-${varietyCode}-${year}`;
    
    // Find the maximum sequence number for this prefix
    const existingLots = await db.select({ lotNumber: lots.lotNumber })
      .from(lots)
      .where(sql`lot_number LIKE ${prefix + '-%'}`);
    
    let maxSequence = 0;
    for (const lot of existingLots) {
      const match = lot.lotNumber.match(/-(\d{3})$/);
      if (match) {
        const seq = parseInt(match[1]);
        if (seq > maxSequence) maxSequence = seq;
      }
    }
    
    const sequence = String(maxSequence + 1).padStart(3, '0');
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

  async getProcessingRecordsByEmployee(employeeName: string): Promise<ProcessingRecord[]> {
    return await db.select().from(processingRecords)
      .where(eq(processingRecords.processedBy, employeeName))
      .orderBy(desc(processingRecords.processingDate));
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

  async getOutwardRecordsByEmployee(employeeName: string): Promise<OutwardRecord[]> {
    return await db.select().from(outwardRecords)
      .where(eq(outwardRecords.dispatchedBy, employeeName))
      .orderBy(desc(outwardRecords.dispatchDate));
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

  // Outward Returns
  async getOutwardReturns(): Promise<OutwardReturn[]> {
    return await db.select().from(outwardReturns).orderBy(desc(outwardReturns.createdAt));
  }

  async getOutwardReturnsByRecord(outwardRecordId: number): Promise<OutwardReturn[]> {
    return await db.select().from(outwardReturns).where(eq(outwardReturns.outwardRecordId, outwardRecordId));
  }

  async createOutwardReturn(ret: InsertOutwardReturn): Promise<OutwardReturn> {
    const [newReturn] = await db.insert(outwardReturns).values(ret).returning();
    return newReturn;
  }

  async deleteOutwardReturn(id: number): Promise<boolean> {
    await db.delete(outwardReturns).where(eq(outwardReturns.id, id));
    return true;
  }

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
    const [looseStock] = await db.select({
      total: sql<number>`sum(cast(quantity as numeric))`
    }).from(stockBalances).where(eq(stockBalances.stockForm, 'loose'));

    const [packedStock] = await db.select({
      total: sql<number>`sum(cast(quantity as numeric))`
    }).from(stockBalances).where(eq(stockBalances.stockForm, 'packed'));

    const [activeLots] = await db.select({
      count: sql<number>`count(*)`
    }).from(lots).where(eq(lots.status, 'active'));

    const [emp] = await db.select({
      count: sql<number>`count(*)`
    }).from(employees).where(eq(employees.status, 'active'));

    const [totalOutward] = await db.select({
      total: sql<number>`sum(cast(quantity as numeric))`
    }).from(outwardRecords);

    const [packagingCount] = await db.select({
      total: sql<number>`sum(number_of_packets)`
    }).from(packagingOutputs);

    return {
      totalStock: Number(looseStock?.total || 0),
      activeBatches: Number(activeLots?.count || 0),
      activeLots: Number(activeLots?.count || 0),
      totalLooseStock: Number(looseStock?.total || 0),
      totalPackedPackets: Number(packedStock?.total || 0),
      totalEmployees: Number(emp?.count || 0),
      totalOutwardKg: Number(totalOutward?.total || 0),
      totalPackagingBags: Number(packagingCount?.total || 0),
      monthlyPayroll: 0
    };
  }

  // Notifications
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getUnreadNotificationsCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, false));
    return Number(result?.count || 0);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  }

  // Trips
  async getTrips(): Promise<Trip[]> {
    return db.select().from(trips).orderBy(desc(trips.createdAt));
  }

  async getTripsByEmployee(employeeId: number): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.employeeId, employeeId)).orderBy(desc(trips.createdAt));
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [created] = await db.insert(trips).values(trip).returning();
    return created;
  }

  async updateTrip(id: number, updates: Partial<InsertTrip>): Promise<Trip | undefined> {
    const [updated] = await db.update(trips).set(updates).where(eq(trips.id, id)).returning();
    return updated;
  }

  // Trip Visits
  async getTripVisits(tripId: number): Promise<TripVisit[]> {
    return db.select().from(tripVisits).where(eq(tripVisits.tripId, tripId)).orderBy(tripVisits.createdAt);
  }

  async createTripVisit(visit: InsertTripVisit): Promise<TripVisit> {
    const [created] = await db.insert(tripVisits).values(visit).returning();
    return created;
  }

  async updateTripVisit(id: number, updates: Partial<InsertTripVisit>): Promise<TripVisit | undefined> {
    const [updated] = await db.update(tripVisits).set(updates).where(eq(tripVisits.id, id)).returning();
    return updated;
  }

  async getTripComments(tripId: number): Promise<TripComment[]> {
    return db.select().from(tripComments).where(eq(tripComments.tripId, tripId)).orderBy(tripComments.createdAt);
  }

  async createTripComment(comment: InsertTripComment): Promise<TripComment> {
    const [created] = await db.insert(tripComments).values(comment).returning();
    return created;
  }

  async getTripAuditHistory(tripId: number): Promise<TripAudit[]> {
    return db.select().from(tripAuditHistory).where(eq(tripAuditHistory.tripId, tripId)).orderBy(tripAuditHistory.changedAt);
  }

  async createTripAudit(audit: InsertTripAudit): Promise<TripAudit> {
    const [created] = await db.insert(tripAuditHistory).values(audit).returning();
    return created;
  }

  async addEmployeeLocation(data: InsertEmployeeLocation): Promise<EmployeeLocation> {
    const [loc] = await db.insert(employeeLocations).values(data).returning();
    return loc;
  }

  async getEmployeeLocationsForDate(employeeId: number, date: string): Promise<EmployeeLocation[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return db.select().from(employeeLocations)
      .where(
        and(
          eq(employeeLocations.employeeId, employeeId),
          gte(employeeLocations.recordedAt, start),
          lte(employeeLocations.recordedAt, end)
        )
      )
      .orderBy(employeeLocations.recordedAt);
  }

  async getDryerEntries(): Promise<DryerEntry[]> {
    return db.select().from(dryerEntries).orderBy(desc(dryerEntries.createdAt));
  }

  async getDryerEntry(id: number): Promise<DryerEntry | undefined> {
    const [entry] = await db.select().from(dryerEntries).where(eq(dryerEntries.id, id));
    return entry;
  }

  async createDryerEntry(entry: InsertDryerEntry): Promise<DryerEntry> {
    const [created] = await db.insert(dryerEntries).values(entry).returning();
    return created;
  }

  async updateDryerEntry(id: number, updates: Partial<InsertDryerEntry>): Promise<DryerEntry | undefined> {
    const [updated] = await db.update(dryerEntries).set({ ...updates, updatedAt: new Date() }).where(eq(dryerEntries.id, id)).returning();
    return updated;
  }

  async deleteDryerEntry(id: number): Promise<boolean> {
    await db.delete(dryerEntries).where(eq(dryerEntries.id, id));
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async findCustomerByName(name: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(sql`lower(${customers.name}) = lower(${name})`);
    return c;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set({ ...updates, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    return updated;
  }

  async upsertCustomerFromVisit(name: string, address: string | null, ownerEmployeeId: number, ownerName: string, reportingManagerName?: string): Promise<Customer> {
    const existing = await this.findCustomerByName(name);
    if (existing) {
      const updates: Partial<InsertCustomer> = { updatedAt: new Date() };
      if (address && !existing.address) updates.address = address;
      return (await this.updateCustomer(existing.id, updates)) || existing;
    }
    return this.createCustomer({ name, address: address || null, ownerEmployeeId, ownerName, reportingManagerName: reportingManagerName || null, status: "active", source: "visit" });
  }

  async createCustomerCheckin(data: InsertCustomerCheckin): Promise<CustomerCheckin> {
    const [created] = await db.insert(customerCheckins).values(data).returning();
    return created;
  }

  async getActiveCustomerCheckin(employeeDbId: number): Promise<CustomerCheckin | undefined> {
    const [row] = await db.select().from(customerCheckins)
      .where(and(eq(customerCheckins.employeeDbId, employeeDbId), eq(customerCheckins.status, "active")))
      .orderBy(desc(customerCheckins.checkedInAt))
      .limit(1);
    return row;
  }

  async checkoutCustomerCheckin(id: number, data: Partial<InsertCustomerCheckin>): Promise<CustomerCheckin | undefined> {
    const [updated] = await db.update(customerCheckins)
      .set({ ...data, status: "completed", checkedOutAt: new Date() })
      .where(eq(customerCheckins.id, id))
      .returning();
    return updated;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTasksByEmployee(employeeDbId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.employeeDbId, employeeDbId)).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
    return t;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(desc(taskComments.createdAt));
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [created] = await db.insert(taskComments).values(comment).returning();
    return created;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async getExpensesByEmployee(employeeDbId: number): Promise<Expense[]> {
    return db.select().from(expenses).where(eq(expenses.employeeDbId, employeeDbId)).orderBy(desc(expenses.createdAt));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [exp] = await db.select().from(expenses).where(eq(expenses.id, id));
    return exp;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async getExpenseComments(expenseId: number): Promise<ExpenseComment[]> {
    return db.select().from(expenseComments).where(eq(expenseComments.expenseId, expenseId)).orderBy(desc(expenseComments.createdAt));
  }

  async createExpenseComment(comment: InsertExpenseComment): Promise<ExpenseComment> {
    const [created] = await db.insert(expenseComments).values(comment).returning();
    return created;
  }

  async getExpenseAuditHistory(expenseId: number): Promise<ExpenseAudit[]> {
    return db.select().from(expenseAuditHistory).where(eq(expenseAuditHistory.expenseId, expenseId)).orderBy(desc(expenseAuditHistory.changedAt));
  }

  async createExpenseAudit(audit: InsertExpenseAudit): Promise<ExpenseAudit> {
    const [created] = await db.insert(expenseAuditHistory).values(audit).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
