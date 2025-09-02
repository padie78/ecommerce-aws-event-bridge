// AWS SDK v3 modular
const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { marshall } = require("@aws-sdk/util-dynamodb");

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const TOPIC_ARN = process.env.NOTIF_TOPIC_ARN;

// Clientes AWS SDK v3
const dbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log("svcSendNotification invoked with event:", JSON.stringify(event));

  try {
    for (const record of event.Records) {
      const raw = JSON.parse(record.body);
      const detail = raw.detail || JSON.parse(raw);
      const orderId = detail.orderId;
      const paymentId = detail.paymentId || null;
      const amount = detail.amount || detail.total || 0;

      // 1) Actualizar orden a COMPLETED (si existe)
      try {
        const updateParams = {
          TableName: ORDERS_TABLE,
          Key: marshall({ orderId }),
          UpdateExpression: "SET #s = :s, completedAt = :c",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: marshall({ ":s": "COMPLETED", ":c": new Date().toISOString() })
        };
        await dbClient.send(new UpdateItemCommand(updateParams));
        console.log("Order updated to COMPLETED:", orderId);
      } catch(e){
        console.warn("Update order failed:", e.message);
      }

      // 2) Publicar notificación por SNS
      const msg = { orderId, paymentId, amount, message: `Order ${orderId} completed` };
      try {
        await snsClient.send(new PublishCommand({
          TopicArn: TOPIC_ARN,
          Subject: `Order ${orderId} completed`,
          Message: JSON.stringify(msg)
        }));
        console.log("Notified completion for order", orderId);
      } catch(e){
        console.warn("SNS publish failed:", e.message);
      }
    }

    return { statusCode: 200 };
  } catch (err) {
    console.error("svcSendNotification error:", err);
    throw err; // para que SQS reintente en caso de error
  }
};
