import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Quotes } from "./pages/Quotes";
import { QuoteDetail } from "./pages/QuoteDetail";
import { CreateQuoteInvoice } from "./pages/CreateQuoteInvoice";
import { Invoices } from "./pages/Invoices";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { Archive } from "./pages/Archive";
import { Customers } from "./pages/Customers";
import { CustomerDetail } from "./pages/CustomerDetail";
import { CreateCustomer } from "./pages/CreateCustomer";
import { EditCustomer } from "./pages/EditCustomer";
import { Services } from "./pages/Services";
import { CreateService } from "./pages/CreateService";
import { EditService } from "./pages/EditService";
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

      // Angebote
      { path: "angebote", Component: Quotes },
      { path: "angebote/:id", Component: QuoteDetail },

      // Erstellen (Angebot & Rechnung)
      { path: "erstellen", Component: CreateQuoteInvoice },

      // Rechnungen
      { path: "rechnungen", Component: Invoices },
      { path: "rechnungen/:id", Component: InvoiceDetail },

      // Archiv
      { path: "archiv", Component: Archive },

      // Kunden
      { path: "kunden", Component: Customers },
      { path: "kunden/neu", Component: CreateCustomer },
      { path: "kunden/:id", Component: CustomerDetail },
      { path: "kunden/:id/bearbeiten", Component: EditCustomer },

      // Leistungen
      { path: "leistungen", Component: Services },
      { path: "leistungen/neu", Component: CreateService },
      { path: "leistungen/:id/bearbeiten", Component: EditService },

      // Sonstiges
      { path: "hilfe", Component: Help },
      { path: "einstellungen", Component: Settings },
      { path: "impressum", Component: Imprint },
      { path: "datenschutz", Component: Privacy },
      { path: "nutzungsbedingungen", Component: Terms },
    ],
  },
]);
