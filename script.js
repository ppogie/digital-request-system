
/*
  DIGITAL PRODUCTION REQUEST SYSTEM
  DASHBOARD V8

  Production:
  - Create Request
  - Request History
  - Production Receiving
  - Employee Directory
  - Material Return

  Logistic:
  - Request History
  - Approval
  - Issuing
  - Email Receipt
  - Employee Management
  - Receiving History
  - Return Verification

  Staff:
  - Basic Dashboard

  DATA: TESTING
*/

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // ==========================================
  // CONFIGURATION
  // ==========================================

  const SUPABASE_URL =
    "https://swyzpswrncaghdfnphhc.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  const $ = id => document.getElementById(id);

  let db;
  let user;
  let role;
  let requests = [];
  let loadingRequest = false;

  const nav = $("mainNav");
  const main = $("appMain");
  const notice = $("authNotice");
  const requestForm = $("requestForm");
  const submitButton = $("submitRequest");

  // ==========================================
  // HELPERS
  // ==========================================

  function setVisible(element, allowed) {
    if (!element) return;
    element.hidden = !allowed;
  }

  function setText(id, text) {
    const element = $(id);
    if (element) {
      element.textContent = String(text);
    }
  }

  function showError(message) {
    console.error(message);

    if (notice) {
      notice.replaceChildren();

      const paragraph = document.createElement("p");
      paragraph.textContent = message;

      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "Go to Login";

      notice.append(paragraph, link);
      notice.hidden = false;
    }

    setVisible(nav, false);
    setVisible(main, false);
  }

  function showDashboardError(message) {
    const element = $("dashboardError");
    if (!element) return;

    element.hidden = false;
    element.className = "dpr-alert error";

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    element.appendChild(paragraph);
  }

  function setFeedback(message, isError = false) {
    const element = $("requestFeedback");

    if (!element) return;

    element.textContent = message;
    element.style.color =
      isError ? "#fda4af" : "#2dd4bf";
  }

  function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function allowedForRole(value) {
    if (!value) return true;

    if (value === "all") return true;

    return value.split(",")
      .map(item => item.trim())
      .includes(role);
  }

  // ==========================================
  // SVG SIDEBAR ICONS
  // ==========================================

  const iconPaths = {
    dashboard: `
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    `,

    request: `
      <path d="M8 3h8l5 5v13H3V3z"/>
      <path d="M16 3v5h5"/>
      <path d="M12 12v6M9 15h6"/>
    `,

    history: `
      <path d="M3 12a9 9 0 1 0 3-6.7"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    `,

    receiving: `
      <path d="m3 7 9-4 9 4-9 4-9-4z"/>
      <path d="M3 7v10l9 4 9-4V7"/>
      <path d="M12 11v10"/>
      <path d="m8 16 3 3 5-6"/>
    `,

    approval: `
      <rect x="5" y="4" width="14" height="17" rx="2"/>
      <path d="M9 4h6"/>
      <path d="m9 13 2 2 4-4"/>
    `,

    issuing: `
      <path d="m3 7 9-4 9 4-9 4-9-4z"/>
      <path d="M3 7v10l9 4 9-4V7"/>
      <path d="M12 11v10"/>
    `,

    receipt: `
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m3 7 9 6 9-6"/>
    `,

    employees: `
      <circle cx="9" cy="8" r="3"/>
      <path d="M3 20v-2a6 6 0 0 1 12 0v2"/>
      <path d="M17 5a3 3 0 0 1 0 6"/>
      <path d="M18 14a5 5 0 0 1 3 5"/>
    `,

    return: `
      <path d="M3 7v6h6"/>
      <path d="M3 13a9 9 0 1 0 3-7"/>
      <path d="m3 7 3-3"/>
    `,

    logout: `
      <path d="m10 17 5-5-5-5"/>
      <path d="M15 12H3"/>
      <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/>
    `
  };

  function createIcon(type) {
    if (!iconPaths[type]) return null;

    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "19");
    svg.setAttribute("height", "19");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    svg.classList.add("dpr-icon");
    svg.innerHTML = iconPaths[type];

    return svg;
  }

  function prepareIcons() {
    document.querySelectorAll("[data-icon]")
      .forEach(link => {
        const iconType = link.dataset.icon;

        link.querySelectorAll("svg, i")
          .forEach(element => element.remove());

        const svg = createIcon(iconType);
        if (svg) link.prepend(svg);
      });

    const logout = $("logoutButton");

    if (logout) {
      logout.replaceChildren();

      const icon = createIcon("logout");
      const label = document.createElement("span");

      label.textContent = "Logout";

      if (icon) logout.appendChild(icon);
      logout.appendChild(label);
    }
  }

  // ==========================================
  // ROLE NAVIGATION
  // ==========================================

  function configureNavigation() {
    document.querySelectorAll("[data-role]")
      .forEach(element => {
        setVisible(
          element,
          allowedForRole(element.dataset.role)
        );
      });

    setText(
      "welcomeMessage",
      `Signed in as ${user.email} (${role})`
    );

    setText(
      "dashboardScope",
      role === "Production"
        ? "Request KPIs show your own requests. " +
          "Receiving and Return KPIs show your own records. " +
          "Older requests made by another account are not included."
        : role === "Logistic"
          ? "Showing records accessible to the Logistic account."
          : "Staff access is limited to the basic dashboard."
    );

    updateActiveMenu();
  }

  function updateActiveMenu() {
    const hash = window.location.hash || "#dashboard";

    document.querySelectorAll(
      "#sidebarMenu a[href^='#']"
    ).forEach(link => {
      const active =
        link.getAttribute("href") === hash;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener(
    "hashchange",
    updateActiveMenu
  );

  // ==========================================
  // REQUEST HISTORY
  // ==========================================

  function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = String(value ?? "-");

    row.appendChild(cell);
    return cell;
  }

  function renderRequests() {
    const list = $("requestList");
    if (!list) return;

    list.replaceChildren();

    const keyword =
      ($("requestSearch")?.value || "")
        .trim()
        .toLowerCase();

    const filter =
      $("requestStatusFilter")?.value || "All";

    const filtered = requests.filter(item => {
      const matchesSearch = [
        item.request_id,
        item.staff_id,
        item.product_model
      ].some(value =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword)
      );

      const matchesStatus =
        filter === "All" ||
        item.status === filter;

      return matchesSearch && matchesStatus;
    });

    if (!filtered.length) {
      const message = document.createElement("p");

      message.textContent = requests.length
        ? "No requests match your search or status filter."
        : "No requests found for this account.";

      list.appendChild(message);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "dpr-history-wrap";

    const table = document.createElement("table");
    table.className = "dpr-history-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ].forEach(title => {
      const th = document.createElement("th");
      th.textContent = title;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    filtered.forEach(item => {
      const tr = document.createElement("tr");

      [
        item.request_id,
        item.request_date,
        item.staff_id,
        item.product_model,
        item.production_quantity
      ].forEach(value => addCell(tr, value));

      const statusCell = document.createElement("td");

      const badge = document.createElement("span");

      const status = String(item.status || "Unknown");

      badge.className =
        "dpr-pill " + status.toLowerCase();

      badge.textContent = status;

      statusCell.appendChild(badge);
      tr.appendChild(statusCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    list.appendChild(wrapper);
  }

  $("requestSearch")?.addEventListener(
    "input",
    renderRequests
  );

  $("requestStatusFilter")?.addEventListener(
    "change",
    renderRequests
  );

  // ==========================================
  // REQUEST KPI
  // ==========================================

  function updateRequestCounters() {
    for (const status of [
      "Pending",
      "Approved",
      "Rejected"
    ]) {
      const count = requests.filter(
        item => item.status === status
      ).length;

      setText(
        status.toLowerCase() + "Count",
        count
      );
    }
  }

  async function loadRequests() {
    if (role === "Staff") {
      [
        "pendingCount",
        "approvedCount",
        "rejectedCount"
      ].forEach(id => setText(id, "—"));

      return;
    }

    setText("requestList", "Loading requests...");

    try {
      let query = db
        .from("requests")
        .select(
          "request_id,request_date,requested_by," +
          "staff_id,product_model,production_quantity," +
          "status,created_at"
        )
        .order("created_at", {
          ascending: false
        })
        .limit(1000);

      // Production can see own requests.
      // Logistic reads requests allowed by RLS.

      if (role === "Production") {
        query = query.eq(
          "requested_by",
          user.id
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      requests = data || [];

      updateRequestCounters();
      renderRequests();

    } catch (error) {
      [
        "pendingCount",
        "approvedCount",
        "rejectedCount"
      ].forEach(id => setText(id, "—"));

      setText(
        "requestList",
        "Unable to load Request History: " +
        error.message
      );

      showDashboardError(
        "Request records could not be loaded: " +
        error.message
      );
    }
  }

  // ==========================================
  // RECEIVING KPI
  // ==========================================

  async function loadReceivingCount() {
    if (role === "Staff") {
      setText("receivedCount", "—");
      return;
    }

    try {
      // Count receipt records visible to this role.
      let query = db
        .from("production_receipts")
        .select("id", {
          count: "exact",
          head: true
        });

      if (role === "Production") {
        query = query.eq(
          "received_by",
          user.id
        );
      }

      const { count, error } = await query;

      if (error) throw error;

      setText("receivedCount", count ?? 0);

    } catch (error) {
      setText("receivedCount", "—");

      showDashboardError(
        "Receiving KPI unavailable: " + error.message
      );
    }
  }

  // ==========================================
  // MATERIAL RETURN KPIs
  // ==========================================

  async function countReturns(status) {
    let query = db
      .from("material_returns")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("status", status);

    if (role === "Production") {
      query = query.eq(
        "submitted_by",
        user.id
      );
    }

    const { count, error } = await query;

    if (error) throw error;

    return count ?? 0;
  }

  async function loadReturnCounts() {
    if (role === "Staff") {
      setText("returnPendingCount", "—");
      setText("returnAcceptedCount", "—");
      return;
    }

    const results = await Promise.allSettled([
      countReturns("Pending"),
      countReturns("Accepted")
    ]);

    const ids = [
      "returnPendingCount",
      "returnAcceptedCount"
    ];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        setText(ids[index], result.value);
      } else {
        setText(ids[index], "—");

        showDashboardError(
          "Material Return KPI unavailable: " +
          result.reason.message
        );
      }
    });
  }

  // ==========================================
  // CREATE REQUEST
  // ==========================================

  async function submitRequest(event) {
    event.preventDefault();

    if (role !== "Production") {
      setFeedback(
        "Only Production can create requests.",
        true
      );
      return;
    }

    if (loadingRequest) return;
    if (!requestForm.reportValidity()) return;

    const requestId =
      $("requestId").value.trim();

    const requestDate =
      $("requestDate").value;

    const staffId =
      $("staffId").value.trim();

    const productModel =
      $("productModel").value.trim();

    const quantity =
      Number($("productionQuantity").value);

    const remarks =
      $("remarks").value.trim();

    if (
      !requestId ||
      !requestDate ||
      !staffId ||
      !productModel ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      setFeedback(
        "Please complete all required fields.",
        true
      );
      return;
    }

    const confirmed = window.confirm(
      `Submit Production Request ${requestId}?`
    );

    if (!confirmed) return;

    loadingRequest = true;
    submitButton.disabled = true;

    setFeedback("Submitting request...");

    try {
      const { error } = await db
        .from("requests")
        .insert({
          request_id: requestId,
          request_date: requestDate,
          requested_by: user.id,
          staff_id: staffId,
          product_model: productModel,
          production_quantity: quantity,
          remarks,
          status: "Pending"
        });

      if (error) throw error;

      requestForm.reset();
      $("requestDate").value = today();

      setFeedback(
        `Request ${requestId} submitted successfully!`
      );

      await loadRequests();

    } catch (error) {
      setFeedback(
        error.code === "23505"
          ? "Request ID already exists."
          : "Submission failed: " + error.message,
        true
      );

    } finally {
      loadingRequest = false;
      submitButton.disabled = false;
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  $("logoutButton")?.addEventListener(
    "click",
    async () => {
      const button = $("logoutButton");
      button.disabled = true;

      try {
        const { error } =
          await db.auth.signOut();

        if (error) throw error;

        window.location.replace("login.html");

      } catch (error) {
        button.disabled = false;

        alert(
          "Logout failed: " + error.message
        );
      }
    }
  );

  // ==========================================
  // AUTHENTICATION & STARTUP
  // ==========================================

  async function initialize() {
    if (!window.supabase?.createClient) {
      showError(
        "Supabase library failed to load."
      );
      return;
    }

    try {
      db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

      const { data: auth, error: authError } =
        await db.auth.getUser();

      if (authError) throw authError;

      if (!auth?.user) {
        window.location.replace("login.html");
        return;
      }

      user = auth.user;

      const { data: profile, error: profileError } =
        await db
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) throw profileError;

      role = profile?.role;

      if (!["Staff", "Production", "Logistic"]
        .includes(role)) {
        throw new Error(
          "Your account does not have a valid role."
        );
      }

      prepareIcons();
      configureNavigation();

      $("requestDate").value = today();

      if (role === "Production") {
        submitButton.disabled = false;

        requestForm.addEventListener(
          "submit",
          submitRequest
        );
      }

      notice.hidden = true;
      nav.hidden = false;
      main.hidden = false;

      await Promise.allSettled([
        loadRequests(),
        loadReceivingCount(),
        loadReturnCounts()
      ]);

      console.log(
        "DPR Dashboard V8 loaded:",
        role
      );

    } catch (error) {
      showError(
        "Unable to open Dashboard: " +
        error.message
      );
    }
  }

  initialize();

});
