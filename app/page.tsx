import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import Date from '@/components/Date';
import Image from 'next/image';

export default function Home() {
  const allPostsData = getSortedPostsData();
  
  return (
    <section className="max-w-2xl mx-auto px-4 pb-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="relative w-32 h-32 mb-6 overflow-hidden rounded-full border-4 border-text-100/10">
           {/* Placeholder for user photo - using globe.svg temporarily */}
           <Image 
             src="/globe.svg" 
             alt="余辉"
             fill
             className="object-cover p-4 bg-text-200/5"
           />
        </div>
        <h2 className="text-3xl font-display font-bold text-text-100 mb-3">
          你好，我是余辉 👋
        </h2>
        <p className="text-lg text-text-200 font-sans max-w-lg">
          全栈开发者 / 技术博主 / 生活观察者
        </p>
      </div>

      {/* Intro Section */}
      <div className="prose prose-neutral mb-16 max-w-none">
        <p className="text-text-200 font-sans leading-relaxed text-lg text-center">
          热衷于构建优雅的 Web 应用，探索新技术的边界。在这个快节奏的数字时代，我试图通过代码和文字，记录下思考的痕迹。欢迎来到我的数字花园。
        </p>
      </div>

      {/* Contact Section */}
      <div className="mb-20 flex justify-center">
        <div className="flex flex-wrap justify-center gap-4">
          <a href="mailto:contact@example.com" className="px-6 py-2 rounded-full bg-text-100 text-background hover:opacity-90 transition-opacity text-sm font-medium">
            Email Me
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-full border border-text-200/30 text-text-100 hover:bg-text-200/5 transition-colors text-sm font-medium">
            GitHub
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-full border border-text-200/30 text-text-100 hover:bg-text-200/5 transition-colors text-sm font-medium">
            Twitter
          </a>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="border-t border-text-200/10 pt-12">
        <h3 className="font-display font-bold text-2xl mb-8 text-text-100">
          最新文章
        </h3>
        <ul className="space-y-10">
          {allPostsData.map(({ id, date, title }) => (
            <li key={id} className="group">
              <Link href={`/posts/${id}`} className="block">
                <h4 className="text-xl md:text-2xl font-display font-semibold mb-2 text-text-100 group-hover:text-text-200 transition-colors leading-tight">
                  {title}
                </h4>
                <div className="text-sm font-sans text-text-200 uppercase tracking-wider">
                  <Date dateString={date} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
