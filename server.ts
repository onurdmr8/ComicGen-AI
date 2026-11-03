import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import * as geminiBackend from "./server/geminiBackend";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === "production" || (typeof __filename !== "undefined" && __filename.endsWith(".cjs"));
  if (isProduction && !process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
  }

  // Enable large payloads for image base64 transfers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper to resolve static assets between dist and public
  const publicPath = path.join(process.cwd(), "public");
  const distPath = path.join(process.cwd(), "dist");
  const resolveStaticFile = (relName: string) => {
    const fromDist = path.join(distPath, relName);
    if (fs.existsSync(fromDist)) return fromDist;
    return path.join(publicPath, relName);
  };

  // Serve public directory assets (PWA manifest, service worker, icons, favicons)
  app.use(express.static(publicPath));

  app.get("/manifest.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.sendFile(resolveStaticFile("manifest.json"));
  });

  app.get("/sw.js", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    res.sendFile(resolveStaticFile("sw.js"));
  });

  // API Routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/gemini/:action", async (req: Request, res: Response) => {
    const { action } = req.params;
    const body = req.body || {};
    const userApiKey = ((req.headers["x-gemini-api-key"] || req.headers["x-user-api-key"]) as string)?.trim() || body.userApiKey?.trim();
    const togetherApiKey = ((req.headers["x-together-api-key"]) as string)?.trim() || body.togetherApiKey?.trim();
    const falApiKey = ((req.headers["x-fal-api-key"]) as string)?.trim() || body.falApiKey?.trim();
    const pollinationsApiKey = ((req.headers["x-pollinations-api-key"]) as string)?.trim() || body.pollinationsApiKey?.trim();

    return geminiBackend.geminiRequestContext.run({ apiKey: userApiKey, togetherApiKey, falApiKey, pollinationsApiKey }, async () => {
      try {
        let result: any;
        switch (action) {
          case "validateApiKey":
            result = await geminiBackend.validateApiKey(body.testKey || userApiKey);
            break;
          case "validateTogetherApiKey":
            result = await geminiBackend.validateTogetherApiKey(body.testKey || togetherApiKey);
            break;
          case "validateFalApiKey":
            result = await geminiBackend.validateFalApiKey(body.testKey || falApiKey);
            break;
          case "validatePollinationsApiKey":
            result = await geminiBackend.validatePollinationsApiKey(body.testKey || pollinationsApiKey);
            break;
          case "generateComicScript":
            result = await geminiBackend.generateComicScript(body.config, body.history || [], body.userDirection || "");
            break;
        case "generateFullPageImage":
          result = await geminiBackend.generateFullPageImage(
            body.panels,
            body.style,
            body.cast,
            body.layoutType,
            body.renderQuality,
            body.locations,
            body.colorPalette,
            body.lightingMood,
            body.consistencyLock,
            body.imageProvider,
            body.pollinationsModel
          );
          break;
        case "generateSinglePanelImage":
          result = await geminiBackend.generateSinglePanelImage(
            body.panelPrompt,
            body.style,
            body.cast,
            body.renderQuality,
            body.directorConfig,
            body.locations,
            body.colorPalette,
            body.lightingMood,
            body.consistencyLock,
            body.characterNames,
            body.contentRating,
            body.modestyTechnique,
            body.topic,
            body.tone,
            body.imageProvider,
            body.pollinationsModel
          );
          break;
        case "generateRandomComicConfig":
          result = await geminiBackend.generateRandomComicConfig();
          break;
        case "generateCharacterAvatar":
          result = await geminiBackend.generateCharacterAvatar(
            body.name,
            body.visualManifest,
            body.style,
            body.usePaidApi,
            body.imageProvider,
            body.pollinationsModel
          );
          break;
        case "generateVisualManifest":
          result = await geminiBackend.generateVisualManifest(body.name, body.description, body.style);
          break;
        case "generateCharacterStyleSheet":
          result = await geminiBackend.generateCharacterStyleSheet(body.name, body.description, body.style);
          break;
        case "generateCharacterVariation":
          result = await geminiBackend.generateCharacterVariation(
            body.baseCharacter,
            body.variationType,
            body.customPrompt,
            body.style,
            body.usePaidApi,
            body.imageProvider,
            body.pollinationsModel
          );
          break;
        case "generateLocationVisualManifest":
          result = await geminiBackend.generateLocationVisualManifest(body.name, body.description, body.type, body.style);
          break;
        case "generateLocationConceptArt":
          result = await geminiBackend.generateLocationConceptArt(
            body.name,
            body.description,
            body.type,
            body.style,
            body.visualManifest,
            body.usePaidApi,
            body.imageProvider,
            body.pollinationsModel
          );
          break;
        case "extractNarrativeMemoryUpdates":
          result = await geminiBackend.extractNarrativeMemoryUpdates(
            body.pagePanels,
            body.pageNumber,
            body.cast,
            body.currentMemory
          );
          break;
        case "editPanelImageInpainting":
          result = await geminiBackend.editPanelImageInpainting(
            body.originalImageUrl,
            body.instructionPrompt,
            body.maskOverlayImageUrl,
            body.style,
            body.cast,
            body.renderQuality,
            body.usePaidApi,
            body.imageProvider
          );
          break;
        default:
          return res.status(404).json({ error: `Bilinmeyen Gemini aksiyonu: ${action}` });
      }

      return res.json({ success: true, data: result });
    } catch (error: any) {
      console.error(`Gemini API route error on ${action}:`, error);
      const errorMessage = error?.message || "Sunucuda beklenmeyen bir hata oluştu.";
      return res.status(500).json({ 
        error: errorMessage, 
        details: error?.stack || String(error) 
      });
    }
    });
  });

  // Vite middleware for development or static build for production
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req: Request, res: Response, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api/")) {
        return res.sendFile(path.join(distPath, "index.html"));
      }
      next();
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ComicGen-AI] Server running at http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || "production"})`);
  });

  // Graceful shutdown for Render deployment lifecycle
  const handleShutdown = (signal: string) => {
    console.log(`[ComicGen-AI] ${signal} received. Closing HTTP server gracefully...`);
    server.close(() => {
      console.log("[ComicGen-AI] HTTP server closed cleanly.");
      process.exit(0);
    });
    // Force close after 10s if connections remain
    setTimeout(() => {
      console.warn("[ComicGen-AI] Forcing process exit after timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

startServer();
