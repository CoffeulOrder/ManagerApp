import { useCallback, useState } from 'react';

import { PinModal } from '@/components/pin-modal';

// Native platforms can't present a modal while another one is still dismissing.
export const MODAL_SWAP_DELAY = 300;

export function usePinGate() {
  const [pending, setPending] = useState<{ run: () => void; title?: string; onCancel?: () => void } | null>(null);

  // onCancel runs when the PIN prompt is dismissed (e.g. to bring back the screen the prompt interrupted).
  const requirePin = useCallback(
    (run: () => void, title?: string, onCancel?: () => void) => setPending({ run, title, onCancel }),
    []
  );

  const pinModal = (
    <PinModal
      visible={pending !== null}
      title={pending?.title}
      onCancel={() => {
        const cancel = pending?.onCancel;
        setPending(null);
        if (cancel) setTimeout(cancel, MODAL_SWAP_DELAY);
      }}
      onSuccess={() => {
        const run = pending?.run;
        setPending(null);
        if (run) setTimeout(run, MODAL_SWAP_DELAY);
      }}
    />
  );

  return { requirePin, pinModal };
}
