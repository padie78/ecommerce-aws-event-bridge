// AWS SDK v3 modular
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

// Crear cliente EventBridge
const ebClient = new EventBridgeClient({});

// Generar un ID único
function newId(prefix = "") {
  return prefix + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// Obtener timestamp ISO
function nowIso() {
  return new Date().toISOString();
}

// Publicar evento en EventBridge
async function putEvent(detailType, source, detail, eventBusName) {
  const params = {
    Entries: [
      {
        Detail: JSON.stringify(detail),
        DetailType: detailType,
        Source: source,
        EventBusName: eventBusName
      }
    ]
  };
  const command = new PutEventsCommand(params);
  return await ebClient.send(command);
}

module.exports = { newId, nowIso, putEvent };
