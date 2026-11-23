import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PaymentRecord, StudioBill } from '@/src/types/studio';

export interface BillPaymentEntry {
  id: string;
  date: string;
  label: string;
  amount: number;
  method: string;
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
