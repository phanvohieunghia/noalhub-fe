// Mock backend cho docs/auth.md §3. Chạy: node mock-api.mjs
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = 8080;
const ORIGIN = "http://localhost:3000";

const users = new Map(); // email -> { id, email, name, password }
const refreshTokens = new Map(); // token -> userId
const accessTokens = new Map(); // token -> userId
const resetTokens = new Map(); // token -> userId

// tài khoản sẵn có
const seed = { id: "u_1", email: "a@b.com", name: "Noah", password: "password123" };
users.set(seed.email, seed);

// Cờ điều khiển để test: POST /__control { forceMeUnauthorized, expireRefresh }
const control = { forceMeUnauthorized: false };

const log = (...a) => console.log("[mock]", ...a);

function issue(userId) {
  const accessToken = "at_" + randomUUID();
  const refreshToken = "rt_" + randomUUID();
  accessTokens.set(accessToken, userId);
  refreshTokens.set(refreshToken, userId);
  return { accessToken, refreshToken };
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name };
}

function findById(id) {
  for (const u of users.values()) if (u.id === id) return u;
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/^\/api/, "");

  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const send = (status, body) => {
    log(req.method, path, "->", status);
    if (body === undefined) return res.writeHead(status).end();
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };

  let body = {};
  if (req.method === "POST") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    if (raw) try { body = JSON.parse(raw); } catch {}
  }

  const bearer = (req.headers.authorization || "").replace(/^Bearer /, "");

  // --- test control ---
  if (path === "/__control") {
    Object.assign(control, body);
    if (body.expireRefresh) refreshTokens.clear();
    if (body.reset) { control.forceMeUnauthorized = false; }
    return send(200, control);
  }

  if (path === "/auth/register") {
    if (users.has(body.email)) {
      return send(422, { message: "Dữ liệu không hợp lệ", fields: { email: "Email đã được sử dụng" } });
    }
    const user = { id: "u_" + randomUUID().slice(0, 8), email: body.email, name: body.name, password: body.password };
    users.set(user.email, user);
    return send(201, { ...issue(user.id), user: publicUser(user) });
  }

  if (path === "/auth/login") {
    const user = users.get(body.email);
    if (!user || user.password !== body.password) {
      return send(401, { message: "Email hoặc mật khẩu không đúng" });
    }
    return send(200, { ...issue(user.id), user: publicUser(user) });
  }

  if (path === "/auth/refresh") {
    const userId = refreshTokens.get(body.refreshToken);
    if (!userId) return send(401, { message: "Refresh token không hợp lệ" });
    refreshTokens.delete(body.refreshToken); // rotate
    control.forceMeUnauthorized = false; // sau khi refresh thì /me hoạt động lại
    return send(200, issue(userId));
  }

  if (path === "/auth/logout") {
    refreshTokens.delete(body.refreshToken);
    accessTokens.delete(bearer);
    return send(204);
  }

  if (path === "/auth/me") {
    if (control.forceMeUnauthorized) return send(401, { message: "Token hết hạn" });
    const userId = accessTokens.get(bearer);
    if (!userId) return send(401, { message: "Chưa xác thực" });
    const user = findById(userId);
    return send(200, { user: publicUser(user) });
  }

  if (path === "/auth/forgot-password") {
    const user = users.get(body.email);
    if (user) {
      const token = "prt_" + randomUUID();
      resetTokens.set(token, user.id);
      log("reset link: http://localhost:3000/reset-password?token=" + token);
    }
    return send(204);
  }

  if (path === "/auth/reset-password") {
    const userId = resetTokens.get(body.token);
    if (!userId) return send(400, { message: "Liên kết đặt lại đã hết hạn" });
    resetTokens.delete(body.token);
    findById(userId).password = body.password;
    return send(204);
  }

  if (path.startsWith("/auth/oauth/")) {
    const provider = path.split("/")[3];
    const redirectUri = url.searchParams.get("redirect_uri");
    if (provider === "github") {
      return res.writeHead(302, { Location: `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}error=access_denied` }).end();
    }
    const oauthUser = users.get("oauth@b.com") ?? (() => {
      const u = { id: "u_oauth", email: "oauth@b.com", name: "OAuth User", password: null };
      users.set(u.email, u);
      return u;
    })();
    const t = issue(oauthUser.id);
    const sep = redirectUri.includes("?") ? "&" : "?";
    return res.writeHead(302, {
      Location: `${redirectUri}${sep}accessToken=${t.accessToken}&refreshToken=${t.refreshToken}`,
    }).end();
  }

  return send(404, { message: "Not found" });
});

server.listen(PORT, () => log(`listening on http://localhost:${PORT}`));
