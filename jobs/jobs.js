// =====================================================================
// Workshop job cards – PROOF OF CONCEPT
// Data is saved in this phone's browser only (localStorage), so use
// SAMPLE DATA ONLY. A real version needs a private shared database.
// =====================================================================
const ACCOUNTS_EMAIL = "accounts@example.com";   // change to the accounts person's email
const PORTAL_URL = "https://www.husqvarnacp.com/"; // CHANGE: the Husqvarna dealer portal address Brad uses (not verified)
const KEY = "ch_jobcards_v1";

const app = document.getElementById("app");
const STATUS = { received: "Received", diagnosing: "In diagnosis", ready: "Ready to quote", quoted: "Quoted" };
let SPARES = [];

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const newId = () => "M-" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.machines && d.jobs) return d; } catch (e) {}
  return { machines: {}, jobs: [], next: 1 };
}
let db = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

const params = new URLSearchParams(location.search);
const machineId = params.get("m");

fetch("spares.json").then(r => r.json()).then(l => {
  SPARES = l;
  document.getElementById("spares").innerHTML = l.map(p => `<option value="${esc(p.description)}">${esc(p.partNumber)}</option>`).join("");
}).catch(() => {}).finally(route);

function route() { machineId ? renderMachine(machineId) : renderHome(); }
const link = id => location.origin + location.pathname + "?m=" + id;
const jobsOf = id => db.jobs.filter(j => j.machineId === id).sort((a, b) => b.n - a.n);
const openJob = id => jobsOf(id).find(j => j.status !== "quoted");
const jobNo = j => "JC-" + String(j.n).padStart(4, "0");

// ---------------------------------------------------------------- HOME
function renderHome() {
  const list = db.jobs.slice().sort((a, b) => b.n - a.n);
  app.innerHTML = `
    <section class="panel">
      <h2>All jobs</h2>
      <p class="muted">Accounts can open any job from here.</p>
      ${list.length ? list.map(j => { const m = db.machines[j.machineId] || {}; return `
        <a class="jobrow" href="?m=${esc(j.machineId)}"><span><b>${jobNo(j)} &ndash; ${esc(m.company)}</b><small>${esc(m.name)} ${esc(m.model)} &bull; ${esc(j.date)}</small></span><span class="pill ${j.status}">${STATUS[j.status]}</span></a>`; }).join("")
        : `<p class="empty">No jobs yet.</p>`}
    </section>
    <section class="panel">
      <h2>New machine tag</h2>
      <p class="muted">Creates a unique link for one machine. Write it to an NFC tag once and stick the tag on the machine.</p>
      <button class="btn" id="newtag" type="button">Create new machine tag</button>
    </section>`;
  document.getElementById("newtag").onclick = () => { location.href = "?m=" + newId(); };
}

// ------------------------------------------------------------- MACHINE
function renderMachine(id) {
  const m = db.machines[id];
  if (!m) return renderIntake(id, null);
  const open = openJob(id);
  let html = `
    <section class="panel">
      <h2>${esc(m.name)} ${esc(m.model)}</h2>
      <p class="muted">${esc(m.company)}${m.contact ? " &bull; " + esc(m.contact) : ""}${m.serial ? " &bull; Serial " + esc(m.serial) : ""}</p>
      <div class="taglink">Tag link: ${esc(link(id))}</div>
    </section>`;
  app.innerHTML = html;
  if (open) {
    const box = document.createElement("div"); app.appendChild(box);
    open.status === "ready" ? renderAccounts(box, open, m) : renderTech(box, open, m);
  } else {
    const p = document.createElement("section"); p.className = "panel";
    p.innerHTML = `<h2>Receive this machine again</h2><p class="muted">No open job. Start a new one when it comes in for repair.</p><button class="btn" id="again" type="button">Receive for a new repair</button>`;
    app.appendChild(p);
    p.querySelector("#again").onclick = () => renderIntake(id, m);
  }
  const hist = jobsOf(id).filter(j => !open || j.n !== open.n);
  if (hist.length) {
    const h = document.createElement("section"); h.className = "panel";
    h.innerHTML = `<h2>Repair history</h2>` + hist.map(j => `<div class="jobrow"><span><b>${jobNo(j)}</b><small>${esc(j.date)} &bull; ${esc(j.fault)}</small></span><span><span class="pill ${j.status}">${STATUS[j.status]}</span> <a class="btn2" href="#" data-n="${j.n}">View</a></span></div>`).join("");
    app.appendChild(h);
    h.querySelectorAll("a[data-n]").forEach(a => a.onclick = e => { e.preventDefault(); const j = db.jobs.find(x => x.n == a.dataset.n); const box = document.createElement("div"); h.replaceWith(box); renderAccounts(box, j, m, true); });
  }
}

