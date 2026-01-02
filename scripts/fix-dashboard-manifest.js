const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  ".next",
  "server",
  "app",
  "(dashboard)",
  "page_client-reference-manifest.js"
);

try {
  fs.mkdirSync(path.dirname(target), { recursive: true });

  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, "module.exports = {};", "utf8");
    console.log(
      "Created missing page_client-reference-manifest.js for (dashboard) route group."
    );
  } else {
    console.log(
      "page_client-reference-manifest.js already exists for (dashboard) route group."
    );
  }
} catch (error) {
  console.error("Failed to ensure (dashboard) client-reference manifest:", error);
  // Do not fail the build because of this helper.
}
