import { cleanupAll, seedAll } from "./db";

export default async function globalSetup() {
  // Clean first to ensure idempotent runs
  await cleanupAll();
  await seedAll();
}
