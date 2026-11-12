import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

const CHECK_TIMEOUT_MS = 2_000;

type CheckResult = { status: "up" } | { status: "down"; error: string };

async function check(probe: () => Promise<unknown>): Promise<CheckResult> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS} ms`)), CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([probe(), timeout]);
    return { status: "up" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "down", error: message.trim().split("\n").at(-1) ?? message };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  await connection();

  const [postgres, redisCheck] = await Promise.all([
    check(() => db().$queryRaw`SELECT 1`),
    check(() => redis().ping()),
  ]);
  const healthy = postgres.status === "up" && redisCheck.status === "up";

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks: { postgres, redis: redisCheck } },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
