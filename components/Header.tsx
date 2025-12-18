import Link from 'next/link';

export default function Header() {
  return (
    <header className="py-12 md:py-20 mb-8 md:mb-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <Link href="/" className="inline-block group">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-text-100 group-hover:text-text-200 transition-colors">
            Hui Blog
          </h1>
        </Link>
      </div>
    </header>
  );
}

