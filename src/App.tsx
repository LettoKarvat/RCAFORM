import React, { useState } from "react";
import FormularioRCA from "./components/FormularioRCA";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import { Settings } from "lucide-react";
import type { FormData } from "./types";

/* ================== REMOTO ================== */
// Base via env (VITE_API_BASE) ou fallback no ngrok informado.
// Também remove uma letra "v" acidental no final (.appv → .app).
const RAW_BASE =
  (import.meta?.env?.VITE_API_BASE as string | undefined) ??
  "https://45c7a7634d0e.ngrok-free.appv";
const API_BASE = RAW_BASE.replace(/\/+$/, "").replace(/v$/, "");
const API_FORMS = `${API_BASE}/api/forms`;
const ADMIN_PASSWORD = "F@ives25"; // deve bater com o backend

// Header para pular o aviso do ngrok
const IS_NGROK = API_BASE.toLowerCase().includes("ngrok");
function makeHeaders(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { ...extra };
  if (IS_NGROK) h["ngrok-skip-browser-warning"] = "true";
  return h;
}

type RemoteItem = {
  id: string;
  createdAt: string;
  data: any;
  ip?: string | null;
  ua?: string | null;
};
type RemoteListResponse = { items: RemoteItem[]; total: number };

function normalizeFormData(x: any): FormData {
  const id =
    x?.id ||
    x?.data?.id ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp =
    x?.timestamp ||
    x?.data?.timestamp ||
    x?.createdAt ||
    new Date().toISOString();

  return {
    id,
    timestamp,
    codigoRca: x?.codigoRca ?? x?.data?.codigoRca ?? "",
    numeroPedido: x?.numeroPedido ?? x?.data?.numeroPedido ?? "",
    forma: x?.forma ?? x?.data?.forma ?? "",
    descricaoOutros: x?.descricaoOutros ?? x?.data?.descricaoOutros ?? "",
  } as FormData;
}

async function postRemote(item: FormData) {
  try {
    const res = await fetch(API_FORMS, {
      method: "POST",
      headers: makeHeaders({ "content-type": "application/json" }),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.warn("POST remoto falhou:", j);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("POST remoto erro:", e);
    return false;
  }
}

async function getRemote(adminKey: string): Promise<FormData[]> {
  try {
    const res = await fetch(API_FORMS, {
      method: "GET",
      headers: makeHeaders({ "x-admin-key": adminKey }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.warn("GET remoto falhou:", j);
      return [];
    }
    const j = (await res.json()) as RemoteListResponse;
    return (j.items || []).map((it) => normalizeFormData(it));
  } catch (e) {
    console.warn("GET remoto erro:", e);
    return [];
  }
}

async function putRemote(all: FormData[], adminKey: string) {
  try {
    const res = await fetch(API_FORMS, {
      method: "PUT",
      headers: makeHeaders({
        "content-type": "application/json",
        "x-admin-key": adminKey,
      }),
      body: JSON.stringify({ items: all }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.warn("PUT remoto falhou:", j);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("PUT remoto erro:", e);
    return false;
  }
}
/* =========================================== */

function App() {
  const [formData, setFormData] = useState<FormData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Enviar formulário: só remoto (sem localStorage)
  const handleFormSubmit = async (data: FormData) => {
    const normalized = normalizeFormData(data);
    const ok = await postRemote(normalized);
    if (!ok) alert("Falha ao enviar dados. Verifique a rede/servidor.");
  };

  // Login admin: carrega do remoto e mostra painel
  const handleAdminLogin = (password: string): boolean => {
    const ok = password === ADMIN_PASSWORD;
    if (ok) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      getRemote(password).then((remote) => setFormData(remote));
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    setFormData([]);
  };

  // Atualizações vindas do painel (editar/excluir/limpar) -> PUT remoto
  const handleUpdateData = async (updatedData: FormData[]) => {
    const ok = await putRemote(updatedData, ADMIN_PASSWORD);
    if (ok) setFormData(updatedData);
    else alert("Não consegui salvar no servidor. Tente novamente.");
  };

  if (isAdmin) {
    return (
      <AdminPanel
        data={formData}
        onLogout={handleAdminLogout}
        onUpdateData={handleUpdateData}
      />
    );
  }

  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute top-8 left-8">
          <button
            onClick={() => setShowAdminLogin(false)}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Voltar ao formulário
          </button>
        </div>
        <AdminLogin onLogin={handleAdminLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Admin Access Button */}
      <div className="absolute top-8 right-8">
        <button
          onClick={() => setShowAdminLogin(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg"
          title="Acesso Administrativo"
        >
          <Settings className="w-5 h-5" />
          Admin
        </button>
      </div>

      <div className="container mx-auto py-12">
        <FormularioRCA onFormSubmit={handleFormSubmit} />
      </div>

      {/* Footer */}
      <div className="text-center text-gray-600 text-sm py-8">
        <p>Sistema de Coleta de Dados RCA © 2025</p>
      </div>
    </div>
  );
}

export default App;
