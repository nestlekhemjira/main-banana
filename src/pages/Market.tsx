import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Star, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- Types ---------- */

interface FarmProfile {
  farm_name: string;
  farm_location: string;
  rating: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: "fruit" | "shoot";
  price_per_unit: number;
  available_quantity: number;
  unit: string;
  harvest_date: string;
  image_url: string | null;
  farm: FarmProfile | null;
}

/* ---------- Component ---------- */

const Market = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "fruit" | "shoot">("all");

  /* ---------- Load Products ---------- */

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
  .from("products")
  .select(`
    id,
    name,
    description,
    product_type,
    price_per_unit,
    available_quantity,
    unit,
    harvest_date,
    image_url,
    farm: farm_profiles!products_farm_id_fkey (
      farm_name,
      farm_location,
      rating
    )
  `)
  .eq("is_active", true)
  .returns<Product[]>(); // ✅ ตัวนี้คือกุญแจ


      if (error) throw error;

      setProducts(data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("โหลดสินค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Filter ---------- */

  const filteredProducts = products.filter((p) => {
    const keyword = search.toLowerCase();

    const matchName = p.name.toLowerCase().includes(keyword);
    const matchFarm =
      p.farm?.farm_name.toLowerCase().includes(keyword) ?? false;

    const matchType =
      typeFilter === "all" || p.product_type === typeFilter;

    return (matchName || matchFarm) && matchType;
  });

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <nav className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-xl font-bold">Banana Marketplace</h1>

          <Button onClick={() => navigate("/auth/login")}>Sign In</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3">
            Fresh Bananas from Real Farms
          </h2>
          <p className="text-muted-foreground">
            Buy directly from farms across Thailand
          </p>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้าหรือฟาร์ม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) =>
              setTypeFilter(v as "all" | "fruit" | "shoot")
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="fruit">ผล</SelectItem>
              <SelectItem value="shoot">หน่อ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            กำลังโหลดสินค้า...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            ไม่พบสินค้า
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/market/product/${p.id}`)}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <span className="text-5xl">🍌</span>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {p.farm?.farm_name ?? "Unknown Farm"}
                      </div>
                    </div>

                    {p.farm?.rating != null && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-sm font-medium text-primary">
                          {p.farm.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {p.description || "Fresh quality produce"}
                  </p>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        ฿{p.price_per_unit}
                        <span className="text-sm text-muted-foreground">
                          /{p.unit}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.available_quantity} {p.unit} available
                      </p>
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full bg-muted">
                      {p.product_type}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    Harvest:{" "}
                    {new Date(p.harvest_date).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Market; 