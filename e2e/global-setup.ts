import { execFileSync } from "node:child_process";
import { loadE2eEnv, resetE2eDatabase } from "../src/lib/e2e/setup";

export default async function globalSetup() {
  const env = loadE2eEnv();
  const commandEnv = { ...process.env, ...env };

  execFileSync("npm", ["run", "db:migrate"], {
    env: commandEnv,
    stdio: "inherit",
  });

  await resetE2eDatabase(env);

  execFileSync("npm", ["run", "admin:bootstrap"], {
    env: commandEnv,
    stdio: "inherit",
  });
}
