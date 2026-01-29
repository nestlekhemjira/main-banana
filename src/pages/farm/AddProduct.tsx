import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ProductType = "fruit" | "shoot";

const AddProduct = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    product_type: "fruit" as ProductType,
    price_per_unit: "",
    available_quantity: "",
    unit: "kg",
    harvest_date: "",
    expiry_date: "",
    image_url: "",
  });

  /* ==============================
     LOAD FARM PROFILE (CRITICAL)
     ============================== */
  useEffect(() => {
    const loadFarm = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("farm_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        toast.error("คุณยังไม่มีฟาร์ม");
        navigate("/dashboard");
        return;
      }

      setFarmId(data.id);
      setLoading(false);
    };

    loadFarm();
  }, [navigate]);

  /* ==============================
     SUBMIT
     ============================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!farmId) {
      toast.error("ไม่พบ farm profile");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("products").insert({
      farm_id: farmId, // ✅ มาจาก DB เท่านั้น
      name: form.name.trim(),
      description: form.description || null,
      product_type: form.product_type,
      price_per_unit: Number(form.price_per_unit),
      available_quantity: Number(form.available_quantity),
      unit: form.unit,
      harvest_date: form.harvest_date,
      expiry_date: form.expiry_date || null,
      image_url: form.image_url || null,
    });

    if (error) {
      console.error(error);
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success("เพิ่มสินค้าเรียบร้อย");
    navigate("/farm/products");
  };

  if (loading) return null;

  /* ==============================
     UI
     ============================== */
  return (
    <div className="container mx-auto max-w-xl py-10">
      <Card className="p-6 space-y-6">
        <h1 className="text-xl font-bold">เพิ่มสินค้า</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>ชื่อสินค้า</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>รายละเอียด</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label>ประเภท</Label>
            <Select
              value={form.product_type}
              onValueChange={(v: ProductType) =>
                setForm({ ...form, product_type: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fruit">ผล</SelectItem>
                <SelectItem value="shoot">หน่อ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>ราคา</Label>
            <Input
              type="number"
              value={form.price_per_unit}
              onChange={(e) =>
                setForm({ ...form, price_per_unit: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>จำนวน</Label>
            <Input
              type="number"
              value={form.available_quantity}
              onChange={(e) =>
                setForm({ ...form, available_quantity: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>หน่วย</Label>
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>

          <div>
            <Label>วันเก็บเกี่ยว</Label>
            <Input
              type="date"
              value={form.harvest_date}
              onChange={(e) =>
                setForm({ ...form, harvest_date: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>วันหมดอายุ</Label>
            <Input
              type="date"
              value={form.expiry_date}
              onChange={(e) =>
                setForm({ ...form, expiry_date: e.target.value })
              }
            />
          </div>

          <div>
            <Label>รูป (URL)</Label>
            <Input
              value={form.image_url}
              onChange={(e) =>
                setForm({ ...form, image_url: e.target.value })
              }
            />
          </div>

          <Button disabled={submitting} type="submit" className="w-full">
            เพิ่มสินค้า
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddProduct;
