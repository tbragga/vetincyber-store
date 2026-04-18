export async function POST(req) {
  try {
    const { items, freteValor } = await req.json();

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(i => ({
          title: i.nome,
          unit_price: Number(i.preco),
          quantity: 1,
          currency_id: 'BRL'
        })),
        shipments: { cost: Number(freteValor), mode: "not_specified" },
        back_urls: {
          success: "https://vetincyber.vercel.app/", // Coloque sua URL aqui
          failure: "https://vetincyber.vercel.app/"
        },
        auto_return: "approved"
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify({ init_point: data.init_point }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro no checkout' }), { status: 500 });
  }
}
