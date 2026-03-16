import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Building, 
  User as UserIcon,
  Users,
  UserPlus,
  Trash2,
  Shield,
  Loader2,
  Mail
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function Settings() {
  const { user, userProfile, company, isAdmin, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Company Data (nur für Admins editierbar)
  const [companyData, setCompanyData] = useState({
    company_name: "",
    owner: "",
    street: "",
    zip: "",
    city: "",
    phone: "",
    email: "",
    tax_number: "",
    vat_id: "",
    iban: "",
    bic: "",
    bank_name: "",
  });

  // User Profile (für alle editierbar)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // User Management (nur für Admins)
  const [companyUsers, setCompanyUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "user" as "admin" | "user",
  });

  useEffect(() => {
    loadSettings();
  }, [company, userProfile]);

  const loadSettings = async () => {
    try {
      if (company) {
        setCompanyData({
          company_name: company.company_name || "",
          owner: company.owner || "",
          street: company.street || "",
          zip: company.zip || "",
          city: company.city || "",
          phone: company.phone || "",
          email: company.email || "",
          tax_number: company.tax_number || "",
          vat_id: company.vat_id || "",
          iban: company.iban || "",
          bic: company.bic || "",
          bank_name: company.bank_name || "",
        });
      }

      if (userProfile) {
        setProfileData({
          name: userProfile.name || "",
          email: userProfile.email || "",
        });
      }

      // Lade User-Liste (nur für Admins)
      if (isAdmin && company?.id) {
        await loadUsers();
        await loadInvitations();
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!company?.id) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    setCompanyUsers(data || []);
  };

  const loadInvitations = async () => {
    if (!company?.id) return;

    const { data, error } = await supabase
      .from("employee_invitations")
      .select("*")
      .eq("company_id", company.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading invitations:", error);
      return;
    }

    setInvitations(data || []);
  };

  const saveCompanyData = async () => {
    if (!company?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update(companyData)
        .eq("id", company.id);

      if (error) throw error;

      toast.success("Firmendaten gespeichert");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast.error("Fehler beim Speichern", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProfileData = async () => {
    if (!userProfile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ name: profileData.name })
        .eq("id", userProfile.id);

      if (error) throw error;

      toast.success("Profil gespeichert");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Fehler beim Speichern", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const sendInvitation = async () => {
    if (!company?.id || !userProfile?.id) return;
    if (!newInvite.email || !newInvite.email.includes("@")) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }

    // Prüfe ob User-Limit erreicht
    if (companyUsers.length >= (company.max_users || 3)) {
      toast.error("Benutzer-Limit erreicht", {
        description: `Ihre Lizenz erlaubt maximal ${company.max_users} Benutzer.`,
      });
      return;
    }

    setSaving(true);
    try {
      // Generiere Token
      const token = `${Math.random().toString(36).substring(2)}${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig

      const { error } = await supabase
        .from("employee_invitations")
        .insert({
          company_id: company.id,
          invited_by: userProfile.id,
          email: newInvite.email.toLowerCase(),
          role: newInvite.role,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast.success("Einladung versendet", {
        description: `Eine Einladung wurde an ${newInvite.email} gesendet.`,
      });

      setNewInvite({ email: "", role: "user" });
      setInviteDialogOpen(false);
      await loadInvitations();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error("Fehler beim Versenden", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("employee_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Einladung gelöscht");
      await loadInvitations();
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      toast.error("Fehler beim Löschen", {
        description: error.message,
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === userProfile?.id) {
      toast.error("Sie können sich nicht selbst deaktivieren");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(currentStatus ? "Benutzer deaktiviert" : "Benutzer aktiviert");
      await loadUsers();
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error("Fehler", {
        description: error.message,
      });
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Deaktiviere statt zu löschen
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: false })
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast.success("Benutzer wurde deaktiviert");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Fehler beim Löschen", {
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Einstellungen</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Verwalten Sie Ihr Profil{isAdmin && " und Ihre Firma"}
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto">
          <TabsTrigger value="profile" className="h-12 text-base gap-2">
            <UserIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Mein Profil</span>
            <span className="sm:hidden">Profil</span>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="company" className="h-12 text-base gap-2">
                <Building className="w-5 h-5" />
                <span className="hidden sm:inline">Firmendaten</span>
                <span className="sm:hidden">Firma</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="h-12 text-base gap-2">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Benutzerverwaltung</span>
                <span className="sm:hidden">Benutzer</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Profil-Tab (für alle User) */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-3 rounded-lg bg-primary/10">
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl">Persönliche Daten</h2>
                <p className="text-sm text-muted-foreground">
                  Ihre Profil-Informationen
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Name</Label>
                <Input
                  placeholder="Ihr Name"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">E-Mail</Label>
                <Input
                  placeholder="Ihre E-Mail"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                  value={profileData.email}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  E-Mail-Adresse kann nicht geändert werden
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Rolle</Label>
                <div className="flex items-center gap-2 h-12 sm:h-14 px-4 rounded-md border bg-muted/50">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base sm:text-lg">
                    {userProfile?.role === "admin" ? "Administrator" : "Mitarbeiter"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg"
                onClick={saveProfileData}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Firmendaten-Tab (nur für Admins) */}
        {isAdmin && (
          <TabsContent value="company" className="space-y-6 mt-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl">Firmendaten</h2>
                  <p className="text-sm text-muted-foreground">
                    Basisdaten Ihres Unternehmens
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Firmenname</Label>
                    <Input
                      placeholder="Mustermann Elektro GmbH"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.company_name}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, company_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Inhaber</Label>
                    <Input
                      placeholder="Max Mustermann"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.owner}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, owner: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Straße und Hausnummer</Label>
                  <Input
                    placeholder="Musterstraße 123"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={companyData.street}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, street: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">PLZ</Label>
                    <Input
                      placeholder="12345"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.zip}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, zip: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Stadt</Label>
                    <Input
                      placeholder="Musterstadt"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.city}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, city: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Telefon</Label>
                    <Input
                      placeholder="+49 123 456789"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.phone}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">E-Mail</Label>
                    <Input
                      type="email"
                      placeholder="info@muster-elektro.de"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.email}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Steuernummer</Label>
                    <Input
                      placeholder="DE123456789"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.tax_number}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, tax_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">USt-IdNr.</Label>
                    <Input
                      placeholder="DE987654321"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.vat_id}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, vat_id: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Bankname</Label>
                  <Input
                    placeholder="Sparkasse Musterstadt"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={companyData.bank_name}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, bank_name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">IBAN</Label>
                    <Input
                      placeholder="DE89 3704 0044 0532 0130 00"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.iban}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, iban: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">BIC</Label>
                    <Input
                      placeholder="COBADEFFXXX"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.bic}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, bic: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg"
                  onClick={saveCompanyData}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    "Speichern"
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* Benutzerverwaltung-Tab (nur für Admins) */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl">Benutzer</h2>
                    <p className="text-sm text-muted-foreground">
                      {companyUsers.length} / {company?.max_users || 3} Benutzer
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setInviteDialogOpen(true)}
                  disabled={companyUsers.length >= (company?.max_users || 3)}
                  className="h-12 gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Einladen</span>
                </Button>
              </div>

              {/* Aktive Benutzer */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Aktive Benutzer</h3>
                <div className="space-y-3">
                  {companyUsers
                    .filter((u) => u.is_active)
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <UserIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              user.role === "admin"
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {user.role === "admin" ? "Admin" : "Mitarbeiter"}
                          </span>
                          {user.id !== userProfile?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                            >
                              Deaktivieren
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Einladungen */}
              {invitations.length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold">Offene Einladungen</h3>
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Läuft ab am{" "}
                              {new Date(invitation.expires_at).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground">
                            {invitation.role === "admin" ? "Admin" : "Mitarbeiter"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInvitation(invitation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deaktivierte Benutzer */}
              {companyUsers.filter((u) => !u.is_active).length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    Deaktivierte Benutzer
                  </h3>
                  <div className="space-y-3">
                    {companyUsers
                      .filter((u) => !u.is_active)
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-4 opacity-60">
                            <div className="p-2 rounded-lg bg-muted">
                              <UserIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            Aktivieren
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Einladungs-Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter einladen</DialogTitle>
            <DialogDescription>
              Senden Sie eine Einladung an eine E-Mail-Adresse. Der Mitarbeiter kann sich dann
              registrieren und wird automatisch Ihrem Unternehmen zugeordnet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail-Adresse</Label>
              <Input
                type="email"
                placeholder="mitarbeiter@firma.de"
                value={newInvite.email}
                onChange={(e) =>
                  setNewInvite({ ...newInvite, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Rolle</Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                value={newInvite.role}
                onChange={(e) =>
                  setNewInvite({ ...newInvite, role: e.target.value as "admin" | "user" })
                }
              >
                <option value="user">Mitarbeiter</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={sendInvitation} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Senden...
                </>
              ) : (
                "Einladung senden"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Löschen-Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Benutzer <strong>{userToDelete?.name}</strong> wird deaktiviert und kann sich
              nicht mehr anmelden. Sie können ihn später wieder aktivieren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser}>Deaktivieren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}