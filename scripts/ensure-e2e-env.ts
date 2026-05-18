import { getE2eEnvPath, loadE2eEnv } from "../src/lib/e2e/setup";

loadE2eEnv();
console.log(`e2e env ready: ${getE2eEnvPath()}`);
