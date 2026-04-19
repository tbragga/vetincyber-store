// api/auth.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  // Credenciais do administrador (configure aqui ou use variáveis de ambiente)
  const ADMIN_EMAIL = 'vetincyber@hotmail.com';
  // Hash SHA-256 da senha real (gere uma vez e cole aqui)
  const ADMIN_PASSWORD_HASH = 'a535739fa270e0f6985f613ebe255b3677d49b4f2361a2e35c55f34d7abafeba';

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'E-mail incorreto' });
  }

  // Calcular hash da senha recebida
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  if (hash !== ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  // Autenticação bem-sucedida
  return res.status(200).json({ success: true });
}
