import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Trash2, FileText, Receipt, Loader2, Check, Send } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useCustomers, useServices, formatCurrency, getCustomerName } from "../../lib/useSupabaseData";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";

interface LineItem {
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  // FIX: MwSt. pro Position — nur 0, 7, 19 %
  vat_rate: string;
}

const UNITS = ['Stunde', 'Stück', 'km', 'Pauschal', 'm', 'm²', 'm³'];
// FIX: Nur erlaubte MwSt.-Sätze
const VAT_RATES = ['0', '7', '19'];

export function CreateQuoteInvoice() {
  const { userProfile, company } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { services } = useServices();
  const navigate = useNavigate();
  // FIX: URL-Parameter für den Dokumenttyp auslesen
  const [searchParams] = useSearchParams();

  const [documentType, setDocumentType] = useState<'quote' | 'invoice'>(() => {
    const typeParam = searchParams.get('type');
    return typeParam === 'invoice' ? 'invoice' : 'quote';
  });

  // FIX: URL-Parameter verfolgen wenn sich die URL ändert
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'invoice' || typeParam === 'quote') {
      setDocumentType(typeParam);
    }
  }, [searchParams]);

  const defaultVatRate = String(company?.default_vat_rate ?? 19);
  // Nur 0, 7, 19 erlaubt — Fallback auf 19 falls DB-Wert anders ist
  const safeDefaultVat = VAT_RATES.includes(defaultVatRate) ? defaultVatRate : '19';

  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [secondDate, setSecondDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: '1', unit: 'Stunde', unit_price: '', vat_rate: safeDefaultVat },
  ]);

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [
    ...prev,
    { description: '', quantity: '1', unit: 'Stunde', unit_price: '', vat_rate: safeDefaultVat },
  ]);

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const applyTemplate = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    const serviceVat = String(service.vat_rate ?? safeDefaultVat);
    const safeVat = VAT_RATES.includes(serviceVat) ? serviceVat : safeDefaultVat;
    updateItem(index, 'description', service.title);
    updateItem(index, 'unit', service.unit);
    updateItem(index, 'unit_price', String(service.unit_price));
    updateItem(index, 'vat_rate', safeVat);
  };

  const calcItemNet = (item: LineItem) =>
    (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);

  const calcItemVat = (item: LineItem) =>
    calcItemNet(item) * ((parseFloat(item.vat_rate) || 0) / 100);

  // FIX: Zusammenfassung berechnet MwSt. pro Position (kann gemischt 7%/19% sein)
  const subtotal = items.reduce((sum, item) => sum + calcItemNet(item), 0);
  const vatAmount = items.reduce((sum, item) => sum + calcItemVat(item), 0);
  const total = subtotal + vatAmount;

  // Gruppierte MwSt. für Zusammenfassung (z.B. 7% + 19% separat ausweisen)
  const vatBreakdown = VAT_RATES.filter(rate => rate !== '0').map(rate => {
    const amount = items
      .filter(i => i.vat_rate === rate)
      .reduce((sum, i) => sum + calcItemVat(i), 0);
    return { rate, amount };
  }).filter(v => v.amount > 0);

  // Nummern-Format hochzählen: "RE-2026-001" → "RE-2026-002"
  const incrementNumber = (current: string): string => {
    const match = current.match(/^(.*?)(\d+)$/);
    if (!match) return current;
    return `${match[1]}${String(parseInt(match[2]) + 1).padStart(match[2].length, '0')}`;
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!customerId) { toast.error('Bitte wählen Sie einen Kunden.'); return; }
    if (!title.trim()) { toast.error('Bitte geben Sie einen Titel ein.'); return; }
    if (items.every(i => !i.description)) { toast.error('Bitte fügen Sie mindestens eine Position hinzu.'); return; }
    if (!userProfile?.company_id) return;

    setSaving(true);
    try {
      // Aktuelle Nummern frisch aus DB holen — nie den Cache verwenden
      const { data: freshCompany, error: companyErr } = await supabase
        .from('companies')
        .select('next_quote_number, next_invoice_number, payment_terms')
        .eq('id', userProfile.company_id)
        .single();
      if (companyErr) throw companyErr;

      const dbItems = items
        .filter(i => i.description)
        .map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit,
          unit_price: parseFloat(i.unit_price) || 0,
          vat_rate: parseFloat(i.vat_rate) || 0,
          total: calcItemNet(i),
        }));

      if (documentType === 'quote') {
        const quoteNumber = freshCompany.next_quote_number ?? `ANG-${Date.now()}`;
        const nextQuoteNumber = incrementNumber(quoteNumber);

        // Nummer zuerst hochzählen, dann Insert
        await supabase.from('companies')
          .update({ next_quote_number: nextQuoteNumber })
          .eq('id', userProfile.company_id);

        const { error } = await supabase.from('quotes').insert({
          company_id: userProfile.company_id,
          customer_id: customerId,
          created_by: userProfile.id,
          quote_number: quoteNumber,
          title: title.trim(),
          status,
          subtotal,
          vat_amount: vatAmount,
          total,
          quote_date: date,
          valid_until: secondDate || null,
          items: dbItems,
          notes: notes || null,
        });
        if (error) {
          // Rollback
          await supabase.from('companies')
            .update({ next_quote_number: quoteNumber })
            .eq('id', userProfile.company_id);
          throw error;
        }
        toast.success(status === 'sent' ? 'Angebot wurde versendet!' : 'Angebot als Entwurf gespeichert!');

      } else {
        const invoiceNumber = freshCompany.next_invoice_number ?? `RE-${Date.now()}`;
        const nextInvoiceNumber = incrementNumber(invoiceNumber);
        const paymentTerms = freshCompany.payment_terms ?? 14;
        const dueDate = secondDate || new Date(new Date(date).getTime() + paymentTerms * 86400000).toISOString().slice(0, 10);

        // Nummer zuerst hochzählen, dann Insert
        await supabase.from('companies')
          .update({ next_invoice_number: nextInvoiceNumber })
          .eq('id', userProfile.company_id);

        const { error } = await supabase.from('invoices').insert({
          company_id: userProfile.company_id,
          customer_id: customerId,
          created_by: userProfile.id,
          invoice_number: invoiceNumber,
          title: title.trim(),
          status,
          subtotal,
          vat_amount: vatAmount,
          total,
          invoice_date: date,
          due_date: dueDate,
          items: dbItems,
          notes: notes || null,
        });
        if (error) {
          // Rollback
          await supabase.from('companies')
            .update({ next_invoice_number: invoiceNumber })
            .eq('id', userProfile.company_id);
          throw error;
        }
        toast.success(status === 'sent' ? 'Rechnung wurde versendet!' : 'Rechnung als Entwurf gespeichert!');
      }

      navigate(documentType === 'quote' ? '/angebote' : '/rechnungen');
    } catch (err: any) {
      toast.error('Fehler beim Speichern', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">
          {documentType === 'quote' ? 'Neues Angebot' : 'Neue Rechnung'} erstellen
        </h1>
        <p className="text-lg text-muted-foreground">
          Füllen Sie die Felder aus und speichern Sie das Dokument
        </p>
      </div>

      {/* Typ */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg"
            variant={documentType === 'quote' ? 'default' : 'outline'}
            className="h-14 text-base gap-2"
            onClick={() => setDocumentType('quote')}>
            <FileText className="w-5 h-5" />Angebot
          </Button>
          <Button size="lg"
            variant={documentType === 'invoice' ? 'default' : 'outline'}
            className="h-14 text-base gap-2"
            onClick={() => setDocumentType('invoice')}>
            <Receipt className="w-5 h-5" />Rechnung
          </Button>
        </div>
      </Card>

      {/* Kunde + Titel + Datum */}
      <Card className="p-5 sm:p-8 space-y-5">
        <h2 className="text-xl sm:text-2xl">Grunddaten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-base">Kunde *</Label>
            {customersLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground h-12">
                <Loader2 className="w-4 h-4 animate-spin" /><span>Lade Kunden...</span>
              </div>
            ) : (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Kunde wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-base py-2">
                      {getCustomerName(c)}
                      {c.customer_number && <span className="text-muted-foreground ml-2 text-sm">({c.customer_number})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base">Titel / Betreff *</Label>
            <Input className="h-12 text-base" placeholder="z.B. Elektroinstallation Neubau"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-base">{documentType === 'quote' ? 'Angebotsdatum' : 'Rechnungsdatum'}</Label>
            <Input type="date" className="h-12 text-base" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-base">{documentType === 'quote' ? 'Gültig bis' : 'Fällig am'}</Label>
            <Input type="date" className="h-12 text-base" value={secondDate} onChange={e => setSecondDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Positionen */}
      <Card className="p-5 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl">Positionen</h2>
          <Button size="lg" onClick={addItem} className="h-12 gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />Position hinzufügen
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 sm:p-6 bg-secondary/30 rounded-lg space-y-4">
              {/* Vorlage */}
              {services.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Vorlage wählen (optional)</Label>
                  <Select onValueChange={v => applyTemplate(index, v)}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Aus Leistungsbibliothek..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-sm py-2">
                          {s.title} — {formatCurrency(s.unit_price)} / {s.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-base">Beschreibung</Label>
                <Input className="h-12 text-base" placeholder="z.B. Elektroinstallation"
                  value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
              </div>

              {/* FIX: 4 Spalten — Menge, Einheit, Preis, MwSt. */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Menge</Label>
                  <Input type="number" className="h-12 text-base" placeholder="1"
                    value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Einheit</Label>
                  <Select value={item.unit} onValueChange={v => updateItem(index, 'unit', v)}>
                    <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Preis (€)</Label>
                  <Input type="number" step="0.01" className="h-12 text-base" placeholder="0.00"
                    value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} />
                </div>
                {/* FIX: MwSt.-Dropdown nur 0%, 7%, 19% */}
                <div className="space-y-2">
                  <Label className="text-sm">MwSt.</Label>
                  <Select value={item.vat_rate} onValueChange={v => updateItem(index, 'vat_rate', v)}>
                    <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VAT_RATES.map(r => (
                        <SelectItem key={r} value={r}>{r} %</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Netto: <strong>{formatCurrency(calcItemNet(item))}</strong>
                  {parseFloat(item.vat_rate) > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      (Brutto: {formatCurrency(calcItemNet(item) + calcItemVat(item))})
                    </span>
                  )}
                </span>
                {items.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeItem(index)} className="h-9 gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />Löschen
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notizen */}
      <Card className="p-5 sm:p-8 space-y-4">
        <h2 className="text-xl sm:text-2xl">Hinweise</h2>
        <Textarea placeholder="Optionale Hinweise oder Anmerkungen..."
          className="min-h-28 text-base" value={notes} onChange={e => setNotes(e.target.value)} />
      </Card>

      {/* Zusammenfassung */}
      <Card className="p-5 sm:p-8 space-y-4">
        <h2 className="text-xl sm:text-2xl">Zusammenfassung</h2>
        <div className="max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Nettobetrag:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {/* FIX: MwSt. aufgeschlüsselt nach Satz */}
          {vatBreakdown.length > 0 ? (
            vatBreakdown.map(v => (
              <div key={v.rate} className="flex justify-between text-base">
                <span className="text-muted-foreground">MwSt. ({v.rate}%):</span>
                <span>{formatCurrency(v.amount)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">MwSt.:</span>
              <span>{formatCurrency(0)}</span>
            </div>
          )}
          <div className="h-px bg-border" />
          <div className="flex justify-between text-2xl font-bold">
            <span>Gesamt:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </Card>

      {/* FIX: Zwei Speicher-Buttons — Entwurf und Direkt versenden */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base gap-2"
          onClick={() => handleSave('draft')}
          disabled={saving}
        >
          {saving
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Check className="w-5 h-5" />}
          Als Entwurf speichern
        </Button>
        <Button
          size="lg"
          className="h-14 text-base gap-2"
          onClick={() => handleSave('sent')}
          disabled={saving}
        >
          {saving
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Send className="w-5 h-5" />}
          {documentType === 'quote' ? 'Angebot versenden' : 'Rechnung versenden'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 text-base"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
