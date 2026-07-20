#!/bin/bash
set -e

# create-and-push.sh
# project.json chadivi, files write chesi, GitHub repo create chesi push chestundi.

PROJECT_JSON="project.json"

REPO_NAME=$(node -e "console.log(require('./$PROJECT_JSON').repo_name)")
DESCRIPTION=$(node -e "console.log(require('./$PROJECT_JSON').description)")

echo "Creating project folder: $REPO_NAME"
mkdir -p "$REPO_NAME"

# Node script tho files anni correct paths lo write cheయిస్తున్నాం
node -e "
const fs = require('fs');
const path = require('path');
const project = require('./$PROJECT_JSON');
for (const file of project.files) {
  const fullPath = path.join('$REPO_NAME', file.path);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.content);
}
"

cd "$REPO_NAME"
git init -q
git add .
git -c user.name="$GIT_USER_NAME" -c user.email="$GIT_USER_EMAIL" commit -q -m "Auto-generated project: $DESCRIPTION"

# GitHub CLI tho repo create + push (GH_TOKEN already env lo set chesi untundi Actions lo)
gh repo create "$REPO_NAME" --public --description "$DESCRIPTION" --source=. --remote=origin --push

echo "SUCCESS: Repo '$REPO_NAME' created and pushed."
