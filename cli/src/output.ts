export function success(data: unknown): never {
  console.log(JSON.stringify({ ok: true, data }));
  process.exit(0);
}

export function fail(error: string): never {
  console.error(JSON.stringify({ ok: false, error }));
  process.exit(1);
}
