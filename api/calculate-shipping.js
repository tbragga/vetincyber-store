// api/calculate-shipping.js
const MELHOR_ENVIO_URL = 'https://sandbox.melhorenvio.com.br/api/v2/me'; // Use sandbox primeiro

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { cep_destino, produtos } = req.body;
    if (!cep_destino || !produtos || !produtos.length) {
      return res.status(400).json({ error: 'CEP e produtos são obrigatórios' });
    }

    // ===== CONFIGURAÇÕES OBRIGATÓRIAS (pegue das variáveis de ambiente) =====
    const token = process.env.MELHOR_ENVIO_TOKEN;
    const cepOrigem = process.env.SHIPPING_FROM_CEP;

    if (!token || !cepOrigem) {
      console.error('Token ou CEP de origem não configurado');
      return res.status(500).json({ error: 'Configuração de frete incompleta' });
    }

    // ===== Monta os produtos com dimensões padrão (evita erros) =====
    const products = produtos.map(prod => ({
      id: prod.id || 1,
      width: 11,          // cm
      height: 17,         // cm
      length: 11,         // cm
      weight: 0.5,        // kg (mínimo aceito)
      insurance_value: 0, // seguro desabilitado
      quantity: prod.quantidade
    }));

    // ===== Chama a API do Melhor Envio =====
    const response = await fetch(`${MELHOR_ENVIO_URL}/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'VETIN CYBER (contato@vetincyber.com)'
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigem },
        to: { postal_code: cep_destino },
        products: products,
        services: '1,2',      // 1=PAC, 2=SEDEX
        options: { receipt: false, own_hand: false }
      })
    });

    // ===== Tratamento de resposta =====
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP ${response.status}:`, errorText);
      // Retorna array vazio – o frontend usa fallback
      return res.status(200).json([]);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error('Resposta inesperada:', data);
      return res.status(200).json([]);
    }

    // Filtra apenas serviços com preço válido
    const opcoes = data
      .filter(s => s.price > 0)
      .map(s => ({
        name: s.name,
        price: s.price,
        delivery_time: s.delivery_time,
        carrier: s.carrier
      }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro interno:', error);
    // Em caso de exceção, retorna array vazio (frontend usará fallback)
    return res.status(200).json([]);
  }
};
