const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const SHOPIFY_DOMAIN = 'jack-beds-store.myshopify.com';
const API_TOKEN = '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';

app.post('/api/track-order', async (req, res) => {
    const { orderNumber, email } = req.body;

    try {
        // Buscar solo por email (Shopify lo permite)
        const response = await axios.get(`https://${SHOPIFY_DOMAIN}/admin/api/2023-10/orders.json?email=${email}`, {
            headers: {
                'X-Shopify-Access-Token': API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        // Filtrar por número de pedido (ignorando '#')
        const order = response.data.orders.find(o => o.name.replace('#', '') === orderNumber.replace('#', ''));

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado o email incorrecto' });
        }

        console.log("Tags crudos:", order.tags);

        res.json({
          orderNumber: order.name,
          tags: order.tags
            .split(',')
            .map(t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').trim()),
          shippingAddress: {
            name: order.shipping_address?.name,
            address1: order.shipping_address?.address1,
            address2: order.shipping_address?.address2,
            zip: order.shipping_address?.zip,
            city: order.shipping_address?.city,
            country: order.shipping_address?.country
          }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al buscar el pedido' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
