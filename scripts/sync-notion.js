require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 映射文件路径
const SYNC_MAP_FILE = path.join(process.cwd(), '.notion-sync-map.json');

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
    
    // 确保内容存在，处理可能的 undefined
    const markdownContent = content?.parent || content || '';
    
    if (!markdownContent || markdownContent.trim() === '') {
      console.warn(`  Warning: Page ${pageId} has no content or unsupported block types`);
    }

    // 提取图片URL
    const images = [];
    const imageRegex = /!\[.*?\]\((https:\/\/.*?)\)/g;
    let match;
    while ((match = imageRegex.exec(markdownContent)) !== null) {
      images.push(match[1]);
    }

    return {
      title,
      date,
      content: markdownContent,
      images,
      pageId,
      lastEditedTime: page.last_edited_time,
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

// 读取映射文件
function loadSyncMap() {
  try {
    if (fs.existsSync(SYNC_MAP_FILE)) {
      const content = fs.readFileSync(SYNC_MAP_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Warning: Failed to load sync map, creating new one:', error.message);
  }
  return { lastSync: null, pages: {} };
}

// 保存映射文件
function saveSyncMap(syncMap) {
  try {
    fs.writeFileSync(SYNC_MAP_FILE, JSON.stringify(syncMap, null, 2), 'utf8');
    console.log('Sync map saved successfully');
  } catch (error) {
    console.error('Error saving sync map:', error.message);
    throw error;
  }
}

// 归档文件
function archivePost(fileName, pageId) {
  try {
    const postsDir = path.join(process.cwd(), 'posts');
    const publicPostsDir = path.join(process.cwd(), 'public', 'posts');
    
    // 创建归档目录（按日期）
    const archiveDate = new Date().toISOString().split('T')[0];
    const archiveDir = path.join(postsDir, 'archived', archiveDate);
    const archivePublicDir = path.join(publicPostsDir, 'archived', archiveDate);
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    if (!fs.existsSync(archivePublicDir)) {
      fs.mkdirSync(archivePublicDir, { recursive: true });
    }
    
    // 移动Markdown文件
    const sourcePath = path.join(postsDir, fileName);
    const targetPath = path.join(archiveDir, fileName);
    
    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, targetPath);
      console.log(`  Archived: ${fileName} -> archived/${archiveDate}/`);
    }
    
    // 移动关联的图片文件
    if (fs.existsSync(publicPostsDir)) {
      const files = fs.readdirSync(publicPostsDir);
      const imagePattern = new RegExp(`^${pageId}-\\d+\\.(png|jpg|jpeg|gif|webp|svg)$`, 'i');
      
      files.forEach(file => {
        if (imagePattern.test(file)) {
          const imageSource = path.join(publicPostsDir, file);
          const imageTarget = path.join(archivePublicDir, file);
          fs.renameSync(imageSource, imageTarget);
          console.log(`  Archived image: ${file}`);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error(`  Error archiving ${fileName}:`, error.message);
    return false;
  }
}

// 保存Markdown文件
async function saveMarkdownFile(fileName, frontmatter, content, images, pageId, lastEditedTime) {
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
notionId: '${pageId}'
lastEdited: '${lastEditedTime}'
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

    // 加载映射文件
    const syncMap = loadSyncMap();
    console.log('Sync map loaded');

    // 查询已发布的文章
    const publishedPosts = await getPublishedPosts(client, databaseId);
    console.log(`Found ${publishedPosts.length} published posts in Notion`);

    // 创建Notion文章ID集合
    const notionPageIds = new Set(publishedPosts.map(post => post.id.replace(/-/g, '')));

    let newCount = 0;
    let updateCount = 0;
    let archiveCount = 0;
    let errorCount = 0;

    // 新的映射对象
    const newSyncMap = {
      lastSync: new Date().toISOString(),
      pages: {}
    };

    // 遍历每篇文章
    for (const post of publishedPosts) {
      try {
        const pageId = post.id.replace(/-/g, '');
        console.log(`\nProcessing page: ${pageId}`);

        // 转换内容
        const { title, date, content, images, lastEditedTime } = await convertNotionPageToMarkdown(
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

        // 检测是新增还是修改
        const existingEntry = syncMap.pages[pageId];
        let isNew = !existingEntry;
        let isUpdated = false;

        if (existingEntry) {
          // 比对last_edited_time
          if (existingEntry.lastEdited !== lastEditedTime) {
            console.log(`  Detected changes (last edited: ${lastEditedTime})`);
            isUpdated = true;
          } else {
            console.log(`  No changes detected, skipping...`);
            // 保持映射信息
            newSyncMap.pages[pageId] = existingEntry;
            continue;
          }
        } else {
          console.log(`  New post detected`);
        }

        // 保存文件
        await saveMarkdownFile(
          fileName,
          { title, date },
          content,
          images,
          pageId,
          lastEditedTime
        );

        // 更新映射
        newSyncMap.pages[pageId] = {
          fileName: fileName,
          lastEdited: lastEditedTime,
          title: title
        };

        if (isNew) {
          console.log(`  ✓ Added successfully`);
          newCount++;
        } else if (isUpdated) {
          console.log(`  ✓ Updated successfully`);
          updateCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error processing post:`, error.message);
        errorCount++;
      }
    }

    // 检测需要归档的文章（在映射中但不在Notion中）
    console.log('\n' + '-'.repeat(50));
    console.log('Checking for posts to archive...');
    
    for (const [pageId, pageInfo] of Object.entries(syncMap.pages)) {
      if (!notionPageIds.has(pageId)) {
        console.log(`\nArchiving: ${pageInfo.title}`);
        const success = archivePost(pageInfo.fileName, pageId);
        if (success) {
          archiveCount++;
        } else {
          errorCount++;
        }
      }
    }

    // 保存更新后的映射文件
    saveSyncMap(newSyncMap);

    // 输出统计
    console.log('\n' + '='.repeat(50));
    console.log('Sync completed!');
    console.log(`Notion posts: ${publishedPosts.length}`);
    console.log(`New: ${newCount} posts`);
    console.log(`Updated: ${updateCount} posts`);
    console.log(`Archived: ${archiveCount} posts`);
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

