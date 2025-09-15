import React, { useEffect, useRef, useState } from "react";
import FormularioRCA from "./components/FormularioRCA";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import { Settings } from "lucide-react";
import type { FormData } from "./types";

/* ======= GITHUB (SEM .env) ======= */
const GH_OWNER = "SEU_USER_OU_ORG"; // ex.: "wellintonkarvat"
const GH_REPO = "SEU_REPO"; // ex.: "formulario-italo"
const GH_TOKEN = "SEU_TOKEN_PAT_COM_SCOPE_repo";
const GH_BRANCH = "main";
const GH_PATH = "src/dados/form.js"; // conforme seu print

/* ======= helpers base64 unicode-safe ======= */
const b64e = (s: string) => btoa(unescape(encodeURIComponent(s)));
const b64d = (b: string) => decodeURIComponent(escape(atob(b)));
const ghHeaders: HeadersInit = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: "application/vnd.github+json",
};

/* ======= LER do GitHub ======= */
async function ghReadAll(): Promise<{ data: FormData[]; sha: string | null }> {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
  const r = await fetch(url, { headers: ghHeaders });
  if (r.status === 404) {
    // Arquivo ainda não existe: começamos vazio
    return { data: [], sha: null };
  }
  if (!r.ok) throw new Error(`GH GET ${r.status}`);
  const j = await r.json();

  const raw = j?.content ? b64d(String(j.content).replace(/\n/g, "")) : "";

  // seu arquivo é .js com "export default [...]"
  let jsonText = raw.trim();
  if (GH_PATH.endsWith(".js")) {
    jsonText = jsonText
      .replace(/^export\s+default\s+/, "")
      .replace(/;?\s*$/, "");
  }

  let arr: any[] = [];
  try {
    const parsed = JSON.parse(jsonText || "[]");
    arr = Array.isArray(parsed) ? parsed : [];
  } catch {
    arr = [];
  }
  return { data: arr as FormData[], sha: j?.sha || null };
}

/* ======= ESCREVER (commit) no GitHub ======= */
async function ghWriteAll(
  all: FormData[],
  sha: string | null
): Promise<string | null> {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
  const bodyContent = GH_PATH.endsWith(".js")
    ? `export default ${JSON.stringify(all, null, 2)};\n`
    : JSON.stringify(all, null, 2);

  const payload: any = {
    message: "chore(data): update form.js",
    content: b64e(bodyContent),
    branch: GH_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const r = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`GH PUT ${r.status}`);
  const j = await r.json();
  return j?.content?.sha || null;
}

function App() {
  const [formData, setFormData] = useState<FormData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const ghShaRef = useRef<string | null>(null);

  const ADMIN_PASSWORD = "F@ives25";

  // Carrega do GitHub ao iniciar
  useEffect(() => {
    (async () => {
      try {
        const { data, sha } = await ghReadAll();
        ghShaRef.current = sha;
        setFormData(data);
      } catch (e) {
        console.error(e);
        setErr(
          "Erro ao carregar do GitHub. Confira OWNER/REPO/TOKEN/BRANCH/PATH e se o arquivo existe (src/dados/form.js)."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persistência central (SEM localStorage)
  const persistAll = async (all: FormData[]) => {
    setFormData(all);
    try {
      // tenta commit com SHA atual
      ghShaRef.current = await ghWriteAll(all, ghShaRef.current);
    } catch (e1) {
      // conflito de SHA? relê e tenta de novo
      try {
        const { sha } = await ghReadAll();
        ghShaRef.current = await ghWriteAll(all, sha);
      } catch (e2) {
        console.error(e2);
        setErr("Falha ao salvar no GitHub.");
      }
    }
  };

  // Recebe do formulário
  const handleFormSubmit = async (data: FormData) => {
    const updated = [...formData, data];
    await persistAll(updated);
  };

  // Login admin
  const handleAdminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      return true;
    }
    return false;
  };
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
  };

  // Admin edita / apaga
  const handleUpdateData = async (updatedData: FormData[]) => {
    await persistAll(updatedData);
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center">Carregando…</div>
    );
  if (err)
    return (
      <div className="min-h-screen grid place-items-center text-red-600">
        {err}
      </div>
    );

  if (isAdmin) {
    return (
      <div className="min-h-screen">
        <AdminPanel
          data={formData}
          onLogout={handleAdminLogout}
          onUpdateData={handleUpdateData}
        />
      </div>
    );
  }

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowAdminLogin(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          title="Acesso Administrativo"
        >
          <Settings className="w-5 h-5" />
          Admin
        </button>
      </div>

      <div className="container mx-auto py-6">
        <FormularioRCA onFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}

export default App;
