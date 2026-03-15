import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Card } from "../ui/card";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface ConnectionStatus {
  supabaseClient: boolean;
  apiConnection: boolean;
  authService: boolean;
  projectId: string;
  error?: string;
}

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    supabaseClient: false,
    apiConnection: false,
    authService: false,
    projectId: "",
  });
  const [testing, setTesting] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setTesting(true);

    try {
      // Test 1: Supabase Client existiert
      const clientExists = !!supabase;

      // Test 2: Project ID
      const projectId = supabase?.supabaseUrl?.split("//")[1]?.split(".")[0] || "";

      // Test 3: Auth Service verfügbar
      let authServiceWorks = false;
      try {
        const { error } = await supabase.auth.getSession();
        authServiceWorks = !error;
      } catch (e) {
        console.error("Auth service error:", e);
      }

      // Test 4: API Connection
      let apiWorks = false;
      try {
        const response = await fetch(
          `${supabase.supabaseUrl}/rest/v1/`,
          {
            headers: {
              apikey: supabase.supabaseKey,
            },
          }
        );
        apiWorks = response.status !== 404;
      } catch (e) {
        console.error("API connection error:", e);
      }

      setStatus({
        supabaseClient: clientExists,
        apiConnection: apiWorks,
        authService: authServiceWorks,
        projectId,
      });
    } catch (error: any) {
      setStatus({
        supabaseClient: false,
        apiConnection: false,
        authService: false,
        projectId: "",
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) => {
    if (testing) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const allPassed = status.supabaseClient && status.apiConnection && status.authService;

  return (
    <Card className="p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          {testing ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : allPassed ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          )}
          <h2 className="text-xl font-semibold">
            Supabase Verbindungs-Status
          </h2>
        </div>

        <div className="space-y-4">
          {/* Test 1 */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Supabase Client</p>
              <p className="text-sm text-muted-foreground">
                Client-Objekt wurde erstellt
              </p>
            </div>
            <StatusIcon success={status.supabaseClient} />
          </div>

          {/* Test 2 */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">API-Verbindung</p>
              <p className="text-sm text-muted-foreground">
                REST API ist erreichbar
              </p>
            </div>
            <StatusIcon success={status.apiConnection} />
          </div>

          {/* Test 3 */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Auth-Service</p>
              <p className="text-sm text-muted-foreground">
                Authentifizierung funktioniert
              </p>
            </div>
            <StatusIcon success={status.authService} />
          </div>

          {/* Project Info */}
          {status.projectId && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Project ID
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">
                {status.projectId}
              </p>
            </div>
          )}

          {/* Error */}
          {status.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Fehler
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {status.error}
              </p>
            </div>
          )}
        </div>

        {/* Result */}
        {!testing && (
          <div
            className={`p-4 rounded-lg border ${
              allPassed
                ? "bg-green-500/10 border-green-500/20"
                : "bg-yellow-500/10 border-yellow-500/20"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                allPassed ? "text-green-700 dark:text-green-300" : "text-yellow-700 dark:text-yellow-300"
              }`}
            >
              {allPassed
                ? "✅ Alle Tests bestanden! Supabase ist vollständig verbunden."
                : "⚠️ Einige Tests fehlgeschlagen. Prüfen Sie die Konfiguration."}
            </p>
          </div>
        )}

        {/* Next Steps */}
        {!testing && !allPassed && (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Nächste Schritte:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {!status.supabaseClient && (
                <li>Prüfen Sie /utils/supabase/info.tsx</li>
              )}
              {!status.apiConnection && (
                <li>Prüfen Sie Project ID und API Key</li>
              )}
              {!status.authService && (
                <li>Prüfen Sie Auth-Konfiguration in Supabase Dashboard</li>
              )}
            </ul>
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={testConnection}
          disabled={testing}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {testing ? "Teste Verbindung..." : "Erneut testen"}
        </button>
      </div>
    </Card>
  );
}
