const API_BASE_URL = "https://6qhokg20v0.execute-api.eu-central-1.amazonaws.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("orderForm");
  const resultDiv = document.getElementById("result");
  const ordersTableBody = document.querySelector("#ordersTable tbody");

  function addOrderToTable(order) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.orderId || "N/A"}</td>
      <td>${order.customerId}</td>
      <td>${order.items?.[0]?.sku || "-"}</td>
      <td>${order.items?.[0]?.qty || "-"}</td>
      <td>${order.items?.[0]?.price || "-"}</td>
      <td>${order.total}</td>
    `;
    ordersTableBody.appendChild(row);
  }

  async function loadOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      const data = await response.json();

      console.log("Fetched orders:", data);

      if (!Array.isArray(data)) {
        console.error("API returned:", data);
        ordersTableBody.innerHTML = "";
        resultDiv.innerHTML = `<p style="color:red;">Error fetching orders: ${
          data.error || "Invalid response format"
        }</p>`;
        return;
      }

      ordersTableBody.innerHTML = "";
      data.forEach(order => addOrderToTable(order));
    } catch (err) {
      console.error("Error fetching orders:", err);
      resultDiv.innerHTML = `<p style="color:red;">Error fetching orders: ${err.message}</p>`;
    }
  }

  // 👉 Cargar órdenes al inicio
  loadOrders();

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const customerId = document.getElementById("customerId").value;
    const sku = document.getElementById("sku").value;
    const qty = parseInt(document.getElementById("qty").value);
    const price = parseFloat(document.getElementById("price").value);

    const total = qty * price;

    const payload = {
      customerId,
      items: [{ sku, qty, price }],
      total,
      postbackUrl: "https://mi-app.com/callback"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      resultDiv.innerHTML = `<p><strong>Response:</strong></p><pre>${JSON.stringify(
        data,
        null,
        2
      )}</pre>`;

      // 👉 En vez de usar directamente addOrderToTable(data),
      // recargamos todas las órdenes para evitar inconsistencias
      await loadOrders();

      form.reset();
    } catch (err) {
      console.error("Error calling API:", err);
      resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
  });
});
