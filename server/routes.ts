
import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { createUserSchema, updateUserSchema } from "@shared/schema";

const SessionStore = MemoryStore(session);

type UserRole = 'admin' | 'manager' | 'hr';

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
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
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
      res.json(user);
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

  app.delete("/api/locations/:id", async (req, res) => {
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

  app.delete(api.batches.delete.path, async (req, res) => {
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

  // === PACKAGING ROUTES ===
  app.post(api.packaging.create.path, async (req, res) => {
    try {
      const input = api.packaging.create.input.parse(req.body);
      const output = await storage.createPackagingOutput(input);
      res.status(201).json(output);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.get(api.packaging.list.path, async (req, res) => {
    const list = await storage.getPackagingOutputs();
    res.json(list);
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
