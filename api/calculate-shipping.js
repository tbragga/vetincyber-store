// api/calculate-shipping.js
const MELHOR_ENVIO_URL = 'https://melhorenvio.com.br/api/v2/me';

module.exports = async (req, res) => {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    // 1. Validação dos dados de entrada
    const { cep_destino, produtos } = req.body;
    if (!cep_destino || !produtos || !produtos.length) {
      return res.status(400).json({ error: 'CEP e produtos são obrigatórios' });
    }

    // 2. Verificar se o token do Melhor Envio está configurado
    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      console.error('Token do Melhor Envio não configurado');
      return res.status(500).json({ error: 'Token de frete não configurado' });
    }

    // 3. Verificar se o CEP de origem está configurado
    const fromCep = process.env.SHIPPING_FROM_CEP;
    if (!fromCep) {
      console.error('CEP de origem não configurado');
      return res.status(500).json({ error: 'CEP de origem não configurado' });
    }

    // 4. Formatar produtos para o payload da Melhor Envio
    const products = produtos.map(prod => {
      // Converte preço de "R$ 299,00" para número decimal
      let price = prod.price;
      if (typeof price === 'string') {
        price = price.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      }
      const valorSeguro = parseFloat(price) || 0;
      
      return {
        id: prod.id || 1,
        width: prod.width || 11,
        height: prod.height || 17,
        length: prod.length || 11,
        weight: prod.weight || 0.5,
        insurance_value: valorSeguro,
        quantity: prod.quantidade
      };
    });

    // 5. Chamada para a API do Melhor Envio
    const response = await fetch(`${MELHOR_ENVIO_URL}/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'VETIN CYBER (contato@vetincyber.com)'
      },
      body: JSON.stringify({
        from: { postal_code: fromCep },
        to: { postal_code: cep_destino },
        products: products,
        services: '1,2', // 1 = PAC, 2 = SEDEX
        options: {
          receipt: false,
          own_hand: false
        }
      })
    });

    // 6. Tratar resposta da API
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta da Melhor Envio:', response.status, errorText);
      return res.status(500).json({ error: `Erro na API de frete: ${response.status}` });
    }

    const data = await response.json();
    
    // 7. Verificar se a resposta contém um array
    if (!Array.isArray(data)) {
      console.error('Resposta inesperada da Melhor Envio:', data);
      return res.status(500).json({ error: 'Formato de resposta inválido' });
    }

    // 8. Formatar opções de frete para o frontend
    const opcoes = data.map(service => ({
      name: service.name,
      price: service.price,
      delivery_time: service.delivery_time,
      carrier: service.carrier
    }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro interno ao calcular frete:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
