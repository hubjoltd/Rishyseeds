
import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { createUserSchema, updateUserSchema, insertLotSchema, insertProcessingRecordSchema, insertOutwardRecordSchema, insertPackagingSizeSchema } from "@shared/schema";
import { seedProductsAndWarehouses } from "./seed-data";

const SessionStore = MemoryStore(session);

type UserRole = 'admin' | 'manager' | 'hr' | 'godown_operator' | 'production_operator' | 'dispatch_operator';
type Action = 'view' | 'create' | 'edit' | 'delete';
type Resource = 'batches' | 'locations' | 'stock' | 'packaging' | 'products' | 'employees' | 'attendance' | 'payroll' | 'users' | 'reports' | 'dashboard' | 'lots' | 'processing' | 'outward' | 'packagingSizes';

// Granular role-based permissions system
const rolePrivileges: Record<UserRole, Record<Resource, Action[]>> = {
  admin: {
    batches: ['view', 'create', 'edit', 'delete'],
    locations: ['view', 'create', 'edit', 'delete'],
    stock: ['view', 'create', 'edit', 'delete'],
    packaging: ['view', 'create', 'edit', 'delete'],
    products: ['view', 'create', 'edit', 'delete'],
    employees: ['view', 'create', 'edit', 'delete'],
    attendance: ['view', 'create', 'edit', 'delete'],
    payroll: ['view', 'create', 'edit', 'delete'],
    users: ['view', 'create', 'edit', 'delete'],
    reports: ['view'],
    dashboard: ['view'],
    lots: ['view', 'create', 'edit', 'delete'],
    processing: ['view', 'create', 'edit', 'delete'],
    outward: ['view', 'create', 'edit', 'delete'],
    packagingSizes: ['view', 'create', 'edit', 'delete'],
  },
  manager: {
    batches: ['view', 'create', 'edit'],
    locations: ['view', 'create', 'edit'],
    stock: ['view', 'create', 'edit'],
    packaging: ['view', 'create', 'edit'],
    products: ['view', 'create'],
    employees: ['view'],
    attendance: ['view'],
    payroll: [],
    users: [],
    reports: ['view'],
    dashboard: ['view'],
    lots: ['view', 'create', 'edit'],
    processing: ['view', 'create', 'edit'],
    outward: ['view', 'create', 'edit'],
    packagingSizes: ['view', 'create', 'edit'],
  },
  hr: {
    batches: ['view'],
    locations: ['view'],
    stock: ['view'],
    packaging: ['view'],
    products: ['view'],
    employees: ['view', 'create', 'edit', 'delete'],
    attendance: ['view', 'create', 'edit', 'delete'],
    payroll: ['view', 'create', 'edit', 'delete'],
    users: [],
    reports: ['view'],
    dashboard: ['view'],
    lots: ['view'],
    processing: ['view'],
    outward: ['view'],
    packagingSizes: ['view'],
  },
  godown_operator: {
    batches: ['view'],
    locations: ['view'],
    stock: ['view', 'create', 'edit'],
    packaging: ['view'],
    products: ['view'],
    employees: [],
    attendance: [],
    payroll: [],
    users: [],
    reports: ['view'],
    dashboard: ['view'],
    lots: ['view', 'create', 'edit'],
    processing: ['view'],
    outward: ['view'],
    packagingSizes: ['view'],
  },
  production_operator: {
    batches: ['view'],
    locations: ['view'],
    stock: ['view'],
    packaging: ['view', 'create', 'edit'],
    products: ['view'],
    employees: [],
    attendance: [],
    payroll: [],
    users: [],
    reports: ['view'],
    dashboard: ['view'],
    lots: ['view'],
    processing: ['view', 'create', 'edit'],
    outward: ['view'],
    packagingSizes: ['view'],
  },
  dispatch_operator: {
    batches: ['view'],
    locations: ['view'],
    stock: ['view'],
    packaging: ['view'],
    products: ['view'],
    employees: [],
    attendance: [],
    payroll: [],
    users: [],
    reports: ['view'],
    dashboard: ['view'],
    lots: ['view'],
    processing: ['view'],
    outward: ['view', 'create', 'edit'],
    packagingSizes: ['view'],
  },
};

