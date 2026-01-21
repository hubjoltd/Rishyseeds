import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Leaf, Grid3X3, List, Eye, Pencil, Trash2, Sprout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function Products() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ crop: "", variety: "", type: "notified" });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product added successfully" });
      setOpen(false);
      setFormData({ crop: "", variety: "", type: "notified" });
    },
  });

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.crop.toLowerCase().includes(search.toLowerCase()) ||
                          p.variety.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueCrops = Array.from(new Set(products?.map(p => p.crop) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Products & Crops</h2>
          <p className="text-sm text-muted-foreground">Manage seed varieties and hybrids</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary" data-testid="button-add-product">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Enter crop and variety details</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Crop Name</label>
                <Input 
                  value={formData.crop}
                  onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                  placeholder="e.g., Tomato, Chilli, Maize"
                  data-testid="input-crop-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Variety</label>
                <Input 
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="e.g., RISHI-11, ARKA VIKAS"
                  data-testid="input-variety-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notified">Notified Variety</SelectItem>
                    <SelectItem value="private_research">Private Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-product">
                {createMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search crops or varieties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-0"
            data-testid="input-search-products"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-0">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="notified">Notified</SelectItem>
            <SelectItem value="private_research">Private Research</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg overflow-hidden bg-muted/50 p-1">
          <Button
            variant="ghost"
            size="sm"
            className={viewMode === "table" ? "bg-background shadow-sm" : ""}
            onClick={() => setViewMode("table")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={viewMode === "grid" ? "bg-background shadow-sm" : ""}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-modern">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl stat-gradient-green">
                <Sprout className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueCrops.length}</p>
                <p className="text-xs text-muted-foreground">Crops</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl stat-gradient-blue">
                <Leaf className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Varieties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl stat-gradient-amber">
                <Leaf className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products?.filter(p => p.type === "notified").length || 0}</p>
                <p className="text-xs text-muted-foreground">Notified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl stat-gradient-rose">
                <Leaf className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products?.filter(p => p.type === "private_research").length || 0}</p>
                <p className="text-xs text-muted-foreground">Private Research</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <Card className="card-modern overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Crop</TableHead>
                <TableHead className="font-semibold">Variety</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredProducts?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
              ) : (
                filteredProducts?.map((product) => (
                  <TableRow key={product.id} className="table-row-hover" data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Sprout className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium">{product.crop}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">{product.variety}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={product.type === "notified" ? "badge-info" : "badge-success"}>
                        {product.type === "notified" ? "Notified" : "Private Research"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={product.isActive ? "badge-success" : "badge-danger"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-product-${product.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-product-${product.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="card-grid">
          {filteredProducts?.map((product) => (
            <Card key={product.id} className="card-modern p-4" data-testid={`card-product-${product.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <Sprout className="w-5 h-5 text-green-600" />
                </div>
                <Badge variant="secondary" className={product.type === "notified" ? "badge-info" : "badge-success"}>
                  {product.type === "notified" ? "Notified" : "Private"}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">{product.crop}</h3>
              <p className="text-primary font-medium">{product.variety}</p>
              <div className="flex gap-2 mt-4 pt-3 border-t border-border/40">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
