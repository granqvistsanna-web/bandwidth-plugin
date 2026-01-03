# Bandwidth Check - Framer Plugin

**Know your page weight before you publish.**

A Framer plugin that analyzes your canvas assets (images, SVGs, fonts) and provides estimated bandwidth usage with actionable optimization recommendations.

## Features

### 📊 Page Weight Analysis
- **Breakpoint Analysis**: View estimates for Desktop, Tablet, and Mobile viewports
- **Detailed Breakdown**: See breakdown by Images, SVGs, Fonts, and base HTML/CSS/JS
- **Page Selector**: Analyze individual pages or view aggregate across all pages

### 🖼️ Asset Management
- **Asset Discovery**: Automatically detects all images and SVGs in your project
- **Intrinsic Dimensions**: Shows actual image dimensions vs. rendered size
- **Usage Tracking**: See how many times each asset is used across your project
- **Visual Previews**: Thumbnail previews for quick asset identification
- **Click to Select**: Click any asset to select it in the Framer canvas

### 💡 Smart Recommendations
- **Prioritized Suggestions**: High/Medium/Low priority recommendations
- **Top 3 Quick Wins**: Highlighted section showing the biggest savings opportunities
- **Actionable Advice**: Specific recommendations like "Resize to 1600×900px and compress to WebP"
- **Potential Savings**: See how much bandwidth you can save with each optimization

### 📤 Export & Reporting
- **Markdown Export**: Copy formatted report to clipboard
- **JSON Export**: Download full analysis data for automation
- **Comprehensive Reports**: Includes summary, breakdown, top assets, and all recommendations

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. In Framer, open the plugin menu and select "Open Development Plugin"

## Usage

1. **Run Analysis**: The plugin automatically analyzes your project on load, or click "Refresh analysis" in the header
2. **Select Page**: Use the dropdown to analyze a specific page or view all pages together
3. **Review Assets**: Check the Assets tab to see all detected images and SVGs
4. **View Recommendations**: Go to Recommendations tab for optimization suggestions
5. **Export Report**: Click "Copy MD" or "JSON" buttons to export your analysis

## How It Works

### What We Measure
- Number of image/SVG nodes in your Framer project
- Rendered dimensions of each asset (width × height in px)
- Intrinsic dimensions (actual image file size)
- Asset types (image vs. SVG)
- Image formats from URLs (JPEG, PNG, WebP, SVG, etc.)

### What We Estimate
- **File sizes**: Estimated using `dimensions × pixel density × compression ratio`
- **Compression ratios**: Assumes standard compression (JPEG: 85%, PNG: 60%, WebP: 90%)
- **Base overhead**: ~110KB for Framer's HTML/CSS/JS runtime
- **Font weight**: ~60KB per font family

### What We DON'T Do
- Download or measure actual file sizes (would be too slow)
- Account for lazy loading, CDN optimizations, or HTTP/2 multiplexing
- Measure JavaScript bundle size from custom code
- Predict bandwidth usage from video, animations, or interactions

## Known Limitations

- **Estimates Only**: These are canvas-based estimates, not actual build output measurements
- **No Video Analysis**: Video files are not currently detected
- **No Third-Party Scripts**: External scripts and fonts are not measured
- **Breakpoint Assumptions**: Uses standard breakpoint widths (375px, 768px, 1440px)

## Development

### Project Structure
```
src/
  ├── components/       # React components
  ├── services/         # Business logic (analysis, traversal, etc.)
  ├── hooks/           # React hooks
  ├── types/           # TypeScript type definitions
  └── utils/           # Utility functions
```

### Key Files
- `src/services/traversal.ts` - Node tree traversal and asset discovery
- `src/services/analyzer.ts` - Main analysis orchestration
- `src/services/recommendations.ts` - Recommendation generation
- `src/services/bandwidth.ts` - Bandwidth estimation calculations

### Building for Production
```bash
npm run build
npm run pack
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features including:
- Published URL audit (actual file size measurement)
- Monthly bandwidth calculator
- One-click compression
- Above-the-fold detection

## License

MIT

---

**Built with**: React, TypeScript, Vite, Tailwind CSS, Framer Plugin SDK v3
