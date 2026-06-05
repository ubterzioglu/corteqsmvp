const hasArg = (prefix) => process.argv.some((arg) => arg === prefix || arg.startsWith(`${prefix}=`));

if (!hasArg("--role")) process.argv.push("--role=Healthcare_Doctor");
if (!hasArg("--csv")) {
  process.argv.push(
    "--csv=C:\\Users\\baris-terzioglu\\OneDrive - adesso Group\\Desktop\\dortmund_turkce_hizmet_veren_doktorlar.csv",
  );
}
if (!hasArg("--source")) process.argv.push("--source=csv.dortmund_turkce_doktorlar");
if (!hasArg("--source-label")) process.argv.push("--source-label=Dortmund Turkce Hizmet Veren Doktorlar CSV");
if (!hasArg("--defaults.city")) process.argv.push("--defaults.city=Dortmund");
if (!hasArg("--defaults.country")) process.argv.push("--defaults.country=DE");

await import("./import-profiles-csv.mjs");
