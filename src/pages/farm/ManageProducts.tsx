import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  product_type: "fruit" | "shoot";
  price_per_unit: number;
  available_quantity: number;
  unit: string;
  harvest_date: string;
  is_active: boolean;
}

const ManageProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth/login");

      const { data: farm, error: farmError } = await supabase
        .from("farm_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (farmError || !farm) {
        toast.error("Farm profile not found");
        return navigate("/dashboard");
      }

      setFarmId(farm.id);
      await fetchProducts(farm.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to initialize");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (farmId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select(`id, name, product_type, price_per_unit, available_quantity, unit, harvest_date, is_active`)
      .eq("farm_id", farmId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProducts(data || []);
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id)
        .eq("farm_id", farmId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !p.is_active } : p
        )
      );

      toast.success("Product status updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const softDelete = async (productId: string) => {
    if (!confirm("Delete this product? (soft delete)")) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", productId)
        .eq("farm_id", farmId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}> 
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Manage Products</h1>
          </div>
          <Button onClick={() => navigate("/farm/products/add")}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground">No active products</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Harvest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <Badge>{p.product_type}</Badge>
                    </TableCell>
                    <TableCell>฿{p.price_per_unit}/{p.unit}</TableCell>
                    <TableCell>{p.available_quantity}</TableCell>
                    <TableCell>{new Date(p.harvest_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "outline"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/farm/products/edit/${p.id}`)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => toggleActive(p)}>
                          {p.is_active ? <ToggleRight /> : <ToggleLeft />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => softDelete(p.id)}>
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ManageProducts;