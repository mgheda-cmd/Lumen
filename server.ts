import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy API Spot Binance
  app.use("/api/v3", async (req, res) => {
    const subpath = req.url;
    try {
      const url = `https://data-api.binance.vision/api/v3${subpath}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      // Secours sur api.binance.com
      const mainUrl = `https://api.binance.com/api/v3${subpath}`;
      const mainResp = await fetch(mainUrl);
      const data = await mainResp.json();
      return res.status(mainResp.status).json(data);
    } catch (error: any) {
      try {
        const mainUrl = `https://api.binance.com/api/v3${subpath}`;
        const mainResp = await fetch(mainUrl);
        const data = await mainResp.json();
        return res.status(mainResp.status).json(data);
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
  });

  // Proxy API Perp/Futures Binance
  app.use("/fapi/v1", async (req, res) => {
    const subpath = req.url;
    try {
      const url = `https://fapi.binance.com/fapi/v1${subpath}`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // API Gmail : récupération des e-mails contenant un indicateur / Pine Script
  app.post("/api/gmail/fetch-indicators", async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: "Jeton d'accès manquant" });
    }

    try {
      // 1. Rechercher les messages récents contenant 'indicator', 'Pine Script', 'TradingView' ou '//@version'
      const query = encodeURIComponent("indicator OR PineScript OR TradingView OR //@version");
      const listResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=15`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!listResp.ok) {
        const errData = await listResp.json();
        return res.status(listResp.status).json({ error: errData.error?.message || "Erreur Gmail API" });
      }

      const listData = await listResp.json();
      const messages = listData.messages || [];

      // Fetch details for each message
      const emails = [];
      for (const msg of messages) {
        const msgResp = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (msgResp.ok) {
          const detail = await msgResp.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(Sans sujet)";
          const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
          const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

          // Extraire le corps du texte
          let bodyText = detail.snippet || "";
          const getBody = (part: any): string => {
            if (!part) return "";
            if (part.body && part.body.data) {
              try {
                return Buffer.from(part.body.data, "base64url").toString("utf-8");
              } catch (e) {
                return "";
              }
            }
            if (part.parts && Array.isArray(part.parts)) {
              return part.parts.map(getBody).join("\n");
            }
            return "";
          };

          if (detail.payload) {
            const fullText = getBody(detail.payload);
            if (fullText) bodyText = fullText;
          }

          emails.push({
            id: msg.id,
            subject,
            from,
            date,
            snippet: detail.snippet,
            body: bodyText,
          });
        }
      }

      return res.json({ emails });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Serveur Vite en développement ou fichiers statiques en production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Lumen en ligne sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
