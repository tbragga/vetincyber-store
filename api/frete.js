import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cep_destino } = req.body;
  if (!cep_destino || cep_destino.length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' });
  }

  // CEP de origem (sua loja) - SUBSTITUA PELO SEU CEP REAL
  const cep_origem = '60863480'; // exemplo: São Paulo - centro

  const payload = {
    from: { postal_code: cep_origem },
    to: { postal_code: cep_destino },
    products: [
      {
        id: '1',
        width: 11,
        height: 17,
        length: 11,
        weight: 0.3,
        insurance_value: 100,
        quantity: 1,
      },
    ],
  };

  try {
    const response = await axios.post(
      'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
      payload,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        },
      }
    );

    // Mapeia apenas o necessário
    const opcoes = response.data.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      delivery_time: opt.delivery_time,
    }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro ao calcular frete:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao calcular frete' });
  }
}
