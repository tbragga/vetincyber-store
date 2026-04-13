const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async (req, res) => {
  // Libera acesso de qualquer origem (para teste)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, payer_email, external_reference } = req.body;

    const preferenceItems = items.map(item => ({
      title: item.title,
      quantity: Number(item.quantidade),
      unit_price: parseFloat(item.price.replace('R$', '').replace(',', '.').trim()),
      currency_id: 'BRL',
    }));

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preferenceData = {
      items: preferenceItems,
      payer: { email: payer_email || 'comprador@exemplo.com' },
      back_urls: {
        success: 'https://seu-site.vercel.app/sucesso.html',
        failure: 'https://seu-site.vercel.app/falha.html',
        pending: 'https://seu-site.vercel.app/pendente.html',
      },
      auto_return: 'approved',
      external_reference: external_reference || `pedido_${Date.now()}`,
      notification_url: 'https://vetincyber.vercel.app/',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });

    return res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar preferência' });
  }
};
