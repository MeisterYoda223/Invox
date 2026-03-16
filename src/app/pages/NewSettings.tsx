import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Building, 
  FileText, 
  Upload, 
  Loader2, 
  Users, 
  User as UserIcon,
  UserPlus,
  Trash2,
  Shield,
  Mail
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export function Settings() {
  const { user, userProfile, company, isAdmin, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Company Settings - jetzt direkt aus company
  const [companySettings, setCompanySettings] = useState({
    company_name: "",
    owner: "",
    street: "",
    zip: "",
    city: "",
    phone: "",
    email: "",
    website: "",
  });

  // Document Settings
  const [documentSettings, setDocumentSettings] = useState({
    next_quote_number: "",
    next_invoice_number: "",
    payment_terms: 14,
    quote_footer: "",
    invoice_footer: "",
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState({
    vat_id: "",
    tax_number: "",
    default_vat_rate: 19,
    bank_name: "",
    iban: "",
    bic: "",
  });

  // User Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // User Management
  const [companyUsers, setCompanyUsers] = useState<UserProfile[]>([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Load company and user data
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Lade Company-Daten nur wenn vorhanden
        if (company) {
          setCompanySettings({
            company_name: company.company_name || "",
            owner: company.owner || "",
            street: company.street || "",
            zip: company.zip || "",
            city: company.city || "",
            phone: company.phone || "",
            email: company.email || "",
            website: company.website || "",
          });

          setDocumentSettings({
            next_quote_number: company.next_quote_number || "ANG-2026-001",
            next_invoice_number: company.next_invoice_number || "RE-2026-001",
            payment_terms: company.payment_terms || 14,
            quote_footer: company.quote_footer || "Wir freuen uns auf Ihre Auftragserteilung.",
            invoice_footer: company.invoice_footer || "Vielen Dank für Ihren Auftrag.",
          });

          setTaxSettings({
            vat_id: company.vat_id || "",
            tax_number: company.tax_number || "",
            default_vat_rate: company.default_vat_rate || 19,
            bank_name: company.bank_name || "",
            iban: company.iban || "",
            bic: company.bic || "",
          });
        }

        // Lade eigene Profil-Daten
        if (userProfile) {
          setProfileSettings({
            name: userProfile.name || "",
            email: userProfile.email || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }

        // Lade alle User des Unternehmens (nur für Admins)
        if (isAdmin && company) {
          const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('company_id', company.id)
            .order('created_at', { ascending: true });

          if (usersError) {
            console.error("Error loading users:", usersError);
          } else {
            setCompanyUsers(users || []);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, company, userProfile, isAdmin]);

  // Save Company Settings (nur Admin)
  const saveCompanySettings = async () => {
    if (!company || !isAdmin) {
      toast.error("Keine Berechtigung", {
        description: "Nur Administratoren können Firmendaten ändern.",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(companySettings)
        .eq('id', company.id);

      if (error) throw error;

      toast.success("Firmendaten erfolgreich gespeichert");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error saving company settings:", error);
      toast.error("Fehler beim Speichern", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Save Document Settings (nur Admin)
  const saveDocumentSettings = async () => {
    if (!company || !isAdmin) {
      toast.error("Keine Berechtigung");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(documentSettings)
        .eq('id', company.id);

      if (error) throw error;

      toast.success("Dokument-Einstellungen erfolgreich gespeichert");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error saving document settings:", error);
      toast.error("Fehler beim Speichern", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Save Tax Settings (nur Admin)
  const saveTaxSettings = async () => {
    if (!company || !isAdmin) {
      toast.error("Keine Berechtigung");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(taxSettings)
        .eq('id', company.id);

      if (error) throw error;

      toast.success("Steuerinformationen erfolgreich gespeichert");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error saving tax settings:", error);
      toast.error("Fehler beim Speichern", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Save Profile Settings (alle User)
  const saveProfileSettings = async () => {
    if (!user || !userProfile) return;

    setSaving(true);
    try {
      // Update Name und Email im Profil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          name: profileSettings.name,
          email: profileSettings.email,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update Email in Auth
      if (profileSettings.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileSettings.email,
        });
        if (emailError) throw emailError;
      }

      // Update Passwort wenn angegeben
      if (profileSettings.newPassword) {
        if (profileSettings.newPassword !== profileSettings.confirmPassword) {
          toast.error("Passwörter stimmen nicht überein");
          setSaving(false);
          return;
        }

        if (profileSettings.newPassword.length < 6) {
          toast.error("Passwort muss mindestens 6 Zeichen lang sein");
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileSettings.newPassword,
        });

        if (passwordError) throw passwordError;

        // Passwortfelder zurücksetzen
        setProfileSettings(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

      toast.success("Profil erfolgreich aktualisiert");
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

  // Add New User (nur Admin)
  const addNewUser = async () => {
    if (!company || !isAdmin) {
      toast.error("Keine Berechtigung");
      return;
    }

    // Prüfe Lizenzlimit
    if (companyUsers.length >= company.max_users) {
      toast.error("Lizenzlimit erreicht", {
        description: `Ihr aktueller Plan erlaubt maximal ${company.max_users} Benutzer. Bitte upgraden Sie Ihre Lizenz.`,
      });
      return;
    }

    setSaving(true);
    try {
      // Erstelle Auth User
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            name: newUserData.name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Erstelle User Profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            company_id: company.id,
            name: newUserData.name,
            email: newUserData.email,
            role: 'user',
            is_active: true,
          });

        if (profileError) throw profileError;

        toast.success("Benutzer erfolgreich hinzugefügt");
        
        // Aktualisiere User-Liste
        const { data: users } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: true });

        if (users) setCompanyUsers(users);

        // Reset Form
        setNewUserData({ name: "", email: "", password: "" });
        setShowAddUserDialog(false);
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error("Fehler beim Hinzufügen", {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete User (nur Admin)
  const deleteUser = async (userId: string) => {
    if (!company || !isAdmin || userId === user?.id) return;

    try {
      // Lösche User Profile (Auth User wird durch CASCADE gelöscht)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success("Benutzer erfolgreich entfernt");
      
      // Aktualisiere Liste
      setCompanyUsers(companyUsers.filter(u => u.id !== userId));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Fehler beim Löschen", {
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Einstellungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Einstellungen</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          {isAdmin ? "Verwalten Sie Ihre Firmendaten und Einstellungen" : "Verwalten Sie Ihr Profil"}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "company" : "profile"} className="space-y-6">
        <TabsList className={`grid w-full max-w-3xl ${isAdmin ? 'grid-cols-5' : 'grid-cols-1'} h-auto`}>
          {isAdmin && (
            <>
              <TabsTrigger value="company" className="text-sm sm:text-base lg:text-lg py-3">
                Firma
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-sm sm:text-base lg:text-lg py-3">
                Dokumente
              </TabsTrigger>
              <TabsTrigger value="tax" className="text-sm sm:text-base lg:text-lg py-3">
                Steuer
              </TabsTrigger>
              <TabsTrigger value="users" className="text-sm sm:text-base lg:text-lg py-3">
                <Users className="w-4 h-4 mr-2 inline" />
                Benutzer
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="profile" className="text-sm sm:text-base lg:text-lg py-3">
            <UserIcon className="w-4 h-4 mr-2 inline" />
            Mein Profil
          </TabsTrigger>
        </TabsList>

        {/* Company Data (nur Admin) */}
        {isAdmin && (
          <TabsContent value="company" className="space-y-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <Building className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl">Firmendaten</h2>
                  <p className="text-sm text-muted-foreground">Nur Administratoren können diese Daten ändern</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Firmenname</Label>
                    <Input
                      placeholder="Mustermann Elektro GmbH"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companySettings.company_name}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, company_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Inhaber / Geschäftsführer</Label>
                    <Input
                      placeholder="Max Mustermann"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companySettings.owner}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, owner: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Straße und Hausnummer</Label>
                  <Input
                    placeholder="Musterstraße 123"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={companySettings.street}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, street: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">PLZ</Label>
                    <Input
                      placeholder="12345"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companySettings.zip}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, zip: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Stadt</Label>
                    <Input
                      placeholder="Musterstadt"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companySettings.city}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, city: e.target.value })
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
                      value={companySettings.phone}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">E-Mail</Label>
                    <Input
                      type="email"
                      placeholder="info@muster-elektro.de"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companySettings.email}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Website (optional)</Label>
                  <Input
                    placeholder="www.muster-elektro.de"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={companySettings.website}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, website: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto"
                onClick={saveCompanySettings}
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
          </TabsContent>
        )}

        {/* Document Settings (nur Admin) */}
        {isAdmin && (
          <TabsContent value="documents" className="space-y-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl">Dokument-Einstellungen</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Nächste Angebotsnummer</Label>
                    <Input
                      placeholder="ANG-2026-001"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={documentSettings.next_quote_number}
                      onChange={(e) =>
                        setDocumentSettings({ ...documentSettings, next_quote_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Nächste Rechnungsnummer</Label>
                    <Input
                      placeholder="RE-2026-001"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={documentSettings.next_invoice_number}
                      onChange={(e) =>
                        setDocumentSettings({ ...documentSettings, next_invoice_number: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Zahlungsziel (Tage)</Label>
                  <Input
                    type="number"
                    placeholder="14"
                    className="h-12 sm:h-14 text-base sm:text-lg max-w-xs"
                    value={documentSettings.payment_terms}
                    onChange={(e) =>
                      setDocumentSettings({ ...documentSettings, payment_terms: parseInt(e.target.value) || 14 })
                    }
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Standard-Fußzeile für Angebote</Label>
                  <Textarea
                    placeholder="Wir freuen uns auf Ihre Auftragserteilung..."
                    className="min-h-28 sm:min-h-32 text-base sm:text-lg"
                    value={documentSettings.quote_footer}
                    onChange={(e) =>
                      setDocumentSettings({ ...documentSettings, quote_footer: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Standard-Fußzeile für Rechnungen</Label>
                  <Textarea
                    placeholder="Vielen Dank für Ihren Auftrag..."
                    className="min-h-28 sm:min-h-32 text-base sm:text-lg"
                    value={documentSettings.invoice_footer}
                    onChange={(e) =>
                      setDocumentSettings({ ...documentSettings, invoice_footer: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto"
                onClick={saveDocumentSettings}
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
          </TabsContent>
        )}

        {/* Tax Settings (nur Admin) */}
        {isAdmin && (
          <TabsContent value="tax" className="space-y-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl">Steuerinformationen</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Umsatzsteuer-ID</Label>
                    <Input
                      placeholder="DE123456789"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxSettings.vat_id}
                      onChange={(e) =>
                        setTaxSettings({ ...taxSettings, vat_id: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Steuernummer</Label>
                    <Input
                      placeholder="123/456/78901"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxSettings.tax_number}
                      onChange={(e) =>
                        setTaxSettings({ ...taxSettings, tax_number: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Standardmäßiger MwSt-Satz (%)</Label>
                  <Input
                    type="number"
                    placeholder="19"
                    className="h-12 sm:h-14 text-base sm:text-lg max-w-xs"
                    value={taxSettings.default_vat_rate}
                    onChange={(e) =>
                      setTaxSettings({ ...taxSettings, default_vat_rate: parseFloat(e.target.value) || 19 })
                    }
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Bankverbindung</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      placeholder="Bank Name"
                      className="h-12 sm:h-14 text-base sm:text-lg sm:col-span-2"
                      value={taxSettings.bank_name}
                      onChange={(e) =>
                        setTaxSettings({ ...taxSettings, bank_name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="IBAN"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxSettings.iban}
                      onChange={(e) =>
                        setTaxSettings({ ...taxSettings, iban: e.target.value })
                      }
                    />
                    <Input
                      placeholder="BIC"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxSettings.bic}
                      onChange={(e) =>
                        setTaxSettings({ ...taxSettings, bic: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto"
                onClick={saveTaxSettings}
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
          </TabsContent>
        )}

        {/* User Management (nur Admin) */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl">Benutzerverwaltung</h2>
                    <p className="text-sm text-muted-foreground">
                      {companyUsers.length} von {company?.max_users} Benutzer
                    </p>
                  </div>
                </div>

                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="h-12 sm:h-14"
                      disabled={companyUsers.length >= (company?.max_users || 1)}
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Benutzer hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl sm:text-2xl">Neuen Benutzer hinzufügen</DialogTitle>
                      <DialogDescription className="text-base">
                        Der neue Benutzer erhält die Rolle "Benutzer" und kann Firmendaten einsehen, aber nicht ändern.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-user-name" className="text-base">Name</Label>
                        <Input
                          id="new-user-name"
                          placeholder="Max Mustermann"
                          className="h-12 text-base"
                          value={newUserData.name}
                          onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-email" className="text-base">E-Mail</Label>
                        <Input
                          id="new-user-email"
                          type="email"
                          placeholder="max@musterfirma.de"
                          className="h-12 text-base"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-password" className="text-base">Passwort</Label>
                        <Input
                          id="new-user-password"
                          type="password"
                          placeholder="Mindestens 6 Zeichen"
                          className="h-12 text-base"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddUserDialog(false)}
                        className="h-12 text-base"
                      >
                        Abbrechen
                      </Button>
                      <Button
                        onClick={addNewUser}
                        disabled={saving || !newUserData.name || !newUserData.email || !newUserData.password}
                        className="h-12 text-base"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Hinzufügen...
                          </>
                        ) : (
                          "Hinzufügen"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* User List */}
              <div className="space-y-3">
                {companyUsers.map((companyUser) => (
                  <div
                    key={companyUser.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base sm:text-lg font-medium truncate">{companyUser.name}</p>
                          {companyUser.role === 'admin' && (
                            <Shield className="w-4 h-4 text-primary" title="Administrator" />
                          )}
                          {companyUser.id === user?.id && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Sie</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{companyUser.email}</p>
                      </div>
                    </div>
                    
                    {companyUser.id !== user?.id && companyUser.role !== 'admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <Trash2 className="w-5 h-5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Benutzer entfernen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie {companyUser.name} wirklich aus Ihrem Unternehmen entfernen? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser(companyUser.id)}>
                              Entfernen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>

              {companyUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Keine Benutzer gefunden</p>
                </div>
              )}
            </Card>
          </TabsContent>
        )}

        {/* Profile Settings (alle User) */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl">Mein Profil</h2>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.role === 'admin' ? 'Administrator' : 'Benutzer'}
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Name</Label>
                <Input
                  placeholder="Ihr Name"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                  value={profileSettings.name}
                  onChange={(e) =>
                    setProfileSettings({ ...profileSettings, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">E-Mail</Label>
                <Input
                  type="email"
                  placeholder="ihre@email.de"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                  value={profileSettings.email}
                  onChange={(e) =>
                    setProfileSettings({ ...profileSettings, email: e.target.value })
                  }
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg sm:text-xl mb-4">Passwort ändern</h3>
                <div className="space-y-4">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Neues Passwort</Label>
                    <Input
                      type="password"
                      placeholder="Mindestens 6 Zeichen"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={profileSettings.newPassword}
                      onChange={(e) =>
                        setProfileSettings({ ...profileSettings, newPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Passwort bestätigen</Label>
                    <Input
                      type="password"
                      placeholder="Passwort wiederholen"
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      value={profileSettings.confirmPassword}
                      onChange={(e) =>
                        setProfileSettings({ ...profileSettings, confirmPassword: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto"
              onClick={saveProfileSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Profil speichern"
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add default export for dynamic imports
export default Settings;