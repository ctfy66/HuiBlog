import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import Date from '@/components/Date';

export default function Home() {
  const allPostsData = getSortedPostsData();
  
  return (
    <section className="max-w-2xl mx-auto px-4 pb-12">
      <div className="mb-16">
        <p className="text-xl text-text-200 font-sans leading-relaxed">
          你好，我是 Hui。这是我的个人博客，分享关于编程、技术和生活的思考。
        </p>
      </div>

      <ul className="space-y-12">
        {allPostsData.map(({ id, date, title }) => (
          <li key={id} className="group">
            <Link href={`/posts/${id}`} className="block">
              <h2 className="text-2xl md:text-3xl font-display font-semibold mb-3 text-text-100 group-hover:text-text-200 transition-colors leading-tight">
                {title}
              </h2>
              <div className="text-sm font-sans text-text-200 uppercase tracking-wider">
                <Date dateString={date} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
