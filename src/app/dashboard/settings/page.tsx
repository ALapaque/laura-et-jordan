import { SettingsForm } from '@/components/dashboard/settings-form';
import { getWedding } from '@/lib/queries';

export default async function SettingsPage() {
  const wedding = await getWedding();
  return (
    <SettingsForm
      initial={{
        notifyEmails: wedding.notifyEmails.join(', '),
        notifyEnabled: wedding.notifyEnabled,
        rsvpDeadline: wedding.rsvpDeadline ? wedding.rsvpDeadline.slice(0, 10) : '',
        locales: wedding.locales,
        siteDomain: wedding.siteDomain ?? '',
      }}
    />
  );
}
