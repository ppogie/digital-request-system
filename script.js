
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const URL = "https://swyzpswrncaghdfnphhc.supabase.co";
  const KEY = "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  const el = (id) => document.getElementById(id);
  const form = el("requestForm");
  const submit = el("submitRequest");
  const notice = el("authNotice");
  const nav = el("mainNav");
  const main = el("appMain");

  // SHOW OR HIDE ELEMENTS

  function visible(node, show) {
    if (!node) return;
    node.hidden = !show;
    node.style.display = show ? "" : "none";
  }

  // REQUEST FEEDBACK

  function message(text, isError = false) {
    let feedback = el("requestFeedback");

    if (!feedback && form) {
      feedback = document.createElement("p");
      feedback.id = "requestFeedback";
      form.after(feedback);
    }

    if (feedback) {
      feedback.textContent = text;
      feedback.style.color = isError
        ? "#a32121"
        : "#08623e";
    }
  }

  // ERROR HANDLING

  function showError(text) {
    console.error(text);

    let box = notice;

    if (!box) {
      box = document.createElement("p");
      (main || document.body).prepend(box);
    }

    box.textContent = text + " ";

    const link = document.createElement("a");
    link.href = "login.html";
    link.textContent = "Go to Login";
    box.appendChild(link);

    visible(box, true);
    visible(nav, false);

    if (main && box !== main) {
      visible(main, true);
    }

    document.body.style.visibility = "visible";
  }

  // LOCAL DATE

  function localToday() {
    const date = new Date();

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  // CHECK SUPABASE LIBRARY

  if (!window.supabase?.createClient) {
    showError(
      "Supabase library not loaded. Check the script tags in index.html."
    );
    return;
  }

  // REUSE ONE SUPABASE CLIENT

  const db = window.dprClient ||
    window.supabase.createClient(URL, KEY);

  window.dprClient = db;

  // VERIFY LOGIN

  let user;

  try {
    const { data, error } = await db.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      location.replace("login.html");
      return;
    }

    user = data.user;

  } catch (error) {
    showError("Login check failed: " + error.message);
    return;
  }

  // CHECK USER ROLE

  let role;

  try {
    const { data, error } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    role = data.role;

    if (!["Staff", "Logistic"].includes(role)) {
      throw Error("Unknown user role");
    }

  } catch (error) {
    showError("Cannot read role: " + error.message);
    return;
  }

  const isStaff = role === "Staff";
  const isLogistic = role === "Logistic";

  // STAFF NAVIGATION

  [
    "staffNavLink",
    "staffQuickLink",
    "request"
  ].forEach((id) => visible(el(id), isStaff));

  // LOGISTIC NAVIGATION

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
  ].forEach((id) => visible(el(id), isLogistic));

  // WELCOME MESSAGE

  if (el("welcomeMessage")) {
    el("welcomeMessage").textContent =
      `Signed in: ${user.email} (${role})`;
  }

  // SHOW DASHBOARD

  visible(notice, false);
  visible(nav, true);
  visible(main, true);

  document.body.style.visibility = "visible";

  // REQUEST HISTORY CONTAINER

  let list = el("requestList");

  if (!list && form) {
    list = document.createElement("div");
    list.id = "requestList";
    form.after(list);
  }

  // DISPLAY REQUEST HISTORY

  function renderRequests(rows) {
    if (!list) return;

    list.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = isLogistic
      ? "All Requests"
      : "My Request History";

    list.appendChild(heading);

    if (!rows.length) {
      const p = document.createElement("p");
      p.textContent = "No requests found.";
      list.appendChild(p);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "table-container";

    const table = document.createElement("table");
    table.className = "request-table";

    const thead = document.createElement("thead");
    const top = document.createElement("tr");

    [
      "Request ID",
      "Date",
      "Staff ID",
      "Product Model",
      "Quantity",
      "Status"
    ].forEach((name) => {
      const th = document.createElement("th");
      th.textContent = name;
      top.appendChild(th);
    });

    thead.appendChild(top);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      [
        row.request_id,
        row.request_date,
        row.staff_id,
        row.product_model,
        row.production_quantity,
        row.status
      ].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = String(value ?? "");
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    list.appendChild(wrap);
  }

  // LOAD REQUESTS FROM DATABASE

// REQUEST HISTORY SEARCH AND FILTER

let cachedRequests = [];

const requestSearch =
  document.getElementById("requestSearch");

const requestStatusFilter =
  document.getElementById("requestStatusFilter");

function filterRequests() {
  const keyword = (requestSearch?.value || "")
    .trim()
    .toLowerCase();

  const status =
    requestStatusFilter?.value || "All";

  const filtered = cachedRequests.filter((r) => {
    const matchesSearch = [
      r.request_id,
      r.staff_id,
      r.product_model
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(keyword)
    );

    const matchesStatus =
      status === "All" || r.status === status;

    return matchesSearch && matchesStatus;
  });

  renderRequests(filtered);
}

requestSearch?.addEventListener("input", filterRequests);

requestStatusFilter?.addEventListener(
  "change",
  filterRequests
);

  async function loadRequests() {
    if (list) {
      list.textContent = "Loading requests...";
    }

    let query = db
      .from("requests")
      .select(
        "request_id,request_date,requested_by,staff_id," +
        "product_model,production_quantity,status,created_at"
      )
      .order("created_at", { ascending: false });

    if (isStaff) {
      query = query.eq("requested_by", user.id);
    }

    try {
      const { data, error } = await query;

      if (error) throw error;

      const rows = data || [];

cachedRequests = rows;
filterRequests();

      // DASHBOARD STATISTICS

      for (const status of [
        "Pending",
        "Approved",
        "Rejected"
      ]) {
        const node = el(
          status.toLowerCase() + "Count"
        );

        if (node) {
          node.textContent = String(
            rows.filter(
              (r) => r.status === status
            ).length
          );
        }
      }

    } catch (error) {
      if (list) {
        list.textContent =
          "Cannot load requests: " + error.message;
      }

      console.error(error);
    }
  }

  // CREATE REQUEST - STAFF ONLY

  if (isStaff && form && submit) {
    const dateInput = el("requestDate");

    if (dateInput && !dateInput.value) {
      dateInput.value = localToday();
    }

    // FIX THE ORIGINAL BUTTON TYPE

    submit.type = "submit";
    submit.disabled = false;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity() || submit.disabled) {
        return;
      }

      const request = {
        request_id: el("requestId")?.value.trim(),
        request_date: el("requestDate")?.value,
        requested_by: user.id,
        staff_id: el("staffId")?.value.trim(),
        product_model: el("productModel")?.value.trim(),
        production_quantity: Number(
          el("productionQuantity")?.value
        ),
        remarks: el("remarks")?.value.trim() || "",
        status: "Pending"
      };

      // VALIDATION

      if (
        !request.request_id ||
        !request.request_date ||
        !request.staff_id ||
        !request.product_model ||
        !Number.isSafeInteger(request.production_quantity) ||
        request.production_quantity < 1
      ) {
        message(
          "Please complete all fields correctly.",
          true
        );
        return;
      }

      submit.disabled = true;
      message("Submitting request...");

      try {
        const { error } = await db
          .from("requests")
          .insert(request);

        if (error) throw error;

        form.reset();

        if (dateInput) {
          dateInput.value = localToday();
        }

        message(
          "Request submitted to Supabase successfully!"
        );

        await loadRequests();

      } catch (error) {
        message(
          error.code === "23505"
            ? "Request ID already exists."
            : "Submission failed: " + error.message,
          true
        );

      } finally {
        submit.disabled = false;
      }
    });
  }

  // LOGOUT

  const logout = el("logoutButton");

  if (logout) {
    logout.addEventListener("click", async () => {
      logout.disabled = true;

      try {
        const { error } = await db.auth.signOut();

        if (error) throw error;

        location.replace("login.html");

      } catch (error) {
        message(
          "Logout failed: " + error.message,
          true
        );

        logout.disabled = false;
      }
    });
  }

  // SYSTEM READY

  console.log("DPR DASHBOARD FIX V2 - role:", role);

  await loadRequests();
});
