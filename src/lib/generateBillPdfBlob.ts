import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StudioBill } from '@/src/types/studio';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { buildWhatsAppUrl, formatINR } from '@/src/lib/utils';
import { STUDIO_TERMS_AND_CONDITIONS } from '@/src/config/termsAndConditions';

interface BillTermItem {
  en: string;
  ta: string;
  title?: {
    en?: string;
    ta?: string;
  };
}

/**
 * Builds off-screen DOM nodes for Page 1 (Invoice & Payment Ledger) and Page 2 (Full Bilingual Terms & Conditions).
 * Uses html2canvas to capture both pages at 2x print resolution so all Tamil Unicode text, ligatures,
 * table styling, and complete terms are preserved with zero clipping or font corruption.
 */
export async function generateBillPdfBlob(bill: StudioBill): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation must be executed in a browser context.');
  }

  const termsList: BillTermItem[] =
    bill.termsAndConditions && bill.termsAndConditions.length > 0
      ? bill.termsAndConditions
      : STUDIO_TERMS_AND_CONDITIONS;

  // Create temporary off-screen container with fixed A4 aspect ratio (794px = 210mm at 96 DPI)
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';
  container.style.color = '#1e293b';
  container.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", "Latha", "Vijaya", "Nirmala UI", sans-serif';

  const excludedLabels = (bill.packageDetails?.excludedItems || []).map((e) =>
    e.label.toLowerCase()
  );

  const isServiceActive = (svc: any): boolean => {
    if (!svc) return false;
    if (svc.selected === false || svc.selected === 'false') return false;
    if (svc.active === false || svc.active === 'false') return false;
    if (svc.included === false || svc.included === 'false') return false;
    if (typeof svc.quantity === 'number' && svc.quantity <= 0) return false;
    const enText = (svc.en || svc.name || svc.key || '').toLowerCase();
    if (excludedLabels.some((ex) => ex.includes(enText) || enText.includes(ex))) {
      return false;
    }
    return true;
  };

  const rawServices =
    bill.packageDetails.includedServices && bill.packageDetails.includedServices.length > 0
      ? bill.packageDetails.includedServices
      : (bill.packageDetails.inclusions || bill.packageDetails.requiredCrew || []).map((inc) => ({
          key: inc,
          en: inc,
          ta: '',
          selected: true,
        }));

  const includedServices = rawServices.filter(isServiceActive);
  const addons = (bill.packageDetails.addons || []).filter(isServiceActive);
  const excludedItems = bill.packageDetails.excludedItems || [];
  const tierLabel = bill.packageDetails.tierLabel || 'Signature';
  const optedServices = bill.packageDetails?.optedServices || bill.optedServices || [];

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 1: OFFICIAL PAYMENT RECEIPT & INVOICE STATEMENT
  // ═══════════════════════════════════════════════════════════════════════
  const page1 = document.createElement('div');
  page1.style.width = '794px';
  page1.style.minHeight = '1120px';
  page1.style.padding = '36px 40px';
  page1.style.boxSizing = 'border-box';
  page1.style.backgroundColor = '#ffffff';
  page1.style.display = 'flex';
  page1.style.flexDirection = 'column';
  page1.style.justifyContent = 'space-between';

  page1.innerHTML = `
    <div>
      <!-- Header Banner -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #092E2B; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #072421; letter-spacing: 0.5px; font-family: serif;">GK STUDIOS</h1>
            <span style="font-size: 11px; font-weight: 700; color: #9A7B38; letter-spacing: 1px;">CREATING MEMORIES</span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; color: #334155;">
            Professional Wedding Photography & 4K Cinematography
          </p>
          <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; line-height: 1.4;">
            ${STUDIO_INFO.address}
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">
            Phone: +91 ${STUDIO_INFO.phone} • Email: ${STUDIO_INFO.email}
          </p>
        </div>

        <div style="text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 4px; min-width: 220px;">
          <div style="background: #092E2B; color: #D8C78E; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 3px; display: inline-block;">
            OFFICIAL PAYMENT RECEIPT
          </div>
          <p style="margin: 6px 0 0 0; font-size: 10px; font-weight: 700; color: #072421;">கட்டண ரசீது & விலைப்பட்டியல்</p>
          <p style="margin: 3px 0 0 0; font-family: monospace; font-size: 14px; font-weight: 800; color: #072421;">
            ${bill.billNumber}
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">
            <strong>Date:</strong> ${bill.billDate || bill.financials.paymentDate || bill.createdAt.slice(0, 10)}
          </p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8; font-family: monospace;">Ref: #${bill.bookingId.slice(0, 8)}</p>
        </div>
      </div>

      <!-- Client & Event Info 2-Column Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
        <!-- Client Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 14px;">
          <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #072421; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            Billed To / வாடிக்கையாளர் விவரம்
          </h4>
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${bill.clientName}</p>
          <p style="margin: 3px 0 0 0; font-size: 11px; color: #334155; font-family: monospace;">Phone: +91 ${bill.clientPhone}</p>
          <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
            <strong>Assigned Crew:</strong> ${bill.crewDetails?.assignedCrew || 'G Krishna + Studio Unit'}
          </p>
          <p style="margin: 3px 0 0 0; font-size: 10px; color: #059669; font-weight: 600;">
            Status: Digitally Confirmed Payment
          </p>
        </div>

        <!-- Event Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 14px;">
          <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #072421; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            Event & Ceremony / நிகழ்வு விவரம்
          </h4>
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">
            ${bill.eventDetails.eventName}
            ${
              bill.eventDetails.tamilEventName
                ? `<span style="font-size: 11px; font-weight: 600; color: #072421; background: #e2e8f0; padding: 1px 6px; border-radius: 3px; margin-left: 6px;">${bill.eventDetails.tamilEventName}</span>`
                : ''
            }
          </p>
          <p style="margin: 3px 0 0 0; font-size: 11px; color: #334155;">
            <strong>Date & Slot:</strong> ${bill.eventDetails.eventDate} ${bill.eventDetails.eventTime ? `(${bill.eventDetails.eventTime})` : ''}
          </p>
          <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
            <strong>Venue:</strong> ${bill.eventDetails.venue || 'To be updated'}
          </p>
        </div>
      </div>

      <!-- Package & Deliverables Summary -->
      <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 14px; margin-bottom: 16px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #072421; letter-spacing: 0.5px;">
              Included Services & Deliverables / சேர்க்கப்பட்ட சேவைகள்
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; background: #092E2B; color: #D8C78E; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.5px;">
              ${tierLabel} Tier
            </span>
            <span style="font-size: 13px; font-weight: 700; color: #072421; font-family: serif;">
              ${bill.packageDetails.basePackageName}
            </span>
          </div>
        </div>

        <!-- Itemized Confirmed Services (Single Source of Truth) -->
        ${
          optedServices.length > 0
            ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 10px; color: #334155;">
                ${optedServices
                  .map(
                    (svc) =>
                      `<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; line-height: 1.3; background: #ffffff; border: 1px solid #f1f5f9; padding: 4px 6px; border-radius: 3px;">
                        <div style="display: flex; align-items: flex-start; gap: 4px;">
                          <span style="color: #059669; font-weight: bold; font-size: 11px; margin-top: -1px;">✓</span>
                          <div>
                            <span style="font-weight: 700; color: #1e293b;">${svc.name}</span>
                            ${svc.tamilName ? `<span style="display: block; font-size: 8.5px; color: #64748b; font-family: 'Noto Sans Tamil', 'Latha', sans-serif;">${svc.tamilName}</span>` : ''}
                            <span style="display: block; font-size: 8.5px; color: #64748b;">
                              ${svc.quantity} ${svc.quantity > 1 ? `${svc.unitLabel}s` : svc.unitLabel} × ₹${svc.unitPrice.toLocaleString('en-IN')}
                              ${svc.durationTier ? ` • ${svc.durationTier === 'threeHours' ? '3h' : svc.durationTier === 'fullDay' ? 'Full Day' : 'Half Day'}` : ''}
                            </span>
                          </div>
                        </div>
                        <span style="font-family: monospace; font-weight: 700; color: #072421; font-size: 10.5px;">
                          ₹${svc.total.toLocaleString('en-IN')}
                        </span>
                      </div>`
                  )
                  .join('')}
              </div>`
            : `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 10px; color: #334155;">
                ${includedServices
                  .map(
                    (svc) =>
                      `<div style="display: flex; align-items: flex-start; gap: 6px; line-height: 1.3;">
                        <span style="color: #059669; font-weight: bold; font-size: 11px; margin-top: -1px;">✓</span>
                        <div>
                          <span style="font-weight: 600; color: #1e293b;">${svc.en}</span>
                          ${
                            svc.ta
                              ? `<span style="display: block; font-size: 9px; color: #64748b; font-family: 'Noto Sans Tamil', 'Latha', sans-serif;">${svc.ta}</span>`
                              : ''
                          }
                        </div>
                      </div>`
                  )
                  .join('')}
              </div>`
        }

        ${
          bill.packageDetails.deliverables && Object.keys(bill.packageDetails.deliverables).length > 0
            ? `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dotted #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9.5px; color: #475569;">
                ${Object.entries(bill.packageDetails.deliverables)
                  .map(
                    ([cat, text]) =>
                      `<div><strong style="color: #072421;">${cat}:</strong> ${text}</div>`
                  )
                  .join('')}
              </div>`
            : ''
        }

        ${
          addons.length > 0 || excludedItems.length > 0
            ? `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 9.5px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                ${
                  addons.length > 0
                    ? `<div><strong style="color: #072421;">Upgrades Added:</strong> ${addons.map((a) => `<span style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 3px; padding: 1px 6px; color: #065f46; margin-left: 2px;">+ ${a.label} (+₹${Number(a.priceDelta).toLocaleString('en-IN')})</span>`).join('')}</div>`
                    : ''
                }
                ${
                  excludedItems.length > 0
                    ? `<div><strong style="color: #991b1b;">Items Excluded:</strong> ${excludedItems.map((e) => `<span style="display: inline-block; background: #fef2f2; border: 1px solid #fecaca; border-radius: 3px; padding: 1px 6px; color: #991b1b; margin-left: 2px;">- ${e.label} (-₹${Math.abs(Number(e.priceDelta)).toLocaleString('en-IN')})</span>`).join('')}</div>`
                    : ''
                }
              </div>`
            : ''
        }
      </div>

      <!-- Financial Transaction Ledger Table -->
      <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <thead>
            <tr style="background: #092E2B; color: #ffffff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 8px 12px;">Description / விவரம்</th>
              <th style="padding: 8px 12px; text-align: center;">Mode</th>
              <th style="padding: 8px 12px; text-align: center;">Stage</th>
              <th style="padding: 8px 12px; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 12px; font-weight: 600; color: #1e293b;">
                Total Agreed Package Investment
                <span style="display: block; font-size: 9px; color: #64748b; font-weight: 400;">மொத்தத் தொகுப்புக் கட்டணம் (Base + Upgrades)</span>
              </td>
              <td style="padding: 9px 12px; text-align: center; color: #64748b;">—</td>
              <td style="padding: 9px 12px; text-align: center; color: #64748b;">Total Contract</td>
              <td style="padding: 9px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
                ${formatINR(bill.financials.totalPackageAmount)}
              </td>
            </tr>

            <!-- Paid Now Row -->
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ecfdf5; font-weight: 700;">
              <td style="padding: 9px 12px; color: #065f46;">
                Payment Received Now (This Receipt)
                <span style="display: block; font-size: 9px; color: #047857; font-weight: 400;">
                  இப்போது செலுத்திய தொகை · Ref: #${bill.paymentId.slice(0, 8)}
                </span>
              </td>
              <td style="padding: 9px 12px; text-align: center; color: #065f46; font-family: monospace; font-size: 10px;">
                ${bill.financials.paymentMode}
              </td>
              <td style="padding: 9px 12px; text-align: center; color: #065f46; font-size: 10px;">
                ${bill.financials.paymentStage}
              </td>
              <td style="padding: 9px 12px; text-align: right; font-family: monospace; font-size: 13px; font-weight: 800; color: #047857;">
                ${formatINR(bill.financials.amountPaidNow)}
              </td>
            </tr>

            <!-- Total Paid to Date -->
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 9px 12px; color: #334155;">
                Cumulative Payments to Date
                <span style="display: block; font-size: 9px; color: #64748b;">இதுவரை செலுத்திய மொத்தத் தொகை</span>
              </td>
              <td style="padding: 9px 12px; text-align: center; color: #64748b;">—</td>
              <td style="padding: 9px 12px; text-align: center; color: #64748b; font-size: 10px;">Cumulative</td>
              <td style="padding: 9px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #1e293b;">
                ${formatINR(bill.financials.totalPaidToDate)}
              </td>
            </tr>

            <!-- Balance Due -->
            <tr style="background: #fffbeb; font-weight: 700; border-top: 2px solid #cbd5e1;">
              <td style="padding: 10px 12px; color: #78350f;">
                Remaining Balance Due
                <span style="display: block; font-size: 9px; color: #92400e; font-weight: 400;">
                  மீதமுள்ள நிலுவைத் தொகை (To be cleared before final album/video handover)
                </span>
              </td>
              <td style="padding: 10px 12px; text-align: center; color: #78350f;">—</td>
              <td style="padding: 10px 12px; text-align: center; color: #78350f; font-size: 10px;">Due on Delivery</td>
              <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-size: 14px; font-weight: 900; color: #78350f;">
                ${formatINR(bill.financials.balanceDue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Studio Seal & Signatory Row -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px 0; border-top: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">
            OFFICIAL STUDIO SEAL / முத்திரை
          </span>
          <div style="margin-top: 4px; height: 44px; width: 140px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-family: serif; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px;">
            GK STUDIOS PANRUTI
          </div>
          <p style="margin: 4px 0 0 0; font-size: 9px; color: #94a3b8;">
            Computer-Generated Digitally Verified Receipt
          </p>
        </div>

        <div style="text-align: right;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block;">
            FOR GK STUDIOS / உரிமையாளர் கையொப்பம்
          </span>
          <div style="height: 38px; display: flex; align-items: flex-end; justify-content: flex-end;">
            <span style="font-family: serif; font-style: italic; font-weight: bold; font-size: 15px; color: #072421; border-bottom: 1px solid #94a3b8; padding-bottom: 2px;">
              G. Krishna
            </span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 600; color: #334155;">
            Authorized Signatory & Founder
          </p>
        </div>
      </div>
    </div>

    <!-- Page 1 Bottom Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b;">
      <span>GK STUDIOS • Panruti, Tamil Nadu • Ph: +91 74185 43123</span>
      <span style="font-weight: 600; color: #072421;">Page 1 of 2 • Official Payment Receipt</span>
    </div>
  `;

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 2: COMPLETE BILINGUAL TERMS & CONDITIONS (ALL 10 CLAUSES)
  // ═══════════════════════════════════════════════════════════════════════
  const page2 = document.createElement('div');
  page2.style.width = '794px';
  page2.style.minHeight = '1120px';
  page2.style.padding = '36px 40px';
  page2.style.boxSizing = 'border-box';
  page2.style.backgroundColor = '#ffffff';
  page2.style.display = 'flex';
  page2.style.flexDirection = 'column';
  page2.style.justifyContent = 'space-between';

  page2.innerHTML = `
    <div>
      <!-- Page 2 Header Banner -->
      <div style="border-bottom: 2px solid #092E2B; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #072421; letter-spacing: 0.5px; font-family: serif;">
            TERMS & CONDITIONS / விதிமுறைகள் மற்றும் நிபந்தனைகள்
          </h2>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
            GK Studios Standard Client Agreement • Official Service Guidelines (10 Clauses)
          </p>
        </div>
        <div style="text-align: right;">
          <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #072421; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 3px;">
            Bill #${bill.billNumber}
          </span>
        </div>
      </div>

      <!-- Full 10 Bilingual Clauses Grid -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${termsList
          .map((term: BillTermItem, idx: number) => {
            const titleEn = term.title?.en ? ` — ${term.title.en}` : '';
            const titleTa = term.title?.ta ? ` (${term.title.ta})` : '';

            return `
              <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                <p style="margin: 0; font-size: 10px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                  ${idx + 1}. ${term.en}${titleEn}
                </p>
                <p style="margin: 2px 0 0 0; font-size: 9.5px; color: #475569; line-height: 1.45;">
                  ${term.ta}${titleTa}
                </p>
              </div>
            `;
          })
          .join('')}
      </div>

      <!-- Agreement & Acceptance Callout -->
      <div style="margin-top: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #092E2B; border-radius: 4px; padding: 10px 14px;">
        <p style="margin: 0; font-size: 10px; font-weight: 700; color: #072421;">
          Client Acceptance & Agreement / வாடிக்கையாளர் ஒப்புதல்:
        </p>
        <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #334155; line-height: 1.4;">
          By confirming your booking and payment, you agree that you have read, understood and accepted all the above terms and conditions.
        </p>
        <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b; line-height: 1.4;">
          முன்பதிவையும் கட்டணத்தையும் உறுதிப்படுத்துவதன் மூலம், மேலே உள்ள அனைத்து விதிமுறைகளையும் படித்து, புரிந்து, ஏற்றுக்கொண்டதாக ஒப்புக்கொள்கிறீர்கள்.
        </p>
      </div>
    </div>

    <!-- Page 2 Bottom Footer & Guarantee -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b;">
      <span>GK STUDIOS PANRUTI • உங்கள் நினைவுகள், எங்கள் பொறுப்பு. • Your Memories, Our Responsibility.</span>
      <span style="font-weight: 600; color: #072421;">Page 2 of 2 • Studio Terms & Conditions</span>
    </div>
  `;

  container.appendChild(page1);
  container.appendChild(page2);
  document.body.appendChild(container);

  try {
    // Render Page 1 to Canvas at 2x resolution
    const canvas1 = await html2canvas(page1, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Render Page 2 to Canvas at 2x resolution
    const canvas2 = await html2canvas(page2, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Page 1: Official Payment Receipt
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.96);
    doc.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

    // Page 2: Terms & Conditions
    doc.addPage();
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.96);
    doc.addImage(imgData2, 'JPEG', 0, 0, 210, 297);

    return doc.output('blob');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
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
    `📍 Venue: ${bill.eventDetails.venue || 'To be updated'}`,
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
