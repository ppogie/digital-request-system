
document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("requestForm");
  const button = document.getElementById("submitRequest");

  if (!form || !button) {
    console.error("Request form or button not found.");
    return;
  }

  const STORAGE_KEY = "productionRequestsDemo";

  // Load saved requests
  function loadRequests() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Unable to load requests:", error);
      return [];
    }
  }

  let requests = loadRequests();

  // Create request list
  const list = document.createElement("div");
  list.id = "requestList";
  form.after(list);

  // Display submitted requests
  function displayRequests() {
    list.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "My Requests (Demo)";
    list.appendChild(heading);

    if (requests.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No requests submitted yet.";
      list.appendChild(empty);
      return;
    }

    const ul = document.createElement("ul");

    requests.slice().reverse().forEach(function (r) {
      const li = document.createElement("li");

      li.textContent =
        "Request ID: " + r.requestId +
        " | Model: " + r.productModel +
        " | Quantity: " + r.quantity +
        " | Status: " + r.status;

      ul.appendChild(li);
    });

    list.appendChild(ul);
  }

  // Enable Submit Request button
  button.disabled = false;

  // Handle request submission
  button.addEventListener("click", function () {

    // Check required fields
    if (!form.reportValidity()) {
      return;
    }

    // Collect request data
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

    // Additional validation
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

    // Check duplicate Request ID
    const duplicate = requests.some(function (r) {
      return r.requestId.toLowerCase() ===
             request.requestId.toLowerCase();
    });

    if (duplicate) {
      alert("Request ID already exists. Please use another ID.");
      return;
    }

    // Save request to browser storage
    const updatedRequests = [...requests, request];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedRequests)
      );
    } catch (error) {
      console.error("Save failed:", error);
      alert("Unable to save request.");
      return;
    }

    requests = updatedRequests;

    // Show success message
    alert("Request submitted successfully!");

    // Clear form
    form.reset();

    // Refresh request list
    displayRequests();
  });

  // Show existing requests when page loads
  displayRequests();

  console.log("Production Request System loaded successfully.");

});
