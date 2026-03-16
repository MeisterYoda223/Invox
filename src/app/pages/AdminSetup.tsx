import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Loader2, Building } from "lucide-react";

export function AdminSetup() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: "",
    owner: "",
    street: "",
    zip: "",
    city: "",
    phone: "",
    email: "",
  });

  const createCompany = async () => {
    if (!user) {
      toast.error("Kein Benutzer angemeldet");
      return;
    }

    if (!companyData.company_name || !companyData.owner) {
      toast.error("Bitte füllen Sie mindestens Firmennamen und Inhaber aus");
      return;
    }

    setLoading(true);
    try {
      // Erstelle Company mit Trial-Lizenz
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: companyData.company_name,
          owner: companyData.owner,
          street: companyData.street,
          zip: companyData.zip,
          city: companyData.city,
          phone: companyData.phone,
          email: companyData.email,
          license_type: 'starter',
          license_status: 'trial', // Wichtig: Trial-Lizenz für neue Companies
          max_users: 3,
          next_quote_number: 'ANG-2026-001',
          next_invoice_number: 'RE-2026-001',
          payment_terms: 14,
          default_vat_rate: 19,
          quote_footer: 'Wir freuen uns auf Ihre Auftragserteilung.',
          invoice_footer: 'Vielen Dank für Ihren Auftrag.',
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Erstelle oder Update User Profile als ADMIN
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          company_id: company.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
          email: user.email,
          role: 'admin', // Explizit als Admin setzen
          is_active: true,
        });

      if (profileError) throw profileError;

      toast.success("Unternehmen erfolgreich erstellt!", {
        description: "Sie sind jetzt Administrator mit Trial-Lizenz (30 Tage)",
      });
      
      // Aktualisiere das Profil
      await refreshProfile();
      
      // Weiterleitung zum Dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error("Fehler beim Erstellen", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Unternehmen erstellen</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Erstellen Sie ein Unternehmen für Ihren Account
        </p>
      </div>

      {!userProfile?.company_id ? (
        <Card className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <Building className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl">Firmendaten</h2>
              <p className="text-sm text-muted-foreground">
                Sie werden automatisch Administrator Ihres Unternehmens
              </p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">
                  Firmenname <span className="text-destructive">*</span>
                </Label>
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
                <Label className="text-base sm:text-lg">
                  Inhaber / Geschäftsführer <span className="text-destructive">*</span>
                </Label>
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
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto"
              onClick={createCompany}
              disabled={loading || !companyData.company_name || !companyData.owner}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Erstelle Unternehmen...
                </>
              ) : (
                "Unternehmen erstellen"
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <Building className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl mb-2">Unternehmen bereits vorhanden</h2>
          <p className="text-muted-foreground mb-6">
            Ihr Account ist bereits einem Unternehmen zugeordnet.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = '/einstellungen'}
          >
            Zu den Einstellungen
          </Button>
        </Card>
      )}
    </div>
  );
}

export default AdminSetup;