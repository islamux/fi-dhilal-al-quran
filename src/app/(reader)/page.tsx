import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'في ظلال القرآن',
  alternates: { canonical: '/' },
};

export default function ReaderHome() {
  return <div id="reader-page-placeholder" className="p-8">الرئيسية — في ظلال القرآن</div>;
}
