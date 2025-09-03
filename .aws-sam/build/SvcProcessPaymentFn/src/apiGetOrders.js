const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

const dbClient = new DynamoDBClient({});
const ORDERS_TABLE = process.env.ORDERS_TABLE;

const localTimeIsrael = () =>
  new Date().toLocaleString("en-IL", { timeZone: "Asia/Jerusalem" });

exports.handler = async (event) => {
  console.log(`[${localTimeIsrael()}] apiGetOrders invoked`);

  try {
    const command = new ScanCommand({ TableName: ORDERS_TABLE });
    const data = await dbClient.send(command);

    console.log(`[${localTimeIsrael()}] Raw scan result:`, JSON.stringify(data.Items));

    // Convertir cada ítem de DynamoDB a objeto normal
    const orders = data.Items.map((item) => unmarshall(item));

    console.log(`[${localTimeIsrael()}] Unmarshalled orders:`, JSON.stringify(orders));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orders),
    };
  } catch (err) {
    console.error(`[${localTimeIsrael()}] apiGetOrders error:`, err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch orders" }),
    };
  }
};
