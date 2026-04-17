// api/calculate-shipping.js
const USE_SANDBOX = process.env.MELHOR_ENVIO_USE_SANDBOX === 'true';
const MELHOR_ENVIO_URL = USE_SANDBOX 
  ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
  : 'https://melhorenvio.com.br/api/v2/me';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { cep_destino, produtos } = req.body;
    if (!cep_destino || !produtos?.length) {
      return res.status(400).json({ error: 'CEP e produtos são obrigatórios' });
    }

    const products = produtos.map(prod => ({
      id: prod.id || 1,
      width: prod.width || 11,
      height: prod.height || 17,
      length: prod.length || 11,
      weight: prod.weight || 0.5,
      insurance_value: parseFloat(prod.price.replace('R$', '').replace(',', '.').trim()) || 0,
      quantity: prod.quantidade
    }));

    const response = await fetch(`${MELHOR_ENVIO_URL}/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'VETIN CYBER (contato@vetincyber.com)'
      },
      body: JSON.stringify({
        from: { postal_code: process.env.SHIPPING_FROM_CEP },
        to: { postal_code: cep_destino },
        products: products,
        services: '1,2',
        options: { receipt: false, own_hand: false }
      })
    });

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error(data.message || 'Erro na cotação');

    const opcoes = data.map(service => ({
      name: service.name,
      price: service.price,
      delivery_time: service.delivery_time,
      carrier: service.carrier
    }));

    res.status(200).json(opcoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
};
