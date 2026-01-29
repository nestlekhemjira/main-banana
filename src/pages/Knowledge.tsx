import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cultivar {
  id: string;
  name: string;
  thai_name: string;
  slug: string;
  description: string;
  characteristics: string;
  image_url: string | null;
}

const Knowledge = () => {
  const navigate = useNavigate();
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [filteredCultivars, setFilteredCultivars] = useState<Cultivar[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCultivars();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredCultivars(
        cultivars.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.thai_name.includes(search) ||
            c.description.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredCultivars(cultivars);
    }
  }, [search, cultivars]);

  const fetchCultivars = async () => {
    try {
      const { data, error } = await supabase
        .from("cultivars")
        .select("*")
        .order("name");

      if (error) throw error;
      setCultivars(data || []);
      setFilteredCultivars(data || []);
    } catch (error: any) {
      toast.error("Failed to load cultivars");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍌</span>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Banana Expert
            </h1>
          </div>
          <Button onClick={() => navigate("/auth/login")}>Sign In</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Banana Knowledge Base</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore comprehensive information about Thai banana cultivars, their
            characteristics, and growing conditions.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search cultivars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Cultivars Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading cultivars...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredCultivars.map((cultivar) => (
              <Card
                key={cultivar.id}
                className="overflow-hidden hover:shadow-soft transition-shadow cursor-pointer"
                onClick={() => navigate(`/knowledge/${cultivar.slug}`)}
              >
                <div className="aspect-video bg-gradient-primary flex items-center justify-center">
                  <span className="text-6xl">🍌</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{cultivar.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {cultivar.thai_name}
                  </p>
                  <p className="text-sm line-clamp-3">{cultivar.description}</p>
                  {cultivar.characteristics && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cultivar.characteristics
                        .split(",")
                        .slice(0, 3)
                        .map((char, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                          >
                            {char.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredCultivars.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cultivars found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;
