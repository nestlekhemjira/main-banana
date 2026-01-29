import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cultivar {
  id: string;
  name: string;
  thai_name: string;
  description: string;
  characteristics: string;
  growing_conditions: string;
  uses: string;
}

const CultivarDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [cultivar, setCultivar] = useState<Cultivar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCultivar();
    }
  }, [slug]);

  const fetchCultivar = async () => {
    try {
      const { data, error } = await supabase
        .from("cultivars")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setCultivar(data);
    } catch (error: any) {
      toast.error("Failed to load cultivar details");
      navigate("/knowledge");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!cultivar) return null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/knowledge")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden shadow-card">
            <div className="aspect-video bg-gradient-primary flex items-center justify-center">
              <span className="text-9xl">🍌</span>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{cultivar.name}</h1>
                <p className="text-xl text-muted-foreground">{cultivar.thai_name}</p>
              </div>

              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-bold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {cultivar.description}
                  </p>
                </section>

                {cultivar.characteristics && (
                  <section>
                    <h2 className="text-2xl font-bold mb-3">Characteristics</h2>
                    <div className="flex flex-wrap gap-2">
                      {cultivar.characteristics.split(",").map((char, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-full"
                        >
                          {char.trim()}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {cultivar.growing_conditions && (
                  <section>
                    <h2 className="text-2xl font-bold mb-3">Growing Conditions</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {cultivar.growing_conditions}
                    </p>
                  </section>
                )}

                {cultivar.uses && (
                  <section>
                    <h2 className="text-2xl font-bold mb-3">Common Uses</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {cultivar.uses}
                    </p>
                  </section>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button onClick={() => navigate("/market")} size="lg">
                  Browse {cultivar.name} Products
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CultivarDetail;
