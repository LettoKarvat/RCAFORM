export interface FormData {
  codigoRca: string;
  numeroPedido: string;
  forma: string;
  descricaoOutros?: string;
  timestamp: string;
  id: string;
}

export interface AdminData {
  password: string;
  isAuthenticated: boolean;
}