
/*
 DIGITAL PRODUCTION REQUEST SYSTEM
 DASHBOARD V5 - COMPLETE REPLACEMENT

 Staff | Logistic | Production
 Supabase + Dashboard + Request History
 Employee Management + Material Return
*/

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // =====================================
  // 1. SUPABASE CONFIGURATION
  // =====================================

  const SUPABASE_URL =
    "https://swyzpswrncaghdfnphhc.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  const el = id => document.getElementById(id);

  const notice = el("authNotice");
  const navigation = el("mainNav");
  const main = el("appMain");
  const form = el("requestForm");
  const submitButton = el("submitRequest");
  const feedback = el("requestFeedback");
  const requestList = el("requestList");
  const logoutButton = el("logoutButton");

  let currentUser = null;
  let role = "";
  let requests = [];

  // =====================================
  // 2. HELPERS
  // =====================================

  function setVisible(id, visible) {
    const node = el(id);
    if (!node) return;

    node.hidden = !visible;

    if (visible) {
      node.style.removeProperty("display");
    } else {
      node.style.display = "none";
    }
  }

  function showError(text) {
    console.error("DPR:", text);

    if (notice) {
      notice.replaceChildren();

      const message = document.createElement("p");
      message.textContent = text;

      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "Go to Login";

      notice.append(message, link);
      notice.hidden = false;
      notice.style.removeProperty("display");
    }

    setVisible("mainNav", false);
    setVisible("appMain", false);
  }

  function setFeedback(text, error = false) {
    if (!feedback) return;

    feedback.textContent = text;
    feedback.style.color =
      error ? "#fb7185" : "#2dd4bf";
  }

  function setToday() {
    const input = el("requestDate");
    if (!input) return;

    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    input.value = `${year}-${month}-${day}`;
  }

  // =====================================
  // 3. SUPABASE CONNECTION
  // =====================================

  if (!window.supabase?.createClient) {
    showError("Supabase library failed to load.");
    return;
  }

  let db;

  try {
    db = window.dprClient ||
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    window.dprClient = db;

  } catch (error) {
    showError(error.message);
    return;
  }

  // =====================================
  // 4. LOGIN & ROLE
  // =====================================

  try {
    const { data: auth, error: authError } =
      await db.auth.getUser();

    if (authError) throw authError;

    if (!auth?.user) {
      window.location.replace("login.html");
      return;
    }

    currentUser = auth.user;

    const { data: profile, error: profileError } =
      await db.from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (profileError) throw profileError;

    role = profile?.role;

    if (!["Staff", "Logistic", "Production"].includes(role)) {
      throw new Error("Unsupported account role.");
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

  // =====================================
  // 5. ROLE-BASED MODULES
  // =====================================

  [
    "staffNavLink",
    "staffQuickLink",
    "request"
  ].forEach(id => setVisible(id, isStaff));

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
  ].forEach(id => setVisible(id, isLogistic));

  const welcome = el("welcomeMessage");

  if (welcome) {
    welcome.textContent =
      `Signed in as ${currentUser.email} (${role})`;
  }

  // =====================================
  // 6. SIDEBAR
  // =====================================

  const navArea =
    navigation?.querySelector(".sidebar-nav") ||
    navigation;

  function addMenu(id, label, href, afterId) {
    if (!navArea) return;

    let link =
      el(id) ||
      navArea.querySelector(`a[href="${href}"]`);

    if (!link) {
      link = document.createElement("a");
      link.id = id;
      link.href = href;
      link.textContent = label;

      const after = el(afterId);

      if (after?.parentElement === navArea) {
        after.after(link);
      } else {
        navArea.appendChild(link);
      }
    }

    link.hidden = false;
    link.style.removeProperty("display");
  }

  // EMPLOYEE MANAGEMENT

  if (isStaff || isLogistic) {
    addMenu(
      "employeeNavLink",
      "Employee Management",
      "employees.html",
      "receiptNavLink"
    );
  } else {
    setVisible("employeeNavLink", false);
  }

  // MATERIAL RETURN

  if (isLogistic || isProduction) {
    addMenu(
      "returnNavLink",
      "Material Return",
      "material-return.html",
      "issuingNavLink"
    );
  } else {
    setVisible("returnNavLink", false);
  }

  // HIDE REQUEST HISTORY FOR PRODUCTION

  if (isProduction && navArea) {
    navArea.querySelectorAll('a[href="#history"]')
      .forEach(link => {
        link.hidden = true;
        link.style.display = "none";
      });

    setVisible("history", false);
  }

  // =====================================
  // 7. SIDEBAR ICONS
  // =====================================

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
    svg.innerHTML = icons[type];

    svg.style.setProperty(
      "width", "19px", "important"
    );

    svg.style.setProperty(
      "height", "19px", "important"
    );

    svg.style.setProperty(
      "flex-shrink", "0", "important"
    );

    svg.style.setProperty(
      "fill", "none", "important"
    );

    return svg;
  }

  function decorateSidebar() {
    if (!navArea) return;

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

      // Clear old decorative icons.
      link.querySelectorAll(
        "svg, i, .nav-icon, .menu-icon"
      ).forEach(node => node.remove());

      link.prepend(createIcon(type));

      link.style.display =
        link.hidden ? "none" : "flex";

      link.style.alignItems = "center";
      link.style.gap = "12px";
    });
  }

  decorateSidebar();

  // =====================================
  // 8. FIX DOUBLE LOGOUT ICON
  // =====================================

  if (logoutButton) {
    // Remove old icons and duplicate labels.
    logoutButton.replaceChildren();

    // Add exactly one icon.
    logoutButton.appendChild(
      createIcon("logout")
    );

    // Add exactly one label.
    const label = document.createElement("span");
    label.textContent = "Logout";

    logoutButton.appendChild(label);

    logoutButton.style.display = "flex";
    logoutButton.style.alignItems = "center";
    logoutButton.style.justifyContent = "center";
    logoutButton.style.gap = "10px";
  }

  // =====================================
  // 9. QUICK ACCESS
  // =====================================

  const quickArea =
    el("receiptQuickLink")?.closest(
      ".quick-links, .quick-access-grid, .quick-grid"
    ) ||
    el("approvalQuickLink")?.closest(
      ".quick-links, .quick-access-grid, .quick-grid"
    ) ||
    el("staffQuickLink")?.closest(
      ".quick-links, .quick-access-grid, .quick-grid"
    ) ||
    document.querySelector("#dashboard .quick-links");

  const quickCSS = document.createElement("style");

  quickCSS.textContent = `
    .dpr-extra-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 12px;
      padding: 22px;
      min-height: 145px;
      border-radius: 14px;
      background: #101b2d;
      border: 1px solid #293548;
      text-decoration: none;
      color: #f8fafc !important;
      font-weight: 600;
      transition: 0.2s;
    }

    .dpr-extra-card::before {
      content: "";
      width: 32px;
      height: 4px;
      border-radius: 4px;
      background: #2dd4bf;
    }

    .dpr-extra-card small {
      font-size: 12px;
      color: #94a3b8;
      font-weight: normal;
      line-height: 1.5;
    }

    .dpr-extra-card:hover {
      border-color: #2dd4bf;
      background: #1b2b40;
      transform: translateY(-3px);
    }

    #mainNav svg.dpr-icon,
    #logoutButton svg.dpr-icon {
      width: 19px !important;
      height: 19px !important;
      min-width: 19px !important;
      max-width: 19px !important;
      min-height: 19px !important;
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
  `;

  document.head.appendChild(quickCSS);

  function addQuickCard(id, title, description, href) {
    if (!quickArea) return;

    let card = el(id);

    if (!card) {
      card = document.createElement("a");
      card.id = id;
      quickArea.appendChild(card);
    }

    card.href = href;
    card.classList.add("dpr-extra-card");
    card.replaceChildren();

    const titleNode = document.createElement("strong");
    titleNode.textContent = title;

    const descriptionNode =
      document.createElement("small");

    descriptionNode.textContent = description;

    card.append(titleNode, descriptionNode);
    card.hidden = false;
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
        ? "Submit production material returns."
        : "Review and verify material returns.",
      "material-return.html"
    );
  }

  // =====================================
  // 10. ACTIVE SIDEBAR
  // =====================================

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

  // =====================================
  // 11. SHOW DASHBOARD
  // =====================================

  if (notice) {
    notice.hidden = true;
    notice.style.display = "none";
  }

  setVisible("mainNav", true);
  setVisible("appMain", true);

  document.body.style.visibility = "visible";

  // =====================================
  // 12. REQUEST HISTORY
  // =====================================

  const searchInput = el("requestSearch");
  const statusFilter = el("requestStatusFilter");

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
    const headRow = document.createElement("tr");

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
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

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

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    requestList.appendChild(wrapper);
  }

  function filterRequests() {
    const keyword =
      (searchInput?.value || "").trim().toLowerCase();

    const status =
      statusFilter?.value || "All";

    const filtered = requests.filter(r => {
      const matchesText = [
        r.request_id,
        r.staff_id,
        r.product_model
      ].some(value =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword)
      );

      const matchesStatus =
        status === "All" || r.status === status;

      return matchesText && matchesStatus;
    });

    renderRequests(filtered);
  }

  searchInput?.addEventListener(
    "input", filterRequests
  );

  statusFilter?.addEventListener(
    "change", filterRequests
  );

  // =====================================
  // 13. LOAD REQUESTS & STATISTICS
  // =====================================

  async function loadRequests() {
    if (isProduction) {
      // Production return data lives in its own module.
      ["pendingCount", "approvedCount", "rejectedCount"]
        .forEach(id => {
          if (el(id)) el(id).textContent = "—";
        });

      return;
    }

    if (requestList) {
      requestList.textContent = "Loading requests...";
    }

    try {
      let query = db.from("requests")
        .select(
          "request_id,request_date,requested_by," +
          "staff_id,product_model,production_quantity," +
          "status,created_at"
        )
        .order("created_at", {
          ascending: false
        });

      // Staff only sees their own requests.
      if (isStaff) {
        query = query.eq(
          "requested_by",
          currentUser.id
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      requests = data || [];

      ["Pending", "Approved", "Rejected"]
        .forEach(status => {
          const count = el(
            status.toLowerCase() + "Count"
          );

          if (!count) return;

          count.textContent = String(
            requests.filter(
              r => r.status === status
            ).length
          );
        });

      filterRequests();

    } catch (error) {
      console.error(
        "Cannot load requests:", error
      );

      ["pendingCount", "approvedCount", "rejectedCount"]
        .forEach(id => {
          if (el(id)) el(id).textContent = "—";
        });

      if (requestList) {
        requestList.textContent =
          "Cannot load requests: " + error.message;
      }
    }
  }

  // =====================================
  // 14. CREATE REQUEST - STAFF
  // =====================================

  if (isStaff && form && submitButton) {
    setToday();

    submitButton.disabled = false;
    submitButton.type = "submit";

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (submitButton.disabled) return;
      if (!form.reportValidity()) return;

      const requestId =
        el("requestId")?.value.trim() || "";

      const requestDate =
        el("requestDate")?.value || "";

      const staffId =
        el("staffId")?.value.trim() || "";

      const productModel =
        el("productModel")?.value.trim() || "";

      const qty = Number(
        el("productionQuantity")?.value
      );

      const remarks =
        el("remarks")?.value.trim() || "";

      if (
        !requestId ||
        !requestDate ||
        !staffId ||
        !productModel ||
        !Number.isSafeInteger(qty) ||
        qty < 1
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
            production_quantity: qty,
            remarks: remarks,
            status: "Pending"
          });

        if (error) throw error;

        form.reset();
        setToday();

        setFeedback(
          "Request submitted successfully!"
        );

        await loadRequests();

      } catch (error) {
        setFeedback(
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

  // =====================================
  // 15. LOGOUT
  // =====================================

  logoutButton?.addEventListener(
    "click",
    async () => {
      logoutButton.disabled = true;

      try {
        const { error } = await db.auth.signOut();

        if (error) throw error;

        window.location.replace("login.html");

      } catch (error) {
        logoutButton.disabled = false;

        alert(
          "Logout failed: " + error.message
        );
      }
    }
  );

  // =====================================
  // 16. INITIAL LOAD
  // =====================================

  await loadRequests();

  console.log(
    "DPR DASHBOARD V5 LOADED - ROLE:",
    role
  );
});
