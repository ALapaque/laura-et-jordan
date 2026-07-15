import { ContentEditor } from '@/components/dashboard/content-editor';
import { DetailCardsManager } from '@/components/dashboard/detail-cards-manager';
import { getDetailCards, getWedding } from '@/lib/queries';

export default async function ContentPage() {
  const [wedding, detailCards] = await Promise.all([getWedding(), getDetailCards()]);
  return (
    <div className="flex flex-col gap-8">
      <ContentEditor
        initial={{
          coupleNames: wedding.coupleNames,
          eventDate: wedding.eventDate ? wedding.eventDate.slice(0, 10) : '',
          venue: wedding.venue ?? '',
          welcomeText: wedding.welcomeText,
        }}
      />
      <DetailCardsManager initial={detailCards} />
    </div>
  );
}
