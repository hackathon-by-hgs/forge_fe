'use client';

import { useState } from 'react';
import { IconCheck } from '@forge/ui/icons';
import type { VirtualAccount } from '../lib/employerOverview';

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard access may be denied — fall back silently
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-outline bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className="truncate font-mono text-sm text-neutral-900" data-numeric>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-outline px-2 text-[11px] font-medium text-neutral-700 hover:bg-surface-container-high"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? (
          <>
            <IconCheck className="!h-3 !w-3" /> Copied
          </>
        ) : (
          'Copy'
        )}
      </button>
    </div>
  );
}

export function NubanFundingBlock({
  virtualAccount,
}: {
  virtualAccount: VirtualAccount | null | undefined;
}) {
  if (!virtualAccount) {
    return (
      <div className="rounded-lg border border-dashed border-outline bg-surface-container-high p-3">
        <p className="text-xs font-medium text-neutral-700">Fund your wallet</p>
        <p className="mt-1 text-xs text-neutral-500">
          Your dedicated NUBAN is being provisioned — refresh in a minute.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-outline bg-surface-container-low p-3">
      <p className="text-xs font-medium text-neutral-700">Fund your wallet</p>
      <p className="mt-1 text-xs text-neutral-500">
        Transfer NGN to the account below from any Nigerian bank. Funds arrive in 1–3 minutes.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <CopyField label="Account name" value={virtualAccount.accountName} />
        <div className="grid grid-cols-2 gap-2">
          <CopyField label="Account number" value={virtualAccount.number} />
          <CopyField label="Bank code" value={virtualAccount.bankCode} />
        </div>
      </div>
    </div>
  );
}
