import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FileText, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/AuthContext";
import { toast } from "sonner";

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
  });

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast.error("Anmeldung fehlgeschlagen", {
            description: error.message || "Bitte überprüfen Sie Ihre Zugangsdaten.",
          });
        } else {
          toast.success("Erfolgreich angemeldet!");
        }
      } else {
        // Registrierung
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwörter stimmen nicht überein");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast.error("Passwort muss mindestens 6 Zeichen lang sein");
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          company: formData.company,
        });

        if (error) {
          toast.error("Registrierung fehlgeschlagen", {
            description: error.message || "Bitte versuchen Sie es erneut.",
          });
        } else {
          toast.success("Erfolgreich registriert!", {
            description: "Sie können sich jetzt anmelden.",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast.error("Ein Fehler ist aufgetreten", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl flex items-center justify-center">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">Invox</h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">
              Angebote & Rechnungen für Handwerksbetriebe
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl mb-2">
                {isLogin ? "Anmelden" : "Registrieren"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {isLogin
                  ? "Melden Sie sich mit Ihrem Account an"
                  : "Erstellen Sie einen neuen Account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">
                      Ihr Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Max Mustermann"
                      className="h-12 text-base"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-base">
                      Firmenname
                    </Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Mustermann Elektro GmbH"
                      className="h-12 text-base"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      required={!isLogin}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  className="h-12 text-base"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">
                  Passwort
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 text-base"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base">
                    Passwort bestätigen
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 text-base"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required={!isLogin}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Bitte warten...
                  </>
                ) : isLogin ? (
                  "Anmelden"
                ) : (
                  "Registrieren"
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm sm:text-base text-primary hover:underline"
                disabled={loading}
              >
                {isLogin
                  ? "Noch kein Account? Jetzt registrieren"
                  : "Bereits registriert? Jetzt anmelden"}
              </button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-4 sm:p-6 bg-primary/5 border-primary/20">
          <div className="space-y-2 text-center">
            <h3 className="text-base sm:text-lg font-semibold">
              Warum Invox?
            </h3>
            <ul className="text-sm sm:text-base text-muted-foreground space-y-1">
              <li>✓ Einfach und schnell Angebote erstellen</li>
              <li>✓ Professionelle Rechnungen in Sekunden</li>
              <li>✓ Kundenverwaltung inklusive</li>
              <li>✓ Für Handwerksbetriebe optimiert</li>
            </ul>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <a href="/impressum" className="hover:text-foreground transition-colors">
              Impressum
            </a>
            <span>•</span>
            <a href="/datenschutz" className="hover:text-foreground transition-colors">
              Datenschutz
            </a>
            <span>•</span>
            <a
              href="/nutzungsbedingungen"
              className="hover:text-foreground transition-colors"
            >
              AGB
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}