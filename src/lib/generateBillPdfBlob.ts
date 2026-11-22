import { jsPDF } from 'jspdf';
import { StudioBill } from '@/src/types/studio';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { buildWhatsAppUrl, formatINR } from '@/src/lib/utils';

export async function generateBillPdfBlob(bill: StudioBill): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  // ─── Luxury Studio Header ───
  doc.setFillColor(7, 36, 33); // #072421
  doc.rect(margin, y, pageWidth - margin * 2, 28, 'F');

  doc.setTextColor(216, 199, 142); // #D8C78E
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GK STUDIOS', margin + 6, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 236, 235);
  doc.text('CREATING MEMORIES • PROFESSIONAL PHOTOGRAPHY & CINEMATOGRAPHY', margin + 6, y + 13);
  doc.text(
    `${STUDIO_INFO.address}`,
    margin + 6,
    y + 18
  );
  doc.text(
    `Phone: +91 ${STUDIO_INFO.phone} | Email: ${STUDIO_INFO.email}`,
    margin + 6,
    y + 23
  );

  // Bill Label Box on Right
  doc.setFillColor(14, 66, 62); // #0E423E
  doc.rect(pageWidth - margin - 52, y + 4, 46, 20, 'F');
  doc.setTextColor(216, 199, 142);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL RECEIPT', pageWidth - margin - 49, y + 9);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(bill.billNumber, pageWidth - margin - 49, y + 15);
  doc.setFontSize(7);
  doc.setTextColor(216, 199, 142);
  doc.text(`Date: ${bill.billDate || bill.financials.paymentDate || bill.createdAt.slice(0, 10)}`, pageWidth - margin - 49, y + 20);

  y += 34;

  // ─── Client & Event Details Grid ───
  doc.setDrawColor(197, 179, 120);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 246, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 42, 'FD');

  // Left Column: Client Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(7, 36, 33);
  doc.text('BILLED TO (CLIENT DETAILS):', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`Client Name: ${bill.clientName}`, margin + 4, y + 13);
  doc.text(`Phone: ${bill.clientPhone}`, margin + 4, y + 19);
  doc.text(`Booking Ref: #${bill.bookingId.slice(0, 10).toUpperCase()}`, margin + 4, y + 25);
  doc.text(`Status: Official Paid Receipt`, margin + 4, y + 31);
  doc.text(`Generated At: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, margin + 4, y + 37);

  // Right Column: Event Details
  const rightColX = pageWidth / 2 + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(7, 36, 33);
  doc.text('EVENT & CEREMONY DETAILS:', rightColX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Event: ${bill.eventDetails.eventName} ${bill.eventDetails.tamilEventName ? `(${bill.eventDetails.tamilEventName})` : ''}`,
    rightColX,
    y + 13
  );
  doc.text(`Event Date: ${bill.eventDetails.eventDate}`, rightColX, y + 19);
  doc.text(`Event Timing / Slot: ${bill.eventDetails.eventTime || '06:00 AM'}`, rightColX, y + 25);
  doc.text(`Venue: ${bill.eventDetails.venue || 'To be updated'}`, rightColX, y + 31);
  doc.text(`Assigned Crew: ${bill.crewDetails?.assignedCrew || 'G Krishna + Studio Unit'}`, rightColX, y + 37);

  y += 48;

  // ─── Package & Service Summary ───
  doc.setFillColor(7, 36, 33);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setTextColor(216, 199, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PACKAGE & DELIVERABLE SPECIFICATIONS', margin + 4, y + 4.8);

  y += 7;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, pageWidth - margin * 2, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text(`Base Package: ${bill.packageDetails.basePackageName}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  const inc = bill.packageDetails.inclusions || bill.packageDetails.requiredCrew || [];
  const inclusionsText = `Inclusions: ${inc.length > 0 ? inc.join(' • ') : 'Standard Complete Studio Coverage'}`;
  doc.text(doc.splitTextToSize(inclusionsText, pageWidth - margin * 2 - 8), margin + 4, y + 10);

  const addons = bill.packageDetails.addons || [];
  if (addons.length > 0) {
    const addonsText = `Custom Add-ons: ${addons.map((a) => `${a.label} (+₹${a.priceDelta})`).join(', ')}`;
    doc.text(doc.splitTextToSize(addonsText, pageWidth - margin * 2 - 8), margin + 4, y + 15);
  }

  y += 24;

  // ─── Financial Ledger Table ───
  doc.setFillColor(7, 36, 33);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setTextColor(216, 199, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAYMENT TRANSACTION & BALANCE STATEMENT', margin + 4, y + 4.8);

  y += 7;

  // Table Rows
  const tableData: [string, string, string][] = [
    ['Total Agreed Package Amount', 'Base plan + confirmed customized upgrades', formatINR(bill.financials.totalPackageAmount)],
    [`Payment Received Now (${bill.financials.paymentStage})`, `Mode: ${bill.financials.paymentMode} · Ref: ${bill.paymentId.slice(0, 8)}`, formatINR(bill.financials.amountPaidNow)],
    ['Total Paid to Date', 'Cumulative confirmed receipts to date', formatINR(bill.financials.totalPaidToDate)],
    ['Remaining Balance Due', 'To be cleared prior to final album & video handover', formatINR(bill.financials.balanceDue)],
  ];

  tableData.forEach(([label, desc, amt], idx) => {
    const isHighlight = idx === 1; // Payment paid now
    const isBalance = idx === 3;
    const rowH = 9;

    doc.setFillColor(
      isHighlight ? 238 : isBalance ? 245 : idx % 2 === 0 ? 255 : 250,
      isHighlight ? 247 : isBalance ? 240 : idx % 2 === 0 ? 255 : 250,
      isHighlight ? 238 : isBalance ? 230 : idx % 2 === 0 ? 255 : 250
    );
    doc.rect(margin, y, pageWidth - margin * 2, rowH, 'FD');

    doc.setFont('helvetica', isHighlight || isBalance ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(
      isHighlight ? 14 : isBalance ? 180 : 30,
      isHighlight ? 80 : isBalance ? 40 : 30,
      isHighlight ? 40 : isBalance ? 30 : 30
    );
    doc.text(label, margin + 4, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(90, 90, 90);
    doc.text(desc, margin + 4, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(
      isHighlight ? 14 : isBalance ? 180 : 30,
      isHighlight ? 80 : isBalance ? 40 : 30,
      isHighlight ? 40 : isBalance ? 30 : 30
    );
    doc.text(amt, pageWidth - margin - 4, y + 5.5, { align: 'right' });

    y += rowH;
  });

  y += 6;

  // ─── Signatory & Stamp ───
  const signBoxW = 70;
  const signBoxX = pageWidth - margin - signBoxW;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(252, 252, 252);
  doc.rect(signBoxX, y, signBoxW, 26, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(7, 36, 33);
  doc.text('FOR GK STUDIOS (PANRUTI)', signBoxX + 4, y + 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('G. Krishna', signBoxX + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(60, 60, 60);
  doc.text('Authorized Signatory & Founder', signBoxX + 4, y + 19);
  doc.text('Digitally Verified Payment Record', signBoxX + 4, y + 23);

  // Left Note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(7, 36, 33);
  doc.text('OFFICIAL MEMORY GUARANTEE:', margin, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(70, 70, 70);
  const noteLines = [
    '• Thank you for placing your trust in GK Studios for your celebration.',
    '• All unedited photos soft-copy provided on pen drive / cloud within 15 working days.',
    '• Printed album preview provided digitally prior to final non-tearable lay-flat printing.',
    '• For queries, reach G Krishna directly at +91 74185 43123.',
  ];
  noteLines.forEach((l, i) => {
    doc.text(l, margin, y + 12 + i * 4);
  });

  y += 30;

  // ─── Terms & Conditions Header ───
  doc.setFillColor(240, 238, 230);
  doc.rect(margin, y, pageWidth - margin * 2, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(7, 36, 33);
  doc.text('STUDIO TERMS & CONDITIONS / விதிமுறைகள் & நிபந்தனைகள் (SUMMARY)', margin + 2, y + 3.8);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(70, 70, 70);

  const terms = [
    '1. Payment Terms: Advance required to reserve crew. Balance cleared upon final video/album approval prior to physical handover.',
    '2. 120-Day Collection Period: Albums and USB media must be collected within 120 days from delivery notification.',
    '3. Photo Selection: Clients must select photos within 30 days of receiving soft copies to ensure timely album layout processing.',
    '4. Additional Album Sheets: Extra album sheets requested beyond package inclusions are billed at standard studio rates (₹300/sheet).',
    '5. Post-Delivery Liability: Studio maintains dual local archival backup for 90 days after delivery; client is advised to back up media.',
  ];

  terms.forEach((term) => {
    if (y < 285) {
      doc.text(doc.splitTextToSize(term, pageWidth - margin * 2), margin, y);
      y += 4;
    }
  });

  return doc.output('blob');
}

export async function downloadBillPdf(bill: StudioBill): Promise<void> {
  const blob = await generateBillPdfBlob(bill);
  const fileName = `${bill.billNumber}-${bill.clientName.replace(/\s+/g, '_')}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareBillPdfWhatsApp(bill: StudioBill): Promise<void> {
  const blob = await generateBillPdfBlob(bill);
  const fileName = `${bill.billNumber}-${bill.clientName.replace(/\s+/g, '_')}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const messageLines = [
    `Vanakkam ${bill.clientName}! 📸`,
    `Here is your official payment receipt from GK STUDIOS:`,
    ``,
    `🧾 Bill Number: ${bill.billNumber}`,
    `✨ Event: ${bill.eventDetails.eventName}${
      bill.eventDetails.tamilEventName ? ` (${bill.eventDetails.tamilEventName})` : ''
    }`,
    `📅 Event Date & Timing: ${bill.eventDetails.eventDate} at ${bill.eventDetails.eventTime || '06:00 AM'}`,
    `📍 Venue: ${bill.eventDetails.venue}`,
    `📦 Package: ${bill.packageDetails.basePackageName}`,
    ``,
    `💵 Amount Paid Now: ${formatINR(bill.financials.amountPaidNow)} (${bill.financials.paymentMode} · ${bill.financials.paymentStage})`,
    `📊 Total Paid to Date: ${formatINR(bill.financials.totalPaidToDate)} of ${formatINR(bill.financials.totalPackageAmount)}`,
    `⚖️ Balance Due: ${formatINR(bill.financials.balanceDue)}`,
    ``,
    `View / Download your official bilingual bill online:`,
    `${typeof window !== 'undefined' ? window.location.origin : ''}/bills/${bill.billNumber}`,
    ``,
    `Thank you for choosing GK STUDIOS!`,
    `Your Memories, Our Responsibility. 🌿`,
  ];
  const text = messageLines.join('\n');

  // Check if Web Share API with files is supported
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `GK Studios Bill #${bill.billNumber} - ${bill.clientName}`,
        text: text,
      });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }
  }

  // Fallback for Desktop/Non-share browsers:
  // Automatically download the PDF file to their device
  await downloadBillPdf(bill);

  // AND open WhatsApp with the message text + attachment reminder
  const targetPhone = bill.clientPhone.replace(/[^0-9]/g, '') || STUDIO_INFO.phone;
  const whatsappUrl = buildWhatsAppUrl(
    targetPhone,
    text + `\n\n[📎 Official PDF Bill downloaded to your device - attach it to this chat]`
  );
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}
