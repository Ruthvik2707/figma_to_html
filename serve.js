import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, "output", req.url === "/" ? "result.html" : req.url);

  const extname = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".svg": "image/svg+xml"
  };

  const contentType = mimeTypes[extname] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("File not found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(8000, () => console.log("🚀 Server running at http://localhost:8000"));
