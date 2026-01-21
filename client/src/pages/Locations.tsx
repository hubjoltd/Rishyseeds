import { useState } from "react";
import { useLocations, useCreateLocation } from "@/hooks/use-inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Warehouse } from "lucide-react";

export default function Locations() {
  const { data: locations, isLoading } = useLocations();
  const { mutate: createLocation, isPending } = useCreateLocation();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof insertLocationSchema>>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: { isActive: true }
  });

  const onSubmit = (data: z.infer<typeof insertLocationSchema>) => {
    createLocation(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Locations</h2>
          <p className="text-muted-foreground">Warehouses and processing units</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location Name</label>
                <Input {...form.register("name")} placeholder="e.g., Warehouse A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Input {...form.register("type")} placeholder="storage, processing, etc." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Capacity (optional)</label>
                <Input type="number" {...form.register("capacity", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input {...form.register("address")} />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Adding..." : "Add Location"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          locations?.map((loc) => (
            <Card key={loc.id} className="card-hover border-t-4 border-t-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{loc.name}</h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider text-xs font-semibold">{loc.type}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {loc.address || "No address provided"}
                  </div>
                  {loc.capacity && (
                    <div className="font-medium text-foreground">
                      Capacity: {loc.capacity} Units
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
