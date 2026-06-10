import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Building, User as UserIcon, Users, UserPlus, Trash2,
  Shield, Loader2, Mail, FileText, Receipt, Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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

const VAT_RATES = ['0', '7', '19'];

export function Settings() {
  const { user, userProfile, company, isAdmin, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Firmendaten ──────────────────────────────────────────
  const [companyData, setCompanyData] = useState({
    company_name: "", owner: "", street: "", zip: "", city: "",
    phone: "", email: "", website: "",
  });

  // ── Dokument-Einstellungen ───────────────────────────────
  const [documentData, setDocumentData] = useState({
    next_quote_number: "",
    next_invoice_number: "",
    payment_terms: 14,
    quote_footer: "",
    invoice_footer: "",
  });

  // ── Steuer & Bank ────────────────────────────────────────
  const [taxData, setTaxData] = useState({
    vat_id: "", tax_number: "",
    default_vat_rate: "19",
    bank_name: "", iban: "", bic: "",
  });

  // ── Profil ───────────────────────────────────────────────
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    newPassword: "", confirmPassword: "",
  });

  // ── Benutzerverwaltung ───────────────────────────────────
  const [companyUsers, setCompanyUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [newInvite, setNewInvite] = useState({ email: "", role: "user" as "admin" | "user" });

  useEffect(() => { loadSettings(); }, [company, userProfile]);

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
          website: company.website || "",
        });
        setDocumentData({
          next_quote_number: company.next_quote_number || "ANG-2026-001",
          next_invoice_number: company.next_invoice_number || "RE-2026-001",
          payment_terms: company.payment_terms || 14,
          quote_footer: company.quote_footer || "",
          invoice_footer: company.invoice_footer || "",
        });
        const rawVat = String(company.default_vat_rate ?? 19);
        setTaxData({
          vat_id: company.vat_id || "",
          tax_number: company.tax_number || "",
          default_vat_rate: VAT_RATES.includes(rawVat) ? rawVat : "19",
          bank_name: company.bank_name || "",
          iban: company.iban || "",
          bic: company.bic || "",
        });
      }
      if (userProfile) {
        setProfileData({ name: userProfile.name || "", email: userProfile.email || "" });
      }
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
      .from("user_profiles").select("*").eq("company_id", company.id)
      .order("created_at", { ascending: true });
    if (!error) setCompanyUsers(data || []);
  };

  const loadInvitations = async () => {
    if (!company?.id) return;
    const { data, error } = await supabase
      .from("employee_invitations").select("*")
      .eq("company_id", company.id).eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error) setInvitations(data || []);
  };

  // ── Speichern ────────────────────────────────────────────
  const saveSection = async (fields: Record<string, any>, successMsg: string) => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update(fields).eq("id", company.id);
      if (error) throw error;
      toast.success(successMsg);
      await refreshProfile();
    } catch (err: any) {
      toast.error("Fehler beim Speichern", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveCompanyData = () => saveSection(companyData, "Firmendaten gespeichert");
  const saveDocumentData = () => saveSection(documentData, "Dokument-Einstellungen gespeichert");
  const saveTaxData = () => saveSection({
    ...taxData,
    default_vat_rate: parseFloat(taxData.default_vat_rate),
  }, "Steuer & Bank gespeichert");

  const saveProfileData = async () => {
    if (!userProfile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles").update({ name: profileData.name }).eq("id", userProfile.id);
      if (error) throw error;

      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          toast.error("Passwörter stimmen nicht überein");
          setSaving(false);
          return;
        }
        if (passwordData.newPassword.length < 6) {
          toast.error("Passwort muss mindestens 6 Zeichen lang sein");
          setSaving(false);
          return;
        }
        const { error: pwErr } = await supabase.auth.updateUser({ password: passwordData.newPassword });
        if (pwErr) throw pwErr;
        setPasswordData({ newPassword: "", confirmPassword: "" });
      }

      toast.success("Profil gespeichert");
      await refreshProfile();
    } catch (err: any) {
      toast.error("Fehler beim Speichern", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Benutzerverwaltung ───────────────────────────────────
  const sendInvitation = async () => {
    if (!company?.id || !userProfile?.id) return;
    if (!newInvite.email.includes("@")) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }
    if (companyUsers.length >= (company.max_users || 3)) {
      toast.error("Benutzer-Limit erreicht", {
        description: `Ihre Lizenz erlaubt maximal ${company.max_users} Benutzer.`,
      });
      return;
    }
    setSaving(true);
    try {
      const token = `${Math.random().toString(36).substring(2)}${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const { error } = await supabase.from("employee_invitations").insert({
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
    } catch (err: any) {
      toast.error("Fehler beim Versenden", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    const { error } = await supabase.from("employee_invitations").delete().eq("id", invitationId);
    if (error) toast.error("Fehler beim Löschen");
    else { toast.success("Einladung gelöscht"); await loadInvitations(); }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === userProfile?.id) {
      toast.error("Sie können sich nicht selbst deaktivieren");
      return;
    }
    const { error } = await supabase
      .from("user_profiles").update({ is_active: !currentStatus }).eq("id", userId);
    if (error) toast.error("Fehler", { description: error.message });
    else {
      toast.success(currentStatus ? "Benutzer deaktiviert" : "Benutzer aktiviert");
      await loadUsers();
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    const { error } = await supabase
      .from("user_profiles").update({ is_active: false }).eq("id", userToDelete.id);
    if (error) toast.error("Fehler", { description: error.message });
    else {
      toast.success("Benutzer wurde deaktiviert");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    }
  };

  const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <div className="flex justify-end mt-8">
      <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto"
        onClick={onClick} disabled={saving}>
        {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Speichern...</> : "Speichern"}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const adminTabCount = isAdmin ? 5 : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Einstellungen</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Verwalten Sie Ihr Profil{isAdmin && " und Ihre Firma"}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "company" : "profile"} className="w-full">
        <TabsList className={`grid w-full h-auto ${isAdmin ? "grid-cols-5" : "grid-cols-1"}`}>
          {isAdmin && (
            <>
              <TabsTrigger value="company" className="h-12 text-base gap-2">
                <Building className="w-4 h-4" /><span className="hidden sm:inline">Firma</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="h-12 text-base gap-2">
                <FileText className="w-4 h-4" /><span className="hidden sm:inline">Dokumente</span>
              </TabsTrigger>
              <TabsTrigger value="tax" className="h-12 text-base gap-2">
                <Receipt className="w-4 h-4" /><span className="hidden sm:inline">Steuer & Bank</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="h-12 text-base gap-2">
                <Users className="w-4 h-4" /><span className="hidden sm:inline">Benutzer</span>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="profile" className="h-12 text-base gap-2">
            <UserIcon className="w-4 h-4" /><span className="hidden sm:inline">Mein Profil</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Firmendaten ──────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="company" className="space-y-6 mt-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10"><Building className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl sm:text-2xl">Firmendaten</h2>
                  <p className="text-sm text-muted-foreground">Nur Administratoren können diese Daten ändern</p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { label: "Firmenname", key: "company_name", placeholder: "Mustermann Elektro GmbH" },
                    { label: "Inhaber / Geschäftsführer", key: "owner", placeholder: "Max Mustermann" },
                  ].map(f => (
                    <div key={f.key} className="space-y-2 sm:space-y-3">
                      <Label className="text-base sm:text-lg">{f.label}</Label>
                      <Input placeholder={f.placeholder} className="h-12 sm:h-14 text-base sm:text-lg"
                        value={(companyData as any)[f.key]}
                        onChange={e => setCompanyData({ ...companyData, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Straße und Hausnummer</Label>
                  <Input placeholder="Musterstraße 123" className="h-12 sm:h-14 text-base sm:text-lg"
                    value={companyData.street}
                    onChange={e => setCompanyData({ ...companyData, street: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">PLZ</Label>
                    <Input placeholder="12345" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.zip}
                      onChange={e => setCompanyData({ ...companyData, zip: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Stadt</Label>
                    <Input placeholder="Musterstadt" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={companyData.city}
                      onChange={e => setCompanyData({ ...companyData, city: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { label: "Telefon", key: "phone", placeholder: "+49 123 456789" },
                    { label: "E-Mail", key: "email", placeholder: "info@firma.de" },
                    { label: "Website (optional)", key: "website", placeholder: "www.firma.de" },
                  ].map(f => (
                    <div key={f.key} className="space-y-2 sm:space-y-3">
                      <Label className="text-base sm:text-lg">{f.label}</Label>
                      <Input placeholder={f.placeholder} className="h-12 sm:h-14 text-base sm:text-lg"
                        value={(companyData as any)[f.key]}
                        onChange={e => setCompanyData({ ...companyData, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
              <SaveButton onClick={saveCompanyData} />
            </Card>
          </TabsContent>
        )}

        {/* ── Dokument-Einstellungen ───────────────────────── */}
        {isAdmin && (
          <TabsContent value="documents" className="space-y-6 mt-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10"><FileText className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl sm:text-2xl">Dokument-Einstellungen</h2>
                  <p className="text-sm text-muted-foreground">Nummernkreise, Zahlungsziel und Fußtexte</p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Nächste Angebotsnummer</Label>
                    <Input placeholder="ANG-2026-001" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={documentData.next_quote_number}
                      onChange={e => setDocumentData({ ...documentData, next_quote_number: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Nächste Rechnungsnummer</Label>
                    <Input placeholder="RE-2026-001" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={documentData.next_invoice_number}
                      onChange={e => setDocumentData({ ...documentData, next_invoice_number: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Zahlungsziel (Tage)</Label>
                  <Input type="number" placeholder="14" className="h-12 sm:h-14 text-base sm:text-lg max-w-xs"
                    value={documentData.payment_terms}
                    onChange={e => setDocumentData({ ...documentData, payment_terms: parseInt(e.target.value) || 14 })} />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Fußzeile Angebote</Label>
                  <Textarea placeholder="Wir freuen uns auf Ihre Auftragserteilung."
                    className="min-h-28 text-base sm:text-lg"
                    value={documentData.quote_footer}
                    onChange={e => setDocumentData({ ...documentData, quote_footer: e.target.value })} />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Fußzeile Rechnungen</Label>
                  <Textarea placeholder="Vielen Dank für Ihren Auftrag."
                    className="min-h-28 text-base sm:text-lg"
                    value={documentData.invoice_footer}
                    onChange={e => setDocumentData({ ...documentData, invoice_footer: e.target.value })} />
                </div>
              </div>
              <SaveButton onClick={saveDocumentData} />
            </Card>
          </TabsContent>
        )}

        {/* ── Steuer & Bank ────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="tax" className="space-y-6 mt-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 rounded-lg bg-primary/10"><Receipt className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl sm:text-2xl">Steuer & Bankverbindung</h2>
                  <p className="text-sm text-muted-foreground">Erscheint auf Ihren Rechnungen</p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">USt-IdNr.</Label>
                    <Input placeholder="DE123456789" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxData.vat_id}
                      onChange={e => setTaxData({ ...taxData, vat_id: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">Steuernummer</Label>
                    <Input placeholder="123/456/78901" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxData.tax_number}
                      onChange={e => setTaxData({ ...taxData, tax_number: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Standard-MwSt.-Satz</Label>
                  <Select value={taxData.default_vat_rate}
                    onValueChange={v => setTaxData({ ...taxData, default_vat_rate: v })}>
                    <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_RATES.map(r => (
                        <SelectItem key={r} value={r}>{r} %</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Bankname</Label>
                  <Input placeholder="Sparkasse Musterstadt" className="h-12 sm:h-14 text-base sm:text-lg"
                    value={taxData.bank_name}
                    onChange={e => setTaxData({ ...taxData, bank_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">IBAN</Label>
                    <Input placeholder="DE89 3704 0044 0532 0130 00" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxData.iban}
                      onChange={e => setTaxData({ ...taxData, iban: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-base sm:text-lg">BIC</Label>
                    <Input placeholder="COBADEFFXXX" className="h-12 sm:h-14 text-base sm:text-lg"
                      value={taxData.bic}
                      onChange={e => setTaxData({ ...taxData, bic: e.target.value })} />
                  </div>
                </div>
              </div>
              <SaveButton onClick={saveTaxData} />
            </Card>
          </TabsContent>
        )}

        {/* ── Benutzerverwaltung ───────────────────────────── */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-3 rounded-lg bg-primary/10"><Users className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h2 className="text-xl sm:text-2xl">Benutzer</h2>
                    <p className="text-sm text-muted-foreground">
                      {companyUsers.filter(u => u.is_active).length} / {company?.max_users || 3} aktiv
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={() => setInviteDialogOpen(true)}
                  disabled={companyUsers.filter(u => u.is_active).length >= (company?.max_users || 3)}
                  className="h-12 gap-2">
                  <UserPlus className="w-5 h-5" /><span className="hidden sm:inline">Einladen</span>
                </Button>
              </div>

              {/* Aktive Benutzer */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Aktive Benutzer</h3>
                <div className="space-y-3">
                  {companyUsers.filter(u => u.is_active).map(u => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{u.name}</p>
                            {u.id === user?.id && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">Sie</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 flex-shrink-0 ${
                          u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                        }`}>
                          {u.role === "admin" && <Shield className="w-3 h-3" />}
                          {u.role === "admin" ? "Admin" : "Mitarbeiter"}
                        </span>
                        {u.id !== userProfile?.id && (
                          <Button variant="ghost" size="sm" className="flex-shrink-0"
                            onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }}>
                            Deaktivieren
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offene Einladungen */}
              {invitations.length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold">Offene Einladungen</h3>
                  <div className="space-y-3">
                    {invitations.map(inv => (
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-muted flex-shrink-0"><Mail className="w-5 h-5 text-muted-foreground" /></div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{inv.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Läuft ab am {new Date(inv.expires_at).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground flex-shrink-0">
                            {inv.role === "admin" ? "Admin" : "Mitarbeiter"}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => deleteInvitation(inv.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deaktivierte Benutzer */}
              {companyUsers.filter(u => !u.is_active).length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold text-muted-foreground">Deaktivierte Benutzer</h3>
                  <div className="space-y-3">
                    {companyUsers.filter(u => !u.is_active).map(u => (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0 flex-1 opacity-60">
                          <div className="p-2 rounded-lg bg-muted flex-shrink-0"><UserIcon className="w-5 h-5 text-muted-foreground" /></div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="flex-shrink-0 self-end sm:self-auto"
                          onClick={() => toggleUserStatus(u.id, u.is_active)}>
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

        {/* ── Mein Profil ──────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-3 rounded-lg bg-primary/10"><UserIcon className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-xl sm:text-2xl">Persönliche Daten</h2>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.role === "admin" ? "Administrator" : "Mitarbeiter"}
                </p>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">Name</Label>
                <Input placeholder="Ihr Name" className="h-12 sm:h-14 text-base sm:text-lg"
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base sm:text-lg">E-Mail</Label>
                <Input placeholder="Ihre E-Mail" className="h-12 sm:h-14 text-base sm:text-lg"
                  value={profileData.email} disabled />
                <p className="text-sm text-muted-foreground">E-Mail-Adresse kann nicht geändert werden</p>
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

              {/* Passwort ändern */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg sm:text-xl">Passwort ändern</h3>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Neues Passwort</Label>
                  <Input type="password" placeholder="Mindestens 6 Zeichen"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-base sm:text-lg">Passwort bestätigen</Label>
                  <Input type="password" placeholder="Passwort wiederholen"
                    className="h-12 sm:h-14 text-base sm:text-lg"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                </div>
                <p className="text-sm text-muted-foreground">Leer lassen wenn Sie das Passwort nicht ändern möchten</p>
              </div>
            </div>
            <SaveButton onClick={saveProfileData} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Einladungs-Dialog ─────────────────────────────── */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter einladen</DialogTitle>
            <DialogDescription>
              Senden Sie eine Einladung per E-Mail. Der Mitarbeiter wird automatisch Ihrem Unternehmen zugeordnet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail-Adresse</Label>
              <Input type="email" placeholder="mitarbeiter@firma.de"
                value={newInvite.email}
                onChange={e => setNewInvite({ ...newInvite, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <select className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                value={newInvite.role}
                onChange={e => setNewInvite({ ...newInvite, role: e.target.value as "admin" | "user" })}>
                <option value="user">Mitarbeiter</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={sendInvitation} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Senden...</> : "Einladung senden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deaktivieren-Dialog ───────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.name}</strong> wird deaktiviert und kann sich nicht mehr anmelden.
              Sie können ihn später wieder aktivieren.
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

export default Settings;
