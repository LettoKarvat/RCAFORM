import React, { useState, useEffect } from "react";
import FormularioRCA from "./components/FormularioRCA";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import { Settings } from "lucide-react";
import type { FormData } from "./types";
import logo from "./assets/faiveslogo.png"; // ⬅️ import da logo

function App() {
  const [formData, setFormData] = useState<FormData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const ADMIN_PASSWORD = "F@ives25";

  useEffect(() => {
    const savedData = localStorage.getItem("rca_form_data");
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }
  }, []);

  const handleFormSubmit = (data: FormData) => {
    const updatedData = [...formData, data];
    setFormData(updatedData);
    localStorage.setItem("rca_form_data", JSON.stringify(updatedData));
  };

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

  const handleUpdateData = (updatedData: FormData[]) => {
    setFormData(updatedData);
    localStorage.setItem("rca_form_data", JSON.stringify(updatedData));
  };

  if (isAdmin) {
    // (opcional) Header com logo também no painel admin
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto pt-8 pb-2">
          <img
            src={logo}
            alt="Faives"
            className="mx-auto h-16 md:h-20 object-contain select-none"
            draggable={false}
          />
        </div>
        <AdminPanel
          data={formData}
          onLogout={handleAdminLogout}
          onUpdateData={handleUpdateData}
        />
      </div>
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

        {/* Logo no topo da tela de login admin */}
        <div className="container mx-auto pt-12 pb-4">
          <img
            src={logo}
            alt="Faives"
            className="mx-auto h-20 md:h-24 object-contain select-none"
            draggable={false}
          />
        </div>

        <AdminLogin onLogin={handleAdminLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Botão Admin */}
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

      {/* Logo no topo do formulário */}
      <div className="container mx-auto pt-12 pb-4">
        <img
          src={logo}
          alt="Faives"
          className="mx-auto h-20 md:h-24 object-contain select-none"
          draggable={false}
        />
      </div>

      <div className="container mx-auto py-6">
        <FormularioRCA onFormSubmit={handleFormSubmit} />
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-sm text-gray-500">
        Desenvolvido por{" "}
        <span className="text-blue-600 font-medium">
          Faives soluções em tecnologia
        </span>{" "}
        • © 2025
      </div>
    </div>
  );
}

export default App;
