// api/calculate-shipping.js
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  // Retorna frete fixo (enquanto não resolver a integração real)
  const opcoes = [
    { name: "PAC", price: 15.00, delivery_time: 5, carrier: "Correios" }
  ];
  return res.status(200).json(opcoes);
};
