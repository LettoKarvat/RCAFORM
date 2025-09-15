// api/forms.ts
export const config = { runtime: "edge" }; // roda no Edge, mais rápido
import { head, put } from "@vercel/blob";

type Submission = {
  id: string;
  createdAt: string;
  data: any;
  // opcional: quem enviou
  ip?: string | null;
  ua?: string | null;
};

const JSON_PATH = "rca/data.json";
const CONTENT_TYPE = "application/json";

async function readAll(): Promise<Submission[]> {
  try {
    const meta = await head(JSON_PATH); // pega url do blob pelo pathname
    const res = await fetch(meta.downloadUrl || meta.url);
    if (!res.ok) return [];
    return (await res.json()) as Submission[];
  } catch {
    // se ainda não existe, começa vazio
    return [];
  }
}

async function writeAll(items: Submission[]) {
  await put(JSON_PATH, JSON.stringify(items, null, 2), {
    access: "public", // Blob precisa de 'public'
    allowOverwrite: true, // sobrescrever o mesmo arquivo
    addRandomSuffix: false, // mantém o mesmo path
    contentType: CONTENT_TYPE,
  });
}

function okJSON(body: any, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": CONTENT_TYPE, ...(init?.headers || {}) },
  });
}
function errJSON(status: number, message: string) {
  return okJSON({ message }, { status });
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  if (method === "GET") {
    // (opcional) bloqueio simples com senha via header
    const adminPw = (process.env.ADMIN_PASSWORD || "").trim();
    const sent = (req.headers.get("x-admin-key") || "").trim();
    if (adminPw && (!sent || sent !== adminPw)) {
      return errJSON(401, "Não autorizado");
    }
    const items = await readAll();
    return okJSON({ items, total: items.length });
  }

  if (method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errJSON(400, "JSON inválido");
    }
    if (!body || typeof body !== "object") {
      return errJSON(400, "Corpo deve ser um objeto JSON");
    }

    const items = await readAll();
    const now = new Date().toISOString();
    const newItem: Submission = {
      id:
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      createdAt: now,
      data: body,
      ip: req.headers.get("x-forwarded-for"),
      ua: req.headers.get("user-agent"),
    };
    items.push(newItem);
    await writeAll(items);
    return okJSON(newItem, { status: 201 });
  }

  if (method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  return errJSON(405, "Método não suportado");
}
