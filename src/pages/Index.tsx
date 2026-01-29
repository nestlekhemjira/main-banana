import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, Book, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import heroImage from "@/assets/hero-bananas.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setDetecting(true);
    try {
      // Simulate ML detection API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result
      setResult({
        cultivar: "Gros Michel",
        confidence: 0.92,
        characteristics: ["Sweet", "Aromatic", "Yellow skin"],
        quality: "Excellent"
      });
      toast.success("Detection complete!");
    } catch (error) {
      toast.error("Detection failed. Please try again.");
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navbar */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl"></span>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Banana Expert
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/knowledge")}>
              <Book className="w-4 h-4 mr-2" />
              Knowledge
            </Button>
            <Button variant="ghost" onClick={() => navigate("/market")}>
              <Store className="w-4 h-4 mr-2" />
              Marketplace
            </Button>
            <Button onClick={() => navigate("/auth/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={heroImage} alt="Fresh bananas" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
               AI-Powered Thai Banana
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Variety Identification
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              ระบบตรวจจำแนกสายพันธุ์ พร้อมระบบจองผลผลิตจากกล้วยเชื่อมต่อโดยตรงกับเกษตกรฟาร์มกล้วยไทย
            </p>
          </div>
        </div>
      </section>

      {/* Detection Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-3xl mx-auto p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Detection</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">Identify Banana Varieties</h3>
            <p className="text-muted-foreground">
              Upload a photo and let our AI identify the banana cultivar instantly
            </p>
          </div>

          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg mb-4"
                  />
                ) : (
                  <div className="py-12">
                    <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Click to upload image</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Detect Button */}
            {previewUrl && (
              <Button
                onClick={handleDetect}
                disabled={detecting}
                size="lg"
                className="w-full"
              >
                {detecting ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Detect Variety
                  </>
                )}
              </Button>
            )}

            {/* Results */}
            {result && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h4 className="text-xl font-bold mb-4">Detection Results</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cultivar:</span>
                    <span className="font-semibold text-lg">{result.cultivar}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-semibold">{(result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quality:</span>
                    <span className="font-semibold text-secondary">{result.quality}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-2">Characteristics:</span>
                    <div className="flex flex-wrap gap-2">
                      {result.characteristics.map((char: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 text-center hover:shadow-soft transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Detection</h3>
            <p className="text-muted-foreground">
              Instantly identify banana varieties with our advanced ML technology
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-soft transition-shadow">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Expert Knowledge</h3>
            <p className="text-muted-foreground">
              Access comprehensive guides on 10+ Thai banana cultivars
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-soft transition-shadow">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Direct from Farms</h3>
            <p className="text-muted-foreground">
              Reserve fresh produce directly from verified banana farms
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-primary p-12 text-center">
          <h3 className="text-4xl font-bold mb-4 text-primary-foreground">
            Start Your Banana Journey
          </h3>
          <p className="text-xl mb-8 text-primary-foreground/80">
            Join our community of banana enthusiasts and farmers
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/market")}
            >
              Explore Marketplace
            </Button>
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90"
              onClick={() => navigate("/knowledge")}
            >
              Learn More
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 Banana Expert. Connecting Thailand's finest banana farms.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