// -------------------------------------------------------------- INTAKE
function renderIntake(id, m) {
  m = m || {};
  app.innerHTML = `
    <section class="panel">
      <h2>Receive machine</h2>
      <p class="muted">Step 1 &ndash; fill this in when the machine arrives.</p>
      <form id="f" novalidate>
        <div class="grid2">
          <label>Company<input name="company" value="${esc(m.company)}" autocomplete="off"></label>
          <label>Contact name &amp; phone<input name="contact" value="${esc(m.contact)}" autocomplete="off"></label>
          <label>Machine name / ID<input name="name" value="${esc(m.name)}" autocomplete="off"></label>
          <label>Model<input name="model" value="${esc(m.model)}" autocomplete="off"></label>
          <label>Serial number<input name="serial" value="${esc(m.serial)}" autocomplete="off"></label>
          <label>Received by<input name="by" autocomplete="off"></label>
        </div>
        <label>Fault reported by customer<textarea name="fault" rows="4"></textarea></label>
        <p class="error" id="err" role="alert"></p>
        <button class="btn" type="submit">Save &amp; receive machine</button>
      </form>
    </section>`;
  document.getElementById("f").onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    const miss = [["company", "company"], ["name", "machine name"], ["fault", "fault reported"]].find(([k]) => !f[k].trim());
    if (miss) { document.getElementById("err").textContent = "Please enter the " + miss[1] + "."; return; }
    db.machines[id] = { company: f.company.trim(), contact: f.contact.trim(), name: f.name.trim(), model: f.model.trim(), serial: f.serial.trim() };
    db.jobs.push({ n: db.next++, machineId: id, date: today(), status: "received", receivedBy: f.by.trim(), fault: f.fault.trim(), tech: "", items: [{ fault: "", work: "", hours: "", parts: [{ desc: "", pn: "", qty: "" }] }] });
    save(); renderMachine(id);
  };
}

