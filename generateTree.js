// generateTree.js
const fs = require("fs");
const path = require("path");

const exclude = [
  "node_modules", ".git", ".vscode", "build", "dist", "coverage",
  ".next", "out", "logs", ".cache", "public", "package-lock.json",
  "yarn.lock", ".env", ".DS_Store"
];

function getTree(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return "";
  const items = fs.readdirSync(dir);
  let output = "";

  for (const item of items) {
    if (exclude.includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    output += "  ".repeat(depth) + "├── " + item + "\n";
    if (stats.isDirectory()) {
      output += getTree(fullPath, depth + 1, maxDepth);
    }
  }
  return output;
}

const result = getTree(process.cwd());
fs.writeFileSync("clean-structure.txt", result);
console.log("✅ Saved clean-structure.txt");
