import { notFound } from 'next/navigation';
import PropertyWizard from '@/components/business/PropertyWizard';

export default async function EditPropertyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const id = Number((await params).propertyId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <PropertyWizard initialPropertyId={id} />;
}
