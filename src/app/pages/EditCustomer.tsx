import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export function EditCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    street: "",
    zip: "",
    city: "",
    phone: "",
    mobile: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Kunde nicht gefunden");
        navigate("/kunden");
        return;
      }

      setForm({
        company_name: data.company_name ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        street: data.street ?? "",
        zip: data.zip ?? "",
        city: data.city ?? "",
        phone: data.phone ?? "",
        mobile: data.mobile ?? "",
        email: data.email ?? "",
        notes: data.notes ?? "",
      });
      setLoading(false);
    };
    load();
  }, [id]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.company_name && !form.last_name) {
      toast.error("Bitte geben Sie einen Firmennamen oder Nachnamen ein.");
      return;
    }
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          company_name: form.company_name || null,
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          street: form.street || null,
          zip: form.zip || null,
          city: form.city || null,
          phone: form.phone || null,
          mobile: form.mobile || null,
          email: form.email || null,
          notes: form.notes || null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Kunde wurde gespeichert!");
      navigate(`/kunden/${id}`);
    } catch (err: any) {
      toast.error("Fehler beim Speichern", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Kunde...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(`/kunden/${id}`)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Zurück
        </Button>
        <div>
          <h1 className="text-3xl sm:text-4xl">Kunde bearbeiten</h1>
          <p className="text-muted-foreground mt-1">Kundendaten ändern und speichern</p>
        </div>
      </div>

      <Card className="p-5 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold">Firma / Person</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-base">Firmenname</Label>
            <Input className="h-12 text-base" placeholder="Mustermann GmbH"
              value={form.company_name} onChange={set("company_name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base">Vorname</Label>
              <Input className="h-12 text-base" placeholder="Max"
                value={form.first_name} onChange={set("first_name")} />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Nachname</Label>
              <Input className="h-12 text-base" placeholder="Mustermann"
                value={form.last_name} onChange={set("last_name")} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold">Adresse</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-base">Straße & Hausnummer</Label>
            <Input className="h-12 text-base" placeholder="Musterstraße 1"
              value={form.street} onChange={set("street")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base">PLZ</Label>
              <Input className="h-12 text-base" placeholder="12345"
                value={form.zip} onChange={set("zip")} />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Stadt</Label>
              <Input className="h-12 text-base" placeholder="Musterstadt"
                value={form.city} onChange={set("city")} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base">Telefon</Label>
            <Input className="h-12 text-base" placeholder="+49 123 456789"
              value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Mobil</Label>
            <Input className="h-12 text-base" placeholder="+49 170 1234567"
              value={form.mobile} onChange={set("mobile")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-base">E-Mail</Label>
            <Input className="h-12 text-base" type="email" placeholder="info@beispiel.de"
              value={form.email} onChange={set("email")} />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-8 space-y-4">
        <h2 className="text-xl font-semibold">Notizen</h2>
        <Textarea className="min-h-24 text-base" placeholder="Interne Notizen zum Kunden..."
          value={form.notes} onChange={set("notes")} />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button size="lg" className="h-14 text-lg gap-3" onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 className="w-5 h-5 animate-spin" />Speichern...</>
            : <><Check className="w-5 h-5" />Änderungen speichern</>}
        </Button>
        <Button variant="outline" size="lg" className="h-14 text-lg"
          onClick={() => navigate(`/kunden/${id}`)} disabled={saving}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
