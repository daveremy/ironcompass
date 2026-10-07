// Write a JSON envelope and exit once the write has drained.
//
// Node's stdout is asynchronous on a pipe: calling process.exit() right after
// console.log() drops whatever the pipe had not yet accepted (the tail of any
// output larger than the pipe buffer, lifeos#294). So these functions return
// after queuing the write and exit in its callback. Code that follows a call
// still runs, so call them as `return success(...)` / `return fail(...)`.
// Only the first call wins: a later success()/fail() is ignored.
let finished = false;

function finish(stream: NodeJS.WriteStream, body: unknown, code: number): void {
  if (finished) return;
  finished = true;
  process.exitCode = code;
  const exit = () => process.exit(code);
  stream.once("error", exit); // e.g. EPIPE when the reader has gone
  stream.write(JSON.stringify(body) + "\n", exit);
}

export function success(data: unknown): void {
  finish(process.stdout, { ok: true, data }, 0);
}

export function fail(error: string): void {
  finish(process.stderr, { ok: false, error }, 1);
}
