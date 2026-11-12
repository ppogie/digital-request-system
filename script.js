// Digital Production Request System - browser-only demo
// Version: request-history-fixed-2026-11-12

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("requestForm");
  const button = document.getElementById("submitRequest");

  if (!form || !button) {
    console.error("Could not find requestForm or submitRequest in index.html");
    return;
  }

  const STORAGE_KEY = "productionRequestsDemo";

  function loadRequests() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Error reading request data:", error);
      return [];
    }
  }

  let requests = loadRequests();

  let list = document.getElementById("requestList");
  if (!list) {
    list = document.createElement("div");
    list.id = "requestList";
    form.after(list);
  }

  function displayRequests() {
    list.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Request History";
    list.appendChild(heading);

    if (requests.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No requests found.";
      list.appendChild(emptyMessage);
      return;
    }

    const container = document.createElement("div");
    container.className = "table-container";

    const table = document.createElement("table");
    table.className = "request-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Request ID", "Date", "Staff ID", "Product Model", "Quantity", "Status"].forEach(function (title) {
      const th = document.createElement("th");
      th.textContent = title;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    requests.slice().reverse().forEach(function (request) {
      const row = document.createElement("tr");
      [
        request.requestId,
        request.requestDate,
        request.staffId,
        request.productModel,
        request.quantity,
        request.status
      ].forEach(function (value) {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    list.appendChild(container);
  }

  button.disabled = false;

  button.addEventListener("click", function () {
    if (!form.reportValidity()) return;

    const request = {
      requestId: document.getElementById("requestId").value.trim(),
      requestDate: document.getElementById("requestDate").value,
      staffId: document.getElementById("staffId").value.trim(),
      productModel: document.getElementById("productModel").value.trim(),
      quantity: Number(document.getElementById("productionQuantity").value),
      remarks: document.getElementById("remarks").value.trim(),
      status: "Pending"
    };

    if (!request.requestId || !request.requestDate || !request.staffId ||
        !request.productModel || !Number.isInteger(request.quantity) ||
        request.quantity < 1) {
      alert("Please complete all required fields correctly.");
      return;
    }

    const duplicate = requests.some(function (saved) {
      return String(saved.requestId).toLowerCase() === request.requestId.toLowerCase();
    });
    if (duplicate) {
      alert("Request ID already exists. Please enter another ID.");
      return;
    }

    const updated = [...requests, request];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Could not save request:", error);
      alert("Unable to save request in this browser.");
      return;
    }

    requests = updated;
    form.reset();
    displayRequests();
    alert("Request submitted successfully!");
  });

  displayRequests();
  console.log("JS VERSION: request-history-fixed-2026-11-12");
});
