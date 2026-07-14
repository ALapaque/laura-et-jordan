import { ImageResponse } from 'next/og';
import { getInvitationByToken } from '@/lib/queries';

export const runtime = 'nodejs';
export const alt = 'Invitation au mariage de Laura & Jordan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  const names = invitation?.wedding.coupleNames ?? 'Laura & Jordan';
  const [first, second] = names.includes('&')
    ? names.split('&').map((s) => s.trim())
    : [names, ''];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F2EDE0',
          color: '#40392A',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 28,
            border: '1px solid rgba(92,100,65,0.35)',
            borderRadius: 18,
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 26,
            letterSpacing: 16,
            textTransform: 'uppercase',
            color: '#5C6441',
            display: 'flex',
          }}
        >
          Invitation mariage
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 24,
            fontSize: 128,
            lineHeight: 1,
          }}
        >
          <span>{first}</span>
          {second && (
            <span style={{ color: '#D2AE47', margin: '0 26px', fontSize: 96 }}>&amp;</span>
          )}
          {second && <span>{second}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 34 }}>
          <div style={{ width: 60, height: 1, background: 'rgba(64,57,42,0.3)', display: 'flex' }} />
          <div
            style={{
              width: 14,
              height: 14,
              background: '#D2AE47',
              transform: 'rotate(45deg)',
              margin: '0 18px',
              display: 'flex',
            }}
          />
          <div style={{ width: 60, height: 1, background: 'rgba(64,57,42,0.3)', display: 'flex' }} />
        </div>
        <div style={{ marginTop: 30, fontSize: 30, fontStyle: 'italic', color: '#858052', display: 'flex' }}>
          {invitation?.parcours.name ?? 'Vous êtes invités'}
        </div>
      </div>
    ),
    size,
  );
}
