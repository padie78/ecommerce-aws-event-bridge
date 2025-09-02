// SDK v3 modular para DynamoDB
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

const { newId, nowIso, putEvent } = require('./common');

const EVENT_BUS = process.env.EVENT_BUS_NAME;
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE;

const dbClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log("=== svcProcessPayment invoked ===");
  console.log("Raw Lambda event:", JSON.stringify(event));

  try {
    for (const [index, record] of event.Records.entries()) {
      console.log(`--- Processing record #${index} ---`);
      console.log("SQS record body:", record.body);

      let raw, detail;
      try {
        raw = JSON.parse(record.body);
        detail = raw.detail || JSON.parse(raw);
        console.log("Parsed event detail:", detail);
      } catch(parseErr) {
        console.error("Failed to parse record body:", parseErr);
        continue; // Pasar al siguiente record
      }

      const orderId = detail.orderId;
      const total = detail.total || 0;

      // Simular proceso de pago
      const paymentId = newId("pay-");
      const payment = {
        paymentId,
        orderId,
        amount: total,
        status: "SUCCESS",
        method: "CARD",
        createdAt: nowIso()
      };
      console.log("Payment object to persist:", payment);

      // Persistir en DynamoDB si tabla está definida
      if (PAYMENTS_TABLE) {
        try {
          const dbResult = await dbClient.send(new PutItemCommand({
            TableName: PAYMENTS_TABLE,
            Item: marshall(payment)
          }));
          console.log("Payment saved to DynamoDB:", JSON.stringify(dbResult));
        } catch(e) {
          console.warn("DynamoDB write failed:", e.message);
        }
      } else {
        console.log("No PAYMENTS_TABLE defined, skipping persistence.");
      }

      // Emitir evento PaymentProcessed al EventBus
      try {
        const eventResult = await putEvent(
          "PaymentProcessed",
          "app.payments",
          { orderId, paymentId, amount: total },
          EVENT_BUS
        );
        console.log("EventBridge PaymentProcessed result:", JSON.stringify(eventResult));
      } catch(eventErr) {
        console.error("Failed to send event to EventBridge:", eventErr);
      }

      console.log(`--- Finished processing record #${index} ---`);
    }

    console.log("=== svcProcessPayment finished ===");
    return { statusCode: 200 };
  } catch (err) {
    console.error("Unhandled error in svcProcessPayment:", err);
    throw err;
  }
};
