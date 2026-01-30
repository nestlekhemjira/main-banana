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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ---------- Types ---------- */

type OrderStatus =
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

interface Reservation {
  id: string;
  quantity: number;
  created_at: string;
  products: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  quantity: number;
  tracking_number: string | null;
  created_at: string;
  products: { name: string } | null;
  profiles: { full_name: string } | null;
}

/* ---------- Component ---------- */

const FarmOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "pending" | "confirmed" | "shipping" | "done"
  >("pending");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [shippingId, setShippingId] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- Load ---------- */

  const loadData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/auth/login");
        return;
      }

      const [{ data: r }, { data: o }] = await Promise.all([
        supabase
          .from("reservations")
          .select(`
            id,
            quantity,
            created_at,
            products ( name ),
            profiles:user_id ( full_name )
          `)
          .order("created_at"),

        supabase
          .from("orders")
          .select(`
            id,
            status,
            quantity,
            tracking_number,
            created_at,
            products ( name ),
            profiles:user_id ( full_name )
          `)
          .order("created_at"),
      ]);

      setReservations(r || []);
      setOrders(o || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Actions ---------- */

  const confirmReservation = async (r: Reservation) => {
  const { error } = await supabase.rpc("confirm_reservation", {
    p_reservation_id: r.id,
  });

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success("ยืนยันออเดอร์เรียบร้อย");
loadData(); // ✅ ใช้อันนี้
  }


  const cancelReservation = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    loadData();
  };

  const updateOrder = async (
    id: string,
    status: OrderStatus,
    extra?: any
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ status, ...extra })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    loadData();
  };

  /* ---------- Buckets ---------- */

  const confirmed = useMemo(
    () => orders.filter((o) => o.status === "confirmed"),
    [orders]
  );

  const shipping = useMemo(
    () => orders.filter((o) => o.status === "shipped"),
    [orders]
  );

  const done = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "delivered" ||
          o.status === "cancelled"
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
    

      {/* ---------- Tabs ---------- */}
      <div className="container mx-auto px-4 max-w-6xl space-y-6 py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        

        {tab === "confirmed" && (
          <OrderTable
            data={confirmed}
            actions={(o) => (
              <Button onClick={() => setShippingId(o.id)}>
                <Truck className="w-4 h-4 mr-1" />
                Ship
              </Button>
            )}
          />
        )}

        {tab === "shipping" && (
          <OrderTable data={shipping} />
        )}

        {tab === "done" && (
          <OrderTable data={done} />
        )}
      </div>

          {/* ---------- Ship Modal ---------- */}
{shippingId && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <Card className="p-6 space-y-4 w-96">
      <h3 className="font-semibold text-lg">
        Shipping Information
      </h3>

      {/* ชื่อขนส่ง */}
      <Input
        placeholder="ชื่อขนส่ง (เช่น Kerry, Flash, ไปรษณีย์ไทย)"
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
      />

      {/* Tracking */}
      <Input
        placeholder="Tracking number"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
      />

      <Button
        className="w-full"
        disabled={!carrier.trim() || !tracking.trim()}
        onClick={() => {
          updateOrder(shippingId, "shipped", {
            carrier: carrier.trim(),
            tracking_number: tracking.trim(),
            shipped_at: new Date().toISOString(),
          });

          setShippingId(null);
          setCarrier("");
          setTracking("");
        }}
      >
        Confirm Shipment
      </Button>
    </Card>
  </div>
)}
 </div>  
  );       
}; 



/* ---------- Table ---------- */

const OrderTable = ({
  data,
  actions,
}: {
  data: any[];
  actions?: (o: any) => React.ReactNode;
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data
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
          <TableHead className="text-right">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((o) => (
          <TableRow key={o.id}>
            <TableCell>{o.profiles?.full_name}</TableCell>
            <TableCell>{o.products?.name}</TableCell>
            <TableCell>{o.quantity}</TableCell>
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
