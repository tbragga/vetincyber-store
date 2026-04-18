import axios from 'axios';

export default async function handler(req, res) {
  // CORS restrito ao domínio da loja (ajuste se necessário)
  const allowedOrigins = ['https://vetincyber.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cep_destino, products } = req.body;

  // Validação do CEP de destino
  if (!cep_destino || !/^\d{8}$/.test(cep_destino)) {
    return res.status(400).json({ error: 'CEP de destino inválido (deve conter 8 dígitos)' });
  }

  // Validação dos produtos
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Lista de produtos inválida ou vazia' });
  }

  for (const p of products) {
    if (!p.width || !p.height || !p.length || !p.weight || p.insurance_value === undefined || !p.quantity) {
      return res.status(400).json({ error: 'Produto com dados incompletos (width, height, length, weight, insurance_value, quantity)' });
    }
  }

  // CEP de origem a partir das variáveis de ambiente (definir no Vercel: CEP_ORIGEM=60863480)
  const cep_origem = process.env.CEP_ORIGEM;
  if (!cep_origem || !/^\d{8}$/.test(cep_origem)) {
    console.error('CEP_ORIGEM não configurado ou inválido');
    return res.status(500).json({ error: 'Configuração de CEP de origem inválida' });
  }

  // Construir payload garantindo tipos numéricos
  const payload = {
    from: { postal_code: cep_origem },
    to: { postal_code: cep_destino },
    products: products.map((p, index) => ({
      id: String(p.id || `prod-${index + 1}`),
      width: Number(p.width),
      height: Number(p.height),
      length: Number(p.length),
      weight: Number(p.weight),
      insurance_value: Number(p.insurance_value),
      quantity: Number(p.quantity)
    }))
  };

  // Logs para debug (aparecerão nos logs da Vercel)
  console.log('=== CÁLCULO DE FRETE ===');
  console.log('CEP Origem:', cep_origem);
  console.log('CEP Destino:', cep_destino);
  console.log('Payload enviado ao Melhor Envio:', JSON.stringify(payload, null, 2));
  console.log('Token usado (primeiros 15 caracteres):', process.env.MELHOR_ENVIO_TOKEN?.substring(0, 15) + '...');

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
        timeout: 10000, // 10 segundos
      }
    );

    console.log('Resposta da API Melhor Envio (status):', response.status);
    console.log('Resposta da API Melhor Envio (dados):', JSON.stringify(response.data, null, 2));

    const opcoes = response.data.map(opt => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      delivery_time: opt.delivery_time,
    }));

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro na chamada ao Melhor Envio:');
    console.error('Mensagem:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Sem resposta do servidor (timeout ou rede)');
    }
    return res.status(500).json({ error: 'Erro ao calcular frete. Tente novamente.' });
  }
}
