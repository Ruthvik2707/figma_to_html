// generateHTML.js
import fs from 'fs';

// Load the design.json
const design = JSON.parse(fs.readFileSync('design.json', 'utf-8'));

let htmlContent = '';
let cssContent = '';

// Recursive function to generate HTML and CSS
function traverse(node) {
  const className = node?.safeClass;
  let html = '';
  let css = '';

  // Determine HTML tag
  const tag = node.type === 'TEXT' ? 'span' : 'div';

  // Start HTML tag
  html += `<${tag} class="${className}">\n`;

  // Add text content if present
  if (node.text) html += node.text;

  // CSS for this node
  css += `.${className} {\n`;

  // Position & size
  if (node.styles.position) {
    css += `  position: absolute;\n`;
    css += `  left: ${node.styles.position.x}px;\n`;
    css += `  top: ${node.styles.position.y}px;\n`;
  }
  if (node.styles.size) {
    css += `  width: ${node.styles.size.width}px;\n`;
    css += `  height: ${node.styles.size.height}px;\n`;
  }

  // Background color
  if (node.styles.backgroundColor) {
    css += `  background-color: ${node.styles.backgroundColor};\n`;
  }

  // Border
  if (node.styles.border) {
    node.styles.border.forEach((b, i) => {
      css += `  border: ${b.weight}px solid ${b.color};\n`;
    });
  }

  // Border-radius
  if (node.styles.borderRadius !== undefined) {
    if (typeof node.styles.borderRadius === 'number') {
      css += `  border-radius: ${node.styles.borderRadius}px;\n`;
    } else {
      const br = node.styles.borderRadius;
      css += `  border-radius: ${br.topLeft}px ${br.topRight}px ${br.bottomRight}px ${br.bottomLeft}px;\n`;
    }
  }

  // Flex layout
  if (node.styles.display === 'flex') {
    css += `  display: flex;\n`;
    if (node.styles.flexDirection) css += `  flex-direction: ${node.styles.flexDirection.toLowerCase()};\n`;
    if (node.styles.padding) {
      const p = node.styles.padding;
      css += `  padding: ${p.top || 0}px ${p.right || 0}px ${p.bottom || 0}px ${p.left || 0}px;\n`;
    }
    if (node.styles.itemSpacing) css += `  gap: ${node.styles.itemSpacing}px;\n`;
  }

  // Text styles
  if (node.type === 'TEXT') {
    if (node.styles.fontSize) css += `  font-size: ${node.styles.fontSize}px;\n`;
    if (node.styles.fontFamily) css += `  font-family: ${node.styles.fontFamily};\n`;
    if (node.styles.fontWeight) css += `  font-weight: ${node.styles.fontWeight};\n`;
    if (node.styles.lineHeight) css += `  line-height: ${node.styles.lineHeight}px;\n`;
    if (node.styles.letterSpacing) css += `  letter-spacing: ${node.styles.letterSpacing}px;\n`;
    if (node.styles.color) css += `  color: ${node.styles.color};\n`;
  }

  css += `}\n\n`;

  // Recursively process children
  if (node.children && node.children.length) {
    node.children.forEach(child => {
      const childResult = traverse(child);
      html += childResult.html;
      css += childResult.css;
    });
  }

  html += `</${tag}>\n`;

  return { html, css };
}

// Generate HTML and CSS for all top-level nodes
design.nodes.forEach(node => {
  const result = traverse(node);
  htmlContent += result.html;
  cssContent += result.css;
});

// Wrap HTML in basic structure
const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <title>Figma Export</title>
</head>
<body style="position: relative;">
${htmlContent}
</body>
</html>`;

// Write files
fs.writeFileSync('./result.html', finalHtml);
fs.writeFileSync('./style.css', cssContent);

console.log('✅ result.html and style.css generated successfully!');
