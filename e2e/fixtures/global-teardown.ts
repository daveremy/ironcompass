import { cleanupAll } from "./db";

export default async function globalTeardown() {
  await cleanupAll();
}
