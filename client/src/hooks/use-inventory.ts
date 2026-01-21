import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBatch, type InsertLocation, type CreateStockMovementRequest, type CreatePackagingOutputRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// === LOCATIONS ===
export function useLocations() {
  return useQuery({
    queryKey: [api.locations.list.path],
    queryFn: async () => {
      const res = await fetch(api.locations.list.path);
      if (!res.ok) throw new Error("Failed to fetch locations");
      return api.locations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertLocation) => {
      const res = await fetch(api.locations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return api.locations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.locations.list.path] });
      toast({ title: "Success", description: "Location created successfully" });
    },
  });
}

// === BATCHES ===
export function useBatches() {
  return useQuery({
    queryKey: [api.batches.list.path],
    queryFn: async () => {
      const res = await fetch(api.batches.list.path);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return api.batches.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertBatch) => {
      const res = await fetch(api.batches.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create batch");
      }
      return api.batches.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.batches.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      toast({ title: "Success", description: "Batch created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBatch> }) => {
      const res = await fetch(`/api/batches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update batch");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.batches.list.path] });
      toast({ title: "Success", description: "Batch updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete batch");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.batches.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      toast({ title: "Success", description: "Batch deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// === STOCK OPERATIONS ===
export function useStockMovements() {
  return useQuery({
    queryKey: [api.stock.history.path],
    queryFn: async () => {
      const res = await fetch(api.stock.history.path);
      if (!res.ok) throw new Error("Failed to fetch movements");
      return api.stock.history.responses[200].parse(await res.json());
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: CreateStockMovementRequest) => {
      const res = await fetch(api.stock.move.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to move stock");
      }
      return api.stock.move.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stock.history.path] });
      queryClient.invalidateQueries({ queryKey: [api.batches.list.path] });
      toast({ title: "Success", description: "Stock moved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreatePackagingOutput() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: CreatePackagingOutputRequest) => {
      const res = await fetch(api.packaging.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create packaging record");
      return api.packaging.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.packaging.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.batches.list.path] });
      toast({ title: "Success", description: "Packaging recorded successfully" });
    },
  });
}

export function usePackagingOutputs() {
  return useQuery({
    queryKey: [api.packaging.list.path],
    queryFn: async () => {
      const res = await fetch(api.packaging.list.path);
      if (!res.ok) throw new Error("Failed to fetch packaging history");
      return api.packaging.list.responses[200].parse(await res.json());
    },
  });
}
