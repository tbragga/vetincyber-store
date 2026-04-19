import axios from 'axios';

export default async function handler(req, res) {
  // CORS – Permitir apenas o domínio da loja
  const allowedOrigins = ['https://vetincyber.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback seguro
    res.setHeader('Access-Control-Allow-Origin', 'https://vetincyber.vercel.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
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
      if (p.width == null || p.height == null || p.length == null || p.weight == null || p.insurance_value == null || p.quantity == null) {
        return res.status(400).json({ error: 'Produto com dados incompletos' });
      }
    }

    // CEP de origem fixo (seu CEP)
    const cep_origem = '60863480';

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

    // Log para debug (visível no painel do Vercel)
    console.log('=== CÁLCULO DE FRETE ===');
    console.log('CEP Origem:', cep_origem);
    console.log('CEP Destino:', cep_destino);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      console.error('Token do Melhor Envio não configurado');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Garantir que o token tenha o prefixo Bearer
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const response = await axios.post(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      payload,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        timeout: 12000,
      }
    );

    console.log('Resposta da API Melhor Envio (status):', response.status);
    console.log('Número de opções retornadas:', response.data.length);

    // Mapeamento seguro: extrai preço de qualquer campo comum e força número
    const opcoes = response.data.map(opt => {
      let rawPrice = opt.price || opt.custom_price || opt.total_price || opt.total || opt.value;
      let priceNumber;
      if (rawPrice === undefined) {
        console.error('Opção sem campo de preço reconhecido:', opt);
        priceNumber = 0;
      } else {
        priceNumber = parseFloat(String(rawPrice).replace(/[^\d,.-]/g, '').replace(',', '.'));
        if (isNaN(priceNumber)) priceNumber = 0;
      }

      return {
        id: opt.id,
        name: opt.name || 'Frete',
        price: priceNumber,               // número
        delivery_time: opt.delivery_time || (opt.delivery_range ? opt.delivery_range.min : 5),
      };
    });

    return res.status(200).json(opcoes);
  } catch (error) {
    console.error('Erro na chamada ao Melhor Envio:');
    console.error('Mensagem:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status).json({
        error: 'Erro na API do Melhor Envio',
        details: error.response.data
      });
    } else if (error.request) {
      console.error('Sem resposta do servidor (timeout ou rede)');
      return res.status(504).json({ error: 'Tempo limite excedido ao consultar frete' });
    } else {
      return res.status(500).json({ error: 'Erro interno ao processar frete' });
    }
  }
}
