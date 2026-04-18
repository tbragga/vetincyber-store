export async function POST(req) {
  try {
    const { cep_destino } = await req.json();

    const response = await fetch(`${process.env.MELHORENVIO_URL}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MELHORENVIO_TOKEN}`,
        'User-Agent': 'VetinCyber (guilhermebragga@hotmail.com)'
      },
      body: JSON.stringify({
        "from": { "postal_code": "60863480" }, // Jangurussu, Fortaleza
        "to": { "postal_code": cep_destino },
        "products": [
          {
            "id": "camera_vint",
            "width": 15, "height": 12, "length": 15, "weight": 0.5,
            "insurance_value": 250.0, "quantity": 1
          }
        ]
      })
    });

    const data = await response.json();
    // Filtra para mostrar apenas as opções que não deram erro (ex: Sedex, Jadlog)
    const opcoesValidas = Array.isArray(data) ? data.filter(o => !o.error) : [];
    return new Response(JSON.stringify(opcoesValidas), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro no cálculo' }), { status: 500 });
  }
}
