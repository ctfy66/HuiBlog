require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 初始化Notion客户端
function initNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey) {
    throw new Error('NOTION_API_KEY is required in environment variables');
  }

  if (!databaseId) {
    throw new Error('NOTION_DATABASE_ID is required in environment variables');
  }

  const client = new Client({ auth: apiKey });
  const n2m = new NotionToMarkdown({ notionClient: client });

  return { client, n2m, databaseId };
}

// 查询已发布的文章
async function getPublishedPosts(client, databaseId) {
  try {
    const response = await client.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Published',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
    });

    return response.results;
  } catch (error) {
    console.error('Error querying Notion database:', error.message);
    throw error;
  }
}

// 转换单篇文章
async function convertNotionPageToMarkdown(client, n2m, pageId) {
  try {
    // 获取页面对象
    const page = await client.pages.retrieve({ page_id: pageId });

    // 提取标题
    let title = 'Untitled';
    const titleProperty = page.properties.Name || page.properties.Title || page.properties.title;
    if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
      title = titleProperty.title.map(t => t.plain_text).join('');
    }

    // 提取日期
    let date = new Date().toISOString().split('T')[0]; // 默认今天
    const dateProperty = page.properties.Date || page.properties.date;
    if (dateProperty && dateProperty.date && dateProperty.date.start) {
      date = dateProperty.date.start;
    } else {
      // 使用创建时间
      date = page.created_time.split('T')[0];
    }

    // 转换内容为Markdown
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const content = n2m.toMarkdownString(mdblocks);

    // 提取图片URL
    const images = [];
    const imageRegex = /!\[.*?\]\((https:\/\/.*?)\)/g;
    let match;
    while ((match = imageRegex.exec(content.parent)) !== null) {
      images.push(match[1]);
    }

    return {
      title,
      date,
      content: content.parent,
      images,
      pageId,
    };
  } catch (error) {
    console.error(`Error converting page ${pageId}:`, error.message);
    throw error;
  }
}

// 下载图片到本地
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // 删除失败的文件
      reject(err);
    });
  });
}

// 生成文件名（处理特殊字符）
function generateFileName(title, pageId) {
  // 移除或替换特殊字符，保留中文、英文、数字、空格和连字符
  let sanitized = title
    .replace(/[\\/:*?"<>|]/g, '') // 移除Windows不允许的字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .trim();

  // 如果标题过长，截取前50个字符
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }

  // 如果处理后为空，使用页面ID
  if (!sanitized) {
    sanitized = 'untitled';
  }

  return `${sanitized}.md`;
}

// 保存Markdown文件
async function saveMarkdownFile(fileName, frontmatter, content, images, pageId) {
  const postsDir = path.join(process.cwd(), 'posts');
  const publicPostsDir = path.join(process.cwd(), 'public', 'posts');

  // 确保目录存在
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  if (!fs.existsSync(publicPostsDir)) {
    fs.mkdirSync(publicPostsDir, { recursive: true });
  }

  // 处理图片
  let updatedContent = content;
  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    try {
      // 生成图片文件名
      const ext = path.extname(new URL(imageUrl).pathname) || '.png';
      const imageFileName = `${pageId}-${i}${ext}`;
      const imagePath = path.join(publicPostsDir, imageFileName);

      // 下载图片
      await downloadImage(imageUrl, imagePath);
      console.log(`  Downloaded image: ${imageFileName}`);

      // 替换Markdown中的图片路径
      updatedContent = updatedContent.replace(imageUrl, `/posts/${imageFileName}`);
    } catch (error) {
      console.warn(`  Warning: Failed to download image ${imageUrl}:`, error.message);
      // 保留原始URL
    }
  }

  // 生成frontmatter
  const frontmatterStr = `---
title: '${frontmatter.title.replace(/'/g, "''")}'
date: '${frontmatter.date}'
---

`;

  // 保存文件
  const fullContent = frontmatterStr + updatedContent;
  const filePath = path.join(postsDir, fileName);
  fs.writeFileSync(filePath, fullContent, 'utf8');

  return filePath;
}

// 主函数
async function main() {
  try {
    console.log('Starting Notion sync...');

    // 初始化客户端
    const { client, n2m, databaseId } = initNotionClient();
    console.log('Notion client initialized');

    // 查询已发布的文章
    const publishedPosts = await getPublishedPosts(client, databaseId);
    console.log(`Found ${publishedPosts.length} published posts`);

    if (publishedPosts.length === 0) {
      console.log('No posts to sync');
      return;
    }

    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    // 遍历每篇文章
    for (const post of publishedPosts) {
      try {
        const pageId = post.id.replace(/-/g, '');
        console.log(`\nProcessing page: ${pageId}`);

        // 转换内容
        const { title, date, content, images } = await convertNotionPageToMarkdown(
          client,
          n2m,
          pageId
        );
        console.log(`  Title: ${title}`);
        console.log(`  Date: ${date}`);
        console.log(`  Images: ${images.length}`);

        // 生成文件名
        const fileName = generateFileName(title, pageId);
        console.log(`  File: ${fileName}`);

        // 保存文件
        await saveMarkdownFile(
          fileName,
          { title, date },
          content,
          images,
          pageId
        );

        console.log(`  ✓ Saved successfully`);
        newCount++;
      } catch (error) {
        console.error(`  ✗ Error processing post:`, error.message);
        errorCount++;
      }
    }

    // 输出统计
    console.log('\n' + '='.repeat(50));
    console.log('Sync completed!');
    console.log(`Total: ${publishedPosts.length} posts`);
    console.log(`Synced: ${newCount} posts`);
    console.log(`Errors: ${errorCount} posts`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();

