// src/lib/jsonbin.ts
// Persistência remota no JSONBin v3 + fallback localStorage

import type { FormData } from "@/types";

const API = "https://api.jsonbin.io/v3";

// ⚠️ Em app 100% front-end, chaves ficam expostas.
// Use .env.local para não commitar em git.
const MASTER_KEY =
  import.meta.env.VITE_JSONBIN_MASTER_KEY ||
  "$2a$10$vBc/nuqClM/P9OmnIwOQ0u.242VrsOTk2SmQKmxtrsEueNNUccg36"; // <- sua X-Master-Key
const ACCESS_KEY =
  import.meta.env.VITE_JSONBIN_ACCESS_KEY ||
  "$2a$10$RAIxoWEViC9fJvh9jLYGz.3FvRAflgnWxjT06UBV9G6QEfXMNaMlS"; // <- sua X-Access-Key (use o hash, não o nome)

const BIN_ID_ENV = import.meta.env.VITE_JSONBIN_BIN_ID || null; // se você já tiver um bin
const LS_BIN_ID_KEY = "rca_jsonbin_id";
const LS_DATA_KEY = "rca_form_data";

type JsonBinCreateResp = {
  record: any;
  metadata: { id: string };
};
type JsonBinGetResp = {
  record: any;
  metadata: { id: string; version: number };
};

function headersJSON() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (MASTER_KEY) h["X-Master-Key"] = MASTER_KEY;
  if (ACCESS_KEY) h["X-Access-Key"] = ACCESS_KEY;
  return h;
}

function getStoredBinId(): string | null {
  return BIN_ID_ENV || localStorage.getItem(LS_BIN_ID_KEY);
}

function storeBinId(id: string) {
  localStorage.setItem(LS_BIN_ID_KEY, id);
}

export function loadLocal(): FormData[] {
  const raw = localStorage.getItem(LS_DATA_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
export function saveLocal(data: FormData[]) {
  localStorage.setItem(LS_DATA_KEY, JSON.stringify(data));
}

async function createBin(initial: FormData[]): Promise<string> {
  const resp = await fetch(`${API}/b`, {
    method: "POST",
    headers: headersJSON(),
    body: JSON.stringify(initial ?? []),
  });
  if (!resp.ok) throw new Error(`JSONBin create error: ${resp.status}`);
  const json = (await resp.json()) as JsonBinCreateResp;
  const id = json?.metadata?.id;
  if (!id) throw new Error("JSONBin create: metadata.id ausente");
  storeBinId(id);
  return id;
}

async function putBin(binId: string, data: FormData[]): Promise<void> {
  const resp = await fetch(`${API}/b/${binId}`, {
    method: "PUT",
    headers: headersJSON(),
    body: JSON.stringify(data ?? []),
  });
  if (!resp.ok) throw new Error(`JSONBin update error: ${resp.status}`);
}

async function getBin(binId: string): Promise<FormData[]> {
  const resp = await fetch(`${API}/b/${binId}/latest`, {
    headers: headersJSON(),
  });
  if (!resp.ok) throw new Error(`JSONBin get error: ${resp.status}`);
  const json = (await resp.json()) as JsonBinGetResp;
  const record = json?.record;
  return Array.isArray(record) ? (record as FormData[]) : [];
}

/** Carrega do JSONBin (se existir). Se não houver bin, retorna null (para usar fallback local). */
export async function loadRemoteOrNull(): Promise<FormData[] | null> {
  const binId = getStoredBinId();
  if (!binId) return null;
  try {
    const data = await getBin(binId);
    // espelha local
    saveLocal(data);
    return data;
  } catch {
    return null;
  }
}

/** Salva tudo no JSONBin (cria se não existir) e espelha local. */
export async function saveRemoteAll(data: FormData[]): Promise<void> {
  let binId = getStoredBinId();
  try {
    if (!binId) {
      binId = await createBin(data ?? []);
    } else {
      await putBin(binId, data ?? []);
    }
    saveLocal(data ?? []);
  } catch (e) {
    // fallback só local se der erro remoto
    console.warn("Falha na persistência remota, usando localStorage:", e);
    saveLocal(data ?? []);
  }
}

/** Acrescenta um item e persiste remoto (ou cria bin) + local. */
export async function appendRemote(item: FormData, current: FormData[]) {
  const updated = [...(current ?? []), item];
  await saveRemoteAll(updated);
  return updated;
}
