import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve index.html with server-side env vars injected as window globals
  app.use("/{*path}", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(indexPath, "utf-8");

    const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
    const injection = `<script>window.__GMAPS_KEY__ = ${JSON.stringify(mapsKey)};</script>`;
    html = html.replace("</head>", `${injection}</head>`);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
}
