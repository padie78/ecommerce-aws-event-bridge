// --- IMPORTANTE: Reemplaza esta URL con la que te da CloudFormation Outputs -> ApiBaseUrl ---
// Por ejemplo: const API_BASE_URL = "https://tu-url-unica.execute-api.eu-central-1.amazonaws.com";
const API_BASE_URL = "https://6qhokg20v0.execute-api.eu-central-1.amazonaws.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("orderForm");
  const resultDiv = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener valores de los campos del formulario
    const customerId = document.getElementById("customerId").value;
    const sku = document.getElementById("sku").value;
    const qty = parseInt(document.getElementById("qty").value);
    const price = parseFloat(document.getElementById("price").value);

    // Calcular el total de la orden
    const total = qty * price;


    console.log("total:", total);

    // Se ha corregido la estructura del payload para que coincida con lo solicitado
    const payload = {
      customerId: customerId,
      items: [
        {
          'sku': sku,
          'qty': qty,
          'price': price
        }
      ],
      total: total,
      postbackUrl: "https://mi-app.com/callback" // URL de ejemplo, puedes ajustarla
    };

    console.log("Payload enviado:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      resultDiv.innerHTML = `
        <p><strong>Response:</strong></p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    } catch (err) {
      console.error("Error calling API:", err);
      resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
  });
});