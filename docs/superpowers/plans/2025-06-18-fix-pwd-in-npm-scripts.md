# Fix PWD in NPM Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragile `$(pwd)` usage in npm scripts with a robust project root resolution mechanism that works regardless of execution directory.

**Architecture:** Replace shell `$(pwd)` with Node.js-based path resolution using a small helper script that determines the true project root directory, then update all affected npm scripts to use this reliable method.

**Tech Stack:** Node.js (built-in `path` module), npm scripts, shell scripting

---

### Task 1: Create Project Root Resolver Script

**Files:**
- Create: `scripts/get-project-root.js`

- [ ] **Step 1: Write the project root resolver script**

```javascript
#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory containing this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The project root is one level up from the scripts directory
const projectRoot = join(__dirname, '..');

// Output to stdout for use in shell scripts
console.log(projectRoot);
```

- [ ] **Step 2: Make the script executable**

Run: `chmod +x scripts/get-project-root.js`
Expected: No errors, script becomes executable

- [ ] **Step 3: Test the script from different directories**

Run: `node scripts/get-project-root.js`
Expected: `/media/islamux/Variety/JavaScriptProjects/fi-thila2`

Run: `cd src && node ../scripts/get-project-root.js`
Expected: `/media/islamux/Variety/JavaScriptProjects/fi-thila2`

- [ ] **Step 4: Commit**

```bash
git add scripts/get-project-root.js
git commit -m "feat: add project root resolver script"
```

---

### Task 2: Update Package.json Scripts to Use Resolver

**Files:**
- Modify: `package.json:14-16`

- [ ] **Step 1: Update cc:mcp script**

Replace `"cc:mcp": "PROJECT_ROOT=$(pwd)/command-center node command-center/packages/mcp/dist/index.js"` with:
```json
"cc:mcp": "PROJECT_ROOT=$(node scripts/get-project-root.js)/command-center node command-center/packages/mcp/dist/index.js",
```

- [ ] **Step 2: Update ccui script**

Replace `"ccui": "PROJECT_ROOT=$(pwd)/command-center node command-center/packages/tui/dist/index.js"` with:
```json
"ccui": "PROJECT_ROOT=$(node scripts/get-project-root.js)/command-center node command-center/packages/tui/dist/index.js",
```

- [ ] **Step 3: Update _cc script**

Replace `"_cc": "PROJECT_ROOT=$(pwd)/command-center node command-center/packages/mcp/dist/cli.js"` with:
```json
"_cc": "PROJECT_ROOT=$(node scripts/get-project-root.js)/command-center node command-center/packages/mcp/dist/cli.js",
```

- [ ] **Step 4: Verify the updated package.json syntax**

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')))" > /dev/null`
Expected: No errors (valid JSON)

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "fix: replace fragile pwd with project root resolver in npm scripts"
```

---

### Task 3: Test Scripts from Different Directories

**Files:**
- Test: `package.json:14-30` (all cc:* scripts)

- [ ] **Step 1: Test cc:status from project root**

Run: `npm run cc:status`
Expected: Command executes successfully with correct PROJECT_ROOT

- [ ] **Step 2: Test cc:status from subdirectory**

Run: `cd src && npm run cc:status`
Expected: Command executes successfully with correct PROJECT_ROOT (not the src directory)

- [ ] **Step 3: Test cc:agents from different directory**

Run: `cd command-center && npm run cc:agents`
Expected: Command executes successfully with correct PROJECT_ROOT

- [ ] **Step 4: Test cc:list from deeply nested directory**

Run: `cd command-center/packages/mcp/src && npm run cc:list`
Expected: Command executes successfully with correct PROJECT_ROOT

- [ ] **Step 5: Return to project root**

Run: `cd /media/islamux/Variety/JavaScriptProjects/fi-thila2`
Expected: Back at project root

- [ ] **Step 6: Create integration test documentation**

Create `docs/testing/command-center-scripts.md`:
```markdown
# Command Center Scripts Testing

## Purpose
Verify that command center scripts work correctly from any directory.

## Test Cases

### From Project Root
```bash
npm run cc:status
npm run cc:agents
npm run cc:list
```

### From Subdirectories
```bash
cd src && npm run cc:status
cd command-center && npm run cc:agents
cd command-center/packages/mcp/src && npm run cc:list
```

### Expected Behavior
All scripts should execute successfully with `PROJECT_ROOT` set to the project root directory (`/media/islamux/Variety/JavaScriptProjects/fi-thila2`), regardless of the current working directory when the script is invoked.
```

- [ ] **Step 7: Commit**

```bash
git add docs/testing/command-center-scripts.md
git commit -m "docs: add command center scripts testing guide"
```

---

### Task 4: Update Documentation

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Read current AGENTS.md to identify command center references**

Run: `grep -n "cc:" AGENTS.md`
Expected: List of lines referencing command center scripts

- [ ] **Step 2: Add note about directory independence**

Add to AGENTS.md after the Commands section (around line 10-15):
```markdown
## Command Center Scripts

The `cc:*` scripts are directory-independent and can be run from any subdirectory. They use a project root resolver to correctly set `PROJECT_ROOT` regardless of the current working directory.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document directory independence of cc:* scripts"
```

---

### Task 5: Create Fallback for Edge Cases

**Files:**
- Modify: `scripts/get-project-root.js`

- [ ] **Step 1: Add fallback to package.json location**

Update `scripts/get-project-root.js`:
```javascript
#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get the directory containing this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Primary method: The project root is one level up from the scripts directory
let projectRoot = join(__dirname, '..');

// Fallback: Verify we're at the right location by checking for package.json
try {
  const packageJsonPath = join(projectRoot, 'package.json');
  readFileSync(packageJsonPath, 'utf8');
} catch (error) {
  // If package.json not found, try to find it by walking up the directory tree
  let currentDir = __dirname;
  while (currentDir !== '/') {
    const testPath = join(currentDir, 'package.json');
    try {
      readFileSync(testPath, 'utf8');
      projectRoot = currentDir;
      break;
    } catch {
      // Continue walking up
      currentDir = dirname(currentDir);
    }
  }
  if (currentDir === '/') {
    console.error('Could not find project root (package.json not found)');
    process.exit(1);
  }
}

// Output to stdout for use in shell scripts
console.log(projectRoot);
```

- [ ] **Step 2: Test the fallback mechanism**

Run: `node scripts/get-project-root.js`
Expected: `/media/islamux/Variety/JavaScriptProjects/fi-thila2`

Run (simulate missing package.json at expected location):
```bash
cd /tmp && node /media/islamux/Variety/JavaScriptProjects/fi-thila2/scripts/get-project-root.js
```
Expected: `/media/islamux/Variety/JavaScriptProjects/fi-thila2` (still finds correct root)

- [ ] **Step 3: Commit**

```bash
git add scripts/get-project-root.js
git commit -m "feat: add fallback mechanism to project root resolver"
```

---

## Self-Review Results

**1. Spec coverage:**
- ✅ Identified the problem: `$(pwd)` in npm scripts
- ✅ Created robust solution with fallback
- ✅ Updated all affected scripts
- ✅ Added testing from different directories
- ✅ Documented the changes

**2. Placeholder scan:**
- ✅ No placeholders found - all code is complete
- ✅ All commands are specified with expected outputs
- ✅ All file paths are exact

**3. Type consistency:**
- ✅ Variable names consistent throughout
- ✅ File paths consistent
- ✅ Script names match across tasks

---

Plan complete and saved to `docs/superpowers/plans/2025-06-18-fix-pwd-in-npm-scripts.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**