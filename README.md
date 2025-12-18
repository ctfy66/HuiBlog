# Impossible? Possible. - Personal Blog

A minimalist personal blog built with Next.js, Tailwind CSS, and Markdown, inspired by Claude's design.

## Features

- 🎨 **Claude Style**: Minimalist typography and color palette.
- 📝 **Markdown-based**: Write posts in Markdown files.
- 🚀 **Next.js App Router**: Fast and SEO-friendly.
- 📱 **Responsive**: Looks good on mobile and desktop.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Adding Posts

1.  Create a new `.md` file in the `posts/` directory.
2.  Add the required frontmatter:
    ```markdown
    ---
    title: 'Your Post Title'
    date: 'YYYY-MM-DD'
    ---
    ```
3.  Write your content below the frontmatter.

## Deployment

### Vercel (Recommended)

1.  Push your code to a GitHub repository.
2.  Go to [Vercel](https://vercel.com) and sign in.
3.  Click "Add New..." -> "Project".
4.  Import your GitHub repository.
5.  Click "Deploy".

Every time you push a new post (md file) to GitHub, Vercel will automatically redeploy your site with the new content.
