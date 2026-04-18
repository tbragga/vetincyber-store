import axios from 'axios';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { cep_destino, products } = req.body;

    // Validação mínima
    if (!cep_destino || cep_destino.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido' });
    }

    // CEP de origem fixo (pode vir do ambiente)
    const cep_origem = process.env.CEP_ORIGEM || '60863480';

    // Payload IDÊNTICO ao que funcionou no cURL
    const payload = {
      from: { postal_code: cep_origem },
      to: { postal_code: cep_destino },
      products: products.map(p => ({
        id: String(p.id || '1'),
        width: 16,
        height: 2,
        length: 11,
        weight: 0.3,
        insurance_value: Number(p.insurance_value) || 100,
        quantity: Number(p.quantity) || 1
      }))
    };

    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) throw new Error('Token do Melhor Envio não configurado');

    const response = await axios.post(
      'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
      payload,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
        timeout: 8000,
      }
    );

    const opcoes = response.data.map(opt => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      delivery_time: opt.delivery_time,
    }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro Melhor Envio:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Falha ao calcular frete' });
  }
}
