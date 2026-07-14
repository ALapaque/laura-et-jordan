'use client';

import { createContext, useContext } from 'react';

export interface InvitationContextValue {
  introDone: boolean;
  musicOn: boolean;
  hasMusic: boolean;
  submitted: boolean;
  toggleMusic: () => void;
  replayIntro: () => void;
  scrollToRsvp: () => void;
  setSubmitted: (value: boolean) => void;
}

export const InvitationContext = createContext<InvitationContextValue | null>(null);

export function useInvitation(): InvitationContextValue {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error('useInvitation doit être utilisé dans <InvitationProvider>');
  return ctx;
}
