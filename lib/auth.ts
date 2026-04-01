import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "@/lib/mongodb";

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_JWT_SECRET.");
  }

  return encoder.encode(secret);
}

export async function verifyPassword(username: string, password: string) {
  const db = await getDb();
  const admin = await db.collection("admins").findOne<{ passwordHash: string }>({
    username,
  });

  if (!admin) {
    return false;
  }

  return compare(password, admin.passwordHash);
}

export async function createAdminToken(username: string) {
  return new SignJWT({ sub: username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getJwtSecret());
}

export async function getAuthorizedAdmin(request: Request) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    const payload = await jwtVerify(token, getJwtSecret());
    return payload.payload.sub ?? null;
  } catch {
    return null;
  }
}
