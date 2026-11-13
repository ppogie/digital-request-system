
/*
 DIGITAL PRODUCTION REQUEST SYSTEM
 Dashboard JavaScript - Supabase Version
*/

document.addEventListener("DOMContentLoaded", async function () {
  "use strict";

  // SUPABASE CONFIGURATION

  const SUPABASE_URL =
    "https://swyzpswrncaghdfnphhc.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  // HTML ELEMENTS

  const notice = document.getElementById("authNotice");
  const navigation = document.getElementById("mainNav");
  const main = document.getElementById("appMain");
  const form = document.getElementById("requestForm");

  const submitButton =
    document.getElementById("submitRequest");

  const feedback =
    document.getElementById("requestFeedback");

  const requestList =
    document.getElementById("requestList");

  // ERROR HANDLING

  function showError(message) {
    console.error(message);

    if (notice) {
      notice.textContent = message + " ";

      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "Go to Login";

      notice.appendChild(link);
      notice.hidden = false;
    }

    if (navigation) navigation.hidden = true;
    if (main) main.hidden = true;
  }

  function showElement(id, shouldShow) {
    const element = document.getElementById(id);

    if (element) {
      element.hidden = !shouldShow;
    }
  }

  function setFeedback(message, isError = false) {
    if (!feedback) return;

    feedback.textContent = message;

    feedback.style.color = isError
      ? "#a32121"
      : "#08623e";
  }

  function setToday() {
    const input = document.getElementById("requestDate");

    if (!input) return;

    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    input.value = `${yyyy}-${mm}-${dd}`;
  }

  // CHECK SUPABASE LIBRARY

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    showError(
      "Supabase library failed to load. Please refresh."
    );
    return;
  }

  // CREATE ONE SUPABASE CLIENT

  let db;

  try {
    db = window.dprClient ||
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

    window.dprClient = db;

  } catch (error) {
    showError(
      "Supabase connection error: " + error.message
    );
    return;
  }

  // VERIFY LOGIN

  let currentUser;

  try {
    const { data, error } = await db.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      window.location.replace("login.html");
      return;
    }

    currentUser = data.user;

  } catch (error) {
    showError(
      "Login verification failed: " + error.message
    );
    return;
  }

  // CHECK USER ROLE

  let role;

  try {
    const { data, error } = await db
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (error) throw error;

    role = data.role;

    if (role !== "Staff" && role !== "Logistic") {
      throw new Error("Invalid user role.");
    }

  } catch (error) {
    showError(
      "Unable to check role: " + error.message
    );
    return;
  }

  const isStaff = role === "Staff";
  const isLogistic = role === "Logistic";

  // STAFF NAVIGATION

  showElement("staffNavLink", isStaff);
  showElement("staffQuickLink", isStaff);
  showElement("request", isStaff);

  // LOGISTIC NAVIGATION

  showElement("logisticNavLink", isLogistic);
  showElement("issuingNavLink", isLogistic);
  showElement("receiptNavLink", isLogistic);

  showElement("approvalQuickLink", isLogistic);
  showElement("issuingQuickLink", isLogistic);
  showElement("receiptQuickLink", isLogistic);

  // LOGISTIC DASHBOARD SECTIONS

  showElement("logisticDashboardCard", isLogistic);
  showElement("issuingDashboardCard", isLogistic);
  showElement("receiptDashboardCard", isLogistic);

  // WELCOME MESSAGE

  const welcome =
    document.getElementById("welcomeMessage");

  if (welcome) {
    welcome.textContent =
      `Signed in as ${currentUser.email} (${role})`;
  }

  // SHOW DASHBOARD

  if (notice) notice.hidden = true;
  if (navigation) navigation.hidden = false;
  if (main) main.hidden = false;

  document.body.style.visibility = "visible";

  // REQUEST HISTORY TABLE

  function renderRequests(rows) {
    if (!requestList) return;

    requestList.replaceChildren();

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No requests found.";

      requestList.appendChild(empty);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-container";

    const table = document.createElement("table");
    table.className = "request-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ];

    headers.forEach(function (label) {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach(function (request) {
      const tr = document.createElement("tr");

      const values = [
        request.request_id,
        request.request_date,
        request.staff_id,
        request.product_model,
        request.production_quantity
      ];

      values.forEach(function (value) {
        const td = document.createElement("td");
        td.textContent = String(value ?? "");
        tr.appendChild(td);
      });

      const statusCell = document.createElement("td");
      const status = document.createElement("span");

      status.className =
        "status-pill " +
        String(request.status || "").toLowerCase();

      status.textContent = request.status || "Unknown";

      statusCell.appendChild(status);
      tr.appendChild(statusCell);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    requestList.appendChild(wrapper);
  }

  // LOAD REQUESTS FROM SUPABASE

  async function loadRequests() {
    if (requestList) {
      requestList.textContent = "Loading requests...";
    }

    try {
      let query = db
        .from("requests")
        .select(
          "request_id,request_date,requested_by,staff_id," +
          "product_model,production_quantity,status,created_at"
        )
        .order("created_at", { ascending: false });

      // Staff only see their own requests
      // RLS also controls access at database level

      if (isStaff) {
        query = query.eq(
          "requested_by",
          currentUser.id
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = data || [];

      renderRequests(rows);

      // UPDATE DASHBOARD STATISTICS

      ["Pending", "Approved", "Rejected"].forEach(
        function (status) {
          const countNode = document.getElementById(
            status.toLowerCase() + "Count"
          );

          if (countNode) {
            countNode.textContent = String(
              rows.filter(
                r => r.status === status
              ).length
            );
          }
        }
      );

    } catch (error) {
      console.error("Request loading error:", error);

      if (requestList) {
        requestList.textContent =
          "Cannot load requests: " + error.message;
      }
    }
  }

  // CREATE REQUEST - STAFF ONLY

  if (isStaff && form && submitButton) {
    setToday();

    submitButton.disabled = false;

    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();

        if (!form.reportValidity()) return;
        if (submitButton.disabled) return;

        const requestId = document
          .getElementById("requestId")
          .value.trim();

        const requestDate = document
          .getElementById("requestDate")
          .value;

        const staffId = document
          .getElementById("staffId")
          .value.trim();

        const productModel = document
          .getElementById("productModel")
          .value.trim();

        const productionQuantity = Number(
          document.getElementById(
            "productionQuantity"
          ).value
        );

        const remarks = document
          .getElementById("remarks")
          .value.trim();

        // VALIDATION

        if (
          !requestId ||
          !requestDate ||
          !staffId ||
          !productModel ||
          !Number.isSafeInteger(productionQuantity) ||
          productionQuantity < 1
        ) {
          setFeedback(
            "Please complete all required fields.",
            true
          );
          return;
        }

        submitButton.disabled = true;
        setFeedback("Submitting request...");

        try {
          const { error } = await db
            .from("requests")
            .insert({
              request_id: requestId,
              request_date: requestDate,
              requested_by: currentUser.id,
              staff_id: staffId,
              product_model: productModel,
              production_quantity: productionQuantity,
              remarks: remarks,
              status: "Pending"
            });

          if (error) throw error;

          form.reset();
          setToday();

          setFeedback(
            "Request submitted to Supabase successfully!"
          );

          await loadRequests();

        } catch (error) {
          const message = error.code === "23505"
            ? "Request ID already exists."
            : "Unable to submit: " + error.message;

          setFeedback(message, true);

        } finally {
          submitButton.disabled = false;
        }
      }
    );
  }

  // LOGOUT FUNCTION

  const logoutButton =
    document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      async function () {
        logoutButton.disabled = true;

        try {
          const { error } = await db.auth.signOut();

          if (error) throw error;

          window.location.replace("login.html");

        } catch (error) {
          logoutButton.disabled = false;

          alert(
            "Unable to logout: " + error.message
          );
        }
      }
    );
  }

  // INITIAL LOAD

  await loadRequests();

  console.log(
    "Digital Production Request Dashboard loaded."
  );

  console.log("User role:", role);
});
