export async function GET() {
  return Response.json({
    status: "ok",
    service: "medico",
    timestamp: new Date().toISOString(),
  });
}