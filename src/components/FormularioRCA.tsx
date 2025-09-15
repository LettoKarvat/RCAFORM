import React, { useState } from 'react';
import { Save, User, Hash, Radio, AlertCircle } from 'lucide-react';
import type { FormData } from '../types';

interface FormularioRCAProps {
  onFormSubmit: (data: FormData) => void;
}

const FormularioRCA: React.FC<FormularioRCAProps> = ({ onFormSubmit }) => {
  const [codigoRca, setCodigoRca] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [forma, setForma] = useState('');
  const [descricaoOutros, setDescricaoOutros] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formasDisponiveis = [
    'midia da tv',
    'radio',
    'digital',
    'instagram',
    'facebook',
    'whatsapp',
    'indicação',
    'carro',
    'outros'
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!codigoRca.trim()) {
      newErrors.codigoRca = 'Código do RCA é obrigatório';
    }

    if (!numeroPedido.trim()) {
      newErrors.numeroPedido = 'Número do pedido é obrigatório';
    }

    if (!forma) {
      newErrors.forma = 'Forma é obrigatória';
    }

    if (forma === 'outros' && !descricaoOutros.trim()) {
      newErrors.descricaoOutros = 'Descrição é obrigatória quando "outros" é selecionado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const formData: FormData = {
      id: Date.now().toString(),
      codigoRca,
      numeroPedido,
      forma,
      descricaoOutros: forma === 'outros' ? descricaoOutros : undefined,
      timestamp: new Date().toISOString()
    };

    try {
      onFormSubmit(formData);
      
      // Reset form
      setCodigoRca('');
      setNumeroPedido('');
      setForma('');
      setDescricaoOutros('');
      setErrors({});
      
      // Show success message
      alert('Dados salvos com sucesso!');
    } catch (error) {
      alert('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Radio className="w-8 h-8" />
            Formulário RCA
          </h1>
          <p className="text-blue-100 mt-2">Preencha as informações do pedido</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Código do RCA */}
          <div className="space-y-2">
            <label htmlFor="codigoRca" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              CÓDIGO DO RCA
            </label>
            <input
              type="text"
              id="codigoRca"
              value={codigoRca}
              onChange={(e) => setCodigoRca(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.codigoRca ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Digite o código do RCA"
            />
            {errors.codigoRca && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.codigoRca}
              </p>
            )}
          </div>

          {/* Número do Pedido */}
          <div className="space-y-2">
            <label htmlFor="numeroPedido" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              NÚMERO DO PEDIDO
            </label>
            <input
              type="text"
              id="numeroPedido"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.numeroPedido ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Digite o número do pedido"
            />
            {errors.numeroPedido && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.numeroPedido}
              </p>
            )}
          </div>

          {/* Forma */}
          <div className="space-y-2">
            <label htmlFor="forma" className="block text-sm font-semibold text-gray-700">
              FORMA QUE CHEGOU NA LOJA
            </label>
            <select
              id="forma"
              value={forma}
              onChange={(e) => setForma(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.forma ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione uma opção</option>
              {formasDisponiveis.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao.charAt(0).toUpperCase() + opcao.slice(1)}
                </option>
              ))}
            </select>
            {errors.forma && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.forma}
              </p>
            )}
          </div>

          {/* Descrição Outros */}
          {forma === 'outros' && (
            <div className="space-y-2">
              <label htmlFor="descricaoOutros" className="block text-sm font-semibold text-gray-700">
                DESCREVA A FORMA
              </label>
              <textarea
                id="descricaoOutros"
                value={descricaoOutros}
                onChange={(e) => setDescricaoOutros(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.descricaoOutros ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Descreva como o cliente chegou na loja"
              />
              {errors.descricaoOutros && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.descricaoOutros}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                SALVAR
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormularioRCA;