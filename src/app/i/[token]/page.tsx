import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationProvider } from '@/components/invitation/invitation-provider';
import { RsvpForm } from '@/components/invitation/rsvp-form';
import { ImageSlot } from '@/components/ui/image-slot';
import { MotifBackground } from '@/components/ui/motif-background';
import { ScallopedPanel } from '@/components/ui/scalloped-panel';
import { withDbRetry } from '@/db';
import { daysUntil, heroDate, momentLocation, momentTime } from '@/lib/format';
import { getDetailCards, getInvitationByToken } from '@/lib/queries';
import type { DetailCard, Moment, MomentAsset, Wedding } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; preview?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const invitation = await withDbRetry(() => getInvitationByToken(token));
  if (!invitation) return { title: 'Invitation' };
  const { wedding, parcours } = invitation;
  const description = (parcours.introOverride ?? wedding.welcomeText) || 'Vous êtes invités.';
  return {
    title: wedding.coupleNames,
    description,
    openGraph: { title: `${wedding.coupleNames} — Invitation`, description, type: 'website' },
    robots: { index: false, follow: false },
  };
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const preview = sp.preview === '1';
  const locale = sp.lang === 'nl' ? 'nl' : 'fr';

  const [invitation, detailCards] = await withDbRetry(() =>
    Promise.all([getInvitationByToken(token), getDetailCards()]),
  );
  if (!invitation) notFound();

  const { wedding, parcours, moments } = invitation;
  const welcome = (parcours.introOverride ?? wedding.welcomeText) || '';
  const countdown = daysUntil(wedding.eventDate);

  return (
    <InvitationProvider preview={preview}>
      {/* Fond crème uni sur tout le site ; la toile de Jouy ne vit QUE dans le hero. */}
      <main className="relative min-h-screen bg-bg">
        <HeroSection wedding={wedding} countdown={countdown} />

        <div className="mx-auto max-w-[540px] pb-16">
          {/* Mot d'accueil */}
          <section data-rev="init" className="px-8 py-[70px] text-center">
            <span className="font-body text-[12px] uppercase tracking-[0.34em] text-sage">
              Mot d'accueil
            </span>
            <p className="mx-auto mt-6 max-w-[420px] font-body text-[22px] leading-[1.7] text-ink">
              {welcome}
            </p>
            <div className="mx-auto mt-8 h-[9px] w-[9px] rotate-45 bg-gold" />
          </section>

          <ProgrammeSection moments={moments} />
          <DetailsSection cards={detailCards} />
          <GallerySection />

          {/* RSVP — carte crème simple */}
          <section
            id="rsvp-anchor"
            data-rev="init"
            className="mx-5 mt-6 rounded-2xl bg-panel px-6 py-[46px] shadow-[0_10px_34px_rgba(64,57,42,0.09)]"
            style={{ scrollMarginTop: 80 }}
          >
            <div className="mb-8 text-center">
              <span className="font-body text-[12px] uppercase tracking-[0.34em] text-sage">
                Réponse
              </span>
              <h2 className="mt-2 font-display text-[48px] leading-none text-ink">
                Serez-vous des nôtres ?
              </h2>
            </div>
            <RsvpForm
              token={parcours.token}
              moments={moments}
              rsvpFields={parcours.rsvpFields}
              deadline={wedding.rsvpDeadline}
              locale={locale}
            />
            <p className="mt-8 text-center font-body text-[11px] leading-relaxed text-muted/80">
              Vos informations servent uniquement à l'organisation du mariage. Aucun suivi tiers ;
              données supprimables sur simple demande.
            </p>
          </section>

          {/* Footer */}
          <footer data-rev="init" className="px-6 pb-4 pt-14 text-center">
            <span className="font-display text-[42px] text-ink">
              Laura <span className="font-accent text-[0.55em] text-gold">&amp;</span> Jordan
            </span>
            <div className="mt-2.5 font-body text-[10px] uppercase tracking-[0.24em] text-sage">
              Avec toute notre affection
            </div>
          </footer>
        </div>
      </main>
    </InvitationProvider>
  );
}

/** Hero « faire-part » : c'est LE seul endroit avec la toile de Jouy + la carte festonnée. */
function HeroSection({ wedding, countdown }: { wedding: Wedding; countdown: number | null }) {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-5 py-20">
      <MotifBackground size="560px" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(242,237,224,0.35) 0%, rgba(242,237,224,0.72) 78%)',
        }}
      />

      <ScallopedPanel
        scallop={30}
        className="relative z-[2] w-full max-w-[380px]"
        style={{ animation: 'jlFadeUp 1s ease both' }}
      >
        <div className="flex flex-col items-center gap-6 px-9 py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="font-body text-[13px] font-medium uppercase tracking-[0.4em] text-ink">
              Invitation mariage
            </span>
            <span className="h-px w-[54px] bg-[rgba(64,57,42,0.3)]" />
          </div>

          <h1 className="m-0 font-display text-[clamp(58px,16vw,92px)] leading-[0.92] text-ink">
            Laura
            <span className="font-accent my-1 block text-[0.5em] text-gold">&amp;</span>
            Jordan
          </h1>

          <div className="flex flex-col items-center gap-4">
            <span className="h-[9px] w-[9px] rotate-45 bg-gold" />
            <div className="flex flex-col items-center gap-2.5">
              <span className="font-body text-[14px] uppercase tracking-[0.3em] text-ink">
                {heroDate(wedding)}
              </span>
              <span className="font-body text-[15px] italic text-sage">
                {wedding.venue ?? 'Le lieu vous sera bientôt dévoilé'}
              </span>
              {countdown !== null && (
                <span className="mt-1 font-body text-[12px] uppercase tracking-[0.2em] text-olive">
                  {countdown === 1 ? 'Dans 1 jour' : `Dans ${countdown} jours`}
                </span>
              )}
            </div>
          </div>
        </div>
      </ScallopedPanel>

      <div
        className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-1.5"
        style={{ animation: 'jlFloat 2.4s ease-in-out infinite' }}
      >
        <span className="font-body text-[10px] uppercase tracking-[0.22em] text-olive">
          Faites défiler
        </span>
        <span className="text-[14px] text-olive">⌄</span>
      </div>
    </section>
  );
}

