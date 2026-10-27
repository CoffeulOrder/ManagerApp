import { useCallback, useState } from 'react';

import { PinModal } from '@/components/pin-modal';

// Native platforms can't present a modal while another one is still dismissing.
export const MODAL_SWAP_DELAY = 300;

export function usePinGate() {
  const [pending, setPending] = useState<{ run: () => void; title?: string } | null>(null);

  const requirePin = useCallback((run: () => void, title?: string) => setPending({ run, title }), []);

  const pinModal = (
    <PinModal
      visible={pending !== null}
      title={pending?.title}
      onCancel={() => setPending(null)}
      onSuccess={() => {
        const run = pending?.run;
        setPending(null);
        if (run) setTimeout(run, MODAL_SWAP_DELAY);
      }}
    />
  );

  return { requirePin, pinModal };
}