// Check if a role has permission for a specific action on a resource
function hasPermission(role: UserRole, resource: Resource, action: Action): boolean {
  return rolePrivileges[role]?.[resource]?.includes(action) || false;
}

// Legacy path-based permissions for backwards compatibility
const rolePermissions: Record<string, UserRole[]> = {
  '/api/batches': ['admin', 'manager'],
  '/api/locations': ['admin', 'manager'],
  '/api/stock': ['admin', 'manager'],
  '/api/packaging': ['admin', 'manager'],
  '/api/products': ['admin', 'manager'],
  '/api/employees': ['admin', 'hr'],
  '/api/attendance': ['admin', 'hr'],
  '/api/payroll': ['admin', 'hr'],
  '/api/dashboard': ['admin', 'manager', 'hr'],
  '/api/reports': ['admin', 'manager', 'hr'],
  '/api/users': ['admin'],
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === SESSION SETUP ===
  app.set('trust proxy', 1);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'rishi-seeds-secret-key',
    resave: true,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: false, // Allow cookies on HTTP in development
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) { // In prod use hashing!
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      (req.session as any).userId = user.id;
      
      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session error" });
        }
        res.json(user);
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json(null);
    
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json(null);
    
    res.json(user);
  });

  // Get current user's permissions
  app.get("/api/auth/permissions", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    
    const userRole = user.role as UserRole;
    const permissions = rolePrivileges[userRole] || {};
    
    res.json({
      role: userRole,
      permissions,
    });
  });

  // === ROLE-BASED AUTHORIZATION MIDDLEWARE ===
  const checkRoleForPath = (routePath: string) => {
    return async (req: any, res: any, next: any) => {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userRole = user.role as UserRole;
      const allowedRoles = rolePermissions[routePath];
      
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied. Insufficient permissions." });
      }
      
      next();
    };
  };

  // Granular permission check middleware
  const checkPermission = (resource: Resource, action: Action) => {
    return async (req: any, res: any, next: any) => {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userRole = user.role as UserRole;
      
      if (!hasPermission(userRole, resource, action)) {
        return res.status(403).json({ 
          message: `Access denied. You don't have permission to ${action} ${resource}.` 
        });
      }
      
      (req as any).user = user;
      next();
    };
  };
  
  app.use('/api/batches', checkRoleForPath('/api/batches'));
  app.use('/api/locations', checkRoleForPath('/api/locations'));
  app.use('/api/stock', checkRoleForPath('/api/stock'));
  app.use('/api/packaging', checkRoleForPath('/api/packaging'));
  app.use('/api/products', checkRoleForPath('/api/products'));
  app.use('/api/employees', checkRoleForPath('/api/employees'));
  app.use('/api/attendance', checkRoleForPath('/api/attendance'));
  app.use('/api/payroll', checkRoleForPath('/api/payroll'));
  app.use('/api/dashboard', checkRoleForPath('/api/dashboard'));
  app.use('/api/reports', checkRoleForPath('/api/reports'));
  app.use('/api/users', checkRoleForPath('/api/users'));

  // === USER MANAGEMENT ROUTES (Admin only) ===
  app.get("/api/users", async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const result = createUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid input" });
      }
      const { username, password, role, fullName } = result.data;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({ username, password, role, fullName });
      res.status(201).json(user);
    } catch (e) {
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid input" });
      }
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updated = await storage.updateUser(id, result.data);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUserId = (req.session as any)?.userId;
      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  // === DASHBOARD ROUTES ===
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json({
      ...stats,
      pendingPayroll: 0, // Mock
      lowStockBatches: [] // Mock
    });
  });

  // === LOCATIONS ROUTES ===
  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation(input);
      res.status(201).json(location);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    const location = await storage.getLocation(Number(req.params.id));
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json(location);
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = req.body;
      const updated = await storage.updateLocation(id, updates);
      if (!updated) return res.status(404).json({ message: "Warehouse not found" });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete("/api/locations/:id", checkPermission('locations', 'delete'), async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      await storage.deleteLocation(id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: "Failed to delete warehouse" });
    }
  });

  // === BATCHES ROUTES ===
  app.get(api.batches.list.path, async (req, res) => {
    const batches = await storage.getBatches();
    res.json(batches);
  });

  app.post(api.batches.create.path, async (req, res) => {
    try {
      const input = api.batches.create.input.parse(req.body);
      const batch = await storage.createBatch(input);
      res.status(201).json(batch);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.get(api.batches.get.path, async (req, res) => {
    const batch = await storage.getBatch(Number(req.params.id));
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  });

  app.put(api.batches.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.batches.update.input.parse(req.body);
      const batch = await storage.updateBatch(id, input);
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      res.json(batch);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.delete(api.batches.delete.path, checkPermission('batches', 'delete'), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const batch = await storage.getBatch(id);
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      await storage.deleteBatch(id);
      res.status(204).send();
    } catch (e) {
      res.status(400).json({ message: "Delete failed" });
    }
  });

  // === STOCK ROUTES ===
  app.post(api.stock.entry.path, async (req, res) => {
    try {
      const input = api.stock.entry.input.parse(req.body);
      const entry = await storage.createStockEntry(input);
      res.status(201).json(entry);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.post(api.stock.move.path, async (req, res) => {
    try {
      const input = api.stock.move.input.parse(req.body);
      const movement = await storage.createStockMovement(input);
      res.status(201).json(movement);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Validation failed" });
    }
  });

  app.get(api.stock.history.path, async (req, res) => {
    const history = await storage.getStockMovements();
    res.json(history);
  });

  app.patch("/api/stock/movements/:id", checkPermission('stock', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateStockMovement(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Movement not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Update failed" });
    }
  });

  app.delete("/api/stock/movements/:id", checkPermission('stock', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStockMovement(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Delete failed" });
    }
  });

  // === PACKAGING ROUTES ===
  app.post(api.packaging.create.path, checkPermission('packaging', 'create'), async (req, res) => {
    try {
      const input = api.packaging.create.input.parse(req.body);
      
      // Validate required fields for stock adjustment
      if (!input.lotId || !input.locationId) {
        return res.status(400).json({ message: "Lot and Location are required" });
      }
      
      const totalQuantityKg = Number(input.totalQuantityKg) || 0;
      const wasteQuantity = Number(input.wasteQuantity) || 0;
      const looseUsed = totalQuantityKg + wasteQuantity;
      
      // Check loose stock availability
      const looseBalance = await storage.getStockBalanceByLotAndLocation(
        input.lotId, 
        input.locationId, 
        'loose'
      );
      const availableLoose = looseBalance ? Number(looseBalance.quantity) : 0;
      
      if (looseUsed > availableLoose) {
        return res.status(400).json({ 
          message: `Insufficient loose stock. Available: ${availableLoose.toFixed(2)} KG, Required: ${looseUsed.toFixed(2)} KG` 
        });
      }
      
      // Create packaging record
      const output = await storage.createPackagingOutput(input);
      
      // Decrease loose stock by total used (packed + waste)
      await storage.adjustStockBalance(
        input.lotId,
        input.locationId,
        'loose',
        -looseUsed
      );
      
      // Increase packed stock by number of packets
      await storage.adjustStockBalance(
        input.lotId,
        input.locationId,
        'packed',
        input.numberOfPackets,
        input.packetSize
      );
      
      res.status(201).json(output);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Validation failed" });
    }
  });

  app.get(api.packaging.list.path, async (req, res) => {
    const list = await storage.getPackagingOutputs();
    res.json(list);
  });

  app.patch("/api/packaging/:id", checkPermission('packaging', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePackagingOutput(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Packaging output not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Update failed" });
    }
  });

  app.delete("/api/packaging/:id", checkPermission('packaging', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePackagingOutput(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Delete failed" });
    }
  });

  // === EMPLOYEES ROUTES ===
  app.get(api.employees.list.path, async (req, res) => {
    const employees = await storage.getEmployees();
    res.json(employees);
  });

  app.post(api.employees.create.path, async (req, res) => {
    try {
      const input = api.employees.create.input.parse(req.body);
      const employee = await storage.createEmployee(input);
      res.status(201).json(employee);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.get(api.employees.get.path, async (req, res) => {
    const employee = await storage.getEmployee(Number(req.params.id));
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = req.body;
      const updated = await storage.updateEmployee(id, updates);
      if (!updated) return res.status(404).json({ message: "Employee not found" });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  // === ATTENDANCE ROUTES ===
  app.post(api.attendance.mark.path, async (req, res) => {
    try {
      const input = api.attendance.mark.input.parse(req.body);
      const att = await storage.markAttendance(input);
      res.status(201).json(att);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.get(api.attendance.list.path, async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const list = await storage.getAttendance(date);
    res.json(list);
  });

  // === PAYROLL ROUTES ===
  app.post(api.payroll.generate.path, async (req, res) => {
    try {
      const { month, employeeId } = api.payroll.generate.input.parse(req.body);
      
      const employees = await storage.getEmployees();
      const generatedPayrolls = [];

      for (const emp of employees) {
        if (employeeId && emp.id !== employeeId) continue;
        
        // Calculate salary using employee's configured allowances and deductions
        const basic = Number(emp.basicSalary || 0);
        const hra = Number(emp.hra || 0);
        const da = Number(emp.da || 0);
        const travelAllowance = Number(emp.travelAllowance || 0);
        const medicalAllowance = Number(emp.medicalAllowance || 0);
        const otherAllowances = Number(emp.otherAllowances || 0);
        
        const totalAllowances = hra + da + travelAllowance + medicalAllowance + otherAllowances;
        
        const pfDeduction = Number(emp.pfDeduction || 0);
        const esiDeduction = Number(emp.esiDeduction || 0);
        const tdsDeduction = Number(emp.tdsDeduction || 0);
        const otherDeductions = Number(emp.otherDeductions || 0);
        
        const totalDeductions = pfDeduction + esiDeduction + tdsDeduction + otherDeductions;
        
        const grossSalary = basic + totalAllowances;
        const netSalary = grossSalary - totalDeductions;
        
        const payroll = await storage.createPayroll({
          employeeId: emp.id,
          month,
          totalDays: 30,
          presentDays: "30", // Default full attendance, can be modified based on actual attendance
          basicPay: basic.toString(),
          allowances: totalAllowances.toString(),
          overtimeAmount: "0",
          deductions: totalDeductions.toString(),
          netSalary: netSalary.toString(),
          status: "generated"
        });
        generatedPayrolls.push(payroll);
      }
      
      res.status(201).json(generatedPayrolls);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.get(api.payroll.list.path, async (req, res) => {
    const list = await storage.getPayrolls();
    res.json(list);
  });

  // === PRODUCTS ROUTES ===
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to create product" });
    }
  });

  app.post("/api/seed-data", async (req, res) => {
    try {
      await seedProductsAndWarehouses();
      res.json({ message: "Products and warehouses seeded successfully" });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to seed data" });
    }
  });

  // === LOTS ROUTES ===
  app.get("/api/lots", checkPermission('lots', 'view'), async (req, res) => {
    const lotsList = await storage.getLots();
    res.json(lotsList);
  });

  app.get("/api/lots/:id", checkPermission('lots', 'view'), async (req, res) => {
    const lot = await storage.getLot(parseInt(req.params.id));
    if (!lot) {
      return res.status(404).json({ message: "Lot not found" });
    }
    res.json(lot);
  });

  app.post("/api/lots", checkPermission('lots', 'create'), async (req, res) => {
    try {
      const validatedData = insertLotSchema.parse(req.body);
      const lot = await storage.createLot(validatedData);
      
      // Create initial stock balance for the lot
      const locationId = req.body.locationId;
      if (locationId && lot.initialQuantity) {
        await storage.createStockBalance({
          lotId: lot.id,
          locationId: locationId,
          stockForm: lot.stockForm || 'loose',
          quantity: lot.initialQuantity,
          packetSize: null,
        });
      }
      
      res.status(201).json(lot);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to create lot" });
    }
  });

  app.patch("/api/lots/:id", checkPermission('lots', 'edit'), async (req, res) => {
    try {
      const validatedData = insertLotSchema.partial().parse(req.body);
      const lot = await storage.updateLot(parseInt(req.params.id), validatedData);
      if (!lot) {
        return res.status(404).json({ message: "Lot not found" });
      }
      res.json(lot);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to update lot" });
    }
  });

  app.delete("/api/lots/:id", checkPermission('lots', 'delete'), async (req, res) => {
    try {
      await storage.deleteLot(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete lot" });
    }
  });

  app.get("/api/lots/generate-number/:productId", checkPermission('lots', 'view'), async (req, res) => {
    try {
      const lotNumber = await storage.generateLotNumber(parseInt(req.params.productId));
      res.json({ lotNumber });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to generate lot number" });
    }
  });

  // === STOCK BALANCES ROUTES ===
  app.get("/api/stock-balances", checkPermission('stock', 'view'), async (req, res) => {
    const balances = await storage.getStockBalances();
    res.json(balances);
  });

  app.get("/api/stock-balances/lot/:lotId", checkPermission('stock', 'view'), async (req, res) => {
    const balances = await storage.getStockBalancesByLot(parseInt(req.params.lotId));
    res.json(balances);
  });

  // === PROCESSING RECORDS ROUTES ===
  app.get("/api/processing", checkPermission('processing', 'view'), async (req, res) => {
    const records = await storage.getProcessingRecords();
    res.json(records);
  });

  app.get("/api/processing/:id", checkPermission('processing', 'view'), async (req, res) => {
    const record = await storage.getProcessingRecord(parseInt(req.params.id));
    if (!record) {
      return res.status(404).json({ message: "Processing record not found" });
    }
    res.json(record);
  });

  app.post("/api/processing", checkPermission('processing', 'create'), async (req, res) => {
    try {
      const validatedData = insertProcessingRecordSchema.parse(req.body);
      const record = await storage.createProcessingRecord(validatedData);
      res.status(201).json(record);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to create processing record" });
    }
  });

  app.patch("/api/processing/:id", checkPermission('processing', 'edit'), async (req, res) => {
    try {
      const validatedData = insertProcessingRecordSchema.partial().parse(req.body);
      const record = await storage.updateProcessingRecord(parseInt(req.params.id), validatedData);
      if (!record) {
        return res.status(404).json({ message: "Processing record not found" });
      }
      res.json(record);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to update processing record" });
    }
  });

  app.delete("/api/processing/:id", checkPermission('processing', 'delete'), async (req, res) => {
    try {
      await storage.deleteProcessingRecord(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete processing record" });
    }
  });

  app.post("/api/processing/:id/complete", checkPermission('processing', 'edit'), async (req, res) => {
    try {
      const { outputQuantity, wasteQuantity } = req.body;
      
      if (!outputQuantity || outputQuantity <= 0) {
        return res.status(400).json({ message: "Output quantity must be positive" });
      }
      
      const processingId = parseInt(req.params.id);
      const record = await storage.getProcessingRecord(processingId);
      
      if (!record) {
        return res.status(404).json({ message: "Processing record not found" });
      }
      
      if (record.status === 'completed') {
        return res.status(400).json({ message: "Processing record already completed" });
      }
      
      const inputLot = await storage.getLot(record.inputLotId);
      if (!inputLot) {
        return res.status(404).json({ message: "Input lot not found" });
      }
      
      const product = await storage.getProduct(inputLot.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const outputLotNumber = await storage.generateLotNumber(inputLot.productId);
      
      const outputLot = await storage.createLot({
        lotNumber: outputLotNumber,
        productId: inputLot.productId,
        sourceType: "processing_output",
        sourceReferenceId: processingId,
        sourceName: `Processing #${processingId}`,
        initialQuantity: String(outputQuantity),
        quantityUnit: "kg",
        stockForm: "loose",
        status: "active",
        inwardDate: new Date().toISOString().slice(0, 10),
        remarks: `Output from processing ${record.processingType} of lot ${inputLot.lotNumber}`,
      });
      
      const updatedRecord = await storage.updateProcessingRecord(processingId, {
        outputQuantity: String(outputQuantity),
        wasteQuantity: String(wasteQuantity || 0),
        outputLotId: outputLot.id,
        status: "completed",
      });
      
      res.json({ record: updatedRecord, outputLot });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to complete processing" });
    }
  });

  // === OUTWARD RECORDS ROUTES ===
  app.get("/api/outward", checkPermission('outward', 'view'), async (req, res) => {
    const records = await storage.getOutwardRecords();
    res.json(records);
  });

  app.get("/api/outward/:id", checkPermission('outward', 'view'), async (req, res) => {
    const record = await storage.getOutwardRecord(parseInt(req.params.id));
    if (!record) {
      return res.status(404).json({ message: "Outward record not found" });
    }
    res.json(record);
  });

  app.post("/api/outward", checkPermission('outward', 'create'), async (req, res) => {
    try {
      const validatedData = insertOutwardRecordSchema.parse(req.body);
      
      // Stock validation: check if sufficient stock is available
      const stockBalance = await storage.getStockBalanceByLotAndLocation(
        validatedData.lotId,
        validatedData.locationId,
        validatedData.stockForm,
        validatedData.packetSize || undefined
      );
      
      const requestedQty = parseFloat(validatedData.quantity);
      const availableQty = stockBalance ? parseFloat(stockBalance.quantity) : 0;
      
      if (requestedQty > availableQty) {
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${availableQty.toFixed(2)} ${validatedData.stockForm === 'packed' ? 'packets' : 'KG'}, Requested: ${requestedQty.toFixed(2)}` 
        });
      }
      
      const record = await storage.createOutwardRecord(validatedData);
      res.status(201).json(record);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to create outward record" });
    }
  });

  app.patch("/api/outward/:id", checkPermission('outward', 'edit'), async (req, res) => {
    try {
      const validatedData = insertOutwardRecordSchema.partial().parse(req.body);
      const record = await storage.updateOutwardRecord(parseInt(req.params.id), validatedData);
      if (!record) {
        return res.status(404).json({ message: "Outward record not found" });
      }
      res.json(record);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to update outward record" });
    }
  });

  app.delete("/api/outward/:id", checkPermission('outward', 'delete'), async (req, res) => {
    try {
      await storage.deleteOutwardRecord(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete outward record" });
    }
  });

  // === PACKAGING SIZES MASTER ROUTES ===
  app.get("/api/packaging-sizes", checkPermission('packagingSizes', 'view'), async (req, res) => {
    const sizes = await storage.getPackagingSizes();
    res.json(sizes);
  });

  app.get("/api/packaging-sizes/:id", checkPermission('packagingSizes', 'view'), async (req, res) => {
    const size = await storage.getPackagingSize(parseInt(req.params.id));
    if (!size) {
      return res.status(404).json({ message: "Packaging size not found" });
    }
    res.json(size);
  });

  app.post("/api/packaging-sizes", checkPermission('packagingSizes', 'create'), async (req, res) => {
    try {
      const validatedData = insertPackagingSizeSchema.parse(req.body);
      const size = await storage.createPackagingSize(validatedData);
      res.status(201).json(size);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to create packaging size" });
    }
  });

  app.patch("/api/packaging-sizes/:id", checkPermission('packagingSizes', 'edit'), async (req, res) => {
    try {
      const validatedData = insertPackagingSizeSchema.partial().parse(req.body);
      const size = await storage.updatePackagingSize(parseInt(req.params.id), validatedData);
      if (!size) {
        return res.status(404).json({ message: "Packaging size not found" });
      }
      res.json(size);
    } catch (e: any) {
      if (e.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message || "Failed to update packaging size" });
    }
  });

  app.delete("/api/packaging-sizes/:id", checkPermission('packagingSizes', 'delete'), async (req, res) => {
    try {
      await storage.deletePackagingSize(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete packaging size" });
    }
  });

  // === EMPLOYEE PORTAL ROUTES ===
  app.post("/api/employee/login", async (req, res) => {
    try {
      const { employeeId, password } = req.body;
      
      if (!employeeId || !password) {
        return res.status(400).json({ message: "Employee ID and password are required" });
      }
      
      const employee = await storage.getEmployeeByEmployeeId(employeeId);
      
      if (!employee) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password (default password is employee ID if not set)
      const expectedPassword = employee.password || employee.employeeId;
      if (password !== expectedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      (req.session as any).employeeId = employee.id;
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.post("/api/employee/logout", (req, res) => {
    (req.session as any).employeeId = null;
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/employee/me", async (req, res) => {
    const employeeId = (req.session as any).employeeId;
    if (!employeeId) return res.status(401).json(null);
    
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(401).json(null);
    
    res.json(employee);
  });

  app.post("/api/employee/punch-in", async (req, res) => {
    try {
      const employeeId = (req.session as any).employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const today = new Date().toISOString().slice(0, 10);
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      if (existingAttendance?.checkIn) {
        return res.status(400).json({ message: "Already punched in today" });
      }
      
      const now = new Date().toTimeString().slice(0, 5);
      
      if (existingAttendance) {
        await storage.updateAttendance(existingAttendance.id, { checkIn: now, status: "present" });
      } else {
        await storage.markAttendance({
          employeeId,
          date: today,
          status: "present",
          checkIn: now,
        });
      }
      
      res.json({ message: "Punched in successfully", time: now });
    } catch (error) {
      res.status(400).json({ message: "Punch in failed" });
    }
  });

  app.post("/api/employee/punch-out", async (req, res) => {
    try {
      const employeeId = (req.session as any).employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const today = new Date().toISOString().slice(0, 10);
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      if (!existingAttendance?.checkIn) {
        return res.status(400).json({ message: "Please punch in first" });
      }
      
      if (existingAttendance.checkOut) {
        return res.status(400).json({ message: "Already punched out today" });
      }
      
      const now = new Date().toTimeString().slice(0, 5);
      await storage.updateAttendance(existingAttendance.id, { checkOut: now });
      
      res.json({ message: "Punched out successfully", time: now });
    } catch (error) {
      res.status(400).json({ message: "Punch out failed" });
    }
  });

  app.get("/api/employee/attendance/today", async (req, res) => {
    try {
      const employeeId = (req.session as any).employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const today = new Date().toISOString().slice(0, 10);
      const attendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      res.json(attendance || null);
    } catch (error) {
      res.status(400).json({ message: "Failed to get attendance" });
    }
  });

  app.get("/api/employee/attendance", async (req, res) => {
    try {
      const employeeId = (req.session as any).employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const records = await storage.getAttendanceByEmployee(employeeId);
      res.json(records);
    } catch (error) {
      res.status(400).json({ message: "Failed to get attendance" });
    }
  });

  app.get("/api/employee/payslips", async (req, res) => {
    try {
      const employeeId = (req.session as any).employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const payslips = await storage.getPayrollsByEmployee(employeeId);
      res.json(payslips);
    } catch (error) {
      res.status(400).json({ message: "Failed to get payslips" });
    }
  });

  app.get("/api/employee/operations", async (req, res) => {
    try {
      const empId = (req.session as any).employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      
      const employee = await storage.getEmployee(empId);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      
      // Get plant operations where this employee was involved
      const processingRecords = await storage.getProcessingRecordsByEmployee(employee.fullName);
      const outwardRecords = await storage.getOutwardRecordsByEmployee(employee.fullName);
      const packagingRecords = await storage.getPackagingOutputsByEmployee(employee.fullName);
      
      res.json({
        processing: processingRecords,
        outward: outwardRecords,
        packaging: packagingRecords,
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to get operations" });
    }
  });

  app.get("/api/employee/payslips/:id/download", async (req, res) => {
    try {
      const employeeId = (req.session as any).employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const payrollId = parseInt(req.params.id);
      const payroll = await storage.getPayroll(payrollId);
      
      if (!payroll || payroll.employeeId !== employeeId) {
        return res.status(404).json({ message: "Payslip not found" });
      }
      
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Helper function to escape HTML to prevent injection
      const escapeHtml = (str: string | null | undefined): string => {
        if (!str) return '-';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      };
      
      // Generate simple HTML payslip (can be converted to PDF later)
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${escapeHtml(payroll.month)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .company { font-size: 24px; font-weight: bold; }
    .title { font-size: 18px; color: #666; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .total { font-weight: bold; background: #f0f0f0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">Rishi Seeds Pvt Ltd</div>
    <div class="title">Payslip for ${escapeHtml(payroll.month)}</div>
  </div>
  
  <table>
    <tr><th>Employee ID</th><td>${escapeHtml(employee.employeeId)}</td></tr>
    <tr><th>Name</th><td>${escapeHtml(employee.fullName)}</td></tr>
    <tr><th>Department</th><td>${escapeHtml(employee.department)}</td></tr>
    <tr><th>Designation</th><td>${escapeHtml(employee.role)}</td></tr>
  </table>
  
  <h3>Earnings</h3>
  <table>
    <tr><th>Basic Pay</th><td>${Number(payroll.basicPay).toLocaleString()}</td></tr>
    <tr><th>Allowances</th><td>${Number(payroll.allowances || 0).toLocaleString()}</td></tr>
    <tr><th>Overtime</th><td>${Number(payroll.overtimeAmount || 0).toLocaleString()}</td></tr>
  </table>
  
  <h3>Deductions</h3>
  <table>
    <tr><th>Total Deductions</th><td>${Number(payroll.deductions || 0).toLocaleString()}</td></tr>
  </table>
  
  <table>
    <tr class="total"><th>Net Salary</th><td>${Number(payroll.netSalary).toLocaleString()}</td></tr>
  </table>
  
  <p style="margin-top: 40px; text-align: center; color: #666;">
    Generated on ${new Date().toLocaleDateString()}
  </p>
</body>
</html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${payroll.month}.html"`);
      res.send(html);
    } catch (error) {
      res.status(400).json({ message: "Failed to download payslip" });
    }
  });

  // === ROLES MANAGEMENT ROUTES ===
  const rolePermissionsSchema = z.record(z.array(z.enum(['view', 'create', 'edit', 'delete']))).default({});

  app.get("/api/roles", checkPermission('users', 'view'), async (req, res) => {
    try {
      const rolesList = await storage.getRoles();
      res.json(rolesList);
    } catch (error) {
      res.status(400).json({ message: "Failed to get roles" });
    }
  });

  app.post("/api/roles", checkPermission('users', 'create'), async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }
      const validatedPermissions = rolePermissionsSchema.parse(permissions || {});
      const role = await storage.createRole({ name, description, permissions: validatedPermissions });
      res.status(201).json(role);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid permissions format" });
      }
      res.status(400).json({ message: error.message || "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", checkPermission('users', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, permissions, isActive } = req.body;
      const validatedPermissions = permissions ? rolePermissionsSchema.parse(permissions) : undefined;
      const role = await storage.updateRole(id, { name, description, permissions: validatedPermissions, isActive });
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid permissions format" });
      }
      res.status(400).json({ message: error.message || "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", checkPermission('users', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRole(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete role" });
    }
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("admin");
  if (!existingUsers) {
    await storage.createUser({
      username: "admin",
      password: "admin123", // Default password
      role: "admin",
      fullName: "System Administrator"
    });
    console.log("Seeded admin user");
  }

  // Products already seeded via SQL, no need to seed here

  const existingLocations = await storage.getLocations();
  if (existingLocations.length === 0) {
    await storage.createLocation({ name: "Main Storage", type: "storage", address: "Warehouse A" });
    await storage.createLocation({ name: "Packaging Unit 1", type: "packaging", address: "Unit 1" });
    console.log("Seeded locations");
  }

  const existingEmployees = await storage.getEmployees();
  if (existingEmployees.length === 0) {
    await storage.createEmployee({
      employeeId: "EMP001",
      fullName: "Ramesh Kumar",
      role: "Supervisor",
      department: "Operations",
      salaryType: "monthly",
      basicSalary: "25000",
      workLocation: "Main Storage",
      status: "active",
      joinDate: "2025-01-01"
    });
    console.log("Seeded employees");
  }
}
