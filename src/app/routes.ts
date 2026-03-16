import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Quotes } from "./pages/Quotes";
import { CreateQuoteInvoice } from "./pages/CreateQuoteInvoice";
import { Invoices } from "./pages/Invoices";
import { Archive } from "./pages/Archive";
import { Customers } from "./pages/Customers";
import { Services } from "./pages/Services";
import { Help } from "./pages/Help";
import { Settings } from "./pages/Settings";
import { Imprint } from "./pages/Imprint";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "angebote", Component: Quotes },
      { path: "erstellen", Component: CreateQuoteInvoice },
      { path: "rechnungen", Component: Invoices },
      { path: "archiv", Component: Archive },
      { path: "kunden", Component: Customers },
      { path: "leistungen", Component: Services },
      { path: "hilfe", Component: Help },
      { path: "einstellungen", Component: Settings },
      // Legal pages now inside Layout to have access to AuthContext
      { path: "impressum", Component: Imprint },
      { path: "datenschutz", Component: Privacy },
      { path: "nutzungsbedingungen", Component: Terms },
    ],
  },
]);