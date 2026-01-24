const fs = require("fs");
const path = require("path");

/**
 * Post-build script to fix common Next.js production deployment issues
 * Specifically addresses clientModules errors on Vercel/production deployments
 */

function fixClientReferenceManifests() {
  const nextDir = path.join(process.cwd(), ".next");
  const serverAppDir = path.join(nextDir, "server", "app");

  if (!fs.existsSync(serverAppDir)) {
    console.log("No server app directory found, skipping manifest fix");
    return;
  }

  // Route groups that might need manifest files
  const routeGroups = ["(dashboard)", "(auth)", "(courses)", "(protected)"];

  routeGroups.forEach((routeGroup) => {
    const groupDir = path.join(serverAppDir, routeGroup);
    const manifestPath = path.join(
      groupDir,
      "page_client-reference-manifest.js",
    );

    try {
      if (!fs.existsSync(groupDir)) {
        fs.mkdirSync(groupDir, { recursive: true });
      }

      if (!fs.existsSync(manifestPath)) {
        const manifestContent = `// Auto-generated client reference manifest
module.exports = {
  clientModules: {},
  clientReferenceMap: {},
  serverReferenceMap: {},
  cssModules: {}
};`;

        fs.writeFileSync(manifestPath, manifestContent, "utf8");
        console.log(`✅ Created client manifest for ${routeGroup}`);
      }
    } catch (error) {
      console.warn(
        `⚠️ Failed to create manifest for ${routeGroup}:`,
        error.message,
      );
    }
  });

  // Fix the root manifest too
  const rootManifestPath = path.join(
    serverAppDir,
    "page_client-reference-manifest.js",
  );
  try {
    if (!fs.existsSync(rootManifestPath)) {
      const rootManifestContent = `// Root client reference manifest
module.exports = {
  clientModules: {},
  clientReferenceMap: {},
  serverReferenceMap: {},
  cssModules: {}
};`;

      fs.writeFileSync(rootManifestPath, rootManifestContent, "utf8");
      console.log("✅ Created root client manifest");
    }
  } catch (error) {
    console.warn("⚠️ Failed to create root manifest:", error.message);
  }
}

function validateBuildOutput() {
  const nextDir = path.join(process.cwd(), ".next");
  const staticDir = path.join(nextDir, "static");
  const serverDir = path.join(nextDir, "server");

  console.log("🔍 Validating build output...");

  if (!fs.existsSync(nextDir)) {
    console.error("❌ .next directory not found");
    process.exit(1);
  }

  if (!fs.existsSync(staticDir)) {
    console.warn("⚠️ Static directory not found");
  } else {
    console.log("✅ Static directory exists");
  }

  if (!fs.existsSync(serverDir)) {
    console.error("❌ Server directory not found");
    process.exit(1);
  } else {
    console.log("✅ Server directory exists");
  }
}

// Main execution
console.log("🚀 Running post-build fixes...");
validateBuildOutput();
fixClientReferenceManifests();
console.log("✅ Post-build fixes completed successfully");
