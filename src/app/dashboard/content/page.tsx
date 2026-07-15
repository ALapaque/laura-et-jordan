import { ContentEditor } from '@/components/dashboard/content-editor';
import { getWedding } from '@/lib/queries';

export default async function ContentPage() {
  const wedding = await getWedding();
  return (
    <ContentEditor
      initial={{
        coupleNames: wedding.coupleNames,
        eventDate: wedding.eventDate ? wedding.eventDate.slice(0, 10) : '',
        venue: wedding.venue ?? '',
        welcomeText: wedding.welcomeText,
      }}
    />
  );
}
