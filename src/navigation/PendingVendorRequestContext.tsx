import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { Event } from '../db/types';

interface PendingVendorRequestValue {
  /** The event a visitor tapped "Request Tables" on before they had a vendor account - set so the Vendor tab can hand them back to it once they're signed in. */
  pendingRequestEvent: Event | null;
  setPendingRequestEvent: (event: Event | null) => void;
}

const PendingVendorRequestContext = createContext<PendingVendorRequestValue | undefined>(undefined);

export function PendingVendorRequestProvider({ children }: { children: ReactNode }) {
  const [pendingRequestEvent, setPendingRequestEvent] = useState<Event | null>(null);
  const value = useMemo(
    () => ({ pendingRequestEvent, setPendingRequestEvent }),
    [pendingRequestEvent]
  );
  return (
    <PendingVendorRequestContext.Provider value={value}>
      {children}
    </PendingVendorRequestContext.Provider>
  );
}

export function usePendingVendorRequest(): PendingVendorRequestValue {
  const ctx = useContext(PendingVendorRequestContext);
  if (!ctx) {
    throw new Error('usePendingVendorRequest must be used within a PendingVendorRequestProvider');
  }
  return ctx;
}
