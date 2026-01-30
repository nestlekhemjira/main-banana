import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------- Types ---------- */

interface ShippingOrder {
  id: string;
  quantity: number;
  shipped_at: string;
  carrier: string | null;
  tracking_number: string | null;
  products: {
    name: string;
    product_type: string;
  };
}

interface ConfirmedOrder {
  id: string;
  quantity: number;
  products: {
    name: string;
    product_type: string;
    harvest_date: string;
  };
}

interface Reservation {
  id: string;
  quantity: number;
  expiry_date: string;
  created_at: string;
  products: {
    name: string;
    product_type: string;
    harvest_date: string;
  };
}

/* ---------- Component ---------- */

const UserOrders = () => {
  const [shipping, setShipping] = useState<ShippingOrder[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedOrder[]>([]);
  const [pending, setPending] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openReview, setOpenReview] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<ShippingOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [shippingRes, confirmedRes, pendingRes] = await Promise.all([
        // 🚚 กำลังจัดส่ง
        supabase
          .from("orders")
          .select(`
            id,
            quantity,
            shipped_at,
            carrier,
            tracking_number,
            products ( name, product_type )
          `)
          .eq("user_id", user.id)
          .eq("status", "shipped")
          .order("shipped_at", { ascending: false }),

        // ✅ ฟาร์มยืนยันแล้ว
        supabase
          .from("orders")
          .select(`
            id,
            quantity,
            products ( name, product_type, harvest_date )
          `)
          .eq("user_id", user.id)
          .eq("status", "confirmed")
          .order("confirmed_at"),

        // ⏳ รอการยืนยัน
        supabase
          .from("reservations")
          .select(`
            id,
            quantity,
            created_at,
            expiry_date,
            products ( name, product_type, harvest_date )
          `)
          .eq("user_id", user.id)
          .order("created_at"),
      ]);

      setShipping(shippingRes.data || []);
      setConfirmed(confirmedRes.data || []);
      setPending(pendingRes.data || []);
    } catch (e) {
      toast.error("โหลดรายการออเดอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const confirmReceived = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "shipped")
      .select()
      .single();

    if (error || !data) {
      toast.error("ไม่สามารถยืนยันรับสินค้าได้");
      return;
    }

    toast.success("ยืนยันรับสินค้าเรียบร้อย");
    setSelectedOrder(data);      // 👉 เปิดรีวิว
    setOpenReview(true);
    loadAll();
  } catch {
    toast.error("เกิดข้อผิดพลาด");
  }
};

    const submitReview = async () => {
  if (!selectedOrder) return;

  // 1️⃣ ป้องกันรีวิวซ้ำ
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", selectedOrder.id)
    .maybeSingle();

  if (existing) {
    toast.error("ออเดอร์นี้รีวิวไปแล้ว");
    return;
  }

  // 2️⃣ insert รีวิว
  const { error } = await supabase.from("reviews").insert({
    order_id: selectedOrder.id,
    farm_id: selectedOrder.id,
    user_id: selectedOrder.id,
    rating,
    comment,
  });

  if (error) {
    toast.error(error.message);
    return;
  }

  // 3️⃣ เปลี่ยนสถานะเป็น reviewed
  await supabase
    .from("orders")
    .update({ status: "reviewed" })
    .eq("id", selectedOrder.id);

  toast.success("ขอบคุณสำหรับรีวิว 🌟");

  // reset
  setOpenReview(false);
  setSelectedOrder(null);
  setRating(5);
  setComment("");
  loadAll();
};



  

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* ===== Header ===== */}
      <div className="flex items-center gap-4">
        <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)} 
            >

          <ArrowLeft/>
        </Button>
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      {/* 🚚 SHIPPING */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">🚚 กำลังจัดส่ง</h2>

        {shipping.length === 0 && (
          <p className="text-muted-foreground">ไม่มีรายการ</p>
        )}

        {shipping.map((o) => (
          <div key={o.id} className="border rounded p-4 space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{o.products.name}</p>
                <p className="text-sm text-muted-foreground">
                  {o.products.product_type} • {o.quantity} ชิ้น
                </p>
              </div>
              <Badge>Shipped</Badge>
            </div>

            <p>📦 ขนส่ง: {o.carrier || "-"}</p>
            <p>🔢 Tracking: {o.tracking_number || "-"}</p>
            <p>📅 วันที่ส่ง: {new Date(o.shipped_at).toLocaleDateString()}</p>

            <Button onClick={() => confirmReceived(o.id)}>
              ได้รับของแล้ว
            </Button>
          </div>
        ))}
      </Card>

      {/* ✅ CONFIRMED */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">✅ ฟาร์มยืนยันแล้ว</h2>

        {confirmed.length === 0 && (
          <p className="text-muted-foreground">ไม่มีรายการ</p>
        )}

        {confirmed.map((o) => (
          <div key={o.id} className="border rounded p-4">
            <p className="font-semibold">{o.products.name}</p>
            <p className="text-sm text-muted-foreground">
              {o.products.product_type} • {o.quantity} ชิ้น
            </p>
            <p>🌱 เก็บเกี่ยว: {o.products.harvest_date}</p>
          </div>
        ))}
      </Card>

      {/* ⏳ PENDING */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">⏳ รอการยืนยัน</h2>

        {pending.length === 0 && (
          <p className="text-muted-foreground">ไม่มีรายการ</p>
        )}

        {pending.map((r) => (
          <div key={r.id} className="border rounded p-4">
            <p className="font-semibold">{r.products.name}</p>
            <p className="text-sm text-muted-foreground">
              {r.products.product_type} • {r.quantity} ชิ้น
            </p>
            <p>📅 วันที่จัดส่ง: {r.expiry_date}</p>
          </div>
        ))}
      </Card>
        {/* ⭐ REVIEW MODAL — ใส่ตรงนี้ */}
    <Dialog open={openReview} onOpenChange={setOpenReview}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            รีวิวฟาร์ม {selectedOrder?.products?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-1">ให้คะแนน</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant={rating >= n ? "default" : "outline"}
                  onClick={() => setRating(n)}
                >
                  ⭐ {n}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="เขียนความคิดเห็นเกี่ยวกับฟาร์ม"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <Button onClick={submitReview} className="w-full">
            ส่งรีวิว
          </Button>
        </div>
      </DialogContent>
    </Dialog>


    </div>
  );
};

export default UserOrders;
