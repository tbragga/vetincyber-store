// 🟢 Código corrigido
let price = item.price;
if (typeof price === 'string') {
    price = price.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
}
price = parseFloat(price);

// 🟢 IMPORTANTE: Converte para centavos (inteiro)
const finalPrice = Math.round(price * 100);

const preferenceItems = items.map(item => ({
    title: item.title,
    quantity: Number(item.quantidade),
    unit_price: finalPrice, // <--- AGORA É UM INTEIRO
    currency_id: 'BRL',
}));

// 🟢 Log para depuração no console da Vercel
console.log('Itens enviados ao Mercado Pago:', JSON.stringify(preferenceItems, null, 2));
