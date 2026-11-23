
/*
 DIGITAL PRODUCTION REQUEST SYSTEM
 DASHBOARD V6

 Production:
 Dashboard, Create Request, Request History,
 Employee Directory, Material Return

 Logistic:
 Dashboard, Request History, Approval,
 Material Issuing, Email Receipt,
 Employee Management, Material Return

 Staff:
 Basic Dashboard only
*/

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // =================================
  // 1. SUPABASE
  // =================================

  const SUPABASE_URL =
    "https://swyzpswrncaghdfnphhc.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  const get = id => document.getElementById(id);

  const notice = get("authNotice");
  const nav = get("mainNav");
  const main = get("appMain");
  const form = get("requestForm");
  const submitButton = get("submitRequest");
  const feedback = get("requestFeedback");
  const requestList = get("requestList");
  const logoutButton = get("logoutButton");

  let user = null;
  let role = null;
  let db = null;
  let cachedRequests = [];

  // =================================
  // 2. HELPERS
  // =================================

  function visible(node, enabled) {
    if (!node) return;

    node.hidden = !enabled;

    if (enabled) {
      node.style.removeProperty("display");
    } else {
      node.style.display = "none";
    }
  }

  function show(id, enabled) {
    visible(get(id), enabled);
  }

  function errorMessage(text) {
    console.error("DPR:", text);

    if (notice) {
      notice.replaceChildren();

      const message = document.createElement("p");
      message.textContent = text;

      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "Go to Login";

      notice.append(message, link);
      visible(notice, true);
    }

    visible(nav, false);
    visible(main, false);
  }

  function feedbackMessage(text, error = false) {
    if (!feedback) return;

    feedback.textContent = text;
    feedback.style.color =
      error ? "#fb7185" : "#2dd4bf";
  }

  function setToday() {
    const input = get("requestDate");
    if (!input) return;

    const date = new Date();

    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    input.value = `${year}-${month}-${day}`;
  }

  // =================================
  // 3. CONNECT & LOGIN
  // =================================

  if (!window.supabase?.createClient) {
    errorMessage("Supabase library failed to load.");
    return;
  }

  try {
    db = window.dprClient ||
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    window.dprClient = db;

    const { data: auth, error: authError } =
      await db.auth.getUser();

    if (authError) throw authError;

    if (!auth?.user) {
      location.replace("login.html");
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

    if (!["Staff", "Logistic", "Production"].includes(role)) {
      throw new Error("Unsupported account role.");
    }

  } catch (error) {
    errorMessage(
      "Login failed: " + error.message
    );
    return;
  }

  const isProduction = role === "Production";
  const isLogistic = role === "Logistic";
  const isStaff = role === "Staff";

  // =================================
  // 4. ROLE NAVIGATION
  // =================================

  // Production now owns Create Request.

  [
    "staffNavLink",
    "staffQuickLink",
    "request"
  ].forEach(id => show(id, isProduction));

  // Logistic modules remain unchanged.

  [
    "logisticNavLink",
    "issuingNavLink",
    "receiptNavLink",
    "approvalQuickLink",
    "issuingQuickLink",
    "receiptQuickLink",
    "logisticDashboardCard",
    "issuingDashboardCard",
    "receiptDashboardCard"
  ].forEach(id => show(id, isLogistic));

  // Request History:
  // Production sees own requests.
  // Logistic sees permitted requests.

  const allowHistory =
    isProduction || isLogistic;

  show("history", allowHistory);

  const navArea =
    nav?.querySelector(".sidebar-nav") || nav;

  if (navArea) {
    navArea.querySelectorAll('a[href="#history"]')
      .forEach(link => visible(link, allowHistory));
  }

  // Welcome message

  const welcome = get("welcomeMessage");

  if (welcome) {
    welcome.textContent =
      `Signed in as ${user.email} (${role})`;
  }

  // =================================
  // 5. SIDEBAR MENUS
  // =================================

  function addMenu(id, label, href, allowed) {
    if (!navArea) return;

    let link =
      get(id) ||
      navArea.querySelector(`a[href="${href}"]`);

    if (!link && allowed) {
      link = document.createElement("a");
      link.id = id;
      link.href = href;
      link.textContent = label;

      const logout = get("logoutButton");

      if (logout?.parentElement === navArea) {
        logout.before(link);
      } else {
        navArea.appendChild(link);
      }
    }

    visible(link, allowed);
  }

  // Production can view employee directory.
  // Logistic can manage employees.

  addMenu(
    "employeeNavLink",
    "Employee Management",
    "employees.html",
    isProduction || isLogistic
  );

  addMenu(
    "returnNavLink",
    "Material Return",
    "material-return.html",
    isProduction || isLogistic
  );

  // =================================
  // 6. SIDEBAR ICONS
  // =================================

  const iconShapes = {
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1"/>' +
      '<rect x="14" y="3" width="7" height="7" rx="1"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1"/>' +
      '<rect x="14" y="14" width="7" height="7" rx="1"/>',

    request:
      '<path d="M8 3h8l5 5v13H3V3z"/>' +
      '<path d="M16 3v5h5M12 12v6M9 15h6"/>',

    history:
      '<path d="M3 12a9 9 0 1 0 3-6.7"/>' +
      '<path d="M3 3v5h5M12 7v5l4 2"/>',

    approval:
      '<rect x="5" y="4" width="14" height="17" rx="2"/>' +
      '<path d="M9 4h6M9 13l2 2 4-4"/>',

    issuing:
      '<path d="m3 7 9-4 9 4-9 4-9-4z"/>' +
      '<path d="M3 7v10l9 4 9-4V7"/>' +
      '<path d="M12 11v10"/>',

    receipt:
      '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
      '<path d="m3 7 9 6 9-6"/>',

    employees:
      '<circle cx="9" cy="8" r="3"/>' +
      '<path d="M3 20v-2a6 6 0 0 1 12 0v2"/>' +
      '<path d="M17 5a3 3 0 0 1 0 6"/>' +
      '<path d="M18 14a5 5 0 0 1 3 5"/>',

    return:
      '<path d="M3 7v6h6"/>' +
      '<path d="M3 13a9 9 0 1 0 3-7"/>' +
      '<path d="m3 7 3-3"/>',

    logout:
      '<path d="m10 17 5-5-5-5"/>' +
      '<path d="M15 12H3"/>' +
      '<path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/>'
  };

  function createIcon(type) {
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
    svg.innerHTML = iconShapes[type];

    svg.style.setProperty(
      "width", "19px", "important"
    );

    svg.style.setProperty(
      "height", "19px", "important"
    );

    svg.style.setProperty(
      "flex-shrink", "0", "important"
    );

    return svg;
  }

  if (navArea) {
    navArea.querySelectorAll("a").forEach(link => {
      const href =
        (link.getAttribute("href") || "").toLowerCase();

      let type = null;

      if (href.includes("material-return.html")) {
        type = "return";
      } else if (href.includes("employees.html")) {
        type = "employees";
      } else if (href.includes("logistic.html")) {
        type = "approval";
      } else if (href.includes("issuing.html")) {
        type = "issuing";
      } else if (href.includes("receipt.html")) {
        type = "receipt";
      } else if (href === "#history") {
        type = "history";
      } else if (href === "#request") {
        type = "request";
      } else if (href === "#dashboard") {
        type = "dashboard";
      }

      if (!type) return;

      link.querySelectorAll(
        "svg, i, .nav-icon, .menu-icon"
      ).forEach(node => node.remove());

      link.prepend(createIcon(type));

      link.style.alignItems = "center";
      link.style.gap = "12px";

      link.style.display =
        link.hidden ? "none" : "flex";
    });
  }

  // Fix Logout duplicate icons

  if (logoutButton) {
    logoutButton.replaceChildren();

    logoutButton.appendChild(
      createIcon("logout")
    );

    const label = document.createElement("span");
    label.textContent = "Logout";

    logoutButton.appendChild(label);

    logoutButton.style.display = "flex";
    logoutButton.style.alignItems = "center";
    logoutButton.style.justifyContent = "center";
    logoutButton.style.gap = "10px";
  }

  // =================================
  // 7. QUICK ACCESS
  // =================================

  const quickArea =
    get("staffQuickLink")?.closest(
      ".quick-links, .quick-access-grid, .quick-grid"
    ) ||
    get("approvalQuickLink")?.closest(
      ".quick-links, .quick-access-grid, .quick-grid"
    ) ||
    document.querySelector("#dashboard .quick-links");

  const styling = document.createElement("style");

  styling.textContent = `
    #mainNav a svg.dpr-icon,
    #logoutButton svg.dpr-icon {
      width: 19px !important;
      height: 19px !important;
      min-width: 19px !important;
      max-width: 19px !important;
      min-height: 19px !important;
      max-height: 19px !important;
      fill: none !important;
      stroke: currentColor !important;
      flex-shrink: 0 !important;
    }

    #mainNav a svg.dpr-icon *,
    #logoutButton svg.dpr-icon * {
      fill: none !important;
      stroke: currentColor !important;
    }

    .dpr-extra-card {
      display: flex !important;
      flex-direction: column;
      justify-content: center;
      gap: 12px;
      min-height: 145px;
      padding: 22px;
      background: #101b2d;
      border: 1px solid #293548;
      border-radius: 14px;
      color: #f8fafc !important;
      text-decoration: none !important;
      font-weight: 600;
    }

    .dpr-extra-card::before {
      content: "";
      width: 32px;
      height: 4px;
      background: #2dd4bf;
      border-radius: 4px;
    }

    .dpr-extra-card small {
      color: #94a3b8;
      font-size: 12px;
      font-weight: normal;
      line-height: 1.5;
    }

    .dpr-extra-card:hover {
      background: #1b2b40;
      border-color: #2dd4bf;
    }

    [hidden] {
      display: none !important;
    }
  `;

  document.head.appendChild(styling);

  function addQuickCard(id, title, description, href, allowed) {
    if (!quickArea) return;

    let card = get(id);

    if (!allowed) {
      visible(card, false);
      return;
    }

    if (!card) {
      card = document.createElement("a");
      card.id = id;
      quickArea.appendChild(card);
    }

    card.href = href;
    card.classList.add("dpr-extra-card");
    card.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = title;

    const detail = document.createElement("small");
    detail.textContent = description;

    card.append(heading, detail);
    visible(card, true);
  }

  addQuickCard(
    "employeeQuickLink",
    "Employee Management",
    isLogistic
      ? "Manage Logistic and Production employees."
      : "View the employee directory.",
    "employees.html",
    isProduction || isLogistic
  );

  addQuickCard(
    "returnQuickLink",
    "Material Return",
    isProduction
      ? "Submit material returns to Logistic."
      : "Review and verify material returns.",
    "material-return.html",
    isProduction || isLogistic
  );

  // =================================
  // 8. SHOW DASHBOARD
  // =================================

  if (notice) visible(notice, false);

  visible(nav, true);
  visible(main, true);

  document.body.style.visibility = "visible";

  const dashboardMessage = document.createElement("p");
  dashboardMessage.style.color = "#94a3b8";

  if (isStaff) {
    dashboardMessage.textContent =
      "Request creation is now managed by Production.";

    get("dashboard")?.appendChild(dashboardMessage);
  }

  function updateActiveMenu() {
    if (!navArea) return;

    const hash = location.hash || "#dashboard";

    navArea.querySelectorAll('a[href^="#"]')
      .forEach(link => {
        const active =
          link.getAttribute("href") === hash;

        link.classList.toggle("active", active);

        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
  }

  updateActiveMenu();

  window.addEventListener(
    "hashchange",
    updateActiveMenu
  );

  // =================================
  // 9. REQUEST HISTORY
  // =================================

  const searchInput = get("requestSearch");
  const statusFilter = get("requestStatusFilter");

  function renderRequests(rows) {
    if (!requestList) return;

    requestList.replaceChildren();

    if (!rows.length) {
      const p = document.createElement("p");
      p.textContent = "No requests found.";
      requestList.appendChild(p);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-container";

    const table = document.createElement("table");
    table.className = "request-table";

    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");

    [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ].forEach(label => {
      const th = document.createElement("th");
      th.textContent = label;
      headingRow.appendChild(th);
    });

    thead.appendChild(headingRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const request of rows) {
      const tr = document.createElement("tr");

      [
        request.request_id,
        request.request_date,
        request.staff_id,
        request.product_model,
        request.production_quantity
      ].forEach(value => {
        const td = document.createElement("td");
        td.textContent = String(value ?? "");
        tr.appendChild(td);
      });

      const td = document.createElement("td");
      const badge = document.createElement("span");

      badge.className =
        "status-pill " +
        String(request.status || "").toLowerCase();

      badge.textContent =
        request.status || "Unknown";

      td.appendChild(badge);
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    requestList.appendChild(wrapper);
  }

  function filterRequests() {
    const keyword =
      (searchInput?.value || "").trim().toLowerCase();

    const selected =
      statusFilter?.value || "All";

    renderRequests(
      cachedRequests.filter(r => {
        const textMatch = [
          r.request_id,
          r.staff_id,
          r.product_model
        ].some(value =>
          String(value ?? "")
            .toLowerCase()
            .includes(keyword)
        );

        const statusMatch =
          selected === "All" ||
          r.status === selected;

        return textMatch && statusMatch;
      })
    );
  }

  searchInput?.addEventListener(
    "input",
    filterRequests
  );

  statusFilter?.addEventListener(
    "change",
    filterRequests
  );

  // =================================
  // 10. LOAD REQUESTS
  // =================================

  async function loadRequests() {
    if (isStaff) {
      [
        "pendingCount",
        "approvedCount",
        "rejectedCount"
      ].forEach(id => {
        if (get(id)) get(id).textContent = "—";
      });

      return;
    }

    if (requestList) {
      requestList.textContent = "Loading requests...";
    }

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
        });

      if (isProduction) {
        query = query.eq("requested_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      cachedRequests = data || [];

      for (const status of [
        "Pending",
        "Approved",
        "Rejected"
      ]) {
        const counter = get(
          status.toLowerCase() + "Count"
        );

        if (counter) {
          counter.textContent = String(
            cachedRequests.filter(
              r => r.status === status
            ).length
          );
        }
      }

      filterRequests();

    } catch (error) {
      console.error(error);

      for (const id of [
        "pendingCount",
        "approvedCount",
        "rejectedCount"
      ]) {
        if (get(id)) get(id).textContent = "—";
      }

      if (requestList) {
        requestList.textContent =
          "Unable to load requests: " +
          error.message;
      }
    }
  }

  // =================================
  // 11. CREATE REQUEST - PRODUCTION
  // =================================

  if (isProduction && form && submitButton) {
    setToday();

    submitButton.disabled = false;
    submitButton.type = "submit";

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (submitButton.disabled) return;
      if (!form.reportValidity()) return;

      const requestId =
        get("requestId")?.value.trim() || "";

      const requestDate =
        get("requestDate")?.value || "";

      const staffId =
        get("staffId")?.value.trim() || "";

      const productModel =
        get("productModel")?.value.trim() || "";

      const quantity = Number(
        get("productionQuantity")?.value
      );

      const remarks =
        get("remarks")?.value.trim() || "";

      if (
        !requestId ||
        !requestDate ||
        !staffId ||
        !productModel ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        feedbackMessage(
          "Please complete all required fields.",
          true
        );
        return;
      }

      submitButton.disabled = true;
      feedbackMessage("Submitting request...");

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

        form.reset();
        setToday();

        feedbackMessage(
          "Request submitted successfully!"
        );

        await loadRequests();

      } catch (error) {
        feedbackMessage(
          error.code === "23505"
            ? "Request ID already exists."
            : "Unable to submit: " + error.message,
          true
        );

      } finally {
        submitButton.disabled = false;
      }
    });
  }

  // =================================
  // 12. LOGOUT
  // =================================

  logoutButton?.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
      const { error } = await db.auth.signOut();

      if (error) throw error;

      location.replace("login.html");

    } catch (error) {
      logoutButton.disabled = false;
      alert(
        "Logout failed: " + error.message
      );
    }
  });

  // =================================
  // 13. INITIAL LOAD
  // =================================

  await loadRequests();

  console.log(
    "DPR DASHBOARD V6 LOADED - ROLE:",
    role
  );

});
