const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// pnpm monorepo: watch the entire workspace root and pnpm store
config.watchFolders = [workspaceRoot];

// Let Metro resolve from the project first, then the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Follow symlinks (required for pnpm)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
