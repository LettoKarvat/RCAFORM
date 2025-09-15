// api/forms.ts
// ✅ Node.js runtime (Serverless) — funciona com @vercel/blob e process.env
export const config = { runtime: "nodejs" };

// Silencia o TS sem precisar instalar @types/node
// (se quiser, pode instalar: pnpm add -D @types/node e remover a linha abaixo)
declare const process: any;

import { head, put } from "@vercel/blob";

type Submission = {
  id: string;
  createdAt: string;
  data: any;
  ip?: string | null;
  ua?: string | null;
};

const JSON_PATH = "rca/data.json";
const CONTENT_TYPE = "application/json";

async function readAll(): Promise<Submission[]> {
  try {
    const meta: any = await head(JSON_PATH);
    const url = meta.downloadUrl || meta.url;
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as Submission[];
  } catch {
    return [];
  }
}

async function writeAll(items: Submission[]) {
  await put(JSON_PATH, JSON.stringify(items, null, 2), {
    access: "public",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: CONTENT_TYPE,
  });
}

function okJSON(res: any, body: any, status = 200) {
  res
    .status(status)
    .setHeader("content-type", CONTENT_TYPE)
    .send(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  const method = (req.method || "GET").toUpperCase();

  if (method === "GET") {
    // proteção simples via header x-admin-key
    const adminPw = (process?.env?.ADMIN_PASSWORD || "").trim();
    const sent = String(req.headers["x-admin-key"] || "").trim();
    if (adminPw && (!sent || sent !== adminPw)) {
      return okJSON(res, { message: "Não autorizado" }, 401);
    }
    const items = await readAll();
    return okJSON(res, { items, total: items.length });
  }

  if (method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return okJSON(res, { message: "JSON inválido" }, 400);
      }
    }
    if (!body || typeof body !== "object") {
      return okJSON(res, { message: "Corpo deve ser um objeto JSON" }, 400);
    }

    const items = await readAll();
    const now = new Date().toISOString();
    const newItem: Submission = {
      id:
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      createdAt: now,
      data: body,
      ip: (req.headers["x-forwarded-for"] as string) || null,
      ua: (req.headers["user-agent"] as string) || null,
    };
    items.push(newItem);
    await writeAll(items);
    return okJSON(res, newItem, 201);
  }

  if (method === "PUT") {
    // sobrescreve o arquivo com a lista inteira enviada
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return okJSON(res, { message: "JSON inválido" }, 400);
      }
    }
    if (!body || typeof body !== "object" || !Array.isArray(body.items)) {
      return okJSON(res, { message: "Esperado { items: [...] }" }, 400);
    }

    const now = new Date().toISOString();
    const items: Submission[] = body.items.map((it: any) => ({
      id:
        String(it?.id) ||
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      createdAt: String(it?.timestamp || it?.createdAt || now),
      data: it,
    }));

    await writeAll(items);
    return okJSON(res, { saved: items.length });
  }

  if (method === "OPTIONS") return res.status(204).end();

  res.setHeader("allow", "GET,POST,PUT,OPTIONS");
  return okJSON(res, { message: "Método não suportado" }, 405);
}
