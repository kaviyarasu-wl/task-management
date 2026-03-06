import { useState } from 'react';
import { Copy, Download, Check, ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { toast } from '@/shared/stores/toastStore';

interface RecoveryCodesProps {
  codes: string[];
  onConfirm: () => void;
}

export function RecoveryCodes({ codes, onConfirm }: RecoveryCodesProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setHasCopied(true);
      toast({ type: 'success', title: 'Recovery codes copied to clipboard' });
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast({ type: 'error', title: 'Failed to copy codes' });
    }
  };

  const handleDownload = () => {
    const content = [
      'MFA Recovery Codes',
      '==================',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Each code can only be used once.',
      'Store these in a safe place.',
      '',
      ...codes.map((code, i) => `${i + 1}. ${code}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mfa-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
        <div className="text-sm text-foreground">
          <p className="font-medium">Save these recovery codes</p>
          <p className="mt-1 text-muted-foreground">
            Each code can only be used once. Store them in a safe place. If you lose
            access to your authenticator app, you can use these codes to sign in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm">
        {codes.map((code) => (
          <div key={code} className="rounded px-2 py-1 text-foreground">
            {code}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={handleCopyAll}>
          {hasCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {hasCopied ? 'Copied' : 'Copy All'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      <Button className="w-full" onClick={onConfirm}>
        I have saved these codes
      </Button>
    </div>
  );
}
