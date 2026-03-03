
import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { createUserSchema, updateUserSchema, insertLotSchema, insertProcessingRecordSchema, insertOutwardRecordSchema, insertPackagingSizeSchema } from "@shared/schema";
import { seedProductsAndWarehouses, seedEmployees, seedRoles } from "./seed-data";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import express from "express";

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Simple in-memory token store (use Redis/DB in production)
const tokenStore = new Map<string, { type: 'user' | 'employee', id: number, expiresAt: number }>();

// Helper functions to get Indian Standard Time (IST = UTC+5:30)
function getISTDate(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(0, 10);
}

function getISTTime(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(11, 16); // HH:mm format
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function createToken(type: 'user' | 'employee', id: number): string {
  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  tokenStore.set(token, { type, id, expiresAt });
  return token;
}

function validateToken(token: string): { type: 'user' | 'employee', id: number } | null {
  const session = tokenStore.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  return { type: session.type, id: session.id };
}

function deleteToken(token: string): void {
  tokenStore.delete(token);
}

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
  
  app.use("/uploads", express.static("uploads"));

  // Google domain verification
  app.get("/google04e2cf6bed3e661f.html", (req, res) => {
    res.send("google-site-verification: google04e2cf6bed3e661f.html");
  });
  
  // === TOKEN-BASED AUTH MIDDLEWARE ===
  // Extract token from Authorization header and attach user/employee ID to request
  app.use((req: any, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const session = validateToken(token);
      if (session) {
        if (session.type === 'user') {
          req.userId = session.id;
        } else {
          req.employeeId = session.id;
        }
        req.authToken = token;
      }
    }
    next();
  });
  

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) { // In prod use hashing!
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = createToken('user', user.id);
      res.json({ ...user, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.auth.logout.path, (req: any, res) => {
    if (req.authToken) {
      deleteToken(req.authToken);
    }
    res.json({ message: "Logged out" });
  });

  app.get(api.auth.me.path, async (req: any, res) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json(null);
    
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json(null);
    
    res.json(user);
  });

  // Get current user's permissions
  app.get("/api/auth/permissions", async (req: any, res) => {
    const userId = req.userId;
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
  // Routes that employees can access for reading/writing - permissions are further checked by checkPermission middleware
  const employeeAccessibleRoutes = [
    '/api/lots', '/api/stock', '/api/processing', '/api/outward', '/api/packaging'
  ];
  
  // Reference data routes that employees can only READ (GET requests only)
  const employeeReadOnlyRoutes = [
    '/api/products', '/api/locations', '/api/packaging-sizes'
  ];
  
  const checkRoleForPath = (routePath: string) => {
    return async (req: any, res: any, next: any) => {
      // Allow employee access to certain routes - individual endpoints check permissions via checkPermission
      if (req.employeeId) {
        // Full access routes - let checkPermission handle the action-level authorization
        if (employeeAccessibleRoutes.includes(routePath)) {
          return next();
        }
        // Read-only access routes - only allow GET requests
        if (employeeReadOnlyRoutes.includes(routePath) && req.method === 'GET') {
          return next();
        }
      }
      
      const userId = req.userId;
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

  // Reference data resources that all authenticated employees can view
  const referenceDataResources: Resource[] = ['products', 'locations', 'packagingSizes', 'lots', 'stock'];
  
  // Granular permission check middleware
  const checkPermission = (resource: Resource, action: Action) => {
    return async (req: any, res: any, next: any) => {
      // Check if employee is authenticated and has role-based permissions
      if (req.employeeId) {
        const employee = await storage.getEmployee(req.employeeId);
        if (!employee) {
          return res.status(401).json({ message: "Employee not found" });
        }
        
        // Allow all employees to view reference data (products, locations, packaging sizes)
        if (action === 'view' && referenceDataResources.includes(resource)) {
          (req as any).employee = employee;
          return next();
        }
        
        if (employee.role) {
          // Get role permissions from roles table
          const role = await storage.getRoleByName(employee.role);
          if (role && role.permissions) {
            const permissions = typeof role.permissions === 'string' 
              ? JSON.parse(role.permissions) 
              : role.permissions;
            const resourcePerms = permissions[resource] || [];
            if (resourcePerms.includes(action)) {
              (req as any).employee = employee;
              return next();
            }
          }
        }
        return res.status(403).json({ 
          message: `Access denied. You don't have permission to ${action} ${resource}.` 
        });
      }
      
      const userId = req.userId;
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

  app.delete("/api/users/:id", async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUserId = req.userId;
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

  app.patch("/api/locations/:id", checkPermission('locations', 'edit'), async (req, res) => {
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

  app.patch("/api/batches/:id", checkPermission('batches', 'edit'), async (req, res) => {
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

  app.delete("/api/batches/:id", checkPermission('batches', 'delete'), async (req, res) => {
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

  app.post(api.stock.move.path, async (req: any, res) => {
    try {
      const input = api.stock.move.input.parse(req.body);
      const movement = await storage.createStockMovement(input);
      
      // Create notification if employee created the record
      if (req.employeeId && input.createdBy) {
        const employee = await storage.getEmployee(req.employeeId);
        if (employee) {
          await storage.createNotification({
            type: "stock_movement",
            message: `${employee.fullName} recorded a stock movement of ${input.quantity} kg`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            resourceType: "stock_movement",
            resourceId: movement.id,
          });
        }
      }
      
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
  app.post(api.packaging.create.path, checkPermission('packaging', 'create'), async (req: any, res) => {
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
      
      // Create notification if employee created the record
      if (req.employeeId && input.createdBy) {
        const employee = await storage.getEmployee(req.employeeId);
        if (employee) {
          await storage.createNotification({
            type: "packing",
            message: `${employee.fullName} packed ${input.numberOfPackets} bags of ${input.packetSize}`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            resourceType: "packaging_output",
            resourceId: output.id,
          });
        }
      }
      
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
      const body = { ...req.body };
      if (body.joinDate === "") body.joinDate = null;
      if (body.password === "") delete body.password;
      const input = api.employees.create.input.parse(body);
      const employee = await storage.createEmployee(input);
      res.status(201).json(employee);
    } catch (e: any) {
      console.error("Employee create error:", e.message || e);
      res.status(400).json({ message: e.message || "Validation failed" });
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
      const { id: _id, createdAt, ...updates } = req.body;
      if (updates.joinDate === "" || updates.joinDate === undefined) updates.joinDate = null;
      if (updates.password === "" || updates.password === undefined) delete updates.password;
      const updated = await storage.updateEmployee(id, updates);
      if (!updated) return res.status(404).json({ message: "Employee not found" });
      res.json(updated);
    } catch (e: any) {
      console.error("Employee update error:", e.message || e);
      res.status(400).json({ message: e.message || "Update failed" });
    }
  });

  // === EMPLOYEE MANAGEMENT ROUTES ===
  app.get("/api/employees", checkPermission('employees', 'view'), async (req, res) => {
    const employees = await storage.getEmployees();
    res.json(employees);
  });

  app.post("/api/employees", checkPermission('employees', 'create'), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.joinDate === "") body.joinDate = null;
      if (body.password === "") delete body.password;
      const employee = await storage.createEmployee(body);
      res.status(201).json(employee);
    } catch (e: any) {
      console.error("Employee create error:", e.message || e);
      res.status(400).json({ message: e.message || "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", checkPermission('employees', 'edit'), async (req, res) => {
    try {
      const { id: _id, createdAt, ...body } = req.body;
      if (body.joinDate === "") body.joinDate = null;
      if (body.password === "" || body.password === undefined) delete body.password;
      const updated = await storage.updateEmployee(Number(req.params.id), body);
      if (!updated) return res.status(404).json({ message: "Employee not found" });
      res.json(updated);
    } catch (e: any) {
      console.error("Employee update error:", e.message || e);
      res.status(400).json({ message: e.message || "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", checkPermission('employees', 'delete'), async (req, res) => {
    try {
      await storage.deleteEmployee(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: "Failed to delete employee" });
    }
  });

  // === DRYER ROUTES ===
  app.get("/api/dryer", async (req: any, res) => {
    try {
      const entries = await storage.getDryerEntries();
      res.json(entries);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to fetch dryer entries" });
    }
  });

  app.get("/api/dryer/:id", async (req: any, res) => {
    try {
      const entry = await storage.getDryerEntry(Number(req.params.id));
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to fetch dryer entry" });
    }
  });

  app.post("/api/dryer", async (req: any, res) => {
    try {
      const body = { ...req.body };
      const nullableStrFields = ['shellingDate'];
      const nullableNumFields = ['intakeQuantity', 'shellingQty', 'intakeMoisture'];
      nullableStrFields.forEach(f => { if (body[f] === "") body[f] = null; });
      nullableNumFields.forEach(f => { if (body[f] === "" || body[f] === undefined) body[f] = null; });
      if (body.remarks === "") body.remarks = null;
      const entry = await storage.createDryerEntry(body);
      res.status(201).json(entry);
    } catch (e: any) {
      console.error("Dryer create error:", e.message || e);
      res.status(400).json({ message: e.message || "Failed to create dryer entry" });
    }
  });

  app.patch("/api/dryer/:id", async (req: any, res) => {
    try {
      const body = { ...req.body };
      const nullableStrFields = ['shellingDate'];
      const nullableNumFields = ['intakeQuantity', 'shellingQty', 'intakeMoisture'];
      nullableStrFields.forEach(f => { if (body[f] === "") body[f] = null; });
      nullableNumFields.forEach(f => { if (body[f] === "") body[f] = null; });
      if (body.remarks === "") body.remarks = null;
      const { id: _id, createdAt, updatedAt, ...updates } = body;
      const updated = await storage.updateDryerEntry(Number(req.params.id), updates);
      if (!updated) return res.status(404).json({ message: "Entry not found" });
      res.json(updated);
    } catch (e: any) {
      console.error("Dryer update error:", e.message || e);
      res.status(400).json({ message: e.message || "Failed to update dryer entry" });
    }
  });

  app.delete("/api/dryer/:id", async (req: any, res) => {
    try {
      await storage.deleteDryerEntry(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete dryer entry" });
    }
  });

  app.post("/api/dryer/auto-expire", async (req: any, res) => {
    try {
      const entries = await storage.getDryerEntries();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let expired = 0;
      for (const entry of entries) {
        if (entry.status === "intake") {
          const dueDate = new Date(entry.fiveDayDueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (today > dueDate) {
            expired++;
          }
        }
      }
      res.json({ expired, message: `${expired} entries auto-expired` });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Auto-expire failed" });
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

  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", checkPermission('products', 'create'), async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", checkPermission('products', 'edit'), async (req, res) => {
    try {
      const updated = await storage.updateProduct(Number(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Product not found" });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", checkPermission('products', 'delete'), async (req, res) => {
    try {
      await storage.deleteProduct(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: "Failed to delete product" });
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

  app.post("/api/lots", checkPermission('lots', 'create'), async (req: any, res) => {
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
      
      // Create notification if employee created the record
      if (req.employeeId && validatedData.createdBy) {
        const employee = await storage.getEmployee(req.employeeId);
        if (employee) {
          await storage.createNotification({
            type: "inward",
            message: `${employee.fullName} created inward lot ${lot.lotNumber} (${lot.initialQuantity} kg)`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            resourceType: "lot",
            resourceId: lot.id,
          });
        }
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

  app.post("/api/processing", checkPermission('processing', 'create'), async (req: any, res) => {
    try {
      const validatedData = insertProcessingRecordSchema.parse(req.body);
      const record = await storage.createProcessingRecord(validatedData);
      
      // Create notification if employee created the record
      if (req.employeeId && validatedData.createdBy) {
        const employee = await storage.getEmployee(req.employeeId);
        if (employee) {
          await storage.createNotification({
            type: "processing",
            message: `${employee.fullName} created a ${validatedData.processingType} processing record`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            resourceType: "processing_record",
            resourceId: record.id,
          });
        }
      }
      
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
      
      // Get the input lot's stock balance to find the location
      const inputStockBalances = await storage.getStockBalancesByLot(record.inputLotId);
      const inputLooseBalance = inputStockBalances.find((b: any) => b.stockForm === 'loose');
      const locationId = inputLooseBalance?.locationId || (inputStockBalances[0]?.locationId);
      
      // Validate stock availability
      const inputQuantity = Number(record.inputQuantity);
      const availableStock = inputLooseBalance ? Number(inputLooseBalance.quantity) : 0;
      
      if (inputQuantity > availableStock) {
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${availableStock.toFixed(2)} KG, Required: ${inputQuantity.toFixed(2)} KG` 
        });
      }
      
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
      
      // Decrease input lot stock balance
      if (locationId) {
        await storage.adjustStockBalance(
          record.inputLotId,
          locationId,
          'loose',
          -inputQuantity
        );
        
        // Create stock balance for output lot
        await storage.createStockBalance({
          lotId: outputLot.id,
          locationId: locationId,
          stockForm: 'loose',
          quantity: String(outputQuantity),
          packetSize: null,
        });
      }
      
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

  app.post("/api/outward", checkPermission('outward', 'create'), async (req: any, res) => {
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
      
      // Create notification if employee created the record
      if (req.employeeId && validatedData.createdBy) {
        const employee = await storage.getEmployee(req.employeeId);
        if (employee) {
          await storage.createNotification({
            type: "outward",
            message: `${employee.fullName} created dispatch record to ${validatedData.destinationType} (${validatedData.quantity} ${validatedData.stockForm === 'packed' ? 'packets' : 'kg'})`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            resourceType: "outward_record",
            resourceId: record.id,
          });
        }
      }
      
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

  // === NOTIFICATIONS ROUTES ===
  app.get("/api/notifications", async (req: any, res) => {
    if (!req.userId) return res.status(401).json({ message: "Authentication required" });
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await storage.getNotifications(limit);
    res.json(notifications);
  });

  app.get("/api/notifications/unread-count", async (req: any, res) => {
    if (!req.userId) return res.status(401).json({ message: "Authentication required" });
    const count = await storage.getUnreadNotificationsCount();
    res.json({ count });
  });

  app.patch("/api/notifications/:id/read", async (req: any, res) => {
    if (!req.userId) return res.status(401).json({ message: "Authentication required" });
    const notification = await storage.markNotificationAsRead(parseInt(req.params.id));
    res.json(notification);
  });

  app.post("/api/notifications/mark-all-read", async (req: any, res) => {
    if (!req.userId) return res.status(401).json({ message: "Authentication required" });
    await storage.markAllNotificationsAsRead();
    res.json({ success: true });
  });

  // === EMPLOYEE PORTAL ROUTES ===
  app.post("/api/employee/login", async (req, res) => {
    try {
      const { employeeId, password } = req.body;
      
      if (!employeeId || !password) {
        return res.status(400).json({ message: "Email, mobile number, or Employee ID and password are required" });
      }
      
      let employee = await storage.getEmployeeByEmployeeId(employeeId);
      
      if (!employee) {
        employee = await storage.getEmployeeByEmailOrPhone(employeeId);
      }
      
      if (!employee) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const expectedPassword = employee.password || employee.employeeId;
      if (password !== expectedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = createToken('employee', employee.id);
      res.json({ ...employee, token });
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.post("/api/employee/logout", (req: any, res) => {
    if (req.authToken) {
      deleteToken(req.authToken);
    }
    res.json({ message: "Logged out" });
  });

  app.get("/api/employee/me", async (req: any, res) => {
    const employeeId = req.employeeId;
    if (!employeeId) return res.status(401).json(null);
    
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(401).json(null);
    
    res.json(employee);
  });

  app.get("/api/employee/profile", async (req: any, res) => {
    const employeeId = req.employeeId;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });
    
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(401).json({ message: "Employee not found" });
    
    const { password, ...profileData } = employee;
    res.json(profileData);
  });

  app.post("/api/employee/update-password", async (req: any, res) => {
    const employeeId = req.employeeId;
    if (!employeeId) return res.status(401).json({ message: "Unauthorized" });
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    
    if (newPassword.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }
    
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(401).json({ message: "Employee not found" });
    
    const expectedPassword = employee.password || employee.employeeId;
    if (currentPassword !== expectedPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    await storage.updateEmployee(employee.id, { password: newPassword });
    res.json({ message: "Password updated successfully" });
  });

  // Get employee permissions based on their role
  app.get("/api/employee/permissions", async (req: any, res) => {
    const employeeId = req.employeeId;
    if (!employeeId) return res.status(401).json(null);
    
    const employee = await storage.getEmployee(employeeId);
    if (!employee) return res.status(401).json(null);
    
    // Look up role permissions by the employee's role name
    const role = await storage.getRoleByName(employee.role);
    
    if (role) {
      return res.json({
        role: employee.role,
        permissions: role.permissions || {}
      });
    }
    
    // Default: only basic employee permissions (dashboard/attendance/payslips)
    // No plant operations access unless role is configured
    return res.json({
      role: employee.role,
      permissions: {
        dashboard: ["view"],
        attendance: ["view"],
        payroll: ["view"]
      }
    });
  });

  app.post("/api/employee/punch-in", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const today = getISTDate();
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      if (existingAttendance?.checkIn) {
        return res.status(400).json({ message: "Already punched in today" });
      }
      
      const now = getISTTime();
      
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
      
      // Create notification for admin
      const employee = await storage.getEmployee(employeeId);
      if (employee) {
        await storage.createNotification({
          type: "punch_in",
          message: `${employee.fullName} punched in at ${now}`,
          employeeId: employee.id,
          employeeName: employee.fullName,
        });
      }
      
      res.json({ message: "Punched in successfully", time: now });
    } catch (error) {
      res.status(400).json({ message: "Punch in failed" });
    }
  });

  app.post("/api/employee/punch-out", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const today = getISTDate();
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      if (!existingAttendance?.checkIn) {
        return res.status(400).json({ message: "Please punch in first" });
      }
      
      if (existingAttendance.checkOut) {
        return res.status(400).json({ message: "Already punched out today" });
      }
      
      const now = getISTTime();
      await storage.updateAttendance(existingAttendance.id, { checkOut: now });
      
      // Create notification for admin
      const employee = await storage.getEmployee(employeeId);
      if (employee) {
        await storage.createNotification({
          type: "punch_out",
          message: `${employee.fullName} punched out at ${now}`,
          employeeId: employee.id,
          employeeName: employee.fullName,
        });
      }
      
      res.json({ message: "Punched out successfully", time: now });
    } catch (error) {
      res.status(400).json({ message: "Punch out failed" });
    }
  });

  app.get("/api/employee/attendance/today", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const today = getISTDate();
      const attendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      res.json(attendance || null);
    } catch (error) {
      res.status(400).json({ message: "Failed to get attendance" });
    }
  });

  app.get("/api/employee/attendance", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const records = await storage.getAttendanceByEmployee(employeeId);
      res.json(records);
    } catch (error) {
      res.status(400).json({ message: "Failed to get attendance" });
    }
  });

  app.get("/api/employee/payslips", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const payslips = await storage.getPayrollsByEmployee(employeeId);
      res.json(payslips);
    } catch (error) {
      res.status(400).json({ message: "Failed to get payslips" });
    }
  });

  app.get("/api/employee/operations", async (req: any, res) => {
    try {
      const empId = req.employeeId;
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

  app.get("/api/employee/payslips/:id/download", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
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

  // === ADMIN TRIP ROUTES ===
  app.get("/api/trips", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "manager"].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const allTrips = await storage.getTrips();
      const employees = await storage.getEmployees();
      const employeeMap = new Map(employees.map(e => [e.id, e]));
      const tripsWithEmployee = allTrips.map(trip => ({
        ...trip,
        employeeName: employeeMap.get(trip.employeeId)?.fullName || "Unknown",
        employeeCode: employeeMap.get(trip.employeeId)?.employeeId || "N/A",
      }));
      res.json(tripsWithEmployee);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/:id", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "manager"].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      const visits = await storage.getTripVisits(id);
      const employee = await storage.getEmployee(trip.employeeId);
      res.json({
        ...trip,
        employeeName: employee?.fullName || "Unknown",
        employeeCode: employee?.employeeId || "N/A",
        visits,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch trip" });
    }
  });

  app.patch("/api/trips/:id/approve", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "manager"].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      if (trip.status !== "submitted") return res.status(400).json({ message: "Trip is not submitted for approval" });
      const updated = await storage.updateTrip(id, {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to approve trip" });
    }
  });

  app.patch("/api/trips/:id/reject", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "manager"].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const trip = await storage.getTrip(id);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      if (trip.status !== "submitted") return res.status(400).json({ message: "Trip is not submitted for approval" });
      const updated = await storage.updateTrip(id, {
        status: "rejected",
        rejectionReason: reason || "Rejected by admin",
        approvedBy: userId,
        approvedAt: new Date(),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reject trip" });
    }
  });

  // === EMPLOYEE TRIP ROUTES ===
  app.get("/api/employee/trips", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      const employeeTrips = await storage.getTripsByEmployee(employeeId);
      res.json(employeeTrips);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch trips" });
    }
  });

  app.get("/api/employee/trips/:id", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip || trip.employeeId !== employeeId) return res.status(404).json({ message: "Trip not found" });
      const visits = await storage.getTripVisits(id);
      res.json({ ...trip, visits });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch trip" });
    }
  });

  app.post("/api/employee/trips", upload.single("startMeterPhoto"), async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      const { startLatitude, startLongitude, startLocationName, startMeterReading } = req.body;
      const startMeterPhoto = req.file ? `/uploads/${req.file.filename}` : null;
      const trip = await storage.createTrip({
        employeeId,
        status: "started",
        startTime: new Date(),
        startLatitude: startLatitude || null,
        startLongitude: startLongitude || null,
        startLocationName: startLocationName || null,
        startMeterReading: startMeterReading || null,
        startMeterPhoto,
      });
      const employee = await storage.getEmployee(employeeId);
      if (employee) {
        await storage.createNotification({
          type: "trip_start",
          message: `${employee.fullName} started a trip`,
          employeeId: employee.id,
          employeeName: employee.fullName,
        });
      }
      res.json(trip);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create trip" });
    }
  });

  app.patch("/api/employee/trips/:id/end", upload.single("endMeterPhoto"), async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip || trip.employeeId !== employeeId) return res.status(404).json({ message: "Trip not found" });
      if (trip.status === "submitted" || trip.status === "approved") {
        return res.status(400).json({ message: "Trip already ended" });
      }
      const { endLatitude, endLongitude, endLocationName, endMeterReading, expenseAmount } = req.body;
      const endMeterPhoto = req.file ? `/uploads/${req.file.filename}` : null;
      const startReading = parseFloat(trip.startMeterReading as string) || 0;
      const endReading = parseFloat(endMeterReading) || 0;
      const totalKm = endReading > startReading ? (endReading - startReading).toString() : "0";
      const updated = await storage.updateTrip(id, {
        status: "submitted",
        endTime: new Date(),
        endLatitude: endLatitude || null,
        endLongitude: endLongitude || null,
        endLocationName: endLocationName || null,
        endMeterReading: endMeterReading || null,
        endMeterPhoto,
        totalKm,
        expenseAmount: expenseAmount || null,
      });
      const employee = await storage.getEmployee(employeeId);
      if (employee) {
        await storage.createNotification({
          type: "trip_end",
          message: `${employee.fullName} submitted trip for approval (${totalKm} km)`,
          employeeId: employee.id,
          employeeName: employee.fullName,
        });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to end trip" });
    }
  });

  app.post("/api/employee/trips/:id/visits", upload.single("punchInPhoto"), async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.employeeId !== employeeId) return res.status(404).json({ message: "Trip not found" });
      if (trip.status === "submitted" || trip.status === "approved") {
        return res.status(400).json({ message: "Trip already ended" });
      }
      const { punchInLatitude, punchInLongitude, punchInLocationName, remarks } = req.body;
      const punchInPhoto = req.file ? `/uploads/${req.file.filename}` : null;
      const visit = await storage.createTripVisit({
        tripId,
        punchInTime: new Date(),
        punchInLatitude: punchInLatitude || null,
        punchInLongitude: punchInLongitude || null,
        punchInLocationName: punchInLocationName || null,
        punchInPhoto,
        remarks: remarks || null,
        status: "punched_in",
      });
      await storage.updateTrip(tripId, { status: "in_progress" });
      res.json(visit);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create visit" });
    }
  });

  app.patch("/api/employee/trips/:id/visits/:visitId/punch-out", upload.single("punchOutPhoto"), async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      const tripId = parseInt(req.params.id);
      const visitId = parseInt(req.params.visitId);
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.employeeId !== employeeId) return res.status(404).json({ message: "Trip not found" });
      const { punchOutLatitude, punchOutLongitude, punchOutLocationName } = req.body;
      const punchOutPhoto = req.file ? `/uploads/${req.file.filename}` : null;
      const updated = await storage.updateTripVisit(visitId, {
        punchOutTime: new Date(),
        punchOutLatitude: punchOutLatitude || null,
        punchOutLongitude: punchOutLongitude || null,
        punchOutLocationName: punchOutLocationName || null,
        punchOutPhoto,
        status: "completed",
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to punch out" });
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
      password: "admin123",
      role: "admin",
      fullName: "System Administrator"
    });
    console.log("Seeded admin user");
  }

  await seedProductsAndWarehouses();
  await seedRoles();
  await seedEmployees();
}
