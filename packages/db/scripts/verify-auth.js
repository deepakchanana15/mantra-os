/**
 * One-off verification, not part of the app: creates a real test user with
 * a bcrypt-hashed password, then drives the actual running API over HTTP —
 * login with correct credentials, login with wrong credentials, and a
 * protected route with the issued token — cleaning up afterward regardless
 * of outcome. Run this while `node dist/src/main.js` is up on API_BASE_URL.
 */
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3099";

async function main() {
  const prisma = new PrismaClient();
  const email = `rls-verify-${crypto.randomBytes(4).toString("hex")}@example.com`;
  const password = "correct-horse-battery-staple";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, name: "Auth Verify Test User" },
  });

  try {
    const wrongLogin = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrong-password" }),
    });
    console.log("Wrong password login ->", wrongLogin.status, "(expect 401)");

    const rightLogin = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await rightLogin.json();
    console.log("Correct password login ->", rightLogin.status, "(expect 200)", loginBody.accessToken ? "got a token" : "NO TOKEN");

    const protectedRoute = await fetch(`${API_BASE_URL}/v1/organizations`, {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
    });
    console.log("Protected route with token ->", protectedRoute.status, "(expect 200)");

    const noToken = await fetch(`${API_BASE_URL}/v1/organizations`);
    console.log("Protected route with NO token ->", noToken.status, "(expect 401)");
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err.message);
  process.exit(1);
});
