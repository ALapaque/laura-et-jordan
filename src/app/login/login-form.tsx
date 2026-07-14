'use client';

import { useActionState } from 'react';
import { signIn, type LoginState } from './actions';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState | null, FormData>(signIn, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1.5 block font-body text-[11px] uppercase tracking-[0.14em] text-olive">
          Email
        </label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-body text-[11px] uppercase tracking-[0.14em] text-olive">
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
        />
      </div>
      {state?.error && (
        <p className="font-body text-[14px] text-[#9a3b2e]" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg border-none bg-olive px-5 py-3 font-body text-[13px] uppercase tracking-[0.14em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
      >
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
