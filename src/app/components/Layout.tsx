import { Outlet, Link, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Archive,
  Users,
  Briefcase,
  HelpCircle,
  Settings,
  Plus,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../../lib/AuthContext";
import { AuthScreen } from "./auth/AuthScreen";

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Angebote", path: "/angebote", icon: FileText },
  { name: "Rechnungen", path: "/rechnungen", icon: Receipt },
  { name: "Archiv", path: "/archiv", icon: Archive },
  { name: "Kunden", path: "/kunden", icon: Users },
  { name: "Leistungen", path: "/leistungen", icon: Briefcase },
  { name: "Hilfe", path: "/hilfe", icon: HelpCircle },
  { name: "Einstellungen", path: "/einstellungen", icon: Settings },
];

// Mobile Bottom Navigation Items (wichtigste Bereiche)
const mobileNavigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Angebote", path: "/angebote", icon: FileText },
  { name: "Rechnungen", path: "/rechnungen", icon: Receipt },
  { name: "Kunden", path: "/kunden", icon: Users },
];

// Legal navigation items
const legalNavigation = [
  { name: "Impressum", path: "/impressum" },
  { name: "Datenschutz", path: "/datenschutz" },
  { name: "Nutzungsbedingungen", path: "/nutzungsbedingungen" },
];

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  // Check if we're on a legal page (these don't require auth)
  const isLegalPage = ['/impressum', '/datenschutz', '/nutzungsbedingungen'].includes(location.pathname);

  // Show loading spinner while checking auth (but not for legal pages)
  if (loading && !isLegalPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <FileText className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-lg text-muted-foreground">Invox wird geladen...</p>
        </div>
      </div>
    );
  }

  // Show legal pages without auth requirement
  if (isLegalPage) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Invox</h1>
            </Link>
            {user && (
              <Link to="/">
                <Button variant="outline">Zurück zur App</Button>
              </Link>
            )}
          </div>
        </div>
        <Outlet />
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-sidebar border-r border-sidebar-border flex-col">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3">
            {/* Logo Placeholder */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary truncate">Invox</h1>
              <p className="text-xs sm:text-sm text-sidebar-foreground mt-0.5 truncate">
                Angebote & Rechnungen
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={`
                    flex items-center gap-4 px-5 py-4 rounded-lg transition-all
                    ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <span className="text-lg truncate">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-4">
          <Link to="/erstellen">
            <Button className="w-full h-14 text-lg gap-3">
              <Plus className="w-6 h-6" />
              Neu erstellen
            </Button>
          </Link>

          {/* User Info & Logout */}
          <div className="pt-4 border-t border-sidebar-border/50 space-y-3">
            <div className="px-2 space-y-1">
              <p className="text-sm font-medium truncate">{user.email}</p>
              {user.user_metadata?.company && (
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user.user_metadata.company}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </div>
          
          {/* Legal Links */}
          <div className="pt-4 border-t border-sidebar-border/50 space-y-2">
            {legalNavigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors truncate"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Logo Placeholder Mobile */}
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">Invox</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-sidebar-foreground flex-shrink-0"
        >
          {mobileMenuOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <Menu className="w-7 h-7" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background z-30 pt-16 pb-20 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`
                      flex items-center gap-5 px-6 py-5 rounded-lg transition-all
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }
                    `}
                  >
                    <Icon className="w-7 h-7 flex-shrink-0" />
                    <span className="text-xl truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}

            <Link to="/erstellen" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-16 text-xl gap-4 mt-4">
                <Plus className="w-7 h-7" />
                Neu erstellen
              </Button>
            </Link>

            {/* User Info & Logout in Mobile Menu */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="px-2 space-y-1">
                <p className="text-base font-medium">{user.email}</p>
                {user.user_metadata?.company && (
                  <p className="text-sm text-muted-foreground">
                    {user.user_metadata.company}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full h-14 text-lg justify-start gap-3"
                onClick={handleSignOut}
              >
                <LogOut className="w-6 h-6" />
                Abmelden
              </Button>
            </div>

            {/* Legal Links in Mobile Menu */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {legalNavigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-sidebar border-t border-sidebar-border z-40 flex items-center justify-around px-2">
        {mobileNavigation.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
            >
              <div
                className={`
                  flex flex-col items-center gap-1 px-2 sm:px-4 py-2 rounded-lg transition-all
                  ${
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground"
                  }
                `}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="text-xs truncate max-w-full">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Floating Action Button - Always Visible on Mobile */}
      <Link
        to="/erstellen"
        className="lg:hidden fixed bottom-24 right-4 sm:right-6 z-50"
      >
        <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-7 h-7" />
        </div>
      </Link>
    </div>
  );
}