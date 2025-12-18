import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import Date from '@/components/Date';
import Image from 'next/image';
import { Mail, Github, Twitter, Terminal, Coffee, Code2 } from 'lucide-react';

export default function Home() {
  const allPostsData = getSortedPostsData();
  
  return (
    <section className="max-w-2xl mx-auto px-4 pb-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-16 pt-8">
        <div className="relative w-32 h-32 mb-6 overflow-hidden rounded-full border-4 border-text-100/10 shadow-lg">
           {/* 用户照片占位符 */}
           <Image 
             src="/head.jpg" 
             alt="余辉"
             fill
             className="object-cover hover:scale-105 transition-transform duration-500"
           />
        </div>
        
      </div>

      {/* About Section */}
      <div className="prose prose-neutral mb-12 max-w-none">
        <h3 className="font-display font-bold text-2xl mb-4 text-text-100 flex items-center gap-2">
          关于我
        </h3>
        <p className="text-text-200 font-sans leading-relaxed mb-4">
          我是余辉,AI提效信徒, 致力于让AI参与到生活的方方面面.
          这是我的博客, 记录我的思考.欢迎交流.
        </p>
      
      </div>

      
      
      {/* Contact Section */}
      <div className="mb-20">
        <h3 className="font-display font-bold text-2xl mb-6 text-text-100 text-center">
          联系方式
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="csgo74753@gmail.com" 
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-text-100 text-background hover:opacity-90 transition-opacity font-medium shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Email Me</span>
          </a>
          <a 
            href="https://github.com/ctfy66" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-text-200/30 text-text-100 hover:bg-text-200/5 transition-colors font-medium"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
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
                <div className="text-sm font-sans text-text-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-text-200/30"></span>
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
