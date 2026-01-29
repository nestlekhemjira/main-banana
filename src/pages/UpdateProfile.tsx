import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User, Store } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

interface FarmProfile {
  id: string;
  farm_name: string;
  farm_location: string;
  farm_description: string | null;
  farm_image_url: string | null;
}

const UpdateProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [isFarm, setIsFarm] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const [farmForm, setFarmForm] = useState({
    farm_name: "",
    farm_location: "",
    farm_description: "",
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth/login", { replace: true });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
  // 🔥 CREATE profile ครั้งแรก
  const { error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: session.user.id,
      full_name: "",
    });

  if (insertError) throw insertError;

  const { data: newProfile, error: newError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (newError) throw newError;

  setProfile(newProfile);
  setProfileForm({
    full_name: "",
    phone: "",
    address: "",
  });
} else {
  // 🟢 มี profile อยู่แล้ว
  setProfile(profileData);
  setProfileForm({
    full_name: profileData.full_name || "",
    phone: profileData.phone || "",
    address: profileData.address || "",
  });
}


      const { data: farmData, error: farmError } = await supabase
        .from("farm_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (farmError) throw farmError;

      if (farmData) {
        setFarmProfile(farmData);
        setIsFarm(true);
        setFarmForm({
          farm_name: farmData.farm_name || "",
          farm_location: farmData.farm_location || "",
          farm_description: farmData.farm_description || "",
        });
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     ✅ ADD THIS FUNCTION
     ======================= */
  const saveProfile = async () => {
    if (!profile) {
      toast.error("Profile not found");
      return;
    }

    if (!profileForm.full_name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name.trim(),
          phone: profileForm.phone.trim() || null,
          address: profileForm.address.trim() || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated");
      navigate(-1);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveFarmProfile = async () => {
    if (!farmProfile) return;

    if (!farmForm.farm_name.trim()) {
      toast.error("Farm name is required");
      return;
    }

    if (!farmForm.farm_location.trim()) {
      toast.error("Farm location is required");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("farm_profiles")
        .update({
          farm_name: farmForm.farm_name.trim(),
          farm_location: farmForm.farm_location.trim(),
          farm_description: farmForm.farm_description.trim() || null,
        })
        .eq("id", farmProfile.id);

      if (error) throw error;

      toast.success("Farm profile updated");
      navigate(-1);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update farm profile"
      );
    } finally {
      setSaving(false);
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
      <nav className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Update Profile</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {isFarm ? (
            <Tabs defaultValue="profile">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="profile">
                  <User className="w-4 h-4 mr-2" /> Personal
                </TabsTrigger>
                <TabsTrigger value="farm">
                  <Store className="w-4 h-4 mr-2" /> Farm
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="p-6 space-y-4">
                  <Label>Full Name *</Label>
                  <Input
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        full_name: e.target.value,
                      })
                    }
                  />
                  <Label>Phone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phone: e.target.value,
                      })
                    }
                  />
                  <Label>Address</Label>
                  <Textarea
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        address: e.target.value,
                      })
                    }
                  />
                  <Button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Personal Profile
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="farm">
                <Card className="p-6 space-y-4">
                  <Label>Farm Name *</Label>
                  <Input
                    value={farmForm.farm_name}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        farm_name: e.target.value,
                      })
                    }
                  />
                  <Label>Location *</Label>
                  <Input
                    value={farmForm.farm_location}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        farm_location: e.target.value,
                      })
                    }
                  />
                  <Label>Description</Label>
                  <Textarea
                    value={farmForm.farm_description}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        farm_description: e.target.value,
                      })
                    }
                  />
                  <Button
                    onClick={saveFarmProfile}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Farm Profile
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-6 space-y-4">
              <Label>Full Name *</Label>
              <Input
                value={profileForm.full_name}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    full_name: e.target.value,
                  })
                }
              />
              <Label>Phone</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    phone: e.target.value,
                  })
                }
              />
              <Label>Address</Label>
              <Textarea
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    address: e.target.value,
                  })
                }
              />
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full"
              >
                {saving && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Profile
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
