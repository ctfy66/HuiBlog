'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 解析HTML内容，提取标题
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const tocItems: TocItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || '';
      const id = heading.id || `heading-${index}`;
      
      // 如果标题没有id，添加一个
      if (!heading.id) {
        heading.id = id;
      }
      
      tocItems.push({ id, text, level });
    });
    
    setToc(tocItems);
  }, [content]);

  useEffect(() => {
    // 监听滚动，高亮当前标题
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    toc.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <h3 className="text-sm font-semibold text-text-100 mb-4 uppercase tracking-wider">
        目录
      </h3>
      <ul className="space-y-2 text-sm">
        {toc.map(({ id, text, level }) => (
          <li
            key={id}
            style={{ paddingLeft: `${(level - 1) * 0.75}rem` }}
          >
            <a
              href={`#${id}`}
              className={`block py-1 border-l-2 pl-3 transition-colors ${
                activeId === id
                  ? 'border-text-100 text-text-100 font-medium'
                  : 'border-gray-200 text-text-200 hover:text-text-100 hover:border-gray-400'
              }`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}




