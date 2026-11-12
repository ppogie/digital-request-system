
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("requestForm");
  const button = document.getElementById("submitRequest");

  if (!form || !button) {
    console.error("Request form or Submit button not found.");
    return;
  }

  const STORAGE_KEY = "productionRequestsDemo";

  function loadRequests() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Could not load requests:", error);
      return [];
    }
  }

  let requests = loadRequests();

  const list = document.createElement("div");
  list.id = "requestList";
  form.after(list);

  // DISPLAY REQUEST HISTORY

  function displayRequests() {
    list.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Request History";
    list.appendChild(heading);

    if (requests.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No requests found.";
      list.appendChild(empty);
      return;
    }

    const container = document.createElement("div");
    container.className = "table-container";

    const table = document.createElement("table");
    table.className = "request-table";

    const headers = [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ];

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    headers.forEach(function (title) {
      const th = document.createElement("th");
      th.textContent = title;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    requests.slice().reverse().forEach(function (request) {
      const tr = document.createElement("tr");

      const values = [
        request.requestId,
        request.requestDate,
        request.staffId,
        request.productModel,
        request.quantity,
        request.status
      ];

      values.forEach(function (value) {
        const td = document.createElement("td");
        td.textContent = String(value ?? "");
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    list.appendChild(container);
  }

  // ENABLE SUBMIT BUTTON

  button.disabled = false;

  // SUBMIT REQUEST

  button.addEventListener("click", function () {
    if (!form.reportValidity()) return;

    const request = {
      requestId: document.getElementById("requestId").value.trim(),
      requestDate: document.getElementById("requestDate").value,
      staffId: document.getElementById("staffId").value.trim(),
      productModel: document.getElementById("productModel").value.trim(),
      quantity: Number(
        document.getElementById("productionQuantity").value
      ),
      remarks: document.getElementById("remarks").value.trim(),
      status: "Pending"
    };

    // VALIDATION

    if (
      !request.requestId ||
      !request.requestDate ||
      !request.staffId ||
      !request.productModel ||
      !Number.isInteger(request.quantity) ||
      request.quantity < 1
    ) {
      alert("Please complete all required fields correctly.");
      return;
    }

    // CHECK DUPLICATE ID

    const duplicate = requests.some(function (saved) {
      return String(saved.requestId).toLowerCase() ===
             request.requestId.toLowerCase();
    });

    if (duplicate) {
      alert("Request ID already exists. Use another ID.");
      return;
    }

    // SAVE REQUEST

    const updated = [...requests, request];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Saving failed:", error);
      alert("Unable to save request in this browser.");
      return;
    }

    requests = updated;

    form.reset();
    displayRequests();

    alert("Request submitted successfully!");
  });

  // INITIAL DISPLAY

  displayRequests();
});

