// Lambda que recibe todos los eventos y los loguea
const localTimeIsrael = () => new Date().toLocaleString('en-IL', { timeZone: 'Asia/Jerusalem' });

exports.handler = async (event) => {
  console.log(`[${localTimeIsrael()}] EventBridgeLogger received event:`, JSON.stringify(event, null, 2));
  return { ok: true };
};
