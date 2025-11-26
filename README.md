# Figma to HTML

A Node.js tool that converts Figma designs into HTML and CSS files. This project fetches design data from Figma using their API, processes the design structure, and generates static HTML/CSS output.

## Project Overview

This tool automates the process of converting Figma designs into front-end code by:
1. Fetching design data from Figma via API
2. Extracting design styles, layouts, and assets
3. Generating semantic HTML markup
4. Creating corresponding CSS stylesheets with absolute positioning

## Features

- **Figma API Integration**: Fetches design files directly from Figma
- **Color Conversion**: Converts Figma color format to RGBA CSS values
- **Text Color Readability**: Automatically adjusts text color based on background brightness
- **Image Handling**: Downloads and embeds Figma design assets
- **CSS Generation**: Creates stylesheets with positioning, sizing, typography, and backgrounds
- **HTML Output**: Generates clean, structured HTML with semantic class names

## Project Structure

```
├── index.js              # Main script - fetches Figma data and processes design structure
├── renderer.js           # Generates HTML and CSS from processed design data
├── config/
│   └── config.js         # Configuration and environment variables
├── design.json           # Processed Figma design data (generated)
├── result.html           # Generated HTML output
├── style.css             # Generated CSS output
├── package.json          # Project dependencies and scripts
└── README.md             # This file
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Ruthvik2707/figma_to_html.git
cd figma_to_html
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```
FIGMA_TOKEN=your_figma_api_token
FIGMA_FILE_ID=your_figma_file_id
```

**Getting your credentials:**
- **FIGMA_TOKEN**: Generate a personal access token from [Figma Settings](https://www.figma.com/developers/api)
- **FIGMA_FILE_ID**: Found in your Figma file URL (`figma.com/file/{FILE_ID}/...`)

## Usage

### Commands

#### Fetch design data from Figma:
```bash
npm run fetch
```
Fetches your Figma design and saves it to `design.json`

#### Generate HTML and CSS:
```bash
npm run render
```
Processes `design.json` and generates `result.html` and `style.css`

#### Run complete pipeline:
```bash
npm run start
```
Runs both fetch and render in sequence

## How It Works

### Fetching (index.js)
1. Connects to Figma API using your token and file ID
2. Traverses the design hierarchy (nodes)
3. Extracts styling information:
   - Position (x, y coordinates)
   - Size (width, height)
   - Colors (backgrounds, text)
   - Typography (font family, size, weight, line height)
   - Images and backgrounds
4. Generates safe CSS class names from node names and IDs
5. Saves processed design structure to `design.json`

### Rendering (renderer.js)
1. Reads the processed `design.json`
2. Recursively traverses the design tree
3. For each node:
   - Creates appropriate HTML element (`<div>` for containers, `<span>` for text)
   - Assigns generated CSS class names
   - Includes text content where applicable
4. Generates corresponding CSS with:
   - Absolute positioning
   - Sizing
   - Colors and backgrounds
   - Typography styles
   - Background images
5. Outputs final HTML and CSS files

## Key Functions

### index.js
- `figmaColorToRgba()`: Converts Figma color objects to CSS RGBA format
- `ensureReadableTextColorSimple()`: Ensures text contrast for readability
- `extractFigmaStyles()`: Main function that fetches and processes Figma data
- `traverseNodes()`: Recursively processes design nodes

### renderer.js
- `traverse()`: Recursively generates HTML/CSS for design nodes

## Dependencies

- **dotenv**: ^16.5.0 - Environment variable management
- **node-fetch**: ^3.3.2 - Fetch API for Node.js

## Output

### result.html
A complete HTML document with:
- DOCTYPE and proper HTML structure
- Linked stylesheet (`style.css`)
- Div/span elements with generated class names
- Relative positioning container

### style.css
CSS stylesheet containing:
- All design element positioning and sizing
- Colors and backgrounds
- Typography settings
- Background image URLs

### what Failed
The position of html overlapps and hard to position these
assets are not extracted properly
need to place asstes and positions based on the figma

## Author

Ruthvik
