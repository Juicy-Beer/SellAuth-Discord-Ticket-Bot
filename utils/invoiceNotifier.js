const { EmbedBuilder, WebhookClient } = require('discord.js');
const axios = require('axios');

const notifiedInvoices = new Set();

const formatCoupon = (coupon) => {
  if (!coupon) return 'N/A';
  return `${coupon.code} (${coupon.discount}${coupon.type === 'percentage' ? '%' : coupon.type === 'fixed' ? coupon.currency || '' : ''})`;
};

const formatCustomFields = (customFields) => {
  if (!customFields || Object.entries(customFields).length === 0) return 'N/A';
  return Object.entries(customFields)
    .map(([key, value]) => `**${key}:** "${value}"`)
    .join(', ');
};

const formatDelivered = (delivered) => {
  if (!delivered) return 'N/A';
  try {
    const data = JSON.parse(delivered);
    if (Array.isArray(data)) return data.join(', ');
    return delivered.toString();
  } catch {
    return delivered.toString();
  }
};

const formatGatewayInfo = (invoice) => {
  switch (invoice.gateway) {
    case 'CASHAPP': return `Transaction ID: "${invoice.cashapp_transaction_id || 'N/A'}"`;
    case 'STRIPE': return invoice.stripe_pi_id ? `[Stripe Payment](https://dashboard.stripe.com/payments/${invoice.stripe_pi_id})` : 'N/A';
    case 'PAYPALFF': return invoice.paypalff_note ? `Note: "${invoice.paypalff_note}"` : 'N/A';
    case 'SUMUP': return invoice.sumup_checkout_id ? `Checkout ID: "${invoice.sumup_checkout_id}"` : 'N/A';
    case 'MOLLIE': return invoice.mollie_transaction_id ? `Payment ID: "${invoice.mollie_transaction_id}"` : 'N/A';
    case 'SKRILL': return invoice.skrill_transaction_id ? `Transaction ID: "${invoice.skrill_transaction_id}"` : 'N/A';
    default: return 'N/A';
  }
};

async function checkCompletedInvoices() {
  if (!process.env.INVOICE_NOTIFIER_DISCORD_WEBHOOK_URL) return;
  const pingRoleId = process.env.INVOICE_NOTIFIER_ROLE_ID;

  try {
    const response = await axios.get(
      `https://api.sellauth.com/v1/shops/${process.env.SHOP_ID}/invoices`,
      { headers: { 'Authorization': `Bearer ${process.env.SELLAUTH_API_KEY}` } }
    );

    const invoices = response.data?.data || response.data;
    if (!Array.isArray(invoices)) return;

    for (const invoice of invoices) {
      if ((invoice.status === 'completed' || invoice.status === 'paid') && !notifiedInvoices.has(invoice.id)) {
        notifiedInvoices.add(invoice.id);

        if (notifiedInvoices.size > 500) {
          const firstItem = notifiedInvoices.values().next().value;
          notifiedInvoices.delete(firstItem);
        }

        const currencySymbol = invoice.currency === 'USD' ? '$' : '€';
        const formattedPrice = invoice.price ? `${currencySymbol}${parseFloat(invoice.price).toFixed(2)}` : 'N/A';
        const maskedIp = invoice.ip ? `||${invoice.ip}||` : 'N/A';
        const createdAt = invoice.created_at ? `<t:${Math.floor(new Date(invoice.created_at).getTime() / 1000)}:F>` : 'N/A';
        const completedAt = invoice.completed_at ? `<t:${Math.floor(new Date(invoice.completed_at).getTime() / 1000)}:F>` : 'N/A';
        const dashboardUrl = invoice.email ? `\n\n**[View Full Customer History](https://dash.sellauth.com/invoices?page=1&email=${encodeURIComponent(invoice.email)})**` : '';

        const embed = new EmbedBuilder()
          .setTitle(`New Order Completed! #${invoice.unique_id || invoice.id}`)
          .setColor('Green')
          .addFields(
            { name: '💶 Details & Pricing', value: `**Status:** \`${invoice.status?.replace(/_/g, ' ') || 'unknown'}\`\n**Product:** ${invoice.product?.name || 'N/A'}\n**Variant:** ${invoice.variant?.name || 'N/A'}\n**Price:** ${formattedPrice} (${invoice.currency || 'EUR'})\n**Coupon:** ${formatCoupon(invoice.coupon)}`, inline: false },
            { name: '👤 Customer Info', value: `**Email:** ${invoice.email || 'N/A'}\n**IP Address:** ${maskedIp}\n**User Agent:** ${invoice.user_agent || 'N/A'}${dashboardUrl}`, inline: false },
            { name: '💳 Gateway Details', value: `**Gateway:** ${invoice.gateway || 'N/A'}\n**Gateway Info:** ${formatGatewayInfo(invoice)}\n**Custom Fields:** ${formatCustomFields(invoice.custom_fields)}`, inline: false },
            { name: '🛒 Deliverables', value: formatDelivered(invoice.delivered), inline: false },
            { name: '📅 Timestamps', value: `**Created At:** ${createdAt}\n**Completed At:** ${completedAt}`, inline: false }
          )
          .setTimestamp();

        const payload = { embeds: [embed] };
        if (pingRoleId) {
          payload.content = `<@&${pingRoleId}>`;
        }

        const webhookClient = new WebhookClient({ url: process.env.INVOICE_NOTIFIER_DISCORD_WEBHOOK_URL });
        await webhookClient.send(payload).catch(() => {});
      }
    }
  } catch (err) {}
}

module.exports = {
  name: 'clientReady',
  once: true,
  execute() {
    setInterval(() => checkCompletedInvoices(), 30000);
  },
};
