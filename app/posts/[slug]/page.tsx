import { getPostData, getSortedPostsData } from '@/lib/posts';
import Date from '@/components/Date';
import TableOfContents from '@/components/TableOfContents';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const postData = await getPostData(slug);
  
  return {
    title: postData.title,
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = await getPostData(slug);
  
  if (!postData) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* 主内容区 */}
        <article className="flex-1 min-w-0 max-w-4xl">
          <header className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-text-100 leading-tight">
              {postData.title}
            </h1>
            <div className="text-sm font-sans text-text-200 uppercase tracking-wider">
              <Date dateString={postData.date} />
            </div>
          </header>
          <div 
            className="prose prose-lg prose-slate max-w-none 
              prose-headings:font-display prose-headings:font-bold prose-headings:text-text-100 
              prose-p:text-text-100 prose-p:leading-relaxed
              prose-a:text-text-100 prose-a:underline hover:prose-a:text-text-200
              prose-strong:text-text-100"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} 
          />
        </article>
        
        {/* 右侧目录栏 */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <TableOfContents content={postData.contentHtml || ''} />
        </aside>
      </div>
    </div>
  );
}

