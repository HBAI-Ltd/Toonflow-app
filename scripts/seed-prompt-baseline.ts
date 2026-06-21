import { db as knexDb } from "@/utils/db";
import { seedPromptBaselineVersions } from "@/utils/promptCenter";

async function main() {
  const result = await seedPromptBaselineVersions();
  console.log(JSON.stringify(result, null, 2));
  await knexDb.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await knexDb.destroy();
  process.exit(1);
});

