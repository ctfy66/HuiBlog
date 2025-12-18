# 背景
文件名：2025-12-18_1_notion-sync.md
创建于：2025-12-18_15:30:00
创建者：DELL
主分支：main
任务分支：task/notion-sync_2025-12-18_1
Yolo模式：Off

# 任务描述
实现从Notion自动同步笔记到博客的功能。用户需求：
- 能把Notion上的笔记发布到博客
- 不需要额外操作（自动化）
- 笔记是否发布由用户在Notion上控制
- 笔记包含图片和代码块
- Notion内容组织在多个页面中
- 选择方案二：GitHub Actions + Notion API

待确认：使用Database方式（勾选Published）还是固定父页面方式

# 项目概览
- 项目类型：Next.js博客
- 当前状态：使用markdown文件作为内容源，存储在posts目录
- 使用gray-matter解析frontmatter（需要title和date字段）
- 使用remark和rehype进行markdown到HTML转换
- 图片存储在public/posts目录

⚠️ 警告：永远不要修改此部分 ⚠️
RIPER-5核心规则：
- PLAN模式：只创建详细规范，不实施代码
- EXECUTE模式：100%遵循计划
- REVIEW模式：标记任何偏差
- 必须完成清单中的所有项目才能完成任务
⚠️ 警告：永远不要修改此部分 ⚠️

# 分析
## 现有博客架构
- Next.js 16.0.10
- posts目录存储markdown文件
- lib/posts.ts处理文件读取和解析
- frontmatter必须包含：title, date
- 支持代码高亮（rehype-highlight）
- 图片存储在public/posts/

## Notion集成要点
1. 需要Notion API Integration和Token
2. 需要将Notion页面连接到Integration
3. Notion内容需要转换为Markdown格式
4. 图片需要下载到本地或保持Notion链接
5. 代码块需要正确转换格式

## 技术约束
- GitHub Actions免费额度限制
- Notion API速率限制
- 图片下载和存储考虑

# 提议的解决方案
方案二：GitHub Actions + Notion API

核心流程：
1. 用户在Notion中标记文章为"Published"
2. GitHub Actions定时任务（如每小时）运行同步脚本
3. 脚本通过Notion API查询Published的文章
4. 下载文章内容并转换为Markdown
5. 下载图片到public/posts/
6. 生成符合格式的frontmatter
7. 保存到posts目录
8. 自动提交更改并推送，触发博客重新部署

技术栈：
- @notionhq/client - Notion官方SDK
- notion-to-md - Notion格式转Markdown
- node-fetch - 下载图片
- GitHub Actions - 定时任务和CI/CD

# 当前执行步骤："实施完成，等待用户测试"

# 任务进度
[2025-12-18_15:30:00]
- 创建功能分支：task/notion-sync_2025-12-18_1
- 创建任务文件：2025-12-18_1_notion-sync.md
- 状态：等待用户确认使用Database还是固定父页面方式

[2025-12-18_15:35:00]
- 已修改：.gitignore, package.json
- 已创建：env.example, scripts/sync-notion.js, .github/workflows/sync-notion.yml
- 更改：
  * 修改.gitignore允许env.example提交
  * 创建环境变量示例文件env.example
  * 添加依赖：@notionhq/client, notion-to-md, dotenv
  * 添加脚本命令：sync-notion
  * 安装新依赖包（16个包）
  * 创建Notion同步脚本，包含所有核心功能
  * 创建GitHub Actions工作流，配置定时和手动触发
- 原因：按照计划实施方案二（GitHub Actions + Notion API）
- 阻碍因素：无
- 状态：未确认

# 最终审查
待完成

