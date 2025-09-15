import React, { useState, useEffect } from "react";
import FormularioRCA from "./components/FormularioRCA";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import { Settings } from "lucide-react";
import type { FormData } from "./types";

/* ================== CONFIG REMOTA ================== */
const API_FORMS = "/api/forms";
const ADMIN_PASSWORD = "F@ives25"; // opcional: mova p/ .env e peça no AdminLogin

type RemoteItem = {
  id: string;
  createdAt: string;
  data: any;
  ip?: string | null;
  ua?: string | null;
};
type RemoteListResponse = { items: RemoteItem[]; total: number };

function normalizeFormData(x: any): FormData {
  // garante campos básicos mesmo se vier algo faltando
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
      headers: { "content-type": "application/json" },
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

async function getRemote(): Promise<FormData[]> {
  try {
    const res = await fetch(API_FORMS, {
      method: "GET",
      headers: { "x-admin-key": ADMIN_PASSWORD },
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

/** Sobrescreve todo o arquivo remoto (PUT) */
async function putRemote(all: FormData[]) {
  try {
    const res = await fetch(API_FORMS, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-admin-key": ADMIN_PASSWORD,
      },
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
/* =================================================== */

function App() {
  const [formData, setFormData] = useState<FormData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // carrega local na inicialização
  useEffect(() => {
    const savedData = localStorage.getItem("rca_form_data");
    if (savedData) {
      try {
        const arr: any[] = JSON.parse(savedData);
        setFormData(arr.map((x) => normalizeFormData(x)));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }
  }, []);

  // helper para salvar local
  const saveLocal = (arr: FormData[]) => {
    setFormData(arr);
    localStorage.setItem("rca_form_data", JSON.stringify(arr));
  };

  // submit do formulário: salva local e remoto
  const handleFormSubmit = async (data: FormData) => {
    const normalized = normalizeFormData(data);
    const updatedData = [...formData, normalized];
    saveLocal(updatedData);

    // remoto (best-effort)
    await postRemote(normalized);
  };

  // login admin: valida senha e puxa do remoto
  const handleAdminLogin = (password: string): boolean => {
    const ok = password === ADMIN_PASSWORD;
    if (ok) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      // carrega remoto e substitui local (best-effort)
      getRemote().then((remote) => {
        if (remote.length) saveLocal(remote);
      });
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
  };

  // alterações feitas no AdminPanel (editar/excluir/limpar):
  const handleUpdateData = async (updatedData: FormData[]) => {
    const normalized = updatedData.map((x) => normalizeFormData(x));
    saveLocal(normalized);
    // tenta sincronizar remoto (PUT sobrescrevendo tudo)
    const ok = await putRemote(normalized);
    if (!ok) {
      // não trava a UI; apenas loga
      console.warn(
        "Sincronização remota falhou; dados mantidos apenas localmente."
      );
    }
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
