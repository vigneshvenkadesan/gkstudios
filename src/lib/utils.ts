import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OptedServiceSnapshot, PaymentRecord, StudioBill } from '@/src/types/studio';

export interface BillDisplayDeliverable {
  category: string;
  text: string;
  isComplimentary: boolean;
}

export interface BillPaymentEntry {
  id: string;
  date: string;
  label: string;
  amount: number;
  method: string;
}

const ALBUM_PHOTO_SELECTION_NOTE =
  /\bmust\s+select\s+([\d,]+)\s*(?:to|[-–—])\s*([\d,]+)\s+photos?\s+for\s+albums?\b[.!]?/i;
const ALBUM_PHOTO_SELECTION_NOTE_GLOBAL =
  /\bmust\s+select\s+([\d,]+)\s*(?:to|[-–—])\s*([\d,]+)\s+photos?\s+for\s+albums?\b[.!]?/gi;

export function getAlbumPhotoSelectionNote(
  deliverables: Record<string, string | undefined> | string[] | undefined
): string | null {
  const values = Array.isArray(deliverables)
    ? deliverables
    : Object.values(deliverables || {});

  for (const value of values) {
    if (!value) continue;
    const match = value.match(ALBUM_PHOTO_SELECTION_NOTE);
    if (match) return `Must select ${match[1]} to ${match[2]} photos`;
  }

  return null;
}

export function removeAlbumPhotoSelectionNote(text: string): string {
  return text
    .replace(ALBUM_PHOTO_SELECTION_NOTE_GLOBAL, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,+;])\s*(?:[,+;]\s*)+/g, '$1 ')
    .replace(/^[,+;]\s*|[,+;]\s*$/g, '')
    .trim();
}

export function getBillDisplayDeliverables(
  deliverables: Record<string, string> | undefined
): BillDisplayDeliverable[] {
  const hiddenCategories = new Set(['albums & photo frames', 'digital deliverables']);
  return Object.entries(deliverables || {}).filter(
    ([category]) => !hiddenCategories.has(category.trim().toLowerCase())
  ).flatMap(([category, value]) =>
    value.split(',').map(removeAlbumPhotoSelectionNote).filter(Boolean).map((text) => ({
      category: category.trim().toLowerCase() === 'deliverables' ? '' : category,
      text,
      isComplimentary: /^complementary/i.test(text),
    }))
  );
}

export function getBillServiceRateTotal(services: OptedServiceSnapshot[]): number {
  return services.reduce((total, service) => total + service.unitPrice * service.quantity, 0);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeWithAmPm(value?: string): string {
  const time = value?.trim() || '';
  if (!time) return '';

  return time.replace(
    /(^|[^\d])(\d{1,2}):([0-5]\d)(?:\s*(AM|PM))?(?=$|[^\d])/gi,
    (match, prefix: string, rawHour: string, minutes: string, meridiem?: string) => {
      const hour = Number(rawHour);
      if (meridiem) {
        if (hour < 1 || hour > 12) return match;
        return `${prefix}${hour}:${minutes} ${meridiem.toUpperCase()}`;
      }
      if (hour > 23) return match;
      const suffix = hour < 12 ? 'AM' : 'PM';
      return `${prefix}${hour % 12 || 12}:${minutes} ${suffix}`;
    }
  );
}

export function getBillPaymentHistory(bill: StudioBill): BillPaymentEntry[] {
  const payments: BillPaymentEntry[] =
    bill.paymentHistory && bill.paymentHistory.length > 0
      ? bill.paymentHistory
      : [
          {
            id: bill.paymentId,
            date: bill.financials.paymentDate,
            label: bill.financials.paymentStage,
            amount: bill.financials.amountPaidNow,
            method: bill.financials.paymentMode,
          },
        ];

  return payments
    .map((payment) => ({
      id: payment.id,
      date: payment.date || '',
      label: payment.label || 'Payment',
      amount: Number(payment.amount) || 0,
      method: payment.method || 'UPI',
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
