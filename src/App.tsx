import React, { useState, useEffect } from "react";
import FormularioRCA from "./components/FormularioRCA";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import { Settings } from "lucide-react";
import type { FormData } from "./types";

function App() {
  const [formData, setFormData] = useState<FormData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const ADMIN_PASSWORD = "F@ives25";

  useEffect(() => {
    // Load data from localStorage
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
