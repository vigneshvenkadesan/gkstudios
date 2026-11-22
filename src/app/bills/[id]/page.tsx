import React from 'react';
import { notFound } from 'next/navigation';
import { getBillByIdOnServer } from '@/src/server/studioStore';
import { BilingualBillClientView } from './BilingualBillClientView';

interface BillPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BillPageProps) {
  const { id } = await params;
  const bill = await getBillByIdOnServer(id);
  if (!bill) {
    return { title: 'Bill Not Found | GK STUDIOS' };
  }
  return {
    title: `Invoice #${bill.billNumber} | GK STUDIOS`,
    description: `Official bilingual invoice & payment receipt for ${bill.clientName} (${bill.eventDetails.eventName})`,
  };
}

export default async function BillPage({ params }: BillPageProps) {
  const { id } = await params;
  const bill = await getBillByIdOnServer(id);

  if (!bill) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#072421] py-6 sm:py-12 px-2 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <BilingualBillClientView bill={bill} />
      </div>
    </div>
  );
}
