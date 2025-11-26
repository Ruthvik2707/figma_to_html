// index.js
import config from './config/config.js';
import fs from 'fs';
import fetch from 'node-fetch'; // optional in Node 18+ you can use global fetch

// Helper: convert Figma color object to CSS rgba()
function figmaColorToRgba(color, opacity = 1) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r},${g},${b},${opacity})`;
}

// Helper: Get visible solid fill from Figma
function getVisibleColorFill(fills) {
  if (!fills || !Array.isArray(fills)) return null;
  return fills.find(f => f.type === "SOLID" && (f.opacity ?? 1) > 0) || null;
}

// Extract RGB from "rgba(r,g,b,a)" string
function parseRGBA(str) {
  const m = str.match(/rgba?\((\d+),(\d+),(\d+),?([\d.]*)?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

// Brightness-based readable color
function ensureReadableTextColorSimple(bgColor, textColor) {
  if (!bgColor) return textColor || "black";

  const bg = parseRGBA(bgColor);
  if (!bg) return textColor || "black";

  // Perceived brightness formula
  const brightness = (bg.r * 299 + bg.g * 587 + bg.b * 114) / 1000;

  // Dark → return white, Light → return black
  return brightness < 128 ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
}


// Main function
async function extractFigmaStyles(fileId, fileToken) {
  const headers = { 'X-Figma-Token': fileToken };
  const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, { headers });
  console.log('HTTP Status Code:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response from Figma API:', errorText);
    return;
  }

  const fileData = await response.json();
  const designData = { nodes: [] };

  function traverseNodes(node) {
    // 1️⃣ Safe ID and class
    const safeId = 'node-' + node.id.replace(/[:;]/g, '-');
    let safeName = node.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    if (/^[0-9]/.test(safeName)) safeName = 'n' + safeName;
    const safeClass = `${safeName}_${safeId}`;

    const nodeInfo = {
      id: safeId,
      name: node.name,
      safeClass,
      type: node.type,
      styles: {},
      children: []
    };

    // Position & size
    if (node.absoluteBoundingBox) {
      nodeInfo.styles.position = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y
      };
      nodeInfo.styles.size = {
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height
      };
    }

    // Background color (fills)
    if (node.fills && node.fills.length) {
      const solidFill = node.fills.find(f => f.type === 'SOLID');
      if (solidFill) {
        nodeInfo.styles.backgroundColor = figmaColorToRgba(solidFill.color, solidFill.opacity ?? 1);
      }
    }

    // Border (strokes)
    if (node.strokes && node.strokes.length) {
      nodeInfo.styles.border = node.strokes.map(stroke => ({
        color: figmaColorToRgba(stroke.color, stroke.opacity ?? 1),
        weight: stroke.weight
      }));
    }

    // Border-radius
    if (node.cornerRadius !== undefined) {
      nodeInfo.styles.borderRadius = node.cornerRadius;
    } else if (node.rectangleCornerRadii) {
      nodeInfo.styles.borderRadius = {
        topLeft: node.rectangleCornerRadii[0],
        topRight: node.rectangleCornerRadii[1],
        bottomRight: node.rectangleCornerRadii[2],
        bottomLeft: node.rectangleCornerRadii[3]
      };
    }

    // Layout/Flex info
    if (node.layoutMode) {
      nodeInfo.styles.display = 'flex';
      nodeInfo.styles.flexDirection = node.layoutMode;
      nodeInfo.styles.padding = node.padding ? node.padding : null;
      nodeInfo.styles.itemSpacing = node.itemSpacing;
    }

    // Text info
    if (node.type === "TEXT") {
      // Ensure styles object exists
      nodeInfo.styles = {};

      // Basic text styles
      nodeInfo.styles.fontSize = node.style?.fontSize;
      nodeInfo.styles.fontFamily = node.style?.fontFamily;
      nodeInfo.styles.fontWeight = node.style?.fontWeight;
      nodeInfo.styles.lineHeight = node.style?.lineHeightPx;
      nodeInfo.styles.letterSpacing = node.style?.letterSpacing;

      // Extract raw text fill color
      const textFill = getVisibleColorFill(node.fills);

      let textColor = textFill
        ? figmaColorToRgba(textFill.color, textFill.opacity ?? 1)
        : "rgba(0,0,0,1)"; // fallback

      // Detect background color (parent fill OR node fill)
      let bgColor = null;

      // Search for solid background on current or parent
      const solidFill =
        node.background?.find(f => f.type === "SOLID") ||
        node.fills?.find(f => f.type === "SOLID");

      if (solidFill) {
        bgColor = figmaColorToRgba(
          solidFill.color,
          solidFill.opacity ?? 1
        );
      }

      // Fix text color if contrast is too low
      textColor = ensureReadableTextColorSimple(bgColor, textColor);

      // Assign final CSS color
      nodeInfo.styles.color = textColor;

      // Set text characters
      nodeInfo.text = node.characters;
    }


    // Recursively traverse children
    if (node.children && node.children.length) {
      node.children.forEach(child => {
        nodeInfo.children.push(traverseNodes(child));
      });
    }

    return nodeInfo;
  }

  // Start traversal from all pages
  if (fileData.document && fileData.document.children) {
    fileData.document.children.forEach(page => {
      designData.nodes.push(traverseNodes(page));
    });
  }

  fs.writeFileSync('./design.json', JSON.stringify(designData, null, 2));
  console.log('✅ design.json created with readable text colors!');
}

// Usage
const FILE_ID = config.FILE_ID;
const FILE_TOKEN = config.FIGMA_TOKEN;
extractFigmaStyles(FILE_ID, FILE_TOKEN);
