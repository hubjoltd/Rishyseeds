import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Shield, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resources = [
  "dashboard", "batches", "locations", "stock", "packaging", "products",
  "employees", "attendance", "payroll", "users", "reports", "lots",
  "processing", "outward", "packagingSizes"
] as const;

const actions = ["view", "create", "edit", "delete"] as const;

const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.record(z.array(z.string())).default({}),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export default function Roles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: roles, isLoading } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setOpen(false);
      form.reset();
      toast({ title: "Success", description: "Role created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RoleFormData }) => {
      const res = await fetch(`/api/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setOpen(false);
      setEditingRole(null);
      form.reset();
      toast({ title: "Success", description: "Role updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDeleteRoleId(null);
      toast({ title: "Success", description: "Role deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (role: any) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || {},
    });
    setOpen(true);
  };

  const onSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    const current = form.getValues("permissions");
    const resourcePerms = current[resource] || [];
    const updated = resourcePerms.includes(action)
      ? resourcePerms.filter((a: string) => a !== action)
      : [...resourcePerms, action];
    form.setValue("permissions", { ...current, [resource]: updated });
  };

  const hasPermission = (resource: string, action: string) => {
    const perms = form.watch("permissions");
    return perms[resource]?.includes(action) || false;
  };

  const filteredRoles = (roles || []).filter((role: any) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Role Management</h2>
          <p className="text-muted-foreground">Create and manage roles with custom permissions</p>
        </div>

        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingRole(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-new-role">
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
              <DialogDescription>Define role name and assign permissions</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Name</label>
                  <Input
                    {...form.register("name")}
                    placeholder="e.g., Supervisor"
                    data-testid="input-role-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    {...form.register("description")}
                    placeholder="Role description"
                    data-testid="input-role-description"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Permissions</label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        {actions.map((action) => (
                          <TableHead key={action} className="text-center capitalize">{action}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource) => (
                        <TableRow key={resource}>
                          <TableCell className="capitalize font-medium">{resource.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                          {actions.map((action) => (
                            <TableCell key={action} className="text-center">
                              <Checkbox
                                checked={hasPermission(resource, action)}
                                onCheckedChange={() => togglePermission(resource, action)}
                                data-testid={`checkbox-${resource}-${action}`}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-role"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editingRole ? "Update Role" : "Create Role")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-roles"
        />
      </div>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Roles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading roles...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No roles found. Create your first role above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role: any) => {
                    const permCount = Object.values(role.permissions || {}).flat().length;
                    return (
                      <TableRow key={role.id} data-testid={`row-role-${role.id}`}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="text-muted-foreground">{role.description || "-"}</TableCell>
                        <TableCell>{permCount} permissions</TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(role)}
                              data-testid={`button-edit-role-${role.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteRoleId(role.id)}
                              data-testid={`button-delete-role-${role.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && deleteMutation.mutate(deleteRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
