import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";

export const rulesProjectId = "demo-buyol";

export async function createRulesTestEnvironment(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: rulesProjectId,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
    storage: {
      rules: readFileSync(resolve(process.cwd(), "storage.rules"), "utf8"),
    },
  });
}
