# Marketplace Listing Content

## Title
**Bandwidth Check**

## Short Description (1-2 sentences)
Analyze your Framer project's bandwidth usage before publishing. Get detailed asset breakdowns, optimization recommendations, and one-click image compression to reduce page weight and save on bandwidth costs.

## Full Description

### Overview
Bandwidth Check helps you understand and optimize your Framer project's bandwidth usage before you publish. Get detailed insights into your assets, identify optimization opportunities, and reduce page weight to stay within your Framer plan limits.

### Key Features

**📊 Comprehensive Analysis**
- Automatic detection of all images and SVGs in your project
- Breakpoint analysis for Desktop, Tablet, and Mobile viewports
- Detailed breakdown by asset type (Images, SVGs, Fonts, HTML/CSS/JS)
- Page-by-page or aggregate analysis across all pages

**🖼️ Asset Management**
- Visual previews with thumbnails for quick identification
- Intrinsic vs. rendered dimensions comparison
- Usage tracking across pages
- Click any asset to select it in the Framer canvas
- Automatic exclusion of design pages from analysis

**💡 Smart Recommendations**
- Prioritized suggestions (High/Medium/Low impact)
- Top 3 Quick Wins highlighting biggest savings opportunities
- Specific, actionable advice (e.g., "Resize to 1920×1080px and compress to WebP")
- Potential savings estimates for each optimization
- Cross-page navigation to find assets on any page

**⚡ One-Click Optimization**
- Automatic image resizing to optimal dimensions
- Compression to WebP or JPEG format
- Preserves transparency when needed
- Choose to replace single node or all usages
- Download optimized images for manual replacement

**📈 Bandwidth Calculator**
- Estimate monthly bandwidth usage based on pageviews
- Compare against Framer plan limits (Free, Mini, Basic, Pro)
- Visual risk indicators for overage warnings
- Per-1,000 pageviews breakdown

**📤 Export & Reporting**
- Markdown export to clipboard
- JSON export for automation
- Comprehensive reports with all analysis data

**🔍 Custom Code Analysis**
- Detects assets loaded dynamically by code overrides/components
- Identifies lazy-loaded resources
- Warns about potential bandwidth-heavy custom code

### Use Cases

- **Before Publishing**: Check if your site will exceed bandwidth limits
- **Optimization**: Identify and fix large images before they cause issues
- **Cost Management**: Estimate monthly bandwidth costs based on expected traffic
- **Performance**: Reduce page weight for faster load times
- **Planning**: Understand asset usage across your entire project

### How It Works

1. **Automatic Analysis**: The plugin scans your Framer canvas on load
2. **Asset Detection**: Finds all images, SVGs, and fonts in your project
3. **Size Estimation**: Calculates estimated file sizes based on dimensions and format
4. **Recommendations**: Suggests optimizations ranked by potential savings
5. **One-Click Fixes**: Optimize images directly from recommendations

### Technical Details

- **Analysis Mode**: Canvas-based (estimates) or Published site (actual measurements)
- **Supported Formats**: JPEG, PNG, WebP, AVIF, SVG
- **Optimization**: Client-side resizing and compression using Canvas API
- **No External Services**: All processing happens locally
- **Dark Mode**: Full support for Framer's light and dark themes

### Requirements

- Framer Desktop app (plugins require desktop)
- No authentication or external services needed
- Works with all Framer plans

### Setup Instructions

1. Install the plugin from the Framer marketplace
2. Open the plugin from your plugins panel
3. Analysis runs automatically on load
4. Review recommendations and optimize as needed
5. Click "Rescan" to update after making changes

### Support

- Email support available (see SUPPORT.md)
- Response time: 48-72 hours for bug reports
- Free plugin with community support

### Known Limitations

- Estimates are canvas-based, not actual build measurements
- Video files are not currently detected
- External scripts loaded outside Framer are not measured
- Analysis is based on Framer canvas structure

---

**Note**: This plugin helps you optimize your project before publishing. For actual published site analysis, use the published mode feature.

