import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Loader2,
  TrendingUp,
  Star,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

/* ---------- Types ---------- */

interface FarmProfile {
  id: string;
  farm_name: string;
  farm_location: string;
  farm_description: string | null;
  rating: number | null;
  total_reviews: number | null;
  total_sales: number | null;
  verified: boolean | null;
}

interface Stats {
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
}

/* ---------- Component ---------- */

const FarmDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    loadFarmData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFarmData = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth/login", { replace: true });
        return;
      }

      const userId = session.user.id;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const isFarm = roles?.some((r) => r.role === "farm");
      if (!isFarm) {
        toast.error("You are not a farm user");
        navigate("/dashboard", { replace: true });
        return;
      }

      const { data: farmData } = await supabase
        .from("farm_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!farmData) {
        toast.error("Farm profile not found");
        navigate("/dashboard", { replace: true });
        return;
      }

      setFarm(farmData);

      const { data: products } = await supabase
        .from("products")
        .select("id, is_active")
        .eq("farm_id", farmData.id);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("farm_id", farmData.id);

      setStats({
        activeProducts: products?.filter((p) => p.is_active).length ?? 0,
        totalOrders: orders?.length ?? 0,
        pendingOrders:
          orders?.filter((o) => o.status === "pending").length ?? 0,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load farm dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold">Farm Dashboard</h1>
          </div>

          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* FARM INFO (READ ONLY) */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{farm?.farm_name}</h2>
              <p className="text-muted-foreground">{farm?.farm_location}</p>
              {farm?.farm_description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {farm.farm_description}
                </p>
              )}
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-500 justify-end">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">
                  {farm?.rating?.toFixed(1) ?? "0.0"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {farm?.total_reviews ?? 0} reviews
              </p>
            </div>
          </div>
        </Card>

        {/* KEY METRICS (INFO ONLY) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <InfoCard
            icon={<Package className="w-5 h-5" />}
            label="Active Products"
            value={stats.activeProducts}
          />
          <InfoCard
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Total Orders"
            value={stats.totalOrders}
          />
          <InfoCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Sales"
            value={`฿${farm?.total_sales?.toLocaleString() ?? 0}`}
          />
        </div>

        {/* MANAGEMENT ACTIONS */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            MANAGEMENT
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <ActionRow
              icon={<Package className="w-5 h-5" />}
              title="Manage Products"
              subtitle="Add, edit, or deactivate products"
              onClick={() => navigate("/farm/products")}
            />

            <ActionRow
              icon={<ShoppingCart className="w-5 h-5" />}
              title="Orders"
              subtitle={`${stats.pendingOrders} pending orders`}
              onClick={() => navigate("/farm/orders")}
            />

            <ActionRow
              icon={<Settings className="w-5 h-5" />}
              title="Farm Settings"
              subtitle="Edit farm profile & settings"
              onClick={() => navigate("/profile")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- UI Blocks ---------- */

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) => (
  <Card className="p-4 flex items-center gap-3 bg-muted/40">
    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </Card>
);

const ActionRow = ({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <Card
    className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent transition"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </Card>
);

export default FarmDashboard;