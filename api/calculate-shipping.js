// api/calculate-shipping.js
const USE_SANDBOX = process.env.MELHOR_ENVIO_SANDBOX === 'true';
const MELHOR_ENVIO_URL = USE_SANDBOX
  ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
  : 'https://melhorenvio.com.br/api/v2/me';

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

    const token = process.env.MELHOR_ENVIO_TOKEN;
    const cepOrigem = process.env.SHIPPING_FROM_CEP;
    if (!token || !cepOrigem) {
      console.error('Token ou CEP de origem não configurado');
      // Fallback: frete fixo
      return res.status(200).json([{ name: "PAC (fixo)", price: 15.00, delivery_time: 5, carrier: "Correios" }]);
    }

    const products = produtos.map(prod => ({
      id: prod.id || 1,
      width: 11,
      height: 17,
      length: 11,
      weight: prod.weight || 0.5,
      insurance_value: 0,
      quantity: prod.quantidade
    }));

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
        services: '1,2',
        options: { receipt: false, own_hand: false }
      })
    });

    if (!response.ok) {
      console.error('Erro HTTP Melhor Envio:', await response.text());
      return res.status(200).json([{ name: "PAC (fixo)", price: 15.00, delivery_time: 5, carrier: "Correios" }]);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json([{ name: "PAC (fixo)", price: 15.00, delivery_time: 5, carrier: "Correios" }]);
    }

    const opcoes = data.map(s => ({
      name: s.name,
      price: s.price,
      delivery_time: s.delivery_time,
      carrier: s.carrier
    }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro na função de frete:', error);
    return res.status(200).json([{ name: "PAC (fixo)", price: 15.00, delivery_time: 5, carrier: "Correios" }]);
  }
};
