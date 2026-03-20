
import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { createUserSchema, updateUserSchema, insertLotSchema, insertProcessingRecordSchema, insertOutwardRecordSchema, insertOutwardReturnSchema, insertPackagingSizeSchema } from "@shared/schema";
import { seedProductsAndWarehouses, seedEmployees, seedRoles } from "./seed-data";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BMfWv-0gEu0b6DEybeZJEMPcRvTsRB9UxZKZwD4hoStqoQ3gZRNib2RRvs1TSMKST4Kv_t-HnWBZTmU0ln6Jotw";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "gnULZuZ-jGv4b3KBumeqgiYYWqP5qlo9meA-ltqcfeE";

webpush.setVapidDetails("mailto:admin@rishiseeds.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function sendPushToEmployee(employeeDbId: number, title: string, body: string, url?: string) {
  try {
    const subs = await storage.getPushSubscriptionsByEmployee(employeeDbId);
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url: url || "/employee-portal", tag: `rishi-${Date.now()}` })
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await storage.deletePushSubscription(sub.endpoint);
        }
      }
    }
  } catch {}
}

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
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

  app.post("/api/employee/upload-punch-photo", upload.single("photo"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ url: photoUrl });
  });

  app.get("/api/download/:filename", (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(filePath);
  });

  app.get("/punch-share/:filename", (req, res) => {
    const { filename } = req.params;
    const { name, id, type, time, date, location } = req.query;
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Not found");
    }
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;
    const punchType = type === "in" ? "Punch In" : "Punch Out";
    const title = `${punchType} - ${name || "Employee"}`;
    const locStr = location ? ` | Location: ${location}` : "";
    const description = `ID: ${id || ""} | Time: ${time || ""} | Date: ${date || ""}${locStr} | Rishi Hybrid Seeds Pvt. Ltd.`;

    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:type" content="website">
<meta property="og:url" content="${baseUrl}/punch-share/${filename}?${new URLSearchParams(req.query as any).toString()}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
<style>
  body { font-family: sans-serif; margin: 0; padding: 20px; background: #f9fafb; display: flex; justify-content: center; }
  .card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; width: 100%; overflow: hidden; }
  .photo { width: 100%; max-height: 400px; object-fit: cover; }
  .details { padding: 16px; }
  .company { color: #2563eb; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
  .punch-type { font-size: 20px; font-weight: bold; color: ${type === "in" ? "#16a34a" : "#dc2626"}; margin-bottom: 4px; }
  .info { color: #374151; font-size: 14px; line-height: 1.6; }
</style>
</head>
<body>
<div class="card">
  <img src="${imageUrl}" class="photo" alt="Punch photo">
  <div class="details">
    <div class="company">Rishi Hybrid Seeds Pvt. Ltd.</div>
    <div class="punch-type">${punchType}</div>
    <div class="info">
      <strong>${name || ""}</strong> (${id || ""})<br>
      Time: ${time || ""}<br>
      Date: ${date || ""}${location ? `<br>Location: ${location}` : ""}
    </div>
  </div>
</div>
</body>
</html>`);
  });

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
    const [stats, allLots, allBalances, allLocations, allPackaging, allOutward] = await Promise.all([
      storage.getDashboardStats(),
      storage.getLots(),
      storage.getStockBalances(),
      storage.getLocations(),
      storage.getPackagingOutputs(),
      storage.getOutwardRecords(),
    ]);

    const activeLots = allLots.filter(l => l.status === 'active');

    const lotBalances = activeLots.map(lot => {
      const looseKg = allBalances
        .filter(b => b.lotId === lot.id && b.stockForm === 'loose')
        .reduce((sum, b) => sum + Number(b.quantity), 0);
      return { lot, looseKg };
    });

    const lowStockLots = lotBalances
      .filter(({ lot, looseKg }) => looseKg > 0 && looseKg < Number(lot.initialQuantity) * 0.2)
      .slice(0, 5)
      .map(({ lot, looseKg }) => ({
        id: lot.id,
        lotNumber: lot.lotNumber,
        initialQuantity: lot.initialQuantity,
        currentBalance: Math.round(looseKg * 100) / 100,
      }));

    const stockByLot = lotBalances
      .filter(({ looseKg }) => looseKg > 0)
      .map(({ lot, looseKg }) => ({
        name: lot.lotNumber,
        stock: Math.round(looseKg * 100) / 100,
      }))
      .slice(0, 10);

    const locationMap: Record<number, string> = {};
    allLocations.forEach(loc => { locationMap[loc.id] = loc.name; });

    const stockByLocation: Record<string, number> = {};
    allBalances
      .filter(b => b.stockForm === 'loose' && Number(b.quantity) > 0)
      .forEach(b => {
        const locName = locationMap[b.locationId] || `Loc ${b.locationId}`;
        stockByLocation[locName] = (stockByLocation[locName] || 0) + Number(b.quantity);
      });

    const locationData = Object.entries(stockByLocation)
      .map(([name, stock]) => ({ name, stock: Math.round(stock * 100) / 100 }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 8);

    const lotMap: Record<number, string> = {};
    allLots.forEach(l => { lotMap[l.id] = l.lotNumber; });

    const recentActivity: { id: string; type: string; label: string; detail: string; date: string }[] = [];

    allLots.slice(0, 5).forEach(lot => {
      if (lot.createdAt) {
        recentActivity.push({
          id: `inward-${lot.id}`,
          type: 'inward',
          label: `Inward: ${lot.lotNumber}`,
          detail: `${lot.initialQuantity} kg received`,
          date: lot.createdAt instanceof Date ? lot.createdAt.toISOString() : String(lot.createdAt),
        });
      }
    });

    allPackaging.slice(0, 5).forEach(p => {
      if (p.createdAt) {
        recentActivity.push({
          id: `pkg-${p.id}`,
          type: 'packaging',
          label: `Packaged: ${lotMap[p.lotId] || `Lot ${p.lotId}`}`,
          detail: `${p.numberOfPackets} x ${p.packetSize}`,
          date: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
        });
      }
    });

    allOutward.slice(0, 5).forEach(o => {
      if (o.createdAt) {
        recentActivity.push({
          id: `out-${o.id}`,
          type: 'outward',
          label: `Dispatched: ${lotMap[o.lotId] || `Lot ${o.lotId}`}`,
          detail: `${o.quantity} ${o.stockForm === 'packed' ? 'pkts' : 'kg'} to ${o.destinationName || o.destinationType}`,
          date: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
        });
      }
    });

    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      ...stats,
      lowStockLots,
      lowStockBatches: lowStockLots,
      stockByLot,
      locationData,
      recentActivity: recentActivity.slice(0, 10),
      pendingPayroll: 0,
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
      
      // Compute totalQuantityKg authoritatively from the DB packaging size record
      // Never trust the client-sent totalQuantityKg — unit mismatches cause wrong deductions
      let totalQuantityKg = Number(input.totalQuantityKg) || 0;
      if (input.packagingSizeId) {
        const pSize = await storage.getPackagingSize(input.packagingSizeId);
        if (pSize) {
          const sizeKg = pSize.unit.toLowerCase() === 'g'
            ? Number(pSize.size) / 1000
            : Number(pSize.size);
          totalQuantityKg = sizeKg * (input.numberOfPackets || 1);
        }
      }
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
      
      // Create packaging record — override totalQuantityKg with server-computed value
      const output = await storage.createPackagingOutput({
        ...input,
        totalQuantityKg: String(totalQuantityKg)
      });
      
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

  app.get("/api/employees/:id/password", checkPermission('employees', 'view'), async (req, res) => {
    try {
      const employee = await storage.getEmployee(Number(req.params.id));
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json({ password: employee.password || employee.employeeId });
    } catch (e) {
      res.status(400).json({ message: "Failed to get password" });
    }
  });

  app.patch("/api/employees/:id/password", checkPermission('employees', 'edit'), async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });
      const employee = await storage.getEmployee(Number(req.params.id));
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      await storage.updateEmployee(Number(req.params.id), { password });
      res.json({ success: true, message: "Password updated successfully" });
    } catch (e) {
      res.status(400).json({ message: "Failed to update password" });
    }
  });

  app.get("/api/employees/:id/trips", checkPermission('employees', 'view'), async (req, res) => {
    try {
      const empId = Number(req.params.id);
      const trips = await storage.getTripsByEmployee(empId);
      const tripsWithVisits = await Promise.all(
        trips.map(async (trip) => {
          const visits = await storage.getTripVisits(trip.id);
          return { ...trip, visits: visits || [], visitCount: visits?.length || 0 };
        })
      );
      res.json(tripsWithVisits);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch employee trips" });
    }
  });

  app.get("/api/employees/:id/attendance", checkPermission('attendance', 'view'), async (req, res) => {
    try {
      const records = await storage.getAttendanceByEmployee(Number(req.params.id));
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch employee attendance" });
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
        const professionalTax = Number(emp.professionalTax || 0);
        const otherDeductions = Number(emp.otherDeductions || 0);
        
        const totalDeductions = pfDeduction + esiDeduction + tdsDeduction + professionalTax + otherDeductions;
        
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

  app.get("/api/payroll/:id/download", async (req, res) => {
    try {
      const payrollId = parseInt(req.params.id);
      const payroll = await storage.getPayroll(payrollId);
      if (!payroll) return res.status(404).json({ message: "Payroll not found" });
      const employee = await storage.getEmployee(payroll.employeeId);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      const escHtml = (s: string | null | undefined) => s ? s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : "-";
      const fmt = (v: number) => v.toLocaleString("en-IN");
      const monthLabel = (() => {
        const [y, m] = payroll.month.split("-");
        const names = ["","JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
        return `${names[parseInt(m)] || m}'${y}`;
      })();
      const doj = (employee as any).joinDate ? new Date((employee as any).joinDate).toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"}) : "-";
      const gross = Number(payroll.basicPay) + Number((employee as any).hra||0) + Number((employee as any).da||0) +
        Number((employee as any).travelAllowance||0) + Number((employee as any).medicalAllowance||0) +
        Number((employee as any).otherAllowances||0) + Number(payroll.overtimeAmount||0);
      const profTax = Number((employee as any).professionalTax||0);
      const totalDed = Number((employee as any).pfDeduction||0) + Number((employee as any).esiDeduction||0) +
        Number((employee as any).tdsDeduction||0) + profTax +
        Number((employee as any).otherDeductions||0) + Number(payroll.deductions||0);
      const leaveDays = Number(payroll.totalDays) - Number(payroll.presentDays);
      const netPay = Number(payroll.netSalary);
      const eRow = (label: string, val: number) =>
        `<tr><td class="el">${label}</td><td class="ec">:</td><td class="ev">${fmt(val)}</td></tr>`;
      const dRow = (label: string, val: number) =>
        `<tr><td class="dl">${label}</td><td class="dc">:</td><td class="dv">${fmt(val)}</td></tr>`;

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Pay Slip - ${escHtml(payroll.month)}</title>
<style>
  @page{size:A4;margin:12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;background:#fff;color:#000;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:760px;margin:20px auto;border:2px solid #000;padding:0}
  .co-header{text-align:center;padding:18px 20px 12px;border-bottom:1px solid #000}
  .co-header .co-name{font-size:15px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase}
  .co-header .slip-title{font-size:13px;font-weight:700;margin-top:4px;text-transform:uppercase}
  .emp-info{padding:10px 16px;border-bottom:1px solid #000}
  .emp-info table{width:100%;border-collapse:collapse}
  .emp-info td{padding:3px 6px;font-size:11.5px;vertical-align:top}
  .emp-info .lbl{font-weight:700;width:100px;white-space:nowrap}
  .emp-info .sep{width:14px;text-align:center}
  .emp-info .val{font-weight:700}
  .sal-grid{display:flex;border-bottom:1px solid #000}
  .earn-col{flex:1;border-right:1px solid #000}
  .ded-col{flex:1}
  .col-hdr{display:flex;justify-content:space-between;padding:5px 8px;font-size:11.5px;font-weight:900;border-bottom:1px solid #000;text-transform:uppercase}
  .st{width:100%;border-collapse:collapse}
  .st .el,.st .dl{padding:4px 8px;font-size:11px;width:55%}
  .st .ec,.st .dc{padding:4px 2px;font-size:11px;width:8%;text-align:center}
  .st .ev,.st .dv{padding:4px 8px;font-size:11px;width:37%;text-align:right;font-weight:600}
  .st tr{border-bottom:1px dotted #ccc}
  .gross-row,.total-row{display:flex;justify-content:space-between;padding:5px 8px;font-size:12px;font-weight:900;border-top:1px solid #000;text-transform:uppercase}
  .net-row{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-bottom:1px solid #000;font-size:12.5px;font-weight:900;text-transform:uppercase}
  .slip-footer{text-align:center;padding:10px 16px;font-size:11px;font-style:italic}
  @media print{body{background:#fff}.page{border:2px solid #000;max-width:100%;margin:0}}
</style></head><body><div class="page">
  <div class="co-header">
    <div class="co-name">RISHI HYBRID SEEDS PVT LTD, SECUNDERABAD</div>
    <div class="slip-title">Pay Slip For The Month Of ${monthLabel}</div>
  </div>
  <div class="emp-info"><table><tr>
    <td><table>
      <tr><td class="lbl">EMP. NAME</td><td class="sep">:</td><td class="val">${escHtml(employee.fullName)}</td></tr>
      <tr><td class="lbl">DEPT.</td><td class="sep">:</td><td class="val">${escHtml(employee.department)}</td></tr>
      <tr><td class="lbl">DESG.</td><td class="sep">:</td><td class="val">${escHtml(employee.role)}</td></tr>
      <tr><td class="lbl">PRESENT DAYS</td><td class="sep">:</td><td class="val">${payroll.presentDays} / ${payroll.totalDays}</td></tr>
    </table></td>
    <td style="width:50%"><table>
      <tr><td class="lbl">D.O.J</td><td class="sep">:</td><td class="val">${doj}</td></tr>
      <tr><td class="lbl">EMP CODE</td><td class="sep">:</td><td class="val">${escHtml(employee.employeeId)}</td></tr>
      <tr><td class="lbl">UAN</td><td class="sep">:</td><td class="val">${escHtml((employee as any).uan)||"0"}</td></tr>
      <tr><td class="lbl">LEAVE DAYS</td><td class="sep">:</td><td class="val">${leaveDays}</td></tr>
    </table></td>
  </tr></table></div>
  <div class="sal-grid">
    <div class="earn-col">
      <div class="col-hdr"><span>EARNINGS</span><span>RS.</span></div>
      <table class="st">
        ${eRow("BASIC", Number(payroll.basicPay))}
        ${eRow("HRA", Number((employee as any).hra||0))}
        ${eRow("DA", Number((employee as any).da||0))}
        ${eRow("CONV", Number((employee as any).travelAllowance||0))}
        ${eRow("SPL ALLOW", Number((employee as any).otherAllowances||0))}
        ${eRow("MED.ALLOW", Number((employee as any).medicalAllowance||0))}
        ${eRow("OVERTIME", Number(payroll.overtimeAmount||0))}
      </table>
      <div class="gross-row"><span>GROSS</span><span>:</span><span>${fmt(gross)}</span></div>
    </div>
    <div class="ded-col">
      <div class="col-hdr"><span>DEDUCTIONS</span><span>:</span><span>RS</span></div>
      <table class="st">
        ${dRow("PF", Number((employee as any).pfDeduction||0))}
        ${dRow("VPF", 0)}
        ${dRow("ESI", Number((employee as any).esiDeduction||0))}
        ${dRow("PROF.TAX", profTax)}
        ${dRow("I.TAX (TDS)", Number((employee as any).tdsDeduction||0))}
        ${dRow("SAL.ADV", 0)}
        ${dRow("OTHERS", Number((employee as any).otherDeductions||0)+Number(payroll.deductions||0))}
      </table>
      <div class="total-row"><span>TOTAL</span><span>:</span><span>${fmt(totalDed)}</span></div>
    </div>
  </div>
  <div class="net-row"><span>NET TAKE HOME</span><span>:</span><span>${fmt(netPay)}</span></div>
  <div class="slip-footer">This is computer generated Pay Slip, Signature not required</div>
</div></body></html>`;
      res.setHeader("Content-Type","text/html");
      res.setHeader("Content-Disposition",`inline; filename="payslip-${payroll.month}-${employee.employeeId}.html"`);
      res.send(html);
    } catch (e) {
      res.status(400).json({ message: "Failed to generate payslip" });
    }
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

  // Upsert stock balance for a lot+location
  app.post("/api/stock-balances/set", checkPermission('stock', 'edit'), async (req, res) => {
    try {
      const { lotId, locationId, quantity, stockForm } = req.body;
      if (!lotId || !locationId || quantity === undefined) {
        return res.status(400).json({ message: "lotId, locationId and quantity required" });
      }
      const form = stockForm || "loose";
      const existing = await storage.getStockBalanceByLotAndLocation(lotId, locationId, form);
      let result;
      if (existing) {
        result = await storage.updateStockBalance(existing.id, String(quantity));
      } else {
        result = await storage.createStockBalance({ lotId, locationId, stockForm: form, quantity: String(quantity), packetSize: null });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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
      
      const requestedKg = parseFloat(validatedData.quantity);

      // Helper to parse packet size string to KG (e.g. "100g" → 0.1, "1kg" → 1)
      const parsePacketSizeKg = (size: string): number => {
        const s = size.toLowerCase().trim();
        if (s.endsWith('kg')) return parseFloat(s);
        if (s.endsWith('g')) return parseFloat(s) / 1000;
        return 1;
      };

      // Stock validation & deduction
      if (validatedData.stockForm === 'packed') {
        // Packed stock: balance is stored as packet COUNT; quantity entered in KG
        const ps = validatedData.packetSize;
        if (!ps) {
          return res.status(400).json({ message: "Packet size is required for packed stock dispatch" });
        }
        const pktKg = parsePacketSizeKg(ps);
        const packetsNeeded = Math.round(requestedKg / pktKg);

        const stockBalance = await storage.getStockBalanceByLotAndLocation(
          validatedData.lotId,
          validatedData.locationId,
          'packed',
          ps
        );
        const availablePackets = stockBalance ? parseFloat(stockBalance.quantity) : 0;
        const availableKg = availablePackets * pktKg;

        if (requestedKg > availableKg + 0.001) {
          return res.status(400).json({
            message: `Insufficient packed stock. Available: ${availableKg.toFixed(2)} KG (${availablePackets} packets of ${ps}), Requested: ${requestedKg.toFixed(2)} KG`
          });
        }

        const record = await storage.createOutwardRecord(validatedData);

        // Deduct packet count from packed balance
        await storage.adjustStockBalance(
          validatedData.lotId,
          validatedData.locationId,
          'packed',
          -packetsNeeded,
          ps
        );

        if (req.employeeId && validatedData.createdBy) {
          const employee = await storage.getEmployee(req.employeeId);
          if (employee) {
            await storage.createNotification({
              type: "outward",
              message: `${employee.fullName} dispatched ${requestedKg} KG (${packetsNeeded} × ${ps} bags) to ${validatedData.destinationType}`,
              employeeId: employee.id,
              employeeName: employee.fullName,
              resourceType: "outward_record",
              resourceId: record.id,
            });
          }
        }

        return res.status(201).json(record);
      } else {
        // Loose / cobs: balance stored in KG
        const stockBalance = await storage.getStockBalanceByLotAndLocation(
          validatedData.lotId,
          validatedData.locationId,
          validatedData.stockForm
        );
        const availableKg = stockBalance ? parseFloat(stockBalance.quantity) : 0;

        if (requestedKg > availableKg + 0.001) {
          return res.status(400).json({
            message: `Insufficient stock. Available: ${availableKg.toFixed(2)} KG, Requested: ${requestedKg.toFixed(2)} KG`
          });
        }

        const record = await storage.createOutwardRecord(validatedData);

        // Deduct KG from loose/cobs balance
        await storage.adjustStockBalance(
          validatedData.lotId,
          validatedData.locationId,
          validatedData.stockForm,
          -requestedKg
        );

        if (req.employeeId && validatedData.createdBy) {
          const employee = await storage.getEmployee(req.employeeId);
          if (employee) {
            await storage.createNotification({
              type: "outward",
              message: `${employee.fullName} dispatched ${requestedKg} KG to ${validatedData.destinationType}`,
              employeeId: employee.id,
              employeeName: employee.fullName,
              resourceType: "outward_record",
              resourceId: record.id,
            });
          }
        }

        return res.status(201).json(record);
      }
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

  // === OUTWARD RETURNS ===
  app.get("/api/outward-returns", checkPermission('outward', 'view'), async (req, res) => {
    const returns = await storage.getOutwardReturns();
    res.json(returns);
  });

  app.get("/api/outward-returns/by-record/:recordId", checkPermission('outward', 'view'), async (req, res) => {
    const returns = await storage.getOutwardReturnsByRecord(parseInt(req.params.recordId));
    res.json(returns);
  });

  app.post("/api/outward-returns", checkPermission('outward', 'create'), async (req: any, res) => {
    try {
      const validatedData = insertOutwardReturnSchema.parse({
        ...req.body,
        createdBy: req.employee?.id || req.user?.id || null,
      });
      const ret = await storage.createOutwardReturn(validatedData);
      res.json(ret);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to create outward return" });
    }
  });

  app.delete("/api/outward-returns/:id", checkPermission('outward', 'delete'), async (req, res) => {
    try {
      await storage.deleteOutwardReturn(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Failed to delete outward return" });
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
      
      const { latitude, longitude, locationName } = req.body || {};
      const today = getISTDate();
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      if (existingAttendance?.checkIn) {
        return res.status(400).json({ message: "Already punched in today" });
      }
      
      const now = getISTTime();
      
      if (existingAttendance) {
        await storage.updateAttendance(existingAttendance.id, {
          checkIn: now,
          status: "present",
          checkInLatitude: latitude || null,
          checkInLongitude: longitude || null,
          checkInLocation: locationName || null,
        });
      } else {
        await storage.markAttendance({
          employeeId,
          date: today,
          status: "present",
          checkIn: now,
          checkInLatitude: latitude || null,
          checkInLongitude: longitude || null,
          checkInLocation: locationName || null,
        });
      }
      
      const employee = await storage.getEmployee(employeeId);
      const locStr = locationName ? ` from ${locationName}` : "";
      if (employee) {
        await storage.createNotification({
          type: "punch_in",
          message: `${employee.fullName} punched in at ${now}${locStr}`,
          employeeId: employee.id,
          employeeName: employee.fullName,
        });
      }
      
      res.json({ message: "Punched in successfully", time: now, location: locationName || null });
    } catch (error) {
      res.status(400).json({ message: "Punch in failed" });
    }
  });

  app.post("/api/employee/punch-out", async (req: any, res) => {
    try {
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ message: "Not authenticated" });
      
      const { latitude, longitude, locationName } = req.body || {};
      const today = getISTDate();
      const existingAttendance = await storage.getAttendanceByEmployeeAndDate(employeeId, today);
      
      if (!existingAttendance?.checkIn) {
        return res.status(400).json({ message: "Please punch in first" });
      }
      
      if (existingAttendance.checkOut) {
        return res.status(400).json({ message: "Already punched out today" });
      }
      
      const now = getISTTime();
      await storage.updateAttendance(existingAttendance.id, {
        checkOut: now,
        checkOutLatitude: latitude || null,
        checkOutLongitude: longitude || null,
        checkOutLocation: locationName || null,
      });
      
      const employee = await storage.getEmployee(employeeId);
      const locStr = locationName ? ` from ${locationName}` : "";
      if (employee) {
        await storage.createNotification({
          type: "punch_out",
          message: `${employee.fullName} punched out at ${now}${locStr}`,
          employeeId: employee.id,
          employeeName: employee.fullName,
        });
      }
      
      res.json({ message: "Punched out successfully", time: now, location: locationName || null });
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
      
      const doj = (employee as any).joinDate
        ? new Date((employee as any).joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "-";
      const gross = Number(payroll.basicPay) + Number((employee as any).hra || 0) + Number((employee as any).da || 0) +
        Number((employee as any).travelAllowance || 0) + Number((employee as any).medicalAllowance || 0) +
        Number((employee as any).otherAllowances || 0) + Number(payroll.overtimeAmount || 0);
      const profTax = Number((employee as any).professionalTax || 0);
      const totalDed = Number((employee as any).pfDeduction || 0) + Number((employee as any).esiDeduction || 0) +
        Number((employee as any).tdsDeduction || 0) + profTax +
        Number((employee as any).otherDeductions || 0) + Number(payroll.deductions || 0);
      const leaveDays = Number(payroll.totalDays) - Number(payroll.presentDays);
      const netPay = Number(payroll.netSalary);

      const fmt = (v: number) => v.toLocaleString("en-IN");
      const monthLabel = (() => {
        const [y, m] = payroll.month.split("-");
        const names = ["","JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
        return `${names[parseInt(m)] || m}'${y}`;
      })();

      const eRow = (label: string, val: number) =>
        `<tr><td class="el">${label}</td><td class="ec">:</td><td class="ev">${fmt(val)}</td></tr>`;
      const dRow = (label: string, val: number) =>
        `<tr><td class="dl">${label}</td><td class="dc">:</td><td class="dv">${fmt(val)}</td></tr>`;

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Pay Slip - ${escapeHtml(payroll.month)}</title>
<style>
  @page{size:A4;margin:12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;background:#fff;color:#000;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:760px;margin:20px auto;border:2px solid #000;padding:0}

  /* COMPANY HEADER */
  .co-header{text-align:center;padding:18px 20px 12px;border-bottom:1px solid #000}
  .co-header .co-name{font-size:15px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase}
  .co-header .slip-title{font-size:13px;font-weight:700;margin-top:4px;text-transform:uppercase}

  /* EMPLOYEE INFO */
  .emp-info{padding:10px 16px;border-bottom:1px solid #000}
  .emp-info table{width:100%;border-collapse:collapse}
  .emp-info td{padding:3px 6px;font-size:11.5px;vertical-align:top}
  .emp-info .lbl{font-weight:700;width:100px;white-space:nowrap}
  .emp-info .sep{width:14px;text-align:center}
  .emp-info .val{font-weight:700}

  /* SALARY GRID */
  .sal-grid{display:flex;border-bottom:1px solid #000}
  .earn-col{flex:1;border-right:1px solid #000}
  .ded-col{flex:1}

  /* Column headers */
  .col-hdr{display:flex;justify-content:space-between;padding:5px 8px;font-size:11.5px;font-weight:900;border-bottom:1px solid #000;text-transform:uppercase}
  .col-hdr .ch-amt{font-weight:900}

  /* Salary rows */
  .st{width:100%;border-collapse:collapse}
  .st .el,.st .dl{padding:4px 8px;font-size:11px;width:55%}
  .st .ec,.st .dc{padding:4px 2px;font-size:11px;width:8%;text-align:center}
  .st .ev,.st .dv{padding:4px 8px;font-size:11px;width:37%;text-align:right;font-weight:600}
  .st tr{border-bottom:1px dotted #ccc}

  /* GROSS / TOTAL rows */
  .gross-row,.total-row{display:flex;justify-content:space-between;padding:5px 8px;font-size:12px;font-weight:900;border-top:1px solid #000;text-transform:uppercase}

  /* NET TAKE HOME */
  .net-row{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-bottom:1px solid #000;font-size:12.5px;font-weight:900;text-transform:uppercase}
  .net-row .net-val{font-size:14px;font-weight:900}

  /* FOOTER */
  .slip-footer{text-align:center;padding:10px 16px;font-size:11px;font-style:italic}

  @media print{
    body{background:#fff}
    .page{border:2px solid #000;max-width:100%;margin:0}
  }
</style></head>
<body>
<div class="page">

  <!-- COMPANY HEADER -->
  <div class="co-header">
    <div class="co-name">RISHI HYBRID SEEDS PVT LTD, SECUNDERABAD</div>
    <div class="slip-title">Pay Slip For The Month Of ${monthLabel}</div>
  </div>

  <!-- EMPLOYEE INFO -->
  <div class="emp-info">
    <table>
      <tr>
        <td>
          <table>
            <tr>
              <td class="lbl">EMP. NAME</td><td class="sep">:</td><td class="val">${escapeHtml(employee.fullName)}</td>
            </tr>
            <tr>
              <td class="lbl">DEPT.</td><td class="sep">:</td><td class="val">${escapeHtml(employee.department)}</td>
            </tr>
            <tr>
              <td class="lbl">DESG.</td><td class="sep">:</td><td class="val">${escapeHtml(employee.role)}</td>
            </tr>
            <tr>
              <td class="lbl">PRESENT DAYS</td><td class="sep">:</td><td class="val">${payroll.presentDays} / ${payroll.totalDays}</td>
            </tr>
          </table>
        </td>
        <td style="width:50%">
          <table>
            <tr>
              <td class="lbl">D.O.J</td><td class="sep">:</td><td class="val">${doj}</td>
            </tr>
            <tr>
              <td class="lbl">EMP CODE</td><td class="sep">:</td><td class="val">${escapeHtml(employee.employeeId)}</td>
            </tr>
            <tr>
              <td class="lbl">UAN</td><td class="sep">:</td><td class="val">${escapeHtml((employee as any).uan) || "0"}</td>
            </tr>
            <tr>
              <td class="lbl">LEAVE DAYS</td><td class="sep">:</td><td class="val">${leaveDays}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <!-- SALARY GRID -->
  <div class="sal-grid">
    <!-- EARNINGS -->
    <div class="earn-col">
      <div class="col-hdr"><span>EARNINGS</span><span class="ch-amt">RS.</span></div>
      <table class="st">
        ${eRow("BASIC", Number(payroll.basicPay))}
        ${eRow("HRA", Number((employee as any).hra || 0))}
        ${eRow("DA", Number((employee as any).da || 0))}
        ${eRow("CONV", Number((employee as any).travelAllowance || 0))}
        ${eRow("SPL ALLOW", Number((employee as any).otherAllowances || 0))}
        ${eRow("MED.ALLOW", Number((employee as any).medicalAllowance || 0))}
        ${eRow("OVERTIME", Number(payroll.overtimeAmount || 0))}
      </table>
      <div class="gross-row"><span>GROSS</span><span>:</span><span>${fmt(gross)}</span></div>
    </div>
    <!-- DEDUCTIONS -->
    <div class="ded-col">
      <div class="col-hdr"><span>DEDUCTIONS</span><span>:</span><span class="ch-amt">RS</span></div>
      <table class="st">
        ${dRow("PF", Number((employee as any).pfDeduction || 0))}
        ${dRow("VPF", 0)}
        ${dRow("ESI", Number((employee as any).esiDeduction || 0))}
        ${dRow("PROF.TAX", profTax)}
        ${dRow("I.TAX (TDS)", Number((employee as any).tdsDeduction || 0))}
        ${dRow("SAL.ADV", 0)}
        ${dRow("OTHERS", Number((employee as any).otherDeductions || 0) + Number(payroll.deductions || 0))}
      </table>
      <div class="total-row"><span>TOTAL</span><span>:</span><span>${fmt(totalDed)}</span></div>
    </div>
  </div>

  <!-- NET TAKE HOME -->
  <div class="net-row">
    <span>NET TAKE HOME</span>
    <span>:</span>
    <span class="net-val">${fmt(netPay)}</span>
  </div>

  <!-- FOOTER -->
  <div class="slip-footer">
    This is computer generated Pay Slip, Signature not required
  </div>

</div>
</body></html>`;
      
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
      const allVisitCounts = await Promise.all(
        allTrips.map(async (trip) => {
          const visits = await storage.getTripVisits(trip.id);
          return { tripId: trip.id, count: visits.length };
        })
      );
      const visitCountMap = new Map(allVisitCounts.map(v => [v.tripId, v.count]));
      const tripsWithEmployee = allTrips.map(trip => ({
        ...trip,
        employeeName: employeeMap.get(trip.employeeId)?.fullName || "Unknown",
        employeeCode: employeeMap.get(trip.employeeId)?.employeeId || "N/A",
        visitCount: visitCountMap.get(trip.id) || 0,
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
      await storage.createTripAudit({
        tripId: id,
        fromStatus: trip.status,
        toStatus: "approved",
        changedByName: user.fullName || user.username,
        notes: "Trip approved",
      });
      sendPushToEmployee(trip.employeeId, "Trip Approved", `Your trip has been approved.`, "/employee-portal/trips");
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
      await storage.createTripAudit({
        tripId: id,
        fromStatus: trip.status,
        toStatus: "rejected",
        changedByName: user.fullName || user.username,
        notes: reason || "Rejected by admin",
      });
      sendPushToEmployee(trip.employeeId, "Trip Rejected", `Your trip submission was not approved.`, "/employee-portal/trips");
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reject trip" });
    }
  });

  app.get("/api/trips/:id/comments", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const id = parseInt(req.params.id);
      const comments = await storage.getTripComments(id);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch comments" });
    }
  });

  app.post("/api/trips/:id/comments", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      const { message } = req.body;
      if (!message?.trim()) return res.status(400).json({ message: "Message is required" });
      const comment = await storage.createTripComment({
        tripId: id,
        message: message.trim(),
        createdByName: user?.fullName || user?.username || "Admin",
      });
      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to add comment" });
    }
  });

  app.get("/api/trips/:id/audit", async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const id = parseInt(req.params.id);
      const history = await storage.getTripAuditHistory(id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch audit history" });
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
      const { punchInLatitude, punchInLongitude, punchInLocationName, remarks, customerName, customerAddress } = req.body;
      const punchInPhoto = req.file ? `/uploads/${req.file.filename}` : null;
      const visit = await storage.createTripVisit({
        tripId,
        punchInTime: new Date(),
        punchInLatitude: punchInLatitude || null,
        punchInLongitude: punchInLongitude || null,
        punchInLocationName: punchInLocationName || null,
        punchInPhoto,
        remarks: remarks || null,
        customerName: customerName || null,
        customerAddress: customerAddress || null,
        status: "punched_in",
      });
      await storage.updateTrip(tripId, { status: "in_progress" });
      // Auto-upsert customer record if customer name provided
      if (customerName && customerName.trim()) {
        try {
          const emp = await storage.getEmployee(employeeId);
          await storage.upsertCustomerFromVisit(customerName.trim(), customerAddress || null, employeeId, emp?.fullName || "Unknown");
        } catch (_) {}
      }
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

  // === FEEDS ROUTES ===
  app.get("/api/feeds", async (req: any, res) => {
    try {
      const filterEmpId = req.query.employeeId ? Number(req.query.employeeId) : null;
      const [allEmps, allTasks, allTrips, allAttendance] = await Promise.all([
        storage.getEmployees(),
        storage.getTasks(),
        storage.getTrips(),
        storage.getAttendance(),
      ]);
      const empMap = Object.fromEntries(allEmps.map(e => [e.id, e]));
      const feeds: any[] = [];
      const matchesFilter = (empId: number) => !filterEmpId || empId === filterEmpId;

      for (const task of allTasks) {
        if (!matchesFilter(task.employeeDbId)) continue;
        const emp = empMap[task.employeeDbId];
        const empName = emp?.fullName || "Unknown";
        const empDept = emp?.department || "NA";
        if (task.startedAt) {
          feeds.push({ id: `task-start-${task.id}`, employeeName: empName, team: empDept, action: "Task Started", actionType: "task_started", platform: "WEB", intel: "NA", dateTime: task.startedAt, taskCode: task.taskCode });
        }
        if (task.completedAt) {
          feeds.push({ id: `task-complete-${task.id}`, employeeName: empName, team: empDept, action: "Task Completed", actionType: "task_completed", platform: "WEB", intel: "NA", dateTime: task.completedAt, taskCode: task.taskCode });
        }
        if (!task.startedAt && task.status === "pending" && task.createdAt) {
          feeds.push({ id: `task-assign-${task.id}`, employeeName: empName, team: empDept, action: "Task Assigned", actionType: "task_assigned", platform: "WEB", intel: "NA", dateTime: task.createdAt, taskCode: task.taskCode });
        }
      }

      for (const trip of allTrips) {
        if (!matchesFilter(trip.employeeId)) continue;
        const emp = empMap[trip.employeeId];
        const empName = emp?.fullName || "Unknown";
        const empDept = emp?.department || "NA";
        if (trip.startTime) {
          feeds.push({ id: `trip-start-${trip.id}`, employeeName: empName, team: empDept, action: "Trip Started", actionType: "trip_started", platform: "ANDROID", intel: "NA", dateTime: trip.startTime });
        }
        if (trip.endTime) {
          feeds.push({ id: `trip-end-${trip.id}`, employeeName: empName, team: empDept, action: "Trip Ended", actionType: "trip_ended", platform: "ANDROID", intel: "NA", dateTime: trip.endTime });
        }
        const visits = await storage.getTripVisits(trip.id);
        for (const v of visits) {
          if (v.punchInTime) {
            feeds.push({ id: `visit-in-${v.id}`, employeeName: empName, team: empDept, action: "Visit Punched In", actionType: "visit_in", platform: "ANDROID", intel: v.customerName || "NA", dateTime: v.punchInTime });
          }
          if (v.punchOutTime) {
            feeds.push({ id: `visit-out-${v.id}`, employeeName: empName, team: empDept, action: "Visit Punched Out", actionType: "visit_out", platform: "ANDROID", intel: v.customerName || "NA", dateTime: v.punchOutTime });
          }
        }
      }

      for (const att of allAttendance) {
        if (!matchesFilter(att.employeeId)) continue;
        const emp = empMap[att.employeeId];
        const empName = emp?.fullName || "Unknown";
        const empDept = emp?.department || "NA";
        if (att.checkIn && att.date) {
          const dt = new Date(`${att.date}T${att.checkIn}:00`);
          if (!isNaN(dt.getTime())) {
            feeds.push({ id: `att-in-${att.id}`, employeeName: empName, team: empDept, action: "Attendance In", actionType: "attendance_in", platform: "ANDROID", intel: "NA", dateTime: dt });
          }
        }
        if (att.checkOut && att.date) {
          const dt = new Date(`${att.date}T${att.checkOut}:00`);
          if (!isNaN(dt.getTime())) {
            feeds.push({ id: `att-out-${att.id}`, employeeName: empName, team: empDept, action: "Attendance Out", actionType: "attendance_out", platform: "ANDROID", intel: "NA", dateTime: dt });
          }
        }
      }

      feeds.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      res.json(feeds.slice(0, 200));
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  // === CUSTOMER ROUTES ===
  app.get("/api/customers", async (req: any, res) => {
    try {
      const list = await storage.getCustomers();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.post("/api/customers", async (req: any, res) => {
    try {
      const { name, mobile, email, address, status } = req.body;
      if (!name) return res.status(400).json({ message: "Name required" });
      const adminUser = (req as any).user;
      const customer = await storage.createCustomer({
        name, mobile: mobile || null, email: email || null, address: address || null,
        status: status || "active",
        ownerName: adminUser?.fullName || adminUser?.username || "Admin",
        ownerEmployeeId: null,
        source: "manual",
      });
      res.status(201).json(customer);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.get("/api/customers/:id", async (req: any, res) => {
    try {
      const c = await storage.getCustomer(Number(req.params.id));
      if (!c) return res.status(404).json({ message: "Not found" });
      res.json(c);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.patch("/api/customers/:id", async (req: any, res) => {
    try {
      const updated = await storage.updateCustomer(Number(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  // === TASK ROUTES ===
  app.get("/api/tasks", async (req: any, res) => {
    try {
      const all = await storage.getTasks();
      const emps = await storage.getEmployees();
      const empMap = Object.fromEntries(emps.map(e => [e.id, e]));
      const result = all.map(t => ({
        ...t,
        employeeName: empMap[t.employeeDbId]?.fullName || "Unknown",
        employeeCode: empMap[t.employeeDbId]?.employeeId || "",
      }));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.post("/api/tasks", async (req: any, res) => {
    try {
      const body = req.body;
      const adminUser = (req as any).user;
      const adminName = adminUser?.fullName || adminUser?.username || "Admin";
      const all = await storage.getTasks();
      const nextNum = all.length + 1;
      const taskCode = `CHK-${String(nextNum).padStart(5, "0")}`;
      const task = await storage.createTask({
        ...body,
        taskCode,
        createdByName: adminName,
        status: body.status || "pending",
      });
      res.status(201).json(task);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", async (req: any, res) => {
    try {
      const task = await storage.getTask(Number(req.params.id));
      if (!task) return res.status(404).json({ message: "Task not found" });
      const emp = await storage.getEmployee(task.employeeDbId);
      res.json({ ...task, employeeName: emp?.fullName || "Unknown", employeeCode: emp?.employeeId || "" });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.patch("/api/tasks/:id", async (req: any, res) => {
    try {
      const task = await storage.getTask(Number(req.params.id));
      if (!task) return res.status(404).json({ message: "Task not found" });
      const updated = await storage.updateTask(task.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to update task" });
    }
  });

  app.get("/api/tasks/:id/comments", async (req: any, res) => {
    try {
      const comments = await storage.getTaskComments(Number(req.params.id));
      res.json(comments);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.post("/api/tasks/:id/comments", async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ message: "Message required" });
      const adminUser = (req as any).user;
      const empId = (req as any).employeeId;
      const empUser = empId ? await storage.getEmployee(empId) : null;
      const createdByName = adminUser?.fullName || adminUser?.username || empUser?.fullName || "User";
      const comment = await storage.createTaskComment({ taskId: Number(req.params.id), message, createdByName });
      res.status(201).json(comment);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  // Employee portal task routes
  app.post("/api/employee/tasks", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const emp = await storage.getEmployee(empId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const all = await storage.getTasks();
      const nextNum = all.length + 1;
      const taskCode = `TASK-${String(nextNum).padStart(4, "0")}`;
      const { title, type, customerName, customerAddress, notes, startDate, endDate, priority } = req.body;
      const task = await storage.createTask({
        taskCode,
        title: title || "Untitled Task",
        employeeDbId: empId,
        type: type || "Visit",
        customerName: customerName || null,
        customerAddress: customerAddress || null,
        notes: notes || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || "medium",
        status: "pending",
        createdByName: emp.fullName,
      });
      res.status(201).json(task);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to create task" });
    }
  });

  app.get("/api/employee/tasks", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const list = await storage.getTasksByEmployee(empId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.patch("/api/employee/tasks/:id/checkin", upload.single("checkInPhoto"), async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const task = await storage.getTask(Number(req.params.id));
      if (!task || task.employeeDbId !== empId) return res.status(404).json({ message: "Task not found" });
      const { checkInLatitude, checkInLongitude, checkInLocationName } = req.body;
      const checkInPhoto = req.file ? `/uploads/${req.file.filename}` : null;
      const updated = await storage.updateTask(task.id, {
        status: "in_progress",
        startedAt: new Date(),
        checkInLatitude: checkInLatitude || null,
        checkInLongitude: checkInLongitude || null,
        checkInLocationName: checkInLocationName || null,
        checkInTime: new Date(),
        checkInPhoto,
      });
      // Auto-upsert customer record if task has customer info
      if (task.customerName && task.customerName.trim()) {
        try {
          const emp = await storage.getEmployee(empId);
          await storage.upsertCustomerFromVisit(task.customerName.trim(), task.customerAddress || null, empId, emp?.fullName || "Unknown");
        } catch (_) {}
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  app.patch("/api/employee/tasks/:id/complete", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const task = await storage.getTask(Number(req.params.id));
      if (!task || task.employeeDbId !== empId) return res.status(404).json({ message: "Task not found" });
      const { dealerName, contactPerson, contactNo, townName, odAmount, regularDue, notes } = req.body;
      const completionNotes = [
        dealerName && `Customer/Dealer: ${dealerName}`,
        contactPerson && `Contact Person: ${contactPerson}`,
        contactNo && `Contact No: ${contactNo}`,
        townName && `Town: ${townName}`,
        odAmount && `OD Amount: ${odAmount}`,
        regularDue && `Regular Due: ${regularDue}`,
        notes && `Notes: ${notes}`,
      ].filter(Boolean).join("\n") || (notes || null);
      const updated = await storage.updateTask(task.id, {
        status: "completed",
        completedAt: new Date(),
        notes: completionNotes,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  // === EMPLOYEE TASK COMMENTS ===
  app.get("/api/employee/tasks/:id/comments", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const comments = await storage.getTaskComments(Number(req.params.id));
      res.json(comments);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/employee/tasks/:id/comments", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const { message, createdByName } = req.body;
      if (!message) return res.status(400).json({ message: "Message required" });
      const comment = await storage.createTaskComment({ taskId: Number(req.params.id), message, createdByName });
      res.json(comment);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === EXPENSE ROUTES ===
  app.get("/api/expenses", async (req: any, res) => {
    try {
      const all = await storage.getExpenses();
      const emps = await storage.getEmployees();
      const empMap = Object.fromEntries(emps.map(e => [e.id, e]));
      const result = all.map(exp => ({
        ...exp,
        employeeName: empMap[exp.employeeDbId]?.fullName || "Unknown",
        employeeCode: empMap[exp.employeeDbId]?.employeeId || "",
        workLocation: exp.workLocation || empMap[exp.employeeDbId]?.workLocation || "NA",
      }));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req: any, res) => {
    try {
      const body = req.body;
      const empId = req.employeeId;
      let employeeDbId = body.employeeDbId;
      if (!employeeDbId && empId) employeeDbId = empId;
      const emp = await storage.getEmployee(employeeDbId);
      if (!emp) return res.status(400).json({ message: "Employee not found" });
      const countResult = await storage.getExpenses();
      const nextNum = countResult.length + 1;
      const expenseCode = `EXP-${String(nextNum).padStart(4, "0")}`;
      const title = body.title || `${emp.fullName}-${emp.employeeId}-Expense`;
      const expense = await storage.createExpense({
        ...body,
        employeeDbId,
        expenseCode,
        title,
        status: "pending",
      });
      await storage.createExpenseAudit({
        expenseId: expense.id,
        fromStatus: null,
        toStatus: "pending",
        changedByName: emp.fullName,
        notes: "Expense created",
      });
      res.status(201).json(expense);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to create expense" });
    }
  });

  app.get("/api/expenses/:id", async (req: any, res) => {
    try {
      const expense = await storage.getExpense(Number(req.params.id));
      if (!expense) return res.status(404).json({ message: "Expense not found" });
      const emp = await storage.getEmployee(expense.employeeDbId);
      res.json({ ...expense, employeeName: emp?.fullName || "Unknown", employeeCode: emp?.employeeId || "" });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch expense" });
    }
  });

  app.patch("/api/expenses/:id", async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const expense = await storage.getExpense(id);
      if (!expense) return res.status(404).json({ message: "Expense not found" });
      const { employeeDbId, expenseCode, status, ...allowed } = req.body;
      const updated = await storage.updateExpense(id, allowed);
      const emp = await storage.getEmployee(expense.employeeDbId);
      res.json({ ...updated, employeeName: emp?.fullName || "Unknown", employeeCode: emp?.employeeId || "" });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to update expense" });
    }
  });

  app.patch("/api/expenses/:id/approve", async (req: any, res) => {
    try {
      const expense = await storage.getExpense(Number(req.params.id));
      if (!expense) return res.status(404).json({ message: "Expense not found" });
      const { approvedAmount, comment } = req.body;
      const adminUser = (req as any).user;
      const adminName = adminUser?.fullName || adminUser?.username || "Admin";
      const updated = await storage.updateExpense(expense.id, {
        status: "approved",
        approvedAmount: approvedAmount || expense.amount,
        finalAmount: approvedAmount || expense.amount,
        adminComment: comment,
        statusUpdatedBy: adminName,
        statusUpdatedOn: new Date(),
      });
      await storage.createExpenseAudit({
        expenseId: expense.id,
        fromStatus: expense.status,
        toStatus: "approved",
        changedByName: adminName,
        notes: comment || "Expense approved",
      });
      sendPushToEmployee(expense.employeeDbId, "Expense Approved", `Your expense ${expense.expenseCode} has been approved.`, "/employee-portal/expenses");
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to approve expense" });
    }
  });

  app.patch("/api/expenses/:id/reject", async (req: any, res) => {
    try {
      const expense = await storage.getExpense(Number(req.params.id));
      if (!expense) return res.status(404).json({ message: "Expense not found" });
      const { reason } = req.body;
      const adminUser = (req as any).user;
      const adminName = adminUser?.fullName || adminUser?.username || "Admin";
      const updated = await storage.updateExpense(expense.id, {
        status: "rejected",
        adminComment: reason,
        statusUpdatedBy: adminName,
        statusUpdatedOn: new Date(),
      });
      await storage.createExpenseAudit({
        expenseId: expense.id,
        fromStatus: expense.status,
        toStatus: "rejected",
        changedByName: adminName,
        notes: reason || "Expense rejected",
      });
      sendPushToEmployee(expense.employeeDbId, "Expense Rejected", `Your expense ${expense.expenseCode} was not approved.`, "/employee-portal/expenses");
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to reject expense" });
    }
  });

  app.get("/api/expenses/:id/comments", async (req: any, res) => {
    try {
      const comments = await storage.getExpenseComments(Number(req.params.id));
      res.json(comments);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch comments" });
    }
  });

  app.post("/api/expenses/:id/comments", async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ message: "Message is required" });
      const adminUser = (req as any).user;
      const empUser = (req as any).employeeId ? await storage.getEmployee((req as any).employeeId) : null;
      const createdByName = adminUser?.fullName || adminUser?.username || empUser?.fullName || "User";
      const comment = await storage.createExpenseComment({ expenseId: Number(req.params.id), message, createdByName });
      res.status(201).json(comment);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to add comment" });
    }
  });

  app.patch("/api/expenses/:id/upload-photos", upload.fields([
    { name: "startingOdometerPhoto", maxCount: 1 },
    { name: "endOdometerPhoto", maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const expense = await storage.getExpense(id);
      if (!expense) return res.status(404).json({ message: "Expense not found" });
      const files = req.files as Record<string, Express.Multer.File[]>;
      const updates: Record<string, string> = {};
      if (files?.startingOdometerPhoto?.[0]) {
        updates.startingOdometerPhoto = `/uploads/${files.startingOdometerPhoto[0].filename}`;
      }
      if (files?.endOdometerPhoto?.[0]) {
        updates.endOdometerPhoto = `/uploads/${files.endOdometerPhoto[0].filename}`;
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No photos provided" });
      }
      const updated = await storage.updateExpense(id, updates as any);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to upload photos" });
    }
  });

  app.get("/api/expenses/:id/audit", async (req: any, res) => {
    try {
      const audit = await storage.getExpenseAuditHistory(Number(req.params.id));
      res.json(audit);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch audit" });
    }
  });

  // Employee portal expense routes
  app.get("/api/employee/expenses", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const list = await storage.getExpensesByEmployee(empId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch expenses" });
    }
  });

  app.post("/api/employee/expenses", upload.fields([
    { name: "startingOdometerPhoto", maxCount: 1 },
    { name: "endOdometerPhoto", maxCount: 1 },
    { name: "billsTicketPhoto", maxCount: 1 },
  ]), async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const emp = await storage.getEmployee(empId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const countResult = await storage.getExpenses();
      const nextNum = countResult.length + 1;
      const expenseCode = `EXP-${String(nextNum).padStart(4, "0")}`;
      const title = req.body.title || `${emp.fullName}-${emp.employeeId}-Expense`;
      const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
      const startPhotoPath = files.startingOdometerPhoto?.[0] ? `/uploads/${files.startingOdometerPhoto[0].filename}` : undefined;
      const endPhotoPath = files.endOdometerPhoto?.[0] ? `/uploads/${files.endOdometerPhoto[0].filename}` : undefined;
      const billsPhotoPath = files.billsTicketPhoto?.[0] ? `/uploads/${files.billsTicketPhoto[0].filename}` : undefined;
      const expense = await storage.createExpense({
        ...req.body,
        employeeDbId: empId,
        expenseCode,
        title,
        status: "pending",
        ...(startPhotoPath ? { startingOdometerPhoto: startPhotoPath } : {}),
        ...(endPhotoPath ? { endOdometerPhoto: endPhotoPath } : {}),
        ...(billsPhotoPath ? { billsTicketPhoto: billsPhotoPath } : {}),
      });
      await storage.createExpenseAudit({
        expenseId: expense.id,
        fromStatus: null,
        toStatus: "pending",
        changedByName: emp.fullName,
        notes: "Expense submitted",
      });
      res.status(201).json(expense);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to create expense" });
    }
  });

  // Employee portal dashboard stats
  app.get("/api/employee/dashboard-stats", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const [myTasks, myExpenses] = await Promise.all([
        storage.getTasksByEmployee(empId),
        storage.getExpensesByEmployee(empId),
      ]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const pendingToday = myTasks.filter(t => {
        const isPending = t.status === "pending";
        const dueDate = t.endDate ? new Date(t.endDate) : null;
        const isDueToday = dueDate ? (dueDate >= today && dueDate <= todayEnd) : false;
        const isCreatedToday = t.createdAt ? (new Date(t.createdAt) >= today && new Date(t.createdAt) <= todayEnd) : false;
        return isPending && (isDueToday || isCreatedToday);
      }).length;
      const inProgress = myTasks.filter(t => t.status === "in_progress").length;
      const overdue = myTasks.filter(t => {
        if (t.status === "completed") return false;
        const dueDate = t.endDate ? new Date(t.endDate) : null;
        return dueDate ? dueDate < today : false;
      }).length;
      const totalTasks = myTasks.length;
      const completedTasks = myTasks.filter(t => t.status === "completed").length;

      const expenseStats = { pending: 0, approved: 0, rejected: 0 };
      for (const e of myExpenses) {
        const amt = parseFloat(e.amount as string) || 0;
        if (e.status === "pending") expenseStats.pending += amt;
        else if (e.status === "approved") expenseStats.approved += amt;
        else if (e.status === "rejected") expenseStats.rejected += amt;
      }

      res.json({
        tasks: { pendingToday, inProgress, overdue, total: totalTasks, completed: completedTasks },
        expenses: expenseStats,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch stats" });
    }
  });

  // Employee portal customers list — only shows customers added by this employee
  app.get("/api/employee/customers", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const list = await storage.getCustomersByEmployee(empId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch customers" });
    }
  });

  // Employee portal active customer check-in
  app.get("/api/employee/customer-checkin/active", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const active = await storage.getActiveCustomerCheckin(empId);
      res.json(active || null);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed" });
    }
  });

  // Employee portal customer check-out
  app.patch("/api/employee/customer-checkin/:id/checkout", upload.single("warrantyCardPhoto"), async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      const body = req.body;
      let warrantyCardPhoto: string | null = null;
      if (req.file) {
        warrantyCardPhoto = `/uploads/${req.file.filename}`;
      }
      const updated = await storage.checkoutCustomerCheckin(id, {
        visitType: body.visitType || null,
        locationName: body.locationName || null,
        locationLatitude: body.locationLatitude || null,
        locationLongitude: body.locationLongitude || null,
        issue: body.issue || null,
        warrantyCardPhoto: warrantyCardPhoto,
        amount: body.amount ? String(body.amount) : null,
        rating: body.rating || null,
        signature: body.signature || null,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to checkout" });
    }
  });

  // Employee portal customer check-in
  app.post("/api/employee/customer-checkin", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const emp = await storage.getEmployee(empId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const { customerId, customerName, customerMobile, isNew, companyName, mobile, email } = req.body;

      let finalCustomerId = customerId ? Number(customerId) : null;
      let finalCustomerName = customerName || companyName || "";
      let finalMobile = customerMobile || mobile || null;

      if (isNew && companyName) {
        const created = await storage.createCustomer({
          name: companyName,
          mobile: mobile || null,
          email: email || null,
          ownerEmployeeId: empId,
          ownerName: emp.fullName,
          status: "active",
          source: "checkin",
        });
        finalCustomerId = created.id;
        finalCustomerName = created.name;
        finalMobile = created.mobile;
      }

      if (!finalCustomerName) return res.status(400).json({ message: "Customer name is required" });

      const checkin = await storage.createCustomerCheckin({
        employeeDbId: empId,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerMobile: finalMobile,
      });
      res.status(201).json(checkin);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to record check-in" });
    }
  });

  // === EMPLOYEE LOCATION TRACKING ===

  // Employee posts their GPS location (called periodically from the employee app)
  app.post("/api/employee/location", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const { latitude, longitude, accuracy, speed } = req.body;
      if (!latitude || !longitude) return res.status(400).json({ message: "latitude and longitude required" });
      const loc = await storage.addEmployeeLocation({
        employeeId: empId,
        latitude: String(latitude),
        longitude: String(longitude),
        accuracy: accuracy != null ? String(accuracy) : null,
        speed: speed != null ? String(speed) : null,
        recordedAt: new Date(),
      });
      res.json(loc);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to record location" });
    }
  });

  // Admin fetches customer check-ins for an employee on a given date
  app.get("/api/employees/:id/checkins", checkPermission('employees', 'view'), async (req, res) => {
    try {
      const empId = Number(req.params.id);
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const rows = await storage.getCustomerCheckinsByEmployeeAndDate(empId, date);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch checkins" });
    }
  });

  // Admin fetches location history for an employee on a given date, with stoppages computed
  app.get("/api/employees/:id/locations", checkPermission('employees', 'view'), async (req, res) => {
    try {
      const empId = Number(req.params.id);
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const rawPoints = await storage.getEmployeeLocationsForDate(empId, date);

      // Prepend punch-in location as the very first point so trails always
      // start from where the employee clocked in that day.
      const attRecord = await storage.getAttendanceByEmployeeAndDate(empId, date);
      let points = rawPoints;
      if (
        attRecord &&
        attRecord.punchInLatitude != null &&
        attRecord.punchInLongitude != null &&
        attRecord.punchInTime
      ) {
        const punchInPoint = {
          id: -1,
          employeeId: empId,
          latitude: attRecord.punchInLatitude,
          longitude: attRecord.punchInLongitude,
          accuracy: null,
          recordedAt: attRecord.punchInTime,
        } as any;
        // Only prepend if the punch-in is not already the first recorded point
        const firstPt = rawPoints[0];
        const punchTime = new Date(attRecord.punchInTime).getTime();
        const firstTime = firstPt ? new Date(firstPt.recordedAt).getTime() : Infinity;
        if (punchTime < firstTime) {
          points = [punchInPoint, ...rawPoints];
        }
      }

      const STOPPAGE_RADIUS_M = 150;   // metres — generous for mobile GPS drift
      const STOPPAGE_MIN_SECS = 2 * 60; // 2 minutes minimum to count as a stoppage

      function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }

      function totalDistKm(pts: typeof points): number {
        let d = 0;
        for (let i = 1; i < pts.length; i++) {
          d += haversineM(Number(pts[i - 1].latitude), Number(pts[i - 1].longitude), Number(pts[i].latitude), Number(pts[i].longitude)) / 1000;
        }
        return d;
      }

      type StoppageCluster = { startIdx: number; endIdx: number; lat: number; lng: number; durationSecs: number };

      // Phase 1: find all stoppage clusters
      const clusters: StoppageCluster[] = [];
      let i = 0;
      while (i < points.length) {
        const anchor = points[i];
        let j = i + 1;
        while (j < points.length &&
          haversineM(Number(anchor.latitude), Number(anchor.longitude), Number(points[j].latitude), Number(points[j].longitude)) <= STOPPAGE_RADIUS_M) {
          j++;
        }
        const durationSecs = j > i + 1
          ? (new Date(points[j - 1].recordedAt).getTime() - new Date(anchor.recordedAt).getTime()) / 1000
          : 0;
        if (j > i + 1 && durationSecs >= STOPPAGE_MIN_SECS) {
          clusters.push({ startIdx: i, endIdx: j - 1, lat: Number(anchor.latitude), lng: Number(anchor.longitude), durationSecs });
          i = j;
        } else {
          i++;
        }
      }

      // Phase 2: build timeline from clusters + travel segments between them
      type Segment =
        | { type: "travelled"; startTime: string; endTime: string; distanceKm: number }
        | { type: "stoppage"; startTime: string; endTime: string; durationSecs: number; lat: number; lng: number };

      const segments: Segment[] = [];
      let prevEndIdx = -1;

      for (const cluster of clusters) {
        // Travel segment before this stoppage
        if (cluster.startIdx > prevEndIdx + 1) {
          const travelPts = points.slice(prevEndIdx + 1, cluster.startIdx + 1);
          if (travelPts.length >= 1) {
            segments.push({
              type: "travelled",
              startTime: new Date(travelPts[0].recordedAt).toISOString(),
              endTime: new Date(travelPts[travelPts.length - 1].recordedAt).toISOString(),
              distanceKm: totalDistKm(travelPts),
            });
          }
        }
        segments.push({
          type: "stoppage",
          startTime: new Date(points[cluster.startIdx].recordedAt).toISOString(),
          endTime: new Date(points[cluster.endIdx].recordedAt).toISOString(),
          durationSecs: cluster.durationSecs,
          lat: cluster.lat,
          lng: cluster.lng,
        });
        prevEndIdx = cluster.endIdx;
      }

      // Travel segment after last stoppage
      if (prevEndIdx < points.length - 1) {
        const travelPts = points.slice(prevEndIdx + 1);
        if (travelPts.length >= 1) {
          segments.push({
            type: "travelled",
            startTime: new Date(travelPts[0].recordedAt).toISOString(),
            endTime: new Date(travelPts[travelPts.length - 1].recordedAt).toISOString(),
            distanceKm: totalDistKm(travelPts),
          });
        }
      }

      const totalKm = segments.filter(s => s.type === "travelled").reduce((acc, s) => acc + (s as any).distanceKm, 0);
      const stoppageCount = clusters.length;

      res.json({ points, segments, totalKm, stoppageCount, travelledKm: totalKm });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to get locations" });
    }
  });

  // === LEAVES (Employee) ===
  app.get("/api/employee/leaves", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const list = await storage.getLeavesByEmployee(emp.id);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/employee/leaves", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const leave = await storage.createLeave({ ...req.body, employeeDbId: emp.id, status: "pending" });
      res.status(201).json(leave);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/employee/leaves/:id/cancel", async (req: any, res) => {
    try {
      const updated = await storage.updateLeave(Number(req.params.id), { status: "cancelled" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/employee/leave-balances", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const year = new Date().getFullYear();
      const cfg = await storage.getEmployeeConfig(emp.id);
      const balances = await storage.getLeaveBalances(emp.id, year);
      const CATS = ["Sick Leave", "Casual Leave", "Privilege Leave", "Earned Leave"];
      const quotaMap: Record<string, number> = {
        "Sick Leave": cfg?.sickLeaveQuota || 7,
        "Casual Leave": cfg?.casualLeaveQuota || 7,
        "Privilege Leave": cfg?.privilegeLeaveQuota || 8,
        "Earned Leave": cfg?.earnedLeaveQuota || 0,
      };
      const result = CATS.map(cat => {
        const bal = balances.find(b => b.leaveCategory === cat);
        const total = quotaMap[cat];
        const taken = bal?.taken || 0;
        return { leaveCategory: cat, total, taken, available: total - taken };
      });
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === LEAVES (Admin) ===
  app.get("/api/leaves", async (req: any, res) => {
    try {
      const list = await storage.getLeaves();
      const result = await Promise.all(list.map(async l => {
        const emp = await storage.getEmployee(l.employeeDbId);
        return { ...l, employeeName: emp?.fullName || "Unknown", employeeCode: emp?.employeeId || "" };
      }));
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/leaves/:id/approve", async (req: any, res) => {
    try {
      const leave = await storage.getLeave(Number(req.params.id));
      if (!leave) return res.status(404).json({ message: "Not found" });
      const updated = await storage.updateLeave(Number(req.params.id), { status: "approved", approvedBy: "Admin", approvedAt: new Date() });
      const dur = Math.max(1, Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 86400000) + 1);
      const year = new Date(leave.startDate).getFullYear();
      await storage.upsertLeaveBalance({ employeeDbId: leave.employeeDbId, leaveCategory: leave.leaveCategory, year, total: 0, taken: dur });
      sendPushToEmployee(leave.employeeDbId, "Leave Approved", `Your ${leave.leaveCategory} request has been approved.`, "/employee-portal/leave");
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/leaves/:id/reject", async (req: any, res) => {
    try {
      const leave = await storage.getLeave(Number(req.params.id));
      const updated = await storage.updateLeave(Number(req.params.id), { status: "rejected", rejectionReason: req.body.reason || "" });
      if (leave) sendPushToEmployee(leave.employeeDbId, "Leave Rejected", `Your ${leave.leaveCategory} request was not approved.`, "/employee-portal/leave");
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === HOLIDAYS ===
  app.get("/api/holidays", async (req: any, res) => {
    try { res.json(await storage.getHolidays()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/holidays", async (req: any, res) => {
    try { res.status(201).json(await storage.createHoliday(req.body)); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/holidays/:id", async (req: any, res) => {
    try { await storage.deleteHoliday(Number(req.params.id)); res.json({ ok: true }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === CHAT ===
  app.get("/api/employee/chat/contacts", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const contacts = await storage.getChatContacts(emp.id);
      res.json(contacts);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/employee/chat/messages/:targetId", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const targetId = Number(req.params.targetId);
      const targetType = req.query.targetType as string || "employee";
      const msgs = await storage.getChatMessages(emp.id, targetId, "employee", targetType);
      await storage.markChatRead(emp.id, "employee", targetId);
      res.json(msgs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/employee/chat/send", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const { receiverId, receiverType, receiverName, message } = req.body;
      const msg = await storage.createChatMessage({
        senderId: emp.id, senderType: "employee", senderName: emp.fullName,
        receiverId, receiverType: receiverType || "employee", receiverName: receiverName || "Unknown", message,
      });
      res.status(201).json(msg);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/employee/chat/people", async (req: any, res) => {
    try {
      const emps = await storage.getEmployees();
      const emp = await storage.getEmployee(req.employeeId);
      const others = emps.filter(e => e.id !== emp?.id).map(e => ({ id: e.id, name: e.fullName, type: "employee", code: e.employeeId }));
      res.json(others);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === PUSH NOTIFICATIONS ===
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ key: VAPID_PUBLIC_KEY });
  });

  app.post("/api/employee/push/subscribe", async (req: any, res) => {
    try {
      const empId = req.employeeId;
      if (!empId) return res.status(401).json({ message: "Not authenticated" });
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ message: "Invalid subscription" });
      const sub = await storage.savePushSubscription({ employeeDbId: empId, endpoint, p256dh: keys.p256dh, auth: keys.auth });
      res.json(sub);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/employee/push/subscribe", async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) await storage.deletePushSubscription(endpoint);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === EMPLOYEE CONFIG (Admin) ===
  app.get("/api/employee-config/:employeeDbId", async (req: any, res) => {
    try {
      const cfg = await storage.getEmployeeConfig(Number(req.params.employeeDbId));
      res.json(cfg || { employeeDbId: Number(req.params.employeeDbId), sickLeaveQuota: 7, casualLeaveQuota: 7, privilegeLeaveQuota: 8, earnedLeaveQuota: 0, weeklyOff: "Sunday", workingHours: "8" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/employee-config", async (req: any, res) => {
    try { res.json(await storage.upsertEmployeeConfig(req.body)); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === EXPENSE COMMENT (Employee) ===
  app.get("/api/employee/expenses/:id/comments", async (req: any, res) => {
    try {
      const comments = await storage.getExpenseComments(Number(req.params.id));
      res.json(comments);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/employee/expenses/:id/comments", async (req: any, res) => {
    try {
      const emp = await storage.getEmployee(req.employeeId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      const comment = await storage.createExpenseComment({
        expenseId: Number(req.params.id),
        message: req.body.message,
        createdByName: emp.fullName,
      });
      res.status(201).json(comment);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // === COMPANY SETTINGS ===
  app.get("/api/company-settings", async (req: any, res) => {
    try {
      const settings = await storage.getAllCompanySettings();
      res.json(settings);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/company-settings/:key", async (req: any, res) => {
    try {
      await storage.setCompanySetting(req.params.key, String(req.body.value ?? ""));
      res.json({ key: req.params.key, value: req.body.value });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/employee/company-settings", async (req: any, res) => {
    try {
      const settings = await storage.getAllCompanySettings();
      // If employee has a per-employee DA rate configured, override the global rate
      const empId = req.employeeId;
      if (empId) {
        const emp = await storage.getEmployee(empId);
        if (emp && (emp as any).daExpenseRate != null && Number((emp as any).daExpenseRate) > 0) {
          settings["da_rate_per_day"] = String((emp as any).daExpenseRate);
        }
      }
      res.json(settings);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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

  // Seed default DA rate if not already set
  const daRate = await storage.getCompanySetting("da_rate_per_day");
  if (!daRate || daRate === "0") {
    await storage.setCompanySetting("da_rate_per_day", "150");
    console.log("Seeded default DA rate: ₹150/day");
  }
}
