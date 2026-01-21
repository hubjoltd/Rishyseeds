import { useState } from "react";
import { Link } from "wouter";
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
import { MapPin, Plus, Warehouse, ChevronRight } from "lucide-react";

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
          <h2 className="text-3xl font-bold font-display text-primary">Warehouses</h2>
          <p className="text-muted-foreground">Storage and processing facilities</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-warehouse">
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Warehouse Name</label>
                <Input {...form.register("name")} placeholder="e.g., Warehouse A" data-testid="input-warehouse-name" />
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
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-warehouse">
                {isPending ? "Adding..." : "Add Warehouse"}
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
            <Link key={loc.id} href={`/locations/${loc.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group" data-testid={`card-location-${loc.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Warehouse className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{loc.name}</h3>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider text-xs font-semibold">{loc.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
