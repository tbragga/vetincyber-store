import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export async function POST(req) {
  const { items, freteEscolhido } = await req.json();

  const preference = new Preference(client);
  const result = await preference.create({
    body: {
      items: items.map(i => ({
        title: i.nome,
        unit_price: Number(i.preco),
        quantity: 1,
        currency_id: 'BRL'
      })),
      // Adicionamos o frete como um item ou custo de envio
      shipments: { cost: freteEscolhido.price, mode: 'not_specified' },
      back_urls: {
        success: 'https://seusite.com/sucesso',
        failure: 'https://seusite.com/erro'
      },
      auto_return: 'approved',
    }
  });

  return new Response(JSON.stringify({ init_point: result.init_point }));
}
