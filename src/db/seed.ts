import { config } from 'dotenv';
// Charge l'environnement AVANT toute lecture de process.env.
config({ path: '.env.local' });
config({ path: '.env' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateToken } from '@/lib/tokens';
import { demoMoments, demoParcours, demoResponses, demoWedding } from './demo-data';
import * as schema from './schema';
import { media, moment, parcours, rsvpResponse, wedding } from './schema';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('✗ DATABASE_URL requis pour le seed. Renseignez-le dans .env.local');
    process.exit(1);
  }
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  console.log('› Nettoyage des tables applicatives…');
  await db.delete(rsvpResponse);
  await db.delete(parcours);
  await db.delete(moment);
  await db.delete(wedding);
  await db.delete(media);

  console.log('› Insertion du mariage…');
  const [w] = await db
    .insert(wedding)
    .values({
      coupleNames: demoWedding.coupleNames,
      welcomeText: demoWedding.welcomeText,
      locales: demoWedding.locales,
      notifyEmails: demoWedding.notifyEmails,
      notifyEnabled: demoWedding.notifyEnabled,
      siteDomain: demoWedding.siteDomain,
    })
    .returning();
  if (!w) throw new Error('Insertion du mariage échouée');

  console.log('› Insertion des moments…');
  const momentIdMap = new Map<string, string>();
  for (const m of demoMoments) {
    const [row] = await db
      .insert(moment)
      .values({
        weddingId: w.id,
        title: m.title,
        description: m.description,
        sortOrder: m.sortOrder,
      })
      .returning();
    momentIdMap.set(m.id, row!.id);
  }

  console.log('› Insertion des parcours (tokens aléatoires)…');
  const parcoursIdMap = new Map<string, string>();
  for (const p of demoParcours) {
    const token = generateToken(10);
    const [row] = await db
      .insert(parcours)
      .values({
        weddingId: w.id,
        token,
        name: p.name,
        visibleMomentIds: p.visibleMomentIds.map((id) => momentIdMap.get(id)!).filter(Boolean),
        rsvpFields: p.rsvpFields,
      })
      .returning();
    parcoursIdMap.set(p.id, row!.id);
    console.log(`   • ${p.name.padEnd(18)} → /i/${token}`);
  }

  console.log('› Insertion des réponses de démonstration…');
  for (const r of demoResponses) {
    const parcoursId = parcoursIdMap.get(r.parcoursId);
    if (!parcoursId) continue;
    await db.insert(rsvpResponse).values({
      parcoursId,
      guestName: r.guestName,
      attending: r.attending,
      headcount: r.headcount,
      perMoment: r.perMoment,
      locale: r.locale,
      createdAt: new Date(r.createdAt),
    });
  }

  console.log('✓ Seed terminé.');
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Seed échoué :', err);
  process.exit(1);
});
