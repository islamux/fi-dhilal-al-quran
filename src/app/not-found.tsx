import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-dark-bg text-brand-dark-active px-6">
      <div className="text-center max-w-md">
        <div
          aria-hidden
          className="text-7xl font-serif text-gilded-gold leading-none"
        >
          ٤٠٤
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold font-serif">
          الصفحة غير موجودة
        </h1>
        <p className="mt-3 text-brand-dark-mute leading-relaxed">
          لم نعثر على هذه الصفحة. ربما تغيّر الرابط أو أُزيلت. تفضّل بالعودة إلى
          الفهرس أو التصفح من القائمة الجانبية.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-gilded-gold text-brand-dark-bg font-bold rounded-none border border-gilded-gold transition-colors hover:bg-gilded-gold/90"
        >
          العودة إلى البداية
        </Link>
      </div>
    </main>
  );
}
