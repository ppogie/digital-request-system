
/*
  DIGITAL PRODUCTION REQUEST SYSTEM
  Dashboard JavaScript - Supabase Version V3
  Login, Roles, Requests, Search, Employee Menu, Icons
*/

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // 1. SUPABASE CONFIGURATION

  const SUPABASE_URL =
    "https://swyzpswrncaghdfnphhc.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  // 2. HTML ELEMENTS

  const byId = (id) => document.getElementById(id);

  const notice = byId("authNotice");
  const navigation = byId("mainNav");
  const main = byId("appMain");
  const form = byId("requestForm");
  const submitButton = byId("submitRequest");
  const feedback = byId("requestFeedback");
  const requestList = byId("requestList");
  const logoutButton = byId("logoutButton");

  let currentUser = null;
  let role = null;
  let cachedRequests = [];

  // 3. HELPER FUNCTIONS

  function setVisible(id, visible) {
    const element = byId(id);
    if (!element) return;

    element.hidden = !visible;

    if (!visible) {
      element.style.display = "none";
    } else {
      element.style.removeProperty("display");
    }
  }

  function showError(message) {
    console.error("DPR Dashboard:", message);

    if (notice) {
      notice.replaceChildren();

      notice.appendChild(
        document.createTextNode(message + " ")
      );

      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "Go to Login";

      notice.appendChild(link);
      notice.classList.add("error");
      notice.hidden = false;
      notice.style.removeProperty("display");
    }

    setVisible("mainNav", false);
    setVisible("appMain", false);
  }

  function setFeedback(message, isError = false) {
    if (!feedback) return;

    feedback.textContent = message;
    feedback.style.color = isError
      ? "#fb7185"
      : "#5eead4";
  }

  function setToday() {
    const dateInput = byId("requestDate");
    if (!dateInput) return;

    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
  }

  // 4. CONNECT SUPABASE

  if (!window.supabase?.createClient) {
    showError(
      "Supabase library not loaded. Refresh the page."
    );
    return;
  }

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
      "Supabase connection failed: " + error.message
    );
    return;
  }

  // 5. VERIFY LOGIN

  try {
    const {
      data: auth,
      error: authError
    } = await db.auth.getUser();

    if (authError) throw authError;

    if (!auth?.user) {
      window.location.replace("login.html");
      return;
    }

    currentUser = auth.user;

    // CHECK USER ROLE

    const {
      data: profile,
      error: profileError
    } = await db
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileError) throw profileError;

    role = profile?.role;

    if (!["Staff", "Logistic"].includes(role)) {
      throw new Error(
        "Your account role is not supported yet."
      );
    }

  } catch (error) {
    showError(
      "Cannot verify login or user role: " +
      error.message
    );
    return;
  }

  const isLogistic = role === "Logistic";
  const isStaff = role === "Staff";

  // 6. STAFF NAVIGATION

  [
    "staffNavLink",
    "staffQuickLink",
    "request"
  ].forEach((id) => {
    setVisible(id, isStaff);
  });

  // 7. LOGISTIC NAVIGATION

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
  ].forEach((id) => {
    setVisible(id, isLogistic);
  });

  // 8. WELCOME MESSAGE

  const welcome = byId("welcomeMessage");

  if (welcome) {
    welcome.textContent =
      `Signed in as ${currentUser.email} (${role})`;
  }

  // 9. EMPLOYEE MANAGEMENT MENU

  function addEmployeeLinks() {
    if (!isLogistic || !navigation) return;

    const navArea =
      navigation.querySelector(".sidebar-nav") ||
      navigation;

    let link =
      byId("employeeNavLink") ||
      navArea.querySelector(
        'a[href="employees.html"]'
      );

    if (!link) {
      link = document.createElement("a");

      link.id = "employeeNavLink";
      link.href = "employees.html";
      link.textContent = "Employee Management";

      const receiptLink = navArea.querySelector(
        '#receiptNavLink, a[href="receipt.html"]'
      );

      if (receiptLink) {
        receiptLink.after(link);
      } else {
        navArea.appendChild(link);
      }
    }

    link.hidden = false;

    // ADD EMPLOYEE MANAGEMENT TO QUICK ACCESS

    const receiptQuick = byId("receiptQuickLink");

    const quickArea =
      receiptQuick?.closest(
        ".quick-links, .quick-access-grid, " +
        ".quick-access, .quick-grid"
      ) ||
      document.querySelector(
        "#dashboard .quick-links"
      );

    if (quickArea && !byId("employeeQuickLink")) {
      const quickLink = document.createElement("a");

      quickLink.id = "employeeQuickLink";
      quickLink.href = "employees.html";
      quickLink.textContent = "Employee Management";

      quickArea.appendChild(quickLink);
    }
  }

  // 10. SIDEBAR SVG ICONS

  function decorateSidebar() {
    if (!navigation) return;

    const navArea =
      navigation.querySelector(".sidebar-nav") ||
      navigation;

    const shapes = {
      dashboard:
        '<rect x="3" y="3" width="7" height="7" rx="1"/>' +
        '<rect x="14" y="3" width="7" height="7" rx="1"/>' +
        '<rect x="3" y="14" width="7" height="7" rx="1"/>' +
        '<rect x="14" y="14" width="7" height="7" rx="1"/>',

      create:
        '<path d="M8 3h8l5 5v13H3V3z"/>' +
        '<path d="M16 3v5h5M12 12v6M9 15h6"/>',

      history:
        '<path d="M3 12a9 9 0 1 0 3-6.7' +
        'M3 3v5h5M12 7v5l4 2"/>',

      approval:
        '<rect x="5" y="4" width="14" height="17" rx="2"/>' +
        '<path d="M9 4.5h6m-6 9 2 2 4-4"/>',

      issuing:
        '<path d="m3 7 9-4 9 4-9 4z' +
        'M3 7v10l9 4 9-4V7' +
        'M12 11v10m4-6 2 2 3-3"/>',

      receipt:
        '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
        '<path d="m3 7 9 6 9-6"/>',

      employees:
        '<circle cx="9" cy="8" r="3"/>' +
        '<path d="M3 20v-2a6 6 0 0 1 12 0v2' +
        'M17 5a3 3 0 0 1 0 6' +
        'm1 3a5 5 0 0 1 3 5"/>',

      logout:
        '<path d="m10 17 5-5-5-5' +
        'M15 12H3' +
        'M12 3h6a3 3 0 0 1 3 3v12' +
        'a3 3 0 0 1-3 3h-6"/>'
    };

    // CREATE SVG

    function icon(type) {
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );

      svg.setAttribute("class", "dpr-menu-icon");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "19");
      svg.setAttribute("height", "19");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.8");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");

      svg.innerHTML = shapes[type];

      // PREVENT OVERSIZED ICONS

      [
        "width",
        "height",
        "min-width",
        "min-height",
        "max-width",
        "max-height"
      ].forEach((prop) => {
        svg.style.setProperty(
          prop,
          "19px",
          "important"
        );
      });

      svg.style.setProperty(
        "flex-shrink",
        "0",
        "important"
      );

      svg.style.setProperty(
        "fill",
        "none",
        "important"
      );

      return svg;
    }

    // IDENTIFY MENU ICONS

    for (const link of navArea.querySelectorAll("a")) {
      const label =
        (link.textContent || "").trim().toLowerCase();

      const href =
        (link.getAttribute("href") || "").toLowerCase();

      let type = null;

      if (
        href.includes("employees.html") ||
        label.includes("employee")
      ) {
        type = "employees";

      } else if (
        href.includes("logistic.html") ||
        label.includes("approval")
      ) {
        type = "approval";

      } else if (
        href.includes("issuing.html") ||
        label.includes("issuing")
      ) {
        type = "issuing";

      } else if (
        href.includes("receipt.html") ||
        label.includes("receipt")
      ) {
        type = "receipt";

      } else if (
        href === "#history" ||
        label.includes("history")
      ) {
        type = "history";

      } else if (
        href === "#request" ||
        label.includes("create")
      ) {
        type = "create";

      } else if (
        href === "#dashboard" ||
        label === "dashboard"
      ) {
        type = "dashboard";
      }

      if (!type) continue;

      // REMOVE OLD ICONS ONLY

      link.querySelectorAll(
        "svg, i, .nav-icon, .menu-icon"
      ).forEach((node) => node.remove());

      link.prepend(icon(type));

      link.style.display =
        link.hidden ? "none" : "flex";

      link.style.alignItems = "center";
      link.style.gap = "12px";
    }

    // LOGOUT ICON

    if (
      logoutButton &&
      !logoutButton.querySelector(".dpr-menu-icon")
    ) {
      logoutButton.prepend(icon("logout"));

      logoutButton.style.display = "flex";
      logoutButton.style.alignItems = "center";
      logoutButton.style.justifyContent = "center";
      logoutButton.style.gap = "10px";
    }
  }

  // 11. ACTIVE SIDEBAR MENU

  function updateActiveMenu() {
    if (!navigation) return;

    const hash =
      window.location.hash || "#dashboard";

    const navArea =
      navigation.querySelector(".sidebar-nav") ||
      navigation;

    const links = navArea.querySelectorAll(
      'a[href^="#"]'
    );

    links.forEach((link) => {
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

  addEmployeeLinks();
  decorateSidebar();
  updateActiveMenu();

  window.addEventListener(
    "hashchange",
    updateActiveMenu
  );

  // 12. SHOW DASHBOARD

  if (notice) {
    notice.hidden = true;
    notice.style.display = "none";
  }

  setVisible("mainNav", true);
  setVisible("appMain", true);

  document.body.style.visibility = "visible";

  // 13. REQUEST HISTORY SEARCH & FILTER

  const searchInput = byId("requestSearch");
  const statusFilter = byId("requestStatusFilter");

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

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ].forEach((label) => {
      const th = document.createElement("th");

      th.textContent = label;
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach((request) => {
      const tr = document.createElement("tr");

      const values = [
        request.request_id,
        request.request_date,
        request.staff_id,
        request.product_model,
        request.production_quantity
      ];

      values.forEach((value) => {
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
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    requestList.appendChild(wrapper);
  }

  function filterRequests() {
    const keyword =
      (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const selectedStatus =
      statusFilter?.value || "All";

    const filtered = cachedRequests.filter((r) => {
      const matchesText = [
        r.request_id,
        r.staff_id,
        r.product_model
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword)
      );

      const matchesStatus =
        selectedStatus === "All" ||
        r.status === selectedStatus;

      return matchesText && matchesStatus;
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

  // 14. LOAD REQUESTS FROM SUPABASE

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

      // STAFF ONLY VIEW THEIR OWN REQUESTS

      if (isStaff) {
        query = query.eq(
          "requested_by",
          currentUser.id
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      cachedRequests = data || [];

      // DASHBOARD STATISTICS

      [
        "Pending",
        "Approved",
        "Rejected"
      ].forEach((status) => {
        const counter = byId(
          status.toLowerCase() + "Count"
        );

        if (counter) {
          counter.textContent = String(
            cachedRequests.filter(
              (r) => r.status === status
            ).length
          );
        }
      });

      filterRequests();

    } catch (error) {
      console.error(
        "Cannot load requests:",
        error
      );

      if (requestList) {
        requestList.textContent =
          "Cannot load requests: " +
          error.message;
      }
    }
  }

  // 15. CREATE REQUEST - STAFF ONLY

  if (isStaff && form && submitButton) {
    setToday();

    submitButton.disabled = false;
    submitButton.type = "submit";

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (submitButton.disabled) return;
        if (!form.reportValidity()) return;

        const requestId =
          byId("requestId")?.value.trim() || "";

        const requestDate =
          byId("requestDate")?.value || "";

        const staffId =
          byId("staffId")?.value.trim() || "";

        const productModel =
          byId("productModel")?.value.trim() || "";

        const productionQuantity = Number(
          byId("productionQuantity")?.value
        );

        const remarks =
          byId("remarks")?.value.trim() || "";

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
            "Please complete all required fields correctly.",
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
            "Request submitted successfully!"
          );

          await loadRequests();

        } catch (error) {
          const message =
            error.code === "23505"
              ? "Request ID already exists. Enter another Request ID."
              : "Unable to submit: " + error.message;

          setFeedback(message, true);

        } finally {
          submitButton.disabled = false;
        }
      }
    );
  }

  // 16. LOGOUT

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
          "Unable to log out: " +
          error.message
        );
      }
    }
  );

  // 17. INITIAL LOAD

  await loadRequests();

  console.log(
    "DPR DASHBOARD FIX V3 - role:",
    role
  );
});
