import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Receipt, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router";

const stats = [
  {
    title: "Offene Angebote",
    value: "12",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Offene Rechnungen",
    value: "8",
    icon: Receipt,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Überfällig",
    value: "2",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    title: "Diese Woche",
    value: "€12.450",
    icon: CheckCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const recentActivities = [
  {
    type: "Angebot",
    customer: "Müller GmbH",
    amount: "€2.450",
    date: "07.03.2026",
    status: "Offen",
  },
  {
    type: "Rechnung",
    customer: "Schmidt Bau",
    amount: "€5.200",
    date: "06.03.2026",
    status: "Bezahlt",
  },
  {
    type: "Angebot",
    customer: "Wagner Elektrik",
    amount: "€1.850",
    date: "05.03.2026",
    status: "Offen",
  },
  {
    type: "Rechnung",
    customer: "Fischer Installation",
    amount: "€3.400",
    date: "04.03.2026",
    status: "Offen",
  },
  {
    type: "Rechnung",
    customer: "Becker Malerei",
    amount: "€890",
    date: "03.03.2026",
    status: "Überfällig",
  },
];

export function Dashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl mb-2">Dashboard</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Übersicht Ihrer Angebote und Rechnungen
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg text-muted-foreground">
                  {stat.title}
                </span>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <Card className="p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl">Letzte Aktivitäten</h2>
          <Link to="/archiv">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Alle anzeigen
            </Button>
          </Link>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors gap-3 sm:gap-6"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {activity.type === "Angebot" ? (
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 flex-shrink-0" />
                ) : (
                  <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-green-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base sm:text-lg font-medium">{activity.type}</span>
                    <span
                      className={`px-3 py-1 rounded-lg text-sm ${
                        activity.status === "Bezahlt"
                          ? "bg-green-500/20 text-green-400"
                          : activity.status === "Überfällig"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground truncate">
                    {activity.customer}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                <div className="text-lg sm:text-xl font-semibold">
                  {activity.amount}
                </div>
                <div className="text-base sm:text-lg text-muted-foreground">
                  {activity.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link to="/erstellen">
          <Card className="p-6 sm:p-8 hover:bg-card/80 transition-colors cursor-pointer h-full">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl">Neues Angebot</h3>
              <p className="text-muted-foreground text-base sm:text-lg">
                Schnell ein neues Angebot erstellen
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/erstellen">
          <Card className="p-6 sm:p-8 hover:bg-card/80 transition-colors cursor-pointer h-full">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <Receipt className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl">Neue Rechnung</h3>
              <p className="text-muted-foreground text-base sm:text-lg">
                Schnell eine neue Rechnung erstellen
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/kunden">
          <Card className="p-6 sm:p-8 hover:bg-card/80 transition-colors cursor-pointer h-full sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl">Kundenverwaltung</h3>
              <p className="text-muted-foreground text-base sm:text-lg">
                Kunden anzeigen und verwalten
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}