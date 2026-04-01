import { createAdminToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid login payload." },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;
    const valid = await verifyPassword(username, password);

    if (!valid) {
      return Response.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const token = await createAdminToken(username);

    return Response.json({ token });
  } catch {
    return Response.json({ error: "Failed to process login." }, { status: 500 });
  }
}
