# Zenchi - Complete Knowledge

A modern, mobile-friendly bookmarks dashboard that syncs with your Notion database. Display and manage your saved bookmarks with a beautiful, pastel-themed interface.

## Features

- 📚 **Notion Integration** - Automatically syncs bookmarks from your Notion database
- ⭐ **Featured Links** - Displays 3 randomly selected featured bookmarks at the top
- 🔍 **Search** - Search bookmarks by title with debounced server-side filtering
- 📄 **Pagination** - Navigate through bookmarks with cursor-based pagination (30 items per page)
- 🎨 **Modern UI** - Clean, pastel-themed design with light mode
- 📱 **Mobile Responsive** - Fully optimized for mobile devices
- 🔗 **Quick Access** - One-click visit buttons with favicon previews

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Notion API (direct HTTP calls)
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ 
- A Notion account with API access
- A Notion database with the following properties:
  - `Name` (Title property)
  - `Link` (URL property)
  - `Type` (Select property)
  - `Status` (Select property)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd zenchi-keep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   NOTION_API_KEY=your_notion_api_key_here
   NOTION_DATABASE_ID=your_notion_database_id_here
   ```

   To get your Notion API key:
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Copy the "Internal Integration Token"

   To get your Database ID:
   - Open your Notion database
   - Copy the ID from the URL (the part after the last slash, before the `?`)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
zenchi-keep/
├── app/
│   ├── api/
│   │   └── bookmarks/
│   │       ├── route.ts          # Main bookmarks API endpoint
│   │       └── featured/
│   │           └── route.ts      # Featured bookmarks endpoint
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main dashboard page
│   └── globals.css                # Global styles
├── components/
│   ├── BookmarkCard.tsx           # Individual bookmark list item
│   ├── FeaturedCard.tsx           # Featured bookmark card
│   └── Pagination.tsx             # Pagination controls
└── lib/
    └── notion.ts                  # Notion API client and utilities
```

## Features Explained

### Featured Links
- Randomly selects 3 bookmarks from your entire database
- Cached for 5 minutes to improve performance
- Displayed as cards at the top of the page

### Search Functionality
- Server-side filtering using Notion API
- Debounced input (300ms delay)
- Searches by bookmark title
- Resets pagination when searching

### Pagination
- Cursor-based pagination for efficient data loading
- Shows current page number
- Previous/Next navigation
- Maintains history for backward navigation

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

3. **Set Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add:
     - `NOTION_API_KEY` = your Notion API key
     - `NOTION_DATABASE_ID` = your Notion database ID

4. **Deploy**
   - Click "Deploy"
   - Your app will be live!

### Security Notes

- ✅ Environment variables are server-side only
- ✅ API keys are never exposed to the client
- ✅ Input validation and sanitization included
- ✅ Error messages don't expose sensitive information
- ⚠️ Make sure `.env` is in `.gitignore` (already included)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