// ---------------------------------------------------------------- TECH
function hoursOptions(v) {
  let o = `<option value="">Hours…</option>`;
  for (let h = 0.25; h <= 16; h += 0.25) o += `<option value="${h}"${String(v) === String(h) ? " selected" : ""}>${h} h</option>`;
  return o;
}
function renderTech(box, job, m) {
  const draw = () => {
    box.innerHTML = `
      <section class="panel">
        <h2>${jobNo(job)} <span class="pill ${job.status}">${STATUS[job.status]}</span></h2>
        <p class="muted">Step 2 &ndash; technician. Received ${esc(job.date)}${job.receivedBy ? " by " + esc(job.receivedBy) : ""}.</p>
        <h3>Fault reported</h3><p style="margin:0">${esc(job.fault)}</p>
        <label>Tech name<input data-job="tech" value="${esc(job.tech)}" autocomplete="off"></label>
        <h3>Work items</h3>
        ${job.items.map((it, i) => `
          <div class="item">
            <h4>#${i + 1}</h4>
            <label>Fault found / work to do<textarea rows="3" data-i="${i}" data-f="fault">${esc(it.fault)}</textarea></label>
            <label>Work completed / notes<textarea rows="4" data-i="${i}" data-f="work">${esc(it.work)}</textarea></label>
            <label>Hours<select data-i="${i}" data-f="hours">${hoursOptions(it.hours)}</select></label>
            <h3>Parts used</h3>
            ${it.parts.map((p, k) => `
              <div class="part">
                <input list="spares" placeholder="Part (search or type)" value="${esc(p.desc)}" data-i="${i}" data-p="${k}" data-f="desc" autocomplete="off">
                <input placeholder="Part number" value="${esc(p.pn)}" data-i="${i}" data-p="${k}" data-f="pn" autocomplete="off">
                <input type="number" inputmode="numeric" min="1" placeholder="Qty" value="${esc(p.qty)}" data-i="${i}" data-p="${k}" data-f="qty">
                <button type="button" class="x" aria-label="Remove part" data-rm="${i}.${k}">&times;</button>
              </div>`).join("")}
            <div class="actions"><button type="button" class="btn2" data-addpart="${i}">+ Add part</button>${job.items.length > 1 ? `<button type="button" class="btn2" data-rmitem="${i}">Remove item #${i + 1}</button>` : ""}</div>
          </div>`).join("")}
        <button type="button" class="btn2" id="additem" style="width:100%">+ Add another work item</button>
        <a class="portal" href="${esc(PORTAL_URL)}" target="_blank" rel="noopener">Look up a part in the Husqvarna portal &#8599;</a>
        <p class="error" id="err" role="alert"></p>
        <div class="actions">
          <button type="button" class="btn2" id="saveprog">Save progress</button>
          <button type="button" class="btn" id="done" style="margin-top:0">Finished &ndash; ready to quote</button>
        </div>
      </section>`;
    wire();
  };
  const wire = () => {
    box.querySelectorAll("[data-job]").forEach(el => el.oninput = () => { job[el.dataset.job] = el.value; save(); });
    box.querySelectorAll("[data-i]").forEach(el => {
      const it = job.items[+el.dataset.i], f = el.dataset.f;
      const set = () => {
        if (el.dataset.p != null) {
          const p = it.parts[+el.dataset.p]; p[f] = el.value;
          if (f === "desc") { const s = SPARES.find(x => x.description === el.value); if (s) { p.pn = s.partNumber; const pn = box.querySelector(`[data-i="${el.dataset.i}"][data-p="${el.dataset.p}"][data-f="pn"]`); if (pn) pn.value = s.partNumber; } }
        } else it[f] = el.value;
        if (job.status === "received") job.status = "diagnosing";
        save();
      };
      el.addEventListener("input", set); el.addEventListener("change", set);
    });
    box.querySelectorAll("[data-addpart]").forEach(b => b.onclick = () => { job.items[+b.dataset.addpart].parts.push({ desc: "", pn: "", qty: "" }); save(); draw(); });
    box.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { const [i, k] = b.dataset.rm.split(".").map(Number); const ps = job.items[i].parts; ps.splice(k, 1); if (!ps.length) ps.push({ desc: "", pn: "", qty: "" }); save(); draw(); });
    box.querySelectorAll("[data-rmitem]").forEach(b => b.onclick = () => { job.items.splice(+b.dataset.rmitem, 1); save(); draw(); });
    box.querySelector("#additem").onclick = () => { job.items.push({ fault: "", work: "", hours: "", parts: [{ desc: "", pn: "", qty: "" }] }); save(); draw(); };
    box.querySelector("#saveprog").onclick = () => { job.status = "diagnosing"; save(); box.querySelector("#err").innerHTML = `<span class="ok">Saved.</span>`; };
    box.querySelector("#done").onclick = () => {
      const err = box.querySelector("#err");
      if (!job.tech.trim()) return err.textContent = "Please enter the tech name.";
      const bad = job.items.findIndex(it => !it.work.trim() || !it.hours);
      if (bad >= 0) return err.textContent = "Work item #" + (bad + 1) + " needs 'work completed' and hours.";
      job.status = "ready"; save(); renderMachine(job.machineId);
    };
  };
  draw();
}

