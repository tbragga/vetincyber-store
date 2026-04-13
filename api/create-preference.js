const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async (req, res) => {
  // Configurar CORS para permitir requisições do seu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { items, payer_email, external_reference } = req.body;

    // Validação simples
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }
    if (!payer_email) {
      return res.status(400).json({ error: 'E-mail obrigatório' });
    }

    // Converte os preços (ex: "R$ 299,00" -> 299.00)
    const preferenceItems = items.map(item => {
      let price = item.price;
      if (typeof price === 'string') {
        price = price.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      }
      price = parseFloat(price);
      return {
        title: item.title,
        quantity: Number(item.quantidade),
        unit_price: price,
        currency_id: 'BRL',
      };
    });

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preferenceData = {
      items: preferenceItems,
      payer: { email: payer_email },
      back_urls: {
        success: `${req.headers.origin}/success.html`,
        failure: `${req.headers.origin}/failure.html`,
        pending: `${req.headers.origin}/pending.html`,
      },
      auto_return: 'approved',
      external_reference: external_reference || `pedido_${Date.now()}`,
      notification_url: `${req.headers.origin}/api/webhook`, // opcional
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });

    return res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro ao criar preferência', details: error.message });
  }
};
