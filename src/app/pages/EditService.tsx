import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

const UNITS = ['Stunde', 'Stück', 'km', 'Pauschal', 'm', 'm²', 'm³'];
const VAT_RATES = ['0', '7', '19'];

export function EditService() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    unit: 'Stunde',
    unit_price: '',
    vat_rate: '19',
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Leistung nicht gefunden');
        navigate('/leistungen');
        return;
      }

      const rawVat = String(data.vat_rate ?? 19);
      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        unit: data.unit ?? 'Stunde',
        unit_price: String(data.unit_price ?? ''),
        vat_rate: VAT_RATES.includes(rawVat) ? rawVat : '19',
      });
      setLoading(false);
    };
    load();
  }, [id]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Bitte geben Sie einen Titel ein.');
      return;
    }
    if (!form.unit_price || isNaN(parseFloat(form.unit_price))) {
      toast.error('Bitte geben Sie einen gültigen Preis ein.');
      return;
    }
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          title: form.title.trim(),
          description: form.description || null,
          unit: form.unit,
          unit_price: parseFloat(form.unit_price),
          vat_rate: parseFloat(form.vat_rate),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Leistung wurde gespeichert!');
      navigate('/leistungen');
    } catch (err: any) {
      toast.error('Fehler beim Speichern', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Leistung...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/leistungen')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Zurück
        </Button>
        <div>
          <h1 className="text-3xl sm:text-4xl">Leistung bearbeiten</h1>
          <p className="text-muted-foreground mt-1">Änderungen speichern</p>
        </div>
      </div>

      <Card className="p-5 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold">Leistungsdetails</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base">Titel *</Label>
            <Input className="h-12 text-base" placeholder="z.B. Elektroinstallation"
              value={form.title} onChange={set('title')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Beschreibung</Label>
            <Textarea className="min-h-24 text-base" placeholder="Kurze Beschreibung der Leistung..."
              value={form.description} onChange={set('description')} />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-8 space-y-6">
        <h2 className="text-xl font-semibold">Preis & Einheit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-base">Einheit</Label>
            <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
              <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base">Preis (€) *</Label>
            <Input className="h-12 text-base" type="number" step="0.01" placeholder="0.00"
              value={form.unit_price} onChange={set('unit_price')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base">MwSt.</Label>
            <Select value={form.vat_rate} onValueChange={v => setForm(p => ({ ...p, vat_rate: v }))}>
              <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VAT_RATES.map(r => (
                  <SelectItem key={r} value={r}>{r} %</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.unit_price && !isNaN(parseFloat(form.unit_price)) && (
          <p className="text-sm text-muted-foreground">
            Bruttopreis: <strong>
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                .format(parseFloat(form.unit_price) * (1 + parseFloat(form.vat_rate || '19') / 100))}
            </strong> / {form.unit} (inkl. {form.vat_rate}% MwSt.)
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button size="lg" className="h-14 text-lg gap-3" onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 className="w-5 h-5 animate-spin" />Speichern...</>
            : <><Check className="w-5 h-5" />Änderungen speichern</>}
        </Button>
        <Button variant="outline" size="lg" className="h-14 text-lg"
          onClick={() => navigate('/leistungen')} disabled={saving}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
