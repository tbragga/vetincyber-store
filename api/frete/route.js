export async function POST(req) {
  try {
    const { cep_destino } = await req.json();

    const response = await fetch(`${process.env.MELHORENVIO_URL}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MELHORENVIO_TOKEN}`,
        'User-Agent': 'VetinCyber/1.0 (contato@vetincyber.com)'
      },
      body: JSON.stringify({
        "from": { "postal_code": "60840285" }, // Seu CEP de Fortaleza
        "to": { "postal_code": cep_destino },
        "products": [
          {
            "id": "camera_padrao",
            "width": 15,
            "height": 12,
            "length": 15,
            "weight": 0.5, // 500g
            "insurance_value": 200.0,
            "quantity": 1
          }
        ]
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Falha ao calcular frete' }), { status: 500 });
  }
}
