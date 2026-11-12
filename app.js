// ============================================================
// BOOKING EMAIL ADDRESS – change it here (one place only).
// ============================================================
const BOOKING_EMAIL = "ca.dewet@live.com";
// ============================================================

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const overlay = document.getElementById("overlay");
const form = document.getElementById("form");
const $ = id => document.getElementById(id);
let current = null;

function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
const money = n => "$" + Number(n).toFixed(2).replace(/\.00$/, "") + " / day";

fetch("machines.json")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(list => { statusEl.hidden = true; list.forEach(render); })
  .catch(() => { statusEl.textContent = "Sorry, machines could not be loaded. Please try again."; });

function render(m) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "card" + (m.available ? "" : " out");
  if (!m.available) b.setAttribute("aria-disabled", "true");
  const img = document.createElement("img");
  img.src = m.image; img.alt = m.name; img.loading = "lazy";
  const body = document.createElement("div");
  body.className = "body";
  const h = document.createElement("h3"); h.textContent = m.name;
  const p = document.createElement("p"); p.textContent = m.description;
  const row = document.createElement("div"); row.className = "row";
  const price = document.createElement("span"); price.className = "price"; price.textContent = money(m.dailyRate);
  const badge = document.createElement("span");
  badge.className = "badge " + (m.available ? "ok" : "no");
  badge.textContent = m.available ? "Available" : "Hired Out";
  row.append(price, badge);
  body.append(h, p, row);
  b.append(img, body);
  if (m.available) b.addEventListener("click", () => openForm(m));
  grid.appendChild(b);
}

function openForm(m) {
  current = m;
  form.reset();
  $("error").textContent = "";
  $("formTitle").textContent = m.name;
  $("formRate").textContent = money(m.dailyRate) + " (AUD)";
  $("start").min = today();
  $("end").min = today();
  overlay.hidden = false;
  $("name").focus();
}
function closeForm() { overlay.hidden = true; }
$("close").addEventListener("click", closeForm);
overlay.addEventListener("click", e => { if (e.target === overlay) closeForm(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeForm(); });

function validate() {
  const name = $("name").value.trim(), phone = $("phone").value.trim();
  const s = $("start").value, e = $("end").value;
  if (!name) return "Please enter your name.";
  if (!phone) return "Please enter your phone number.";
  if (!s) return "Please choose a start date.";
  if (!e) return "Please choose an end date.";
  if (s < today()) return "Start date cannot be in the past.";
  if (e < s) return "End date cannot be before the start date.";
  return "";
}

form.addEventListener("submit", ev => {
  ev.preventDefault();
  const err = validate();
  $("error").textContent = err;
  if (err) return;
  const subject = "Booking request: " + current.name;
  const body = [
    "Hi Concrete Hire team,",
    "I'm interested in booking out this unit.",
    "",
    "",
    "Machine: " + current.name,
    "Daily rate: " + money(current.dailyRate) + " (AUD)",
    "Customer name: " + $("name").value.trim(),
    "Phone: " + $("phone").value.trim(),
    "Start date: " + $("start").value,
    "End date: " + $("end").value,
    "Delivery/Pickup: " + $("method").value,
    "Notes: " + $("notes").value.trim()
  ].join("\n");
  window.location.href = "mailto:" + BOOKING_EMAIL +
    "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
});
