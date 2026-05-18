import "dotenv/config";

import { closeDbClient } from "../src/lib/db/client";
import {
  bootstrapAdmin,
  readBootstrapAdminEnv,
} from "../src/lib/auth/bootstrap";

async function main() {
  const result = await bootstrapAdmin(readBootstrapAdminEnv());

  if (result.status === "skipped") {
    console.log("bootstrap skipped; user already exists");
    return;
  }

  console.log(`bootstrap created admin ${result.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "bootstrap failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDbClient();
  });
