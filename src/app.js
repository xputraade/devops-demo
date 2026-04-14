const express = require("express");
const pool = require("./db");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Request log supaya masuk ke ELK
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "support-ticketing",
        logType: "request",
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      })
    );
  });

  next();
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO agents (name, email)
    VALUES
      ('Putra Support', 'putra@example.com'),
      ('Adit Support', 'adit@example.com')
    ON CONFLICT (email) DO NOTHING
  `);
}

function logEvent(event) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      source: "support-ticketing",
      logType: "event",
      ...event,
    })
  );
}

function pageTemplate(title, content) {
  return `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --card: rgba(255,255,255,0.92);
        --card-border: rgba(226,232,240,0.9);
        --text: #0f172a;
        --muted: #64748b;
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
        --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        --radius: 20px;
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(37,99,235,0.12), transparent 28%),
          radial-gradient(circle at top right, rgba(6,182,212,0.10), transparent 24%),
          linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulseGlow {
        0% { box-shadow: 0 0 0 rgba(37,99,235,0); }
        50% { box-shadow: 0 0 0 8px rgba(37,99,235,0.06); }
        100% { box-shadow: 0 0 0 rgba(37,99,235,0); }
      }

      header {
        position: sticky;
        top: 0;
        z-index: 20;
        backdrop-filter: blur(12px);
        background: rgba(15, 23, 42, 0.9);
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .nav {
        max-width: 1180px;
        margin: 0 auto;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        color: #fff;
        font-weight: 800;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .brand-icon {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: linear-gradient(135deg, #2563eb, #06b6d4);
        box-shadow: 0 12px 24px rgba(37,99,235,0.28);
        animation: pulseGlow 3s infinite ease-in-out;
      }

      .nav-links {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .nav-links a {
        text-decoration: none;
        color: rgba(255,255,255,0.92);
        padding: 10px 14px;
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .nav-links a:hover {
        background: rgba(255,255,255,0.08);
        transform: translateY(-1px);
      }

      main {
        max-width: 1180px;
        margin: 0 auto;
        padding: 28px 20px 42px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 18px;
        margin-bottom: 20px;
        animation: fadeUp 0.5s ease forwards;
      }

      .hero-card,
      .card {
        background: var(--card);
        border: 1px solid var(--card-border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
      }

      .hero-card {
        padding: 26px;
      }

      .hero h1 {
        margin: 0 0 12px;
        font-size: 36px;
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .hero p {
        margin: 0;
        color: var(--muted);
        line-height: 1.75;
        font-size: 15px;
      }

      .hero-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }

      .mini-stat {
        padding: 18px;
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96));
        border: 1px solid #e2e8f0;
        animation: fadeUp 0.6s ease forwards;
      }

      .mini-stat .label {
        color: var(--muted);
        font-size: 13px;
        margin-bottom: 8px;
      }

      .mini-stat .value {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .grid {
        display: grid;
        gap: 18px;
      }

      .grid-2 {
        grid-template-columns: 1.15fr 0.85fr;
      }

      .card {
        padding: 22px;
        animation: fadeUp 0.55s ease forwards;
      }

      .card h2, .card h3 {
        margin: 0 0 14px;
        font-size: 19px;
        letter-spacing: -0.02em;
      }

      .section-desc {
        margin: -4px 0 16px;
        color: var(--muted);
        font-size: 14px;
      }

      label {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 700;
        color: #334155;
      }

      input, textarea, select {
        width: 100%;
        border: 1px solid #dbe4ee;
        background: #fff;
        border-radius: 14px;
        padding: 12px 14px;
        font: inherit;
        outline: none;
        transition: all 0.2s ease;
        margin-bottom: 14px;
      }

      input:focus, textarea:focus, select:focus {
        border-color: rgba(37,99,235,0.65);
        box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
        transform: translateY(-1px);
      }

      textarea {
        min-height: 130px;
        resize: vertical;
      }

      button {
        width: 100%;
        border: none;
        border-radius: 14px;
        padding: 13px 16px;
        background: linear-gradient(135deg, var(--primary), #3b82f6);
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(37,99,235,0.22);
        transition: all 0.2s ease;
      }

      button:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg, var(--primary-hover), #2563eb);
        box-shadow: 0 16px 28px rgba(37,99,235,0.28);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        text-align: left;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
        padding: 12px 10px;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 14px 10px;
        border-bottom: 1px solid #eef2f7;
        vertical-align: top;
      }

      tr:hover td {
        background: rgba(37,99,235,0.035);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
      }

      .status-open {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .status-in_progress {
        background: #fef3c7;
        color: #b45309;
      }

      .status-resolved {
        background: #dcfce7;
        color: #15803d;
      }

      .status-closed {
        background: #e5e7eb;
        color: #475569;
      }

      .priority-low { color: #0f766e; font-weight: 700; }
      .priority-medium { color: #2563eb; font-weight: 700; }
      .priority-high { color: #d97706; font-weight: 700; }
      .priority-urgent { color: #dc2626; font-weight: 800; }

      .muted {
        color: var(--muted);
        font-size: 14px;
      }

      .comment {
        border-left: 4px solid #cbd5e1;
        background: #fafcff;
        padding: 14px 16px;
        border-radius: 0 14px 14px 0;
        margin-bottom: 14px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .comment:hover {
        transform: translateX(2px);
        box-shadow: 0 8px 16px rgba(15,23,42,0.04);
      }

      .empty-state {
        padding: 26px;
        border: 1px dashed #cbd5e1;
        border-radius: 16px;
        text-align: center;
        color: var(--muted);
        background: rgba(255,255,255,0.65);
      }

      .summary-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .summary-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        border-radius: 14px;
        background: #f8fafc;
        margin-bottom: 10px;
        transition: transform 0.18s ease, background 0.18s ease;
      }

      .summary-list li:hover {
        transform: translateX(2px);
        background: #f1f5f9;
      }

      .summary-count {
        min-width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: white;
        border: 1px solid #dbe2ea;
        font-weight: 800;
      }

      a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 700;
      }

      a:hover {
        text-decoration: underline;
      }

      @media (max-width: 920px) {
        .hero,
        .grid-2 {
          grid-template-columns: 1fr;
        }

        .hero h1 {
          font-size: 30px;
        }
      }

      @media (max-width: 640px) {
        .nav {
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-stats {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="nav">
        <a href="/" class="brand">
          <span class="brand-icon">🎫</span>
          <span>Support Ticketing</span>
        </a>
        <div class="nav-links">
          <a href="/">Dashboard</a>
          <a href="/tickets">All Tickets</a>
        </div>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="hero-card">
          <h1>Fast, simple support ticket management</h1>
          <p>
            Create customer issues, assign agents, update progress, and keep everything observable with structured logs in ELK.
          </p>
        </div>
        <div class="hero-stats">
          <div class="mini-stat">
            <div class="label">Platform</div>
            <div class="value">Local K8s</div>
          </div>
          <div class="mini-stat">
            <div class="label">Database</div>
            <div class="value">PostgreSQL</div>
          </div>
          <div class="mini-stat">
            <div class="label">Logs</div>
            <div class="value">ELK</div>
          </div>
          <div class="mini-stat">
            <div class="label">Mode</div>
            <div class="value">MVP</div>
          </div>
        </div>
      </section>
      ${content}
    </main>
  </body>
  </html>
  `;
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "disconnected",
      error: err.message,
    });
  }
});

app.get("/", async (_req, res) => {
  try {
    await ensureSchema();

    const stats = await pool.query(`
      SELECT status, COUNT(*)::int AS total
      FROM tickets
      GROUP BY status
      ORDER BY status
    `);

    const recent = await pool.query(`
      SELECT t.id, t.title, t.status, t.priority, t.customer_name, t.created_at, a.name AS agent_name
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.assigned_agent_id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    const html = `
      <div class="grid grid-2">
        <div class="card">
          <h2>Create Ticket</h2>
          <p class="section-desc">Capture a new customer issue and send it to your support queue.</p>

          <form method="POST" action="/tickets">
            <label>Title</label>
            <input name="title" placeholder="Example: Login issue on dashboard" required />

            <label>Description</label>
            <textarea name="description" rows="5" placeholder="Describe the issue in detail..." required></textarea>

            <label>Customer Name</label>
            <input name="customer_name" placeholder="Putra" required />

            <label>Customer Email</label>
            <input name="customer_email" type="email" placeholder="putra@example.com" required />

            <label>Priority</label>
            <select name="priority">
              <option value="low">low</option>
              <option value="medium" selected>medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>

            <button type="submit">Create Ticket</button>
          </form>
        </div>

        <div class="card">
          <h2>Status Summary</h2>
          <p class="section-desc">Quick snapshot of current ticket workload.</p>
          ${
            stats.rows.length === 0
              ? "<div class='empty-state'>No tickets yet.</div>"
              : `<ul class="summary-list">
                  ${stats.rows
                    .map(
                      (row) => `
                    <li>
                      <strong>${row.status.replace("_", " ")}</strong>
                      <span class="summary-count">${row.total}</span>
                    </li>
                  `
                    )
                    .join("")}
                </ul>`
          }
        </div>
      </div>

      <div class="card">
        <h2>Recent Tickets</h2>
        <p class="section-desc">Track the latest support activity and jump into ticket details.</p>
        <p><a href="/tickets">View all tickets</a></p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Customer</th>
              <th>Agent</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${
              recent.rows.length === 0
                ? `<tr><td colspan="7"><div class="empty-state">No recent tickets yet.</div></td></tr>`
                : recent.rows
                    .map(
                      (t) => `
                <tr>
                  <td><a href="/tickets/${t.id}">#${t.id}</a></td>
                  <td>${t.title}</td>
                  <td><span class="badge status-${t.status}">${t.status}</span></td>
                  <td><span class="priority-${t.priority}">${t.priority}</span></td>
                  <td>${t.customer_name}</td>
                  <td>${t.agent_name || "-"}</td>
                  <td>${new Date(t.created_at).toLocaleString()}</td>
                </tr>
              `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    `;

    res.send(pageTemplate("Support Ticketing", html));
  } catch (err) {
    res.status(500).send(pageTemplate("Error", `<div class="card"><pre>${err.message}</pre></div>`));
  }
});

app.get("/tickets", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.title, t.status, t.priority, t.customer_name, t.created_at, a.name AS agent_name
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.assigned_agent_id
      ORDER BY t.created_at DESC
    `);

    const html = `
      <div class="card">
        <h2>All Tickets</h2>
        <p class="section-desc">View and manage all submitted support requests.</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Customer</th>
              <th>Agent</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${
              result.rows.length === 0
                ? `<tr><td colspan="7"><div class="empty-state">No tickets found.</div></td></tr>`
                : result.rows
                    .map(
                      (t) => `
                <tr>
                  <td><a href="/tickets/${t.id}">#${t.id}</a></td>
                  <td>${t.title}</td>
                  <td><span class="badge status-${t.status}">${t.status}</span></td>
                  <td><span class="priority-${t.priority}">${t.priority}</span></td>
                  <td>${t.customer_name}</td>
                  <td>${t.agent_name || "-"}</td>
                  <td>${new Date(t.created_at).toLocaleString()}</td>
                </tr>
              `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    `;

    res.send(pageTemplate("All Tickets", html));
  } catch (err) {
    res.status(500).send(pageTemplate("Error", `<div class="card"><pre>${err.message}</pre></div>`));
  }
});

app.get("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const ticketResult = await pool.query(
      `
      SELECT t.*, a.name AS agent_name
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.assigned_agent_id
      WHERE t.id = $1
    `,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).send(pageTemplate("Not Found", "<div class='card'>Ticket not found</div>"));
    }

    const agentsResult = await pool.query(`SELECT id, name FROM agents ORDER BY name`);
    const commentsResult = await pool.query(
      `
      SELECT * FROM ticket_comments
      WHERE ticket_id = $1
      ORDER BY created_at DESC
    `,
      [id]
    );

    const t = ticketResult.rows[0];

    const html = `
      <div class="card">
        <h2>Ticket #${t.id} — ${t.title}</h2>
        <p class="section-desc">Detailed issue information and follow-up actions.</p>

        <p><strong>Customer:</strong> ${t.customer_name} (${t.customer_email})</p>
        <p><strong>Status:</strong> <span class="badge status-${t.status}">${t.status}</span></p>
        <p><strong>Priority:</strong> <span class="priority-${t.priority}">${t.priority}</span></p>
        <p><strong>Assigned Agent:</strong> ${t.agent_name || "-"}</p>
        <p><strong>Description:</strong><br>${t.description}</p>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <h3>Update Ticket</h3>
          <p class="section-desc">Change progress or assign this issue to an agent.</p>

          <form method="POST" action="/tickets/${t.id}/update">
            <label>Status</label>
            <select name="status">
              ${["open", "in_progress", "resolved", "closed"]
                .map((s) => `<option value="${s}" ${t.status === s ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>

            <label>Assign Agent</label>
            <select name="assigned_agent_id">
              <option value="">Unassigned</option>
              ${agentsResult.rows
                .map(
                  (a) =>
                    `<option value="${a.id}" ${
                      String(t.assigned_agent_id) === String(a.id) ? "selected" : ""
                    }>${a.name}</option>`
                )
                .join("")}
            </select>

            <button type="submit">Save Changes</button>
          </form>
        </div>

        <div class="card">
          <h3>Add Comment</h3>
          <p class="section-desc">Post an internal note or update for this ticket.</p>

          <form method="POST" action="/tickets/${t.id}/comments">
            <label>Author</label>
            <input name="author_name" placeholder="Support Agent" required />

            <label>Comment</label>
            <textarea name="comment" rows="5" placeholder="Write update or resolution note..." required></textarea>

            <button type="submit">Add Comment</button>
          </form>
        </div>
      </div>

      <div class="card">
        <h3>Comments</h3>
        ${
          commentsResult.rows.length === 0
            ? "<div class='empty-state'>No comments yet.</div>"
            : commentsResult.rows
                .map(
                  (c) => `
              <div class="comment">
                <strong>${c.author_name}</strong>
                <div class="muted">${new Date(c.created_at).toLocaleString()}</div>
                <p>${c.comment}</p>
              </div>
            `
                )
                .join("")
        }
      </div>
    `;

    res.send(pageTemplate(`Ticket #${t.id}`, html));
  } catch (err) {
    res.status(500).send(pageTemplate("Error", `<div class="card"><pre>${err.message}</pre></div>`));
  }
});

app.post("/tickets", async (req, res) => {
  try {
    const { title, description, customer_name, customer_email, priority } = req.body;

    const result = await pool.query(
      `
      INSERT INTO tickets (title, description, customer_name, customer_email, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, customer_name, customer_email, priority, status, created_at
    `,
      [title, description, customer_name, customer_email, priority || "medium"]
    );

    const ticket = result.rows[0];

    logEvent({
      eventType: "ticket_created",
      ticketId: ticket.id,
      title: ticket.title,
      customerName: ticket.customer_name,
      customerEmail: ticket.customer_email,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
    });

    res.redirect(`/tickets/${ticket.id}`);
  } catch (err) {
    logEvent({
      eventType: "ticket_create_failed",
      error: err.message,
    });

    res.status(500).send(pageTemplate("Error", `<div class="card"><pre>${err.message}</pre></div>`));
  }
});

app.post("/tickets/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_agent_id } = req.body;

    const result = await pool.query(
      `
      UPDATE tickets
      SET status = $1,
          assigned_agent_id = NULLIF($2, '')::int,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, status, priority, assigned_agent_id, updated_at
    `,
      [status, assigned_agent_id || null, id]
    );

    const ticket = result.rows[0];

    logEvent({
      eventType: "ticket_updated",
      ticketId: ticket.id,
      status: ticket.status,
      priority: ticket.priority,
      assignedAgentId: ticket.assigned_agent_id,
      updatedAt: ticket.updated_at,
    });

    res.redirect(`/tickets/${id}`);
  } catch (err) {
    logEvent({
      eventType: "ticket_update_failed",
      ticketId: req.params.id,
      error: err.message,
    });

    res.status(500).send(pageTemplate("Error", `<div class="card"><pre>${err.message}</pre></div>`));
  }
});

app.post("/tickets/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, comment } = req.body;

    const result = await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, author_name, comment)
      VALUES ($1, $2, $3)
      RETURNING id, ticket_id, author_name, created_at
    `,
      [id, author_name, comment]
    );

    const commentRow = result.rows[0];

    logEvent({
      eventType: "ticket_comment_added",
      ticketId: commentRow.ticket_id,
      commentId: commentRow.id,
      authorName: commentRow.author_name,
      createdAt: commentRow.created_at,
    });

    res.redirect(`/tickets/${id}`);
  } catch (err) {
    logEvent({
      eventType: "ticket_comment_failed",
      ticketId: req.params.id,
      error: err.message,
    });

    res.status(500).send(pageTemplate("Error", `<div class="card"><pre>${err.message}</pre></div>`));
  }
});

module.exports = app;
