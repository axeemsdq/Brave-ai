const express = require("express");
const http = require("http");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const CHAT_PASSWORD = process.env.CHAT_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!ADMIN_PASSWORD || !CHAT_PASSWORD || !SESSION_SECRET) {
  console.error("Set ADMIN_PASSWORD, CHAT_PASSWORD and SESSION_SECRET environment variables.");
  process.exit(1);
}

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
const sessionMiddleware = session({
  name: "bravo.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
});
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, "public")));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const messages = [];
let nextId = 1;
const MAX_MESSAGES = 500;

function requireRole(role, req, res, next) {
  if (req.session && req.session.role === role) return next();
  return res.status(401).json({ error: "Please sign in again." });
}
app.post("/api/login", loginLimiter, async (req, res) => {
  const { role, password } = req.body || {};
  if (!["admin", "guest"].includes(role) || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid login details." });
  }
  const expected = role === "admin" ? ADMIN_PASSWORD : CHAT_PASSWORD;
  const ok = await bcrypt.compare(password, await bcrypt.hash(expected, 10));
  if (!ok) return res.status(401).json({ error: "Wrong password. Try again." });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Could not start session." });
    req.session.role = role;
    res.json({ ok: true, role });
  });
});
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => res.json({ role: req.session?.role || null }));
app.get("/api/messages", (req, res) => {
  if (!req.session?.role) return res.status(401).json({ error: "Sign in first." });
  res.json({ messages });
});
app.post("/api/messages", (req, res) => {
  if (!req.session?.role) return res.status(401).json({ error: "Sign in first." });
  const text = String(req.body?.text || "").trim().slice(0, 2000);
  if (!text) return res.status(400).json({ error: "Write a message first." });
  const message = {
    id: nextId++,
    text,
    sender: req.session.role,
    createdAt: new Date().toISOString()
  };
  messages.push(message);
  if (messages.length > MAX_MESSAGES) messages.shift();
  io.emit("new-message", message);
  res.json({ message });
});

io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
io.use((socket, next) => {
  if (socket.request.session?.role) return next();
  next(new Error("Not signed in"));
});
server.listen(PORT, () => console.log(`Bravo AI running on port ${PORT}`));