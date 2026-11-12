/* Digital Production Request — Supabase version
 * Paste the contents of this file into the repository file named script.js
 * Publishable key may be in browser code; NEVER put a secret/service_role key here.
 */

document.addEventListener("DOMContentLoaded", async function () {
  "use strict";

  const SUPABASE_URL = "https://swyzpswrncaghdfnphhc.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Rek9NATddqXIwNN0UQ6cUw_Iuh5aRoE";

  const form = document.getElementById("requestForm");
  const submitButton = document.getElementById("submitRequest");

  // If an old CSS rule hides the dashboard, reveal it only after auth succeeds.
  function revealPage() {
    document.body.style.visibility = "visible";
  }

  function showSetupError(message) {
    console.error(message);
    const box = document.createElement("p");
    box.style.cssText = "padding:16px;margin:18px;background:#fff3f2;color:#9b1c1c;border-radius:8px";
    box.textContent = message;
    (document.querySelector("main") || document.body).prepend(box);
    revealPage();
  }

  if (!form || !submitButton) {
    showSetupError("Cannot find requestForm or submitRequest in index.html.");
    return;
  }

  // Keep disabled until the user's authenticated session has been checked.
  submitButton.disabled = true;

  if (!window.supabase || !window.supabase.createClient) {
    showSetupError("Supabase library did not load. Check the CDN script in index.html.");
    return;
  }
  if (!SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
    showSetupError("Set your Supabase publishable key in script.js (not the secret key).");
    return;
  }

  let db;
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } catch (error) {
    showSetupError("Supabase configuration error: " + error.message);
    return;
  }

  // Check login before reading or submitting requests.
  let currentUser;
  try {
    const { data, error } = await db.auth.getUser();
    if (error || !data.user) {
      window.location.replace("login.html");
      return;
    }
    currentUser = data.user;
  } catch (error) {
    showSetupError("Could not verify login: " + error.message);
    return;
  }

  // Role only changes the visible navigation; RLS enforces database permissions.
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (profileError) {
    showSetupError("Cannot read user profile: " + profileError.message);
    return;
  }

  const isLogistic = profile.role === "Logistic";
  const approvalSection = document.getElementById("approval");
  const approvalLink = document.querySelector('nav a[href="#approval"]');
  if (!isLogistic) {
    if (approvalSection) approvalSection.hidden = true;
    if (approvalLink) approvalLink.hidden = true;
  }

  const list = document.getElementById("requestList") || document.createElement("div");
  list.id = "requestList";
  if (!list.isConnected) form.after(list);

  const feedback = document.createElement("p");
  feedback.id = "requestFeedback";
  feedback.setAttribute("role", "status");
  form.after(feedback);

  function tellUser(message, isError = false) {
    feedback.textContent = message;
    feedback.style.color = isError ? "#a32222" : "#17633b";
  }

  function renderRequests(rows) {
    list.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = isLogistic ? "All Requests" : "My Request History";
    list.appendChild(heading);

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No requests in the database yet.";
      list.appendChild(empty);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "table-container";
    const table = document.createElement("table");
    table.className = "request-table";
    const head = document.createElement("thead");
    const trHead = document.createElement("tr");
    ["Request ID", "Date", "Staff ID", "Product Model", "Quantity", "Status"]
      .forEach(function (columnName) {
        const th = document.createElement("th");
        th.textContent = columnName;
        trHead.appendChild(th);
      });
    head.appendChild(trHead);
    table.appendChild(head);

    const body = document.createElement("tbody");
    rows.forEach(function (request) {
      const tr = document.createElement("tr");
      [
        request.request_id,
        request.request_date,
        request.staff_id,
        request.product_model,
        request.production_quantity,
        request.status
      ].forEach(function (value) {
        const td = document.createElement("td");
        td.textContent = String(value ?? "");
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    list.appendChild(wrap);
  }

  async function loadRequests() {
    const { data, error } = await db
      .from("requests")
      .select("request_id,request_date,staff_id,product_model,production_quantity,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load requests:", error);
      tellUser("Unable to load requests: " + error.message, true);
      return;
    }
    renderRequests(data || []);
  }

  // The button already has type="button" in the current index.html.
  submitButton.addEventListener("click", async function () {
    if (!form.reportValidity()) return;

    const requestId = document.getElementById("requestId")?.value.trim();
    const requestDate = document.getElementById("requestDate")?.value;
    const staffId = document.getElementById("staffId")?.value.trim();
    const productModel = document.getElementById("productModel")?.value.trim();
    const quantity = Number(document.getElementById("productionQuantity")?.value);
    const remarks = document.getElementById("remarks")?.value.trim() || "";

    if (!requestId || !requestDate || !staffId || !productModel ||
        !Number.isInteger(quantity) || quantity <= 0) {
      tellUser("Please fill in all required fields correctly.", true);
      return;
    }

    submitButton.disabled = true;
    tellUser("Submitting request...");
    try {
      const { error } = await db.from("requests").insert({
        request_id: requestId,
        request_date: requestDate,
        requested_by: currentUser.id,
        staff_id: staffId,
        product_model: productModel,
        production_quantity: quantity,
        remarks: remarks,
        status: "Pending"
      });
      if (error) {
        tellUser(
          error.code === "23505"
            ? "Request ID already exists. Please use another ID."
            : "Submit failed: " + error.message,
          true
        );
        return;
      }

      form.reset();
      tellUser("Request submitted to Supabase successfully!");
      await loadRequests();
    } catch (error) {
      tellUser("Network error: " + error.message, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  revealPage();
  submitButton.disabled = false;
  await loadRequests();
  console.log("Digital Production Request: Supabase connected, user role:", profile.role);
});
