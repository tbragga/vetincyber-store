export async function POST(req) {
  const { cep } = await req.json();
  
  // Aqui o segredo: enviamos as dimensões médias de uma câmera vintage
  const res = await fetch(`${process.env.MELHORENVIO_URL}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MELHORENVIO_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'VetinCyber (guilhermebragga@hotmail.com)'
    },
    body: JSON.stringify({
      "from": { "postal_code": "60863480" }, // Seu CEP de Fortaleza
      "to": { "postal_code": cep },
      "products": [{ id: "camera", width: 15, height: 12, length: 15, weight: 0.5, quantity: 1 }]
    })
  });

  const data = await res.json();
  // Filtramos apenas as melhores opções (Sedex e Jadlog)
  return new Response(JSON.stringify(data.filter(o => !o.error)));
}
