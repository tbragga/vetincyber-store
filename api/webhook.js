module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { type, data } = req.body;
  if (type === 'payment') {
    console.log('Pagamento aprovado:', data.id);
    // Aqui você pode depois atualizar o Supabase
  }
  res.status(200).end();
};
