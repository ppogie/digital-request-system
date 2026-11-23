
/*
  DIGITAL PRODUCTION REQUEST SYSTEM
  DASHBOARD V4
  Staff | Logistic | Production
*/

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // ==============================
  // 1. SUPABASE CONFIGURATION
  // ==============================

  const SUPABASE_URL =
    "https://swyzpswrncaghdfnphhc.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  const $ = id => document.getElementById(id);

  const notice = $("authNotice");
  const navigation = $("mainNav");
  const main = $("appMain");
  const form = $("requestForm");
  const submitButton = $("submitRequest");
  const feedback = $("requestFeedback");
  const requestList = $("requestList");
  const logoutButton = $("logoutButton");

  let user = null;
  let role = null;
  let requests = [];

  // ==============================
  // 2. HELPER FUNCTIONS
  // ==============================

  function show(id, visible) {
    const node = $(id);
    if (!node) return;

    node.hidden = !visible;

    if (visible) {
      node.style.removeProperty("display");
    } else {
      node.style.display = "none";
    }
  }

  function showError(message) {
    console.error(message);

    if (notice) {
      notice.replaceChildren();

      const text = document.createElement("span");
      text.textContent = message + " ";
      notice.appendChild(text);

      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "Go to Login";
      notice.appendChild(link);

      notice.hidden = false;
      notice.style.removeProperty("display");
    }

    show("mainNav", false);
    show("appMain", false);
  }

  function message(text, error = false) {
    if (!feedback) return;

    feedback.textContent = text;
    feedback.style.color =
      error ? "#fb7185" : "#2dd4bf";
  }

  function setToday() {
    const dateInput = $("requestDate");
    if (!dateInput) return;

    const now = new Date();

    const y = now.getFullYear();
    const m = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
      now.getDate()
    ).padStart(2, "0");

    dateInput.value = `${y}-${m}-${d}`;
  }

  // ==============================
  // 3. SUPABASE CONNECTION
  // ==============================

  if (!window.supabase?.createClient) {
    showError("Supabase library failed to load.");
    return;
  }

  const db = window.dprClient ||
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

  window.dprClient = db;

  // ==============================
  // 4. AUTHENTICATION
  // ==============================

  try {
    const { data, error } =
      await db.auth.getUser();

    if (error) throw error;

    if (!data?.user) {
      location.replace("login.html");
      return;
    }

    user = data.user;

    const profileResult = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileResult.error) {
      throw profileResult.error;
    }

    role = profileResult.data?.role;

    if (!["Staff", "Logistic", "Production"].includes(role)) {
      throw new Error("Invalid account role.");
    }

  } catch (error) {
    showError(
      "Login verification failed: " + error.message
    );
    return;
  }

  const isStaff = role === "Staff";
  const isLogistic = role === "Logistic";
  const isProduction = role === "Production";

  // ==============================
  // 5. ROLE-BASED NAVIGATION
  // ==============================

  [
    "staffNavLink",
    "staffQuickLink",
    "request"
  ].forEach(id => show(id, isStaff));

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

  const welcome = $("welcomeMessage");

  if (welcome) {
    welcome.textContent =
      `Signed in as ${user.email} (${role})`;
  }

  // ==============================
  // 6. SHARED STYLING
  // ==============================

  const extraCSS = document.createElement("style");

  extraCSS.textContent = `
    #mainNav .dpr-nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 15px;
      min-height: 46px;
      color: #cbd5e1;
      text-decoration: none;
      border-radius: 10px;
      font-size: 14px;
      border-left: 3px solid transparent;
    }

    #mainNav .dpr-nav-link:hover {
      background: #243247;
      color: #5eead4;
    }

    #mainNav .dpr-nav-link.active {
      background: #164e4a;
      color: #5eead4;
      border-left-color: #2dd4bf;
      font-weight: 600;
    }

    #mainNav .dpr-nav-link[hidden] {
      display: none !important;
    }

    #mainNav svg.dpr-icon,
    #logoutButton svg.dpr-icon {
      width: 19px !important;
      height: 19px !important;
      min-width: 19px !important;
      min-height: 19px !important;
      max-width: 19px !important;
      max-height: 19px !important;
      flex-shrink: 0 !important;
      fill: none !important;
      stroke: currentColor !important;
    }

    #mainNav svg.dpr-icon *,
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
      font-size: 15px;
      font-weight: 600;
      transition: 0.2s ease;
    }

    .dpr-extra-card::before {
      content: "";
      width: 32px;
      height: 4px;
      border-radius: 4px;
      background: #2dd4bf;
    }

    .dpr-extra-card:hover {
      border-color: #2dd4bf;
      background: #1b2b40;
      transform: translateY(-3px);
    }

    .dpr-extra-card small {
      font-size: 12px;
      line-height: 1.5;
      font-weight: normal;
      color: #94a3b8;
    }
  `;

  document.head.appendChild(extraCSS);

  // ==============================
  // 7. SIDEBAR MENUS
  // ==============================

  const navArea =
    navigation?.querySelector(".sidebar-nav") ||
    navigation;

  function addMenu(id, label, href, afterId) {
    if (!navArea) return null;

    let link =
      $(id) ||
      navArea.querySelector(`a[href="${href}"]`);

    if (!link) {
      link = document.createElement("a");
      link.id = id;
      link.href = href;
      link.textContent = label;

      const afterNode = $(afterId);

      if (afterNode && afterNode.parentElement === navArea) {
        afterNode.after(link);
      } else {
        navArea.appendChild(link);
      }
    }

    link.hidden = false;
    link.style.removeProperty("display");

    return link;
  }

  // EMPLOYEE MANAGEMENT
  // Staff can view; Logistic can manage.
  // Actual permissions remain controlled by RLS.

  if (isStaff || isLogistic) {
    addMenu(
      "employeeNavLink",
      "Employee Management",
      "employees.html",
      "receiptNavLink"
    );
  } else {
    show("employeeNavLink", false);
  }

  // MATERIAL RETURN
  // Production submits; Logistic reviews.

  if (isProduction || isLogistic) {
    addMenu(
      "returnNavLink",
      "Material Return",
      "material-return.html",
      "issuingNavLink"
    );
  } else {
    show("returnNavLink", false);
  }

  // ==============================
  // 8. SIDEBAR ICONS
  // ==============================

  const icons = {
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
      '<path d="m3 7 9-4 9 4-9 4z"/>' +
      '<path d="M3 7v10l9 4 9-4V7"/>' +
      '<path d="M12 11v10M16 15l2 2 3-3"/>',

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

    svg.setAttribute("class", "dpr-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "19");
    svg.setAttribute("height", "19");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    svg.innerHTML = icons[type];

    return svg;
  }

  if (navArea) {
    navArea.querySelectorAll("a").forEach(link => {
      const href =
        (link.getAttribute("href") || "")
          .toLowerCase();

      const label =
        (link.textContent || "")
          .trim()
          .toLowerCase();

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
      } else if (label.includes("employee")) {
        type = "employees";
      } else if (label.includes("return")) {
        type = "return";
      }

      if (!type) return;

      link.classList.add("dpr-nav-link");

      // Remove previous decorative icons.
      link.querySelectorAll(
        "svg, i, .nav-icon, .menu-icon"
      ).forEach(node => node.remove());

      link.prepend(createIcon(type));
    });
  }
   
