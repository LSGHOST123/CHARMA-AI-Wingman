const TARGET_BASE_URL = 'https://generativelanguage.googleapis.com'; 
const ALPHA_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzmkNoWvTNRLhW-rNp7WijNAV_9kv5gez6khybt79VequBOfmmeGLHH_P07JIjDUsZ7nQ/exec';

/**
 * fetchWithProxy: Helper universal para bypass de CORS.
 * Resolve automaticamente problemas de query string e respostas mistas (JSON/Text).
 */
export const fetchWithProxy = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  // 1. Constrói a URL alvo garantindo a estrutura correta de separadores (? e &)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let fullTargetUrl = TARGET_BASE_URL + cleanEndpoint;

  // Corrige duplicidade de '?' se o endpoint já vier com parâmetros mal formatados
  if ((fullTargetUrl.match(/\?/g) || []).length > 1) {
    const parts = fullTargetUrl.split('?');
    fullTargetUrl = parts[0] + '?' + parts.slice(1).join('&');
  }

  // 2. Monta a URL do Proxy
  // Nota: No ambiente AI Studio, usamos o Alpha Proxy para garantir tráfego estável
  const url = `${ALPHA_PROXY_URL}?url=${encodeURIComponent(fullTargetUrl)}`;

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    }
  };

  // Regra Anti-404 para métodos GET
  if (options?.method === 'GET' || !options?.method) {
    const cleanHeaders = { ...fetchOptions.headers } as Record<string, string>;
    delete cleanHeaders['Content-Type'];
    fetchOptions.headers = cleanHeaders;
  }

  try {
    const response = await fetch(url, fetchOptions);
    const textData = await response.text();
    
    try {
      // Tenta retornar como objeto se for JSON
      return JSON.parse(textData) as T;
    } catch {
      // Caso contrário, retorna o conteúdo bruto
      return textData as unknown as T;
    }
  } catch (err) {
    console.error("Alpha Proxy Error:", err);
    throw err;
  }
};
