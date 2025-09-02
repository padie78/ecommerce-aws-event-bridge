// Importar solo lo que necesitamos de AWS SDK v3
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

const { newId, nowIso, putEvent } = require('./common');

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const EVENT_BUS = process.env.EVENT_BUS_NAME;

// Crear cliente DynamoDB
const dbClient = new DynamoDBClient({});

// Función para hora local Israel
const localTimeIsrael = () => new Date().toLocaleString('en-IL', { timeZone: 'Asia/Jerusalem' });

exports.handler = async (event) => {
  console.log(`[${localTimeIsrael()}] apiCreateOrder invoked`);
  console.log(`[${localTimeIsrael()}] Event received:`, JSON.stringify(event));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const orderId = newId("ord-");
    const order = {
      orderId,
      customerId: body.customerId || "anonymous",
      items: body.items || [],
      total: body.total || 0,
      status: "PENDING",
      createdAt: nowIso()
    };

    console.log(`[${localTimeIsrael()}] Saving order to DynamoDB:`, JSON.stringify(order));

    await dbClient.send(new PutItemCommand({
      TableName: ORDERS_TABLE,
      Item: marshall(order)
    }));

    console.log(`[${localTimeIsrael()}] Order saved successfully`);

    // Publicar OrderCreated en EventBridge usando tu función putEvent de common.js
    console.log("  EventBus:", EVENT_BUS || "N/A");
    console.log("  Detail-Type:", 'OrderCreated');
    console.log("  Source:", 'app.orders');
    
    const eventResult = await putEvent("OrderCreated", "app.orders", {
      orderId,
      customerId: order.customerId,
      items: order.items,
      total: order.total
    }, EVENT_BUS);

    console.log(`[${localTimeIsrael()}] EventBridge putEvent result:`, JSON.stringify(eventResult));

    return {
      statusCode: 201,
      body: JSON.stringify({ ok: true, orderId })
    };
  } catch (err) {
    console.error(`[${localTimeIsrael()}] apiCreateOrder error:`, err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
