import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quote, Invoice, QuoteItem, formatCurrency, formatDate, getCustomerName } from './useSupabaseData';

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

function buildHtml(type: 'quote' | 'invoice', doc: Quote | Invoice, company: Company): string {
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

  const vatRate = items.length > 0 ? Math.round(((doc.vat_amount / doc.subtotal) * 100) || 19) : 19;
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
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: white; width: 794px; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .company-name { font-size: 22pt; font-weight: bold; color: #1a56db; }
  .company-info { font-size: 9pt; color: #555; line-height: 1.6; margin-top: 6px; }
  .doc-title { font-size: 18pt; font-weight: bold; margin-bottom: 6px; }
  .doc-meta { font-size: 10pt; color: #444; line-height: 1.8; text-align: right; }
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
  .footer-text { margin-top: 16px; font-size: 9pt; color: #666; line-height: 1.6; }
  .bank-info { margin-top: 16px; font-size: 9pt; color: #555; line-height: 1.7; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .tax-info { font-size: 9pt; color: #666; margin-top: 8px; }
  h2 { font-size: 13pt; margin-bottom: 4px; }
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
    <div>
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

  <h2>${doc.title}</h2>

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
  ${isInvoice && company.payment_terms ? `<p class="footer-text">Bitte überweisen Sie den Betrag innerhalb von ${company.payment_terms} Tagen.</p>` : ''}
  ${footer ? `<p class="footer-text">${footer}</p>` : ''}
</body>
</html>`;
}

// HTML → PDF Blob via html2canvas + jsPDF
async function htmlToPdfBlob(html: string): Promise<Blob> {
  // Temporäres verstecktes iframe zum Rendern
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Warten bis Fonts/Styles geladen
    await new Promise(r => setTimeout(r, 300));

    const body = iframeDoc.body;
    const canvas = await html2canvas(body, {
      scale: 2,              // Hohe Auflösung
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      logging: false,
    });

    // A4: 210 × 297 mm
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png');
    const imgH = (canvas.height * pageW) / canvas.width;

    // Mehrseitig falls Inhalt länger als eine A4-Seite
    let yOffset = 0;
    let remaining = imgH;

    while (remaining > 0) {
      if (yOffset > 0) pdf.addPage();
      const sliceH = Math.min(remaining, pageH);
      pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH);
      yOffset += pageH;
      remaining -= sliceH;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(iframe);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportPdf(
  type: 'quote' | 'invoice',
  doc: Quote | Invoice,
  company: Company,
): Promise<void> {
  const html = buildHtml(type, doc, company);
  const number = type === 'invoice' ? (doc as Invoice).invoice_number : (doc as Quote).quote_number;
  const filename = `${number}.pdf`;

  // PDF-Blob erzeugen (funktioniert auf Web und Capacitor)
  const pdfBlob = await htmlToPdfBlob(html);

  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();

  // ── Capacitor (Android / iOS) ─────────────────────────────────────────────
  if (isCapacitor) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      const base64 = await blobToBase64(pdfBlob);

      // In Documents speichern (dauerhaft, in Dateien-App sichtbar)
      let savedUri = '';
      try {
        await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Documents });
        const r = await Filesystem.getUri({ path: filename, directory: Directory.Documents });
        savedUri = r.uri;
      } catch {
        await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
        const r = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
        savedUri = r.uri;
      }

      // Share-Dialog mit der echten PDF-Datei
      try {
        const { Share } = await import('@capacitor/share');
        const { value: canShare } = await Share.canShare();
        if (canShare) {
          await Share.share({
            title: filename,
            url: savedUri,
            dialogTitle: 'PDF speichern oder teilen',
          });
        }
      } catch (shareErr: any) {
        const msg = (shareErr?.message ?? '').toLowerCase();
        if (!msg.includes('cancel') && !msg.includes('dismiss') && !msg.includes('abort')) {
          console.error('Share error:', shareErr);
        }
        // PDF ist bereits gespeichert — kein Problem
      }

      return;
    } catch (err) {
      console.error('Capacitor PDF error:', err);
    }
  }

  // ── Web: direkt herunterladen ─────────────────────────────────────────────
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
