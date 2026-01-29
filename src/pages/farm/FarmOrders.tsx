import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Eye,
  Check,
  X,
  Truck,
} from "lucide-react";

/* ---------- Types ---------- */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

interface Reservation {
  id: string;
  status: OrderStatus;
  quantity: number;
  created_at: string;
  delivery_date: string | null;
  tracking_number: string | null;
  products: {
    id: string;
    name: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

/* ---------- Component ---------- */

const FarmOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "pending" | "confirmed" | "shipping" | "done"
  >("pending");

  const [orders, setOrders] = useState<Reservation[]>([]);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  /* ---------- Load ---------- */

  const loadOrders = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          id,
          status,
          quantity,
          created_at,
          delivery_date,
          tracking_number,
          products ( id, name ),
          profiles:user_id ( full_name )
        `
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Actions ---------- */

  const updateStatus = async (
    id: string,
    status: OrderStatus,
    extra?: any
  ) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status, ...extra })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Updated");
    loadOrders();
  };

  /* ---------- Buckets ---------- */

  const today = new Date().toISOString().slice(0, 10);

  const pending = useMemo(
    () => orders.filter((o) => o.status === "pending"),
    [orders]
  );

  const confirmedToday = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "confirmed" && o.delivery_date === today
      ),
    [orders]
  );

  const confirmedLater = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "confirmed" &&
          o.delivery_date &&
          o.delivery_date > today
      ),
    [orders]
  );

  const shipping = useMemo(
    () => orders.filter((o) => o.status === "shipped"),
    [orders]
  );

  const done = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "delivered" || o.status === "cancelled"
      ),
    [orders]
  );

  /* ---------- UI ---------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ---------- Header ---------- */}
      <nav className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/farm/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Farm Orders</h1>
        </div>
      </nav>

      {/* ---------- Summary ---------- */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-4 gap-4 max-w-6xl">
        <Card className="p-4">Pending: {pending.length}</Card>
        <Card className="p-4">Ship Today: {confirmedToday.length}</Card>
        <Card className="p-4">Shipping: {shipping.length}</Card>
        <Card className="p-4">Done: {done.length}</Card>
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ---------- Pending ---------- */}
        {tab === "pending" && (
          <OrderTable
            data={pending}
            actions={(o) => (
              <>
                <Button
                  size="icon"
                  onClick={() =>
                    updateStatus(o.id, "confirmed", {
                      confirmed_at: new Date(),
                    })
                  }
                >
                  <Check />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() =>
                    updateStatus(o.id, "cancelled", {
                      cancelled_at: new Date(),
                    })
                  }
                >
                  <X />
                </Button>
              </>
            )}
          />
        )}

        {/* ---------- Confirmed ---------- */}
        {tab === "confirmed" && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">
                📦 Ship Today
              </h3>
              <OrderTable
                data={confirmedToday}
                actions={(o) => (
                  <Button
                    onClick={() => setShippingId(o.id)}
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    Ship
                  </Button>
                )}
              />
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">
                ⏳ Upcoming
              </h3>
              <OrderTable data={confirmedLater} />
            </Card>
          </div>
        )}

        {/* ---------- Shipping ---------- */}
        {tab === "shipping" && <OrderTable data={shipping} />}

        {/* ---------- Done ---------- */}
        {tab === "done" && <OrderTable data={done} />}
      </div>

      {/* ---------- Ship Modal (simple) ---------- */}
      {shippingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <Card className="p-6 space-y-4 w-96">
            <h3 className="font-semibold">Enter Tracking</h3>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
            <Button
              disabled={!tracking}
              onClick={() => {
                updateStatus(shippingId, "shipped", {
                  tracking_number: tracking,
                  shipped_at: new Date(),
                });
                setShippingId(null);
                setTracking("");
              }}
            >
              Confirm
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

/* ---------- Table Component ---------- */

const OrderTable = ({
  data,
  actions,
}: {
  data: Reservation[];
  actions?: (o: Reservation) => React.ReactNode;
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((o) => (
          <TableRow key={o.id}>
            <TableCell>{o.profiles?.full_name}</TableCell>
            <TableCell>{o.products?.name}</TableCell>
            <TableCell>{o.quantity}</TableCell>
            <TableCell>{o.delivery_date || "-"}</TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  window.location.href = `/farm/orders/${o.id}`
                }
              >
                <Eye className="w-4 h-4" />
              </Button>
              {actions && actions(o)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default FarmOrders;