// ------------------------------------------------------------ ACCOUNTS
function csvFor(job, m) {
  const head = ["Job No", "Date", "Company", "Contact", "Machine", "Model", "Serial", "Tech", "Work item", "Fault found", "Work completed", "Hours", "Part description", "Part number", "Qty"];
  const rows = [head];
  job.items.forEach((it, i) => {
    const parts = it.parts.filter(p => p.desc || p.pn || p.qty);
    (parts.length ? parts : [{ desc: "", pn: "", qty: "" }]).forEach(p => rows.push([jobNo(job), job.date, m.company, m.contact, m.name, m.model, m.serial, job.tech, i + 1, it.fault, it.work, it.hours, p.desc, p.pn, p.qty]));
  });
  return "﻿" + rows.map(r => r.map(v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
}
function renderAccounts(box, job, m, readonly) {
  const totalHours = job.items.reduce((s, it) => s + (parseFloat(it.hours) || 0), 0);
  const subject = "Job ready to quote: " + jobNo(job) + " - " + m.company + " - " + m.name;
  const body = "Job " + jobNo(job) + " is ready to quote.\n\nOpen the job: " + link(job.machineId);
  box.innerHTML = `
    <section class="panel">
      <h2>${jobNo(job)} <span class="pill ${job.status}">${STATUS[job.status]}</span></h2>
      <p class="muted">Step 3 &ndash; accounts. Everything for quoting is below.</p>
      <table class="sum">
        <tr><th>Company</th><td>${esc(m.company)}</td></tr>
        <tr><th>Contact</th><td>${esc(m.contact)}</td></tr>
        <tr><th>Machine</th><td>${esc(m.name)} ${esc(m.model)}${m.serial ? " (serial " + esc(m.serial) + ")" : ""}</td></tr>
        <tr><th>Received</th><td>${esc(job.date)}</td></tr>
        <tr><th>Tech</th><td>${esc(job.tech)}</td></tr>
        <tr><th>Fault reported</th><td>${esc(job.fault)}</td></tr>
        <tr><th>Total hours</th><td><b>${totalHours}</b></td></tr>
      </table>
      ${job.items.map((it, i) => `
        <h3>Work item #${i + 1} &ndash; ${it.hours ? esc(it.hours) + " h" : "no hours"}</h3>
        ${it.fault ? `<p class="muted"><b>Found:</b> ${esc(it.fault)}</p>` : ""}
        <p style="margin:0 0 8px;white-space:pre-wrap">${esc(it.work)}</p>
        ${it.parts.some(p => p.desc || p.pn) ? `<table class="partsum"><tr><th>Part</th><th>Number</th><th>Qty</th></tr>${it.parts.filter(p => p.desc || p.pn).map(p => `<tr><td>${esc(p.desc)}</td><td>${esc(p.pn)}</td><td>${esc(p.qty)}</td></tr>`).join("")}</table>` : `<p class="muted">No parts.</p>`}`).join("")}
      <div class="actions">
        <button class="btn" id="csv" type="button" style="margin-top:0">Download Excel file (.csv)</button>
        ${readonly ? "" : `<a class="btn2" href="mailto:${esc(ACCOUNTS_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}">Email accounts the link</a>`}
      </div>
      ${readonly || job.status === "quoted" ? "" : `<div class="actions"><button class="btn2" id="reopen" type="button">Send back to tech</button><button class="btn2" id="quoted" type="button">Mark as quoted</button></div>`}
    </section>`;
  box.querySelector("#csv").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csvFor(job, m)], { type: "text/csv;charset=utf-8" }));
    a.download = jobNo(job) + ".csv"; document.body.appendChild(a); a.click(); a.remove();
  };
  const ro = box.querySelector("#reopen"); if (ro) ro.onclick = () => { job.status = "diagnosing"; save(); renderMachine(job.machineId); };
  const q = box.querySelector("#quoted"); if (q) q.onclick = () => { job.status = "quoted"; save(); renderMachine(job.machineId); };
}
