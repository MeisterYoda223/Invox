import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Briefcase, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency } from "../../lib/useSupabaseData";
import { supabase } from "../../lib/supabase";
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

export function Services() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Eigener Fetch damit wir lokal löschen können ohne Hook-Einschränkung
  useEffect(() => {
    const load = async () => {
      if (!userProfile?.company_id) return;
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', userProfile.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else setServices(data ?? []);
      setLoading(false);
    };
    load();
  }, [userProfile?.company_id]);

  const filtered = services.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    // Soft-delete: is_active auf false setzen statt hart löschen
    // (verhindert Probleme bei Angeboten/Rechnungen die diese Leistung referenzieren)
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen', { description: error.message });
    } else {
      toast.success('Leistung wurde gelöscht');
      setServices(prev => prev.filter(s => s.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl mb-2">Leistungsbibliothek</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">Häufig verwendete Leistungen verwalten</p>
        </div>
        <Link to="/leistungen/neu">
          <Button size="lg" className="h-14 px-8 text-base gap-3 w-full sm:w-auto">
            <Plus className="w-6 h-6" />Neue Leistung
          </Button>
        </Link>
      </div>

      <Card className="p-5">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Gespeicherte Leistungen</p>
          <p className="text-2xl font-bold">{services.length}</p>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Leistung suchen..." className="pl-12 h-12 text-base"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground py-8">
          <Loader2 className="w-6 h-6 animate-spin" /><span>Lade Leistungen...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-red-400">Fehler: {error}</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {search ? 'Keine Leistungen gefunden.' : 'Noch keine Leistungen vorhanden. Fügen Sie Ihre erste Leistung hinzu!'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(service => (
            <Card key={service.id} className="p-4 sm:p-6 hover:bg-card/80 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl">{service.title}</h3>
                      {service.service_number && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {service.service_number}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(service.unit_price)}
                        <span className="text-sm text-muted-foreground font-normal ml-1">/ {service.unit}</span>
                      </span>
                      {service.vat_rate != null && (
                        <span className="text-sm text-muted-foreground">MwSt. {service.vat_rate}%</span>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {/* FIX: Bearbeiten navigiert zur Edit-Seite */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 flex-1 sm:flex-initial gap-2"
                        onClick={() => navigate(`/leistungen/${service.id}/bearbeiten`)}
                      >
                        <Edit className="w-4 h-4" />Bearbeiten
                      </Button>

                      {/* FIX: Löschen mit Bestätigungsdialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 flex-1 sm:flex-initial gap-2"
                            disabled={deleting === service.id}
                          >
                            {deleting === service.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4 text-destructive" />}
                            Löschen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leistung löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie <strong>{service.title}</strong> wirklich löschen?
                              Die Leistung wird aus der Bibliothek entfernt. Bereits erstellte
                              Angebote und Rechnungen bleiben unverändert.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(service.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <Briefcase className="w-7 h-7 text-primary mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg mb-1">Tipp: Leistungsbibliothek nutzen</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Speichern Sie häufig verwendete Leistungen hier ab. Beim Erstellen von Angeboten und Rechnungen können Sie diese dann schnell einfügen.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
