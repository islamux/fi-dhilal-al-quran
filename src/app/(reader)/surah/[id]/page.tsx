import type { Metadata } from 'next';

export default function SurahPage() {
  return <div className="p-8">سورة — في ظلال القرآن</div>;
}

export async function generateStaticParams() {
  return [];
}