if (logoutButton) {
  // Remove all existing logout SVG icons
  logoutButton.querySelectorAll("svg").forEach(icon => {
    icon.remove();
  });

  // Add one new logout icon
  logoutButton.prepend(createIcon("logout"));

  logoutButton.style.display = "flex";
  logoutButton.style.alignItems = "center";
  logoutButton.style.justifyContent = "center";
  logoutButton.style.gap = "10px";
}


  // ==============================
  // 9. QUICK ACCESS CARDS
  // ==============================

  function getQuickArea() {
    const anchor =
      $("receiptQuickLink") ||
      $("issuingQuickLink") ||
      $("approvalQuickLink") ||
      $("staffQuickLink");

    return anchor?.closest(
      ".quick-links, .quick-access-grid, " +
      ".quick-access, .quick-grid"
    ) || document.querySelector(
      "#dashboard .quick-links"
    );
  }

  function addQuickCard(id, title, description, href) {
    const area = getQuickArea();
    if (!area) return;

    let card = $(id);

    if (!card) {
      card = document.createElement("a");
      card.id = id;
      area.appendChild(card);
    }

    card.href = href;
    card.classList.add("dpr-extra-card");

    card.replaceChildren();

    const titleNode = document.createElement("strong");
    titleNode.textContent = title;

    const descNode = document.createElement("small");
    descNode.textContent = description;

    card.append(titleNode, descNode);

    card.hidden = false;
    card.style.removeProperty("display");
  }

  if (isLogistic) {
    addQuickCard(
      "employeeQuickLink",
      "Employee Management",
      "Manage Logistic and Production employees.",
      "employees.html"
    );
  }

  if (isLogistic || isProduction) {
    addQuickCard(
      "returnQuickLink",
      "Material Return",
      isProduction
        ? "Submit raw material returns."
        : "Review Production material returns.",
      "material-return.html"
    );
  }

  // ==============================
  // 10. ACTIVE SIDEBAR
  // ==============================

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

  // ==============================
  // 11. SHOW DASHBOARD
  // ==============================

  if (notice) {
    notice.hidden = true;
    notice.style.display = "none";
  }

  show("mainNav", true);
  show("appMain", true);

  document.body.style.visibility = "visible";

  // ==============================
  // 12. REQUEST HISTORY
  // ==============================

  const searchInput = $("requestSearch");
  const statusFilter = $("requestStatusFilter");

  function renderRequests(rows) {
    if (!requestList) return;

    requestList.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.textContent = "No requests found.";
      requestList.appendChild(empty);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-container";

    const table = document.createElement("table");
    table.className = "request-table";

    const head = document.createElement("thead");
    const heading = document.createElement("tr");

    [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      heading.appendChild(th);
    });

    head.appendChild(heading);
    table.appendChild(head);

    const body = document.createElement("tbody");

    rows.forEach(request => {
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

      badge.textContent = request.status || "Unknown";

      td.appendChild(badge);
      tr.appendChild(td);
      body.appendChild(tr);
    });

    table.appendChild(body);
    wrapper.appendChild(table);
    requestList.appendChild(wrapper);
  }

  function filterRequests() {
    const keyword =
      (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const status =
      statusFilter?.value || "All";

    const filtered = requests.filter(r => {
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
        status === "All" || r.status === status;

      return textMatch && statusMatch;
    });

    renderRequests(filtered);
  }

  searchInput?.addEventListener(
    "input",
    filterRequests
  );

  statusFilter?.addEventListener(
    "change",
    filterRequests
  );

  // ==============================
  // 13. LOAD REQUESTS
  // ==============================

  async function loadRequests() {
    if (requestList) {
      requestList.textContent = "Loading requests...";
    }

    try {
      let query = db
        .from("requests")
        .select(
          "request_id,request_date,requested_by," +
          "staff_id,product_model," +
          "production_quantity,status,created_at"
        )
        .order("created_at", { ascending: false });

      if (isStaff) {
        query = query.eq("requested_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      requests = data || [];

      for (const status of [
        "Pending",
        "Approved",
        "Rejected"
      ]) {
        const counter =
          $(status.toLowerCase() + "Count");

        if (counter) {
          counter.textContent = String(
            requests.filter(r =>
              r.status === status
            ).length
          );
        }
      }

      filterRequests();

    } catch (error) {
      console.error(error);

      if (requestList) {
        requestList.textContent =
          "Unable to load requests: " +
          error.message;
      }
    }
  }

  // ==============================
  // 14. CREATE REQUEST
  // ==============================

  if (isStaff && form && submitButton) {
    setToday();

    submitButton.disabled = false;
    submitButton.type = "submit";

    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        if (submitButton.disabled) return;
        if (!form.reportValidity()) return;

        const requestId =
          $("requestId")?.value.trim() || "";

        const requestDate =
          $("requestDate")?.value || "";

        const staffId =
          $("staffId")?.value.trim() || "";

        const productModel =
          $("productModel")?.value.trim() || "";

        const qty = Number(
          $("productionQuantity")?.value
        );

        const remarks =
          $("remarks")?.value.trim() || "";

        if (
          !requestId ||
          !requestDate ||
          !staffId ||
          !productModel ||
          !Number.isSafeInteger(qty) ||
          qty <= 0
        ) {
          message(
            "Please complete all required fields.",
            true
          );
          return;
        }

        submitButton.disabled = true;
        message("Submitting request...");

        try {
          const { error } = await db
            .from("requests")
            .insert({
              request_id: requestId,
              request_date: requestDate,
              requested_by: user.id,
              staff_id: staffId,
              product_model: productModel,
              production_quantity: qty,
              remarks,
              status: "Pending"
            });

          if (error) throw error;

          form.reset();
          setToday();

          message("Request submitted successfully!");

          await loadRequests();

        } catch (error) {
          message(
            error.code === "23505"
              ? "Request ID already exists."
              : "Unable to submit: " + error.message,
            true
          );

        } finally {
          submitButton.disabled = false;
        }
      }
    );
  }

  // ==============================
  // 15. LOGOUT
  // ==============================

  logoutButton?.addEventListener(
    "click",
    async () => {
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
    }
  );

  // ==============================
  // 16. INITIAL LOAD
  // ==============================

  await loadRequests();

  console.log(
    "DPR DASHBOARD V4 LOADED - ROLE:",
    role
  );
});
