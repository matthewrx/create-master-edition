import {
  establishConnection,
  establishPayer,
  checkAccounts,
  create_master_edition,
} from "./init";

require("process");

async function main() {
  await establishConnection();
  await establishPayer();
  await checkAccounts();
  await create_master_edition();

  console.log("success");
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
