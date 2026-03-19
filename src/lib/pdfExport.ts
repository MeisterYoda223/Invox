import { Quote, Invoice, Customer, QuoteItem, formatCurrency, formatDate, getCustomerName } from './useSupabaseData';

interface Company {
  company_name: string;
  owner: string;
  street?: string;
  zip?: string;
  city?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  vat_id?: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  payment_terms?: number;
  quote_footer?: string;
  invoice_footer?: string;
}

function buildHtml(
  type: 'quote' | 'invoice',
  doc: Quote | Invoice,
  company: Company,
): string {
  const isInvoice = type === 'invoice';
  const inv = doc as Invoice;
  const qt = doc as Quote;

  const number = isInvoice ? inv.invoice_number : qt.quote_number;
  const date = isInvoice ? inv.invoice_date : qt.quote_date;
  const secondDate = isInvoice
    ? inv.due_date ? `<p><strong>Fällig am:</strong> ${formatDate(inv.due_date)}</p>` : ''
    : qt.valid_until ? `<p><strong>Gültig bis:</strong> ${formatDate(qt.valid_until)}</p>` : '';

  const customer = doc.customer;
  const customerAddr = customer ? `
    <strong>${getCustomerName(customer)}</strong><br/>
    ${customer.street ?? ''}<br/>
    ${customer.zip ?? ''} ${customer.city ?? ''}
    ${customer.email ? `<br/>${customer.email}` : ''}
  ` : '';

  const items: QuoteItem[] = doc.items ?? [];
  const itemRows = items.map((item, i) => `
    <tr class="${i % 2 === 0 ? 'even' : ''}">
      <td>${item.description}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${item.unit}</td>
      <td class="right">${formatCurrency(item.unit_price)}</td>
      <td class="right">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  const vatRate = items.length > 0
    ? Math.round(((doc.vat_amount / doc.subtotal) * 100) || 19)
    : 19;

  const footer = isInvoice ? (company.invoice_footer ?? '') : (company.quote_footer ?? '');
  const bankInfo = company.iban ? `
    <div class="bank-info">
      <strong>Bankverbindung:</strong><br/>
      ${company.bank_name ? `${company.bank_name}<br/>` : ''}
      IBAN: ${company.iban}${company.bic ? ` | BIC: ${company.bic}` : ''}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; padding: 40px; max-width: 800px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .company-name { font-size: 22pt; font-weight: bold; color: #1a56db; }
  .company-info { font-size: 9pt; color: #555; line-height: 1.6; }
  .doc-title { font-size: 18pt; font-weight: bold; margin-bottom: 6px; }
  .doc-meta { font-size: 10pt; color: #444; line-height: 1.8; }
  .addresses { display: flex; justify-content: space-between; margin: 30px 0; gap: 40px; }
  .address-box { flex: 1; }
  .address-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .address-content { font-size: 10pt; line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  thead tr { background: #1a56db; color: white; }
  thead th { padding: 10px 8px; text-align: left; font-size: 10pt; }
  thead th.center { text-align: center; }
  thead th.right { text-align: right; }
  tbody td { padding: 8px; font-size: 10pt; border-bottom: 1px solid #f0f0f0; }
  tbody tr.even { background: #f9f9f9; }
  td.center { text-align: center; }
  td.right { text-align: right; }
  .totals { margin-left: auto; width: 280px; margin-top: 8px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 10pt; border-bottom: 1px solid #eee; }
  .totals-row.total { font-size: 13pt; font-weight: bold; color: #1a56db; border-bottom: none; border-top: 2px solid #1a56db; padding-top: 8px; margin-top: 4px; }
  .notes { margin: 20px 0; padding: 14px; background: #f8f9ff; border-left: 3px solid #1a56db; font-size: 10pt; line-height: 1.6; }
  .footer-text { margin-top: 24px; font-size: 9pt; color: #666; line-height: 1.6; }
  .bank-info { margin-top: 16px; font-size: 9pt; color: #555; line-height: 1.7; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .tax-info { font-size: 9pt; color: #666; margin-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${company.company_name}</div>
      <div class="company-info">
        ${company.street ? `${company.street}<br/>` : ''}
        ${company.zip || company.city ? `${company.zip ?? ''} ${company.city ?? ''}<br/>` : ''}
        ${company.phone ? `Tel: ${company.phone}<br/>` : ''}
        ${company.email ? `E-Mail: ${company.email}` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div class="doc-title">${isInvoice ? 'RECHNUNG' : 'ANGEBOT'}</div>
      <div class="doc-meta">
        <p><strong>Nr.:</strong> ${number}</p>
        <p><strong>Datum:</strong> ${formatDate(date)}</p>
        ${secondDate}
        ${company.tax_number ? `<p><strong>St-Nr.:</strong> ${company.tax_number}</p>` : ''}
        ${company.vat_id ? `<p><strong>USt-IdNr.:</strong> ${company.vat_id}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-box">
      <div class="address-label">Rechnungsempfänger</div>
      <div class="address-content">${customerAddr}</div>
    </div>
    <div class="address-box">
      <div class="address-label">Absender</div>
      <div class="address-content">
        <strong>${company.owner ?? company.company_name}</strong><br/>
        ${company.street ?? ''}<br/>
        ${company.zip ?? ''} ${company.city ?? ''}
      </div>
    </div>
  </div>

  <h2 style="font-size:13pt; margin-bottom:4px;">${doc.title}</h2>

  <table>
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th class="center">Menge</th>
        <th class="center">Einheit</th>
        <th class="right">Einzelpreis</th>
        <th class="right">Gesamt</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Nettobetrag:</span><span>${formatCurrency(doc.subtotal)}</span></div>
    <div class="totals-row"><span>MwSt. (${vatRate}%):</span><span>${formatCurrency(doc.vat_amount)}</span></div>
    <div class="totals-row total"><span>Gesamtbetrag:</span><span>${formatCurrency(doc.total)}</span></div>
  </div>

  <p class="tax-info">Alle Preise zzgl. ${vatRate}% Mehrwertsteuer.</p>

  ${doc.notes ? `<div class="notes"><strong>Hinweise:</strong><br/>${doc.notes}</div>` : ''}

  <hr class="divider"/>

  ${bankInfo}
  ${isInvoice && company.payment_terms ? `
    <p class="footer-text">Bitte überweisen Sie den Betrag innerhalb von ${company.payment_terms} Tagen.</p>
  ` : ''}
  ${footer ? `<p class="footer-text">${footer}</p>` : ''}
</body>
</html>`;
}

export async function exportPdf(
  type: 'quote' | 'invoice',
  doc: Quote | Invoice,
  company: Company,
): Promise<void> {
  const html = buildHtml(type, doc, company);
  const number = type === 'invoice' ? (doc as Invoice).invoice_number : (doc as Quote).quote_number;
  const filename = `${number}.pdf`;

  // Capacitor (iOS/Android)
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Use print-to-pdf via browser window on mobile
    const blob = await htmlToPdfBlob(html);
    const base64 = await blobToBase64(blob);
    const path = `${filename}`;

    await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({ title: filename, url: uri });
    return;
  } catch {
    // Not Capacitor – fall through to web
  }

  // Web: open in new tab and trigger print dialog
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.print();
    };
  }
}

async function htmlToPdfBlob(html: string): Promise<Blob> {
  // On web without a PDF lib, we just create an HTML blob
  // and rely on the print dialog
  return new Blob([html], { type: 'text/html' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
