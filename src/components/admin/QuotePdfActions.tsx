'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  getQuotePdfFileName,
  generateQuotePdfBlob,
  shareQuotePdf,
  type StudioQuotePdfData,
} from '@/src/lib/generateBillPdfBlob';

interface QuotePdfActionsProps {
  quote: StudioQuotePdfData;
  disabled?: boolean;
}

type QuoteAction = 'view' | 'download' | 'share' | null;

export function QuotePdfActions({ quote, disabled = false }: QuotePdfActionsProps) {
  const [activeAction, setActiveAction] = useState<QuoteAction>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const handleView = async () => {
    setActiveAction('view');
    try {
      const blob = await generateQuotePdfBlob(quote);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      toast.error(error instanceof Error ? `Could not open quote: ${error.message}` : 'Could not open quote.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDownload = async () => {
    setActiveAction('download');
    try {
      const blob = await generateQuotePdfBlob(quote);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getQuotePdfFileName(quote);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      toast.success('Quote PDF downloaded.');
    } catch (error) {
      toast.error(error instanceof Error ? `Could not download quote: ${error.message}` : 'Could not download quote.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleShare = async () => {
    setActiveAction('share');
    try {
      const shared = await shareQuotePdf(quote, quote.clientPhone);
      if (shared) {
        toast.success('Quote PDF is ready to share.');
      } else {
        toast.info('Quote sharing was cancelled.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? `Could not share quote: ${error.message}` : 'Could not share quote.');
    } finally {
      setActiveAction(null);
    }
  };

  const actionsDisabled = disabled || activeAction !== null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actionsDisabled}
          onClick={() => void handleView()}
          aria-label="View quote PDF"
          title="View quote PDF"
          className="h-9 px-2.5 text-xs"
        >
          {activeAction === 'view' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          View
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actionsDisabled}
          onClick={() => void handleDownload()}
          aria-label="Download quote PDF"
          title="Download quote PDF"
          className="h-9 px-2.5 text-xs"
        >
          {activeAction === 'download' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actionsDisabled}
          onClick={() => void handleShare()}
          aria-label="Share quote PDF via WhatsApp"
          title="Share quote PDF via WhatsApp"
          className="h-9 border-[#25D366]/45 px-2.5 text-xs text-emerald-300 hover:border-[#25D366]/60 hover:text-emerald-200"
        >
          {activeAction === 'share' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageCircle className="h-3.5 w-3.5" />
          )}
          WhatsApp
        </Button>
      </div>

      <Dialog
        open={Boolean(previewUrl)}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
      >
        <DialogContent className="flex h-[90dvh] w-[96vw] max-w-5xl flex-col gap-3 overflow-hidden bg-[#092E2B] p-3 text-[#E6ECEB] sm:gap-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm text-white sm:text-base">
              Quotation · {quote.packageName}
            </DialogTitle>
            <DialogDescription className="text-[#E6ECEB]/75">
              {quote.quoteNumber} · {quote.clientName}
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              title={`Quote PDF for ${quote.clientName}`}
              className="min-h-0 flex-1 rounded border border-[#C5B378]/30 bg-white"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
