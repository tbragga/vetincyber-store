// api/calculate-shipping.js
const MELHOR_ENVIO_URL = 'https://sandbox.melhorenvio.com.br/api/v2/me'; // Use o sandbox para testes

module.exports = async (req, res) => {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  // 1. Validação dos dados de entrada
  const { cep_destino, produtos } = req.body;
  if (!cep_destino || !produtos || !produtos.length) {
    return res.status(400).json({ error: 'CEP e produtos são obrigatórios' });
  }

  // 2. Verificação das variáveis de ambiente (CRÍTICO!)
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const cepOrigem = process.env.SHIPPING_FROM_CEP;
  if (!token || !cepOrigem) {
    console.error('Erro de configuração: Token ou CEP de origem não encontrados.');
    return res.status(500).json({ error: 'Configuração de frete incompleta' });
  }

  // 3. Formatação dos produtos com dimensões padrão e validação de peso
  const products = produtos.map(prod => {
    let weight = Number(prod.weight);
    if (isNaN(weight) || weight <= 0) weight = 0.5; // Peso mínimo de 0.5kg

    return {
      id: prod.id || 1,
      width: 11,          // Largura em cm (valor padrão)
      height: 17,         // Altura em cm
      length: 11,         // Comprimento em cm
      weight: weight,
      insurance_value: 0, // Desabilitar seguro para simplificar
      quantity: prod.quantidade
    };
  });

  try {
    // 4. Chamada para a API do Melhor Envio
    const response = await fetch(`${MELHOR_ENVIO_URL}/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'VETIN CYBER (contato@vetincyber.com)' // Identifique sua aplicação
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigem },
        to: { postal_code: cep_destino },
        products: products,
        services: '1,2',      // 1=PAC, 2=SEDEX
        options: { receipt: false, own_hand: false }
      })
    });

    // 5. Tratamento da resposta da API
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP ${response.status} da Melhor Envio:`, errorText);
      return res.status(200).json([]); // Retorna array vazio, o frontend aplica fallback
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error('Resposta inesperada da API:', data);
      return res.status(200).json([]);
    }

    // 6. Filtragem e formatação das opções de frete
    const opcoes = data
      .filter(service => service.price > 0)
      .map(service => ({
        name: service.name,
        price: service.price,
        delivery_time: service.delivery_time,
        carrier: service.carrier
      }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro interno na Vercel Function:', error);
    return res.status(200).json([]); // Fallback em caso de qualquer erro inesperado
  }
};