function ProgrammeSection({ moments }: { moments: Moment[] }) {
  if (moments.length === 0) return null;
  return (
    <section className="px-6 py-14">
      <div data-rev="init" className="mb-11 text-center">
        <span className="font-body text-[12px] uppercase tracking-[0.34em] text-sage">
          Le programme
        </span>
        <h2 className="mt-2.5 font-display text-[46px] leading-none text-ink">La journée</h2>
      </div>
      <div className="relative mx-auto flex max-w-[420px] flex-col gap-1.5">
        {moments.map((m, i) => (
          <div key={m.id} data-rev="init" className="relative flex gap-5 pb-8 pl-1">
            <div className="flex flex-col items-center">
              <span className="mt-1.5 h-[13px] w-[13px] flex-none rounded-full border-2 border-gold bg-accent" />
              {i < moments.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-[rgba(92,100,65,0.28)]" />
              )}
            </div>
            <div className="flex-1 pb-1.5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="m-0 font-body text-[22px] font-medium text-ink">{m.title}</h3>
                <span className="whitespace-nowrap font-mono text-[12px] text-sage">
                  {momentTime(m)}
                </span>
              </div>
              <div className="mt-0.5 font-body text-[14px] italic text-olive">
                {momentLocation(m)}
              </div>
              {m.description && (
                <p className="mt-2 font-body text-[15px] leading-[1.6] text-muted">
                  {m.description}
                </p>
              )}
              <MomentGallery assets={m.media} title={m.title} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Galerie d'un moment : placeholder si vide, grande photo si une seule, grille sinon. */
function MomentGallery({ assets, title }: { assets: MomentAsset[]; title: string }) {
  if (assets.length === 0) {
    return (
      <div className="mt-3 h-[132px] overflow-hidden rounded-[10px]">
        <ImageSlot label="Photo" />
      </div>
    );
  }
  if (assets.length === 1) {
    return (
      <div className="mt-3 h-[150px] overflow-hidden rounded-[10px]">
        <ImageSlot src={assets[0]!.url} alt={title} />
      </div>
    );
  }
  const odd = assets.length % 2 === 1;
  const [first, ...rest] = assets;
  const gridItems = odd ? rest : assets;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {odd && first && (
        <div className="col-span-2 h-[150px] overflow-hidden rounded-[10px]">
          <ImageSlot src={first.url} alt={title} />
        </div>
      )}
      {gridItems.map((a) => (
        <div key={a.id} className="h-[110px] overflow-hidden rounded-[10px]">
          <ImageSlot src={a.url} alt={title} />
        </div>
      ))}
    </div>
  );
}

function DetailsSection({ cards }: { cards: DetailCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section
      data-rev="init"
      className="mx-5 my-6 rounded-[14px] bg-panel px-[30px] py-11 text-center shadow-[0_6px_24px_rgba(64,57,42,0.06)]"
    >
      <span className="font-body text-[12px] uppercase tracking-[0.34em] text-sage">
        Détails pratiques
      </span>
      <div className="mx-auto mt-6 flex max-w-[420px] flex-col gap-4 text-left">
        {cards.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-[13px] border border-line bg-surface">
            <div className="h-[158px]">
              <ImageSlot src={c.mediaUrl} label={c.label || 'Photo'} alt={c.label} />
            </div>
            <div className="px-[18px] py-[15px]">
              <div className="mb-1 font-body text-[12px] uppercase tracking-[0.16em] text-olive">
                {c.label}
              </div>
              <div className="font-body text-[17px] text-ink">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section data-rev="init" className="px-5 pb-10 pt-14">
      <div className="mb-6 text-center">
        <span className="font-body text-[12px] uppercase tracking-[0.34em] text-sage">Galerie</span>
      </div>
      <div className="mx-auto grid max-w-[440px] grid-cols-2 gap-2.5">
        <div className="col-span-2 h-[180px] overflow-hidden rounded-[10px]">
          <ImageSlot label="Photo" />
        </div>
        <div className="h-[150px] overflow-hidden rounded-[10px]">
          <ImageSlot label="Photo" />
        </div>
        <div className="h-[150px] overflow-hidden rounded-[10px]">
          <ImageSlot label="Photo" />
        </div>
      </div>
    </section>
  );
}
