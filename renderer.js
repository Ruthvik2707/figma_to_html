
import fs from 'fs';

const design = JSON.parse(fs.readFileSync('design.json', 'utf-8'));

let htmlContent = '';
let cssContent = '';

function traverse(node) {
  const className = node?.safeClass;
  const tag = node.type === 'TEXT' ? 'span' : 'div';

  let html = `<${tag} class="${className}">\n`;
  let css = `.${className} {\n`;

  if (node.styles.position) {
    css += `  position: absolute;\n`;
    css += `  left: ${node.styles.position.x}px;\n`;
    css += `  top: ${node.styles.position.y}px;\n`;
  }

  if (node.styles.size) {
    css += `  width: ${node.styles.size.width}px;\n`;
    css += `  height: ${node.styles.size.height}px;\n`;
  }

  if (node.styles.backgroundColor) {
    css += `  background-color: ${node.styles.backgroundColor};\n`;
  }

  if (node.assetUrl) {
    css += `  background-image: url("${node.assetUrl}");\n`;
    css += `  background-size: cover;\n`;
    css += `  background-repeat: no-repeat;\n`;
  }

  if (node.styles.color) css += `  color: ${node.styles.color};\n`;
  if (node.styles.fontSize) css += `  font-size: ${node.styles.fontSize}px;\n`;
  if (node.styles.fontFamily) css += `  font-family: ${node.styles.fontFamily};\n`;
  if (node.styles.fontWeight) css += `  font-weight: ${node.styles.fontWeight};\n`;
  if (node.styles.lineHeight) css += `  line-height: ${node.styles.lineHeight}px;\n`;

  css += `}\n\n`;

  if (node.text) html += node.text;

  if (node.children?.length) {
    node.children.forEach(child => {
      const res = traverse(child);
      html += res.html;
      css += res.css;
    });
  }

  html += `</${tag}>\n`;

  return { html, css };
}

design.nodes.forEach(node => {
  const result = traverse(node);
  htmlContent += result.html;
  cssContent += result.css;
});

const finalHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body style="position:relative;">
${htmlContent}
  </body>
</html>`;

fs.writeFileSync('./result.html', finalHtml);
fs.writeFileSync('./style.css', cssContent);

console.log("✅ result.html and style.css updated with asset backgrounds!");
