import { connection, NextResponse } from "next/server";

function gauge(name: string, help: string, value: number): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name} ${value}`;
}

export async function GET() {
  await connection();

  const memory = process.memoryUsage();
  const body = [
    gauge("app_up", "1 when the web process is serving.", 1),
    gauge("app_uptime_seconds", "Seconds since the web process started.", process.uptime()),
    gauge("app_heap_used_bytes", "V8 heap used, in bytes.", memory.heapUsed),
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
