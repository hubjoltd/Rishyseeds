import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type User } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type Action = 'view' | 'create' | 'edit' | 'delete';
type Resource = 'batches' | 'locations' | 'stock' | 'packaging' | 'products' | 'employees' | 'attendance' | 'payroll' | 'users' | 'reports' | 'dashboard';
type Permissions = Record<Resource, Action[]>;

export interface UserPermissions {
  role: string;
  permissions: Permissions;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const userQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json() as User;
    },
  });

  const permissionsQuery = useQuery({
    queryKey: ["/api/auth/permissions"],
    queryFn: async () => {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return await res.json() as UserPermissions;
    },
    enabled: !!userQuery.data,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Pick<InsertUser, "username" | "password">) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      return await res.json() as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.username}` });
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method, credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear(); // Clear all data on logout
      toast({ title: "Logged out", description: "See you next time!" });
    },
  });

  const hasPermission = (resource: Resource, action: Action): boolean => {
    const perms = permissionsQuery.data?.permissions;
    if (!perms) return false;
    return perms[resource]?.includes(action) ?? false;
  };

  const canDelete = (resource: Resource): boolean => hasPermission(resource, 'delete');
  const canEdit = (resource: Resource): boolean => hasPermission(resource, 'edit');
  const canCreate = (resource: Resource): boolean => hasPermission(resource, 'create');
  const canView = (resource: Resource): boolean => hasPermission(resource, 'view');

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    permissions: permissionsQuery.data,
    hasPermission,
    canDelete,
    canEdit,
    canCreate,
    canView,
  };
}

export type { Action, Resource };
