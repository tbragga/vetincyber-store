import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, freteValor } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  // Converte itens para o formato do Mercado Pago
  const preferenceItems = items.map((item) => ({
    title: item.title,
    quantity: Number(item.quantidade),
    unit_price: parseFloat(item.price.replace('R$', '').replace(',', '.').trim()),
  }));

  if (freteValor && freteValor > 0) {
    preferenceItems.push({
      title: 'Frete',
      quantity: 1,
      unit_price: Number(freteValor),
    });
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: preferenceItems,
        back_urls: {
          success: 'https://seu-dominio.vercel.app/sucesso', // ajuste
          failure: 'https://seu-dominio.vercel.app/falha',
          pending: 'https://seu-dominio.vercel.app/pendente',
        },
        auto_return: 'approved',
        notification_url: 'https://seu-dominio.vercel.app/api/webhook', // se tiver webhook
      },
    });

    return res.status(200).json({ init_point: response.init_point });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    return res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
}
