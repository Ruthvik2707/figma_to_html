// index.js
import config from './config/config.js';
import fs from 'fs';
import fetch from 'node-fetch';

// Convert color to rgba
function figmaColorToRgba(color, opacity = 1) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r},${g},${b},${opacity})`;
}

// Find visible fill
function getVisibleColorFill(fills) {
  if (!fills || !Array.isArray(fills)) return null;
  return fills.find(f => f.type === "SOLID" && (f.opacity ?? 1) > 0) || null;
}

// Parse rgba string
function parseRGBA(str) {
  const m = str.match(/rgba?\((\d+),(\d+),(\d+),?([\d.]*)?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

// Ensure readable text
function ensureReadableTextColorSimple(bgColor, textColor) {
  if (!bgColor) return textColor || "black";
  const bg = parseRGBA(bgColor);
  if (!bg) return textColor || "black";
  const brightness = (bg.r * 299 + bg.g * 587 + bg.b * 114) / 1000;
  return brightness < 128 ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
}

// Fetch Figma images for imageRef list
async function fetchImageUrls(fileId, imageRefs, token) {
  if (imageRefs.length === 0) return {};

  const ids = imageRefs.join(",");
  const url = `https://api.figma.com/v1/images/${fileId}?ids=${ids}&format=png`;

  const res = await fetch(url, {
    headers: { 'X-Figma-Token': token }
  });

  const json = await res.json();
  return json.images || {};
}

// MAIN
async function extractFigmaStyles(fileId, token) {
  const headers = { 'X-Figma-Token': token };

  const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, { headers });
  console.log("HTTP Status Code:", response.status);
  const fileData = await response.json();

  const imageRefs = []; // collect image refs from all nodes
  const designData = { nodes: [] };

  function computeRelativePosition(abs, parentAbs) {
    if (!abs) return { x: 0, y: 0 };
    if (!parentAbs) return { x: abs.x, y: abs.y };
    return { x: abs.x - parentAbs.x, y: abs.y - parentAbs.y };
  }

  function traverseNodes(node, parentAbs = null) {
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

    // collect imageRef if exists
    if (node.fills?.length) {
      node.fills.forEach(f => {
        if (f.type === "IMAGE" && f.imageRef) {
          imageRefs.push(node.id);
        }
      });
    }

    if (node.background?.length) {
      node.background.forEach(b => {
        if (b.type === "IMAGE" && b.imageRef) {
          imageRefs.push(node.id);
        }
      });
    }

    const abs = node.absoluteBoundingBox;
    let rel = computeRelativePosition(abs, parentAbs);

    if (abs) {
      nodeInfo.styles.position = { x: rel.x, y: rel.y };
      nodeInfo.styles.size = { width: abs.width, height: abs.height };
    }

    // background solid color
    if (node.fills?.length) {
      const solidFill = node.fills.find(f => f.type === "SOLID");
      if (solidFill) {
        nodeInfo.styles.backgroundColor = figmaColorToRgba(
          solidFill.color,
          solidFill.opacity ?? 1
        );
      }
    }

    // TEXT
    if (node.type === "TEXT") {
      nodeInfo.styles.fontSize = node.style?.fontSize;
      nodeInfo.styles.fontFamily = node.style?.fontFamily;
      nodeInfo.styles.fontWeight = node.style?.fontWeight;
      nodeInfo.styles.lineHeight = node.style?.lineHeightPx;
      nodeInfo.styles.letterSpacing = node.style?.letterSpacing;

      const textFill = getVisibleColorFill(node.fills);
      let textColor = textFill
        ? figmaColorToRgba(textFill.color, textFill.opacity ?? 1)
        : "rgba(0,0,0,1)";

      let bgColor = null;
      const solidFill =
        node.background?.find(f => f.type === "SOLID") ||
        node.fills?.find(f => f.type === "SOLID");

      if (solidFill) {
        bgColor = figmaColorToRgba(
          solidFill.color,
          solidFill.opacity ?? 1
        );
      }

      textColor = ensureReadableTextColorSimple(bgColor, textColor);
      nodeInfo.styles.color = textColor;

      nodeInfo.text = node.characters;
    }

    // children
    if (node.children?.length) {
      node.children.forEach(child =>
        nodeInfo.children.push(traverseNodes(child, abs))
      );
    }

    return nodeInfo;
  }

  // traverse pages
  fileData.document.children.forEach(page => {
    designData.nodes.push(traverseNodes(page));
  });

  // Fetch URLs for all collected imageRefs
  const urlMap = await fetchImageUrls(fileId, imageRefs, token);

  // Insert URLs into nodes
  function assignUrls(node) {
    if (urlMap[node.id]) {
      node.assetUrl = urlMap[node.id];
    }
    if (node.children) {
      node.children.forEach(assignUrls);
    }
  }

  designData.nodes.forEach(assignUrls);

  fs.writeFileSync('./design.json', JSON.stringify(designData, null, 2));
  console.log("✅ design.json created with image URLs!");
}

extractFigmaStyles(config.FILE_ID, config.FIGMA_TOKEN);
