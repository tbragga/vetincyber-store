import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, data } = req.body;
  if (type === 'payment') {
    const paymentId = data.id;
    try {
      const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        // Aqui você pode integrar com o Melhor Envio para gerar etiqueta
        // e enviar e-mail de confirmação
        console.log(`Pagamento ${paymentId} aprovado!`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }
  res.status(200).send('OK');
}
