#!/bin/bash

# Branch Protection Rules Setup Script
# This script sets up branch protection rules for the main branch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up branch protection rules...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

# Get repository information
REPO_INFO=$(gh repo view --json owner,name)
OWNER=$(echo $REPO_INFO | jq -r '.owner.login')
REPO=$(echo $REPO_INFO | jq -r '.name')

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
    echo -e "${RED}Error: Could not determine repository owner and name.${NC}"
    exit 1
fi

echo -e "${YELLOW}Repository: $OWNER/$REPO${NC}"

# Branch to protect
BRANCH="main"

# Create branch protection rule using GitHub API
echo -e "${GREEN}Creating branch protection rules for $BRANCH...${NC}"

# Protection rule payload
PROTECTION_PAYLOAD=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Type Check",
      "Unit Tests",
      "Build"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF
)

# Apply branch protection
if gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$OWNER/$REPO/branches/$BRANCH/protection" \
  --input - <<< "$PROTECTION_PAYLOAD" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Branch protection rules created successfully!${NC}"
else
  echo -e "${YELLOW}⚠ Branch protection might already exist or you may not have admin permissions.${NC}"
  echo -e "${YELLOW}  Attempting to update existing rules...${NC}"
  
  # Try to update with a simplified payload
  SIMPLE_PAYLOAD=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
)
  
  if gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$OWNER/$REPO/branches/$BRANCH/protection" \
    --input - <<< "$SIMPLE_PAYLOAD" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Basic branch protection rules applied!${NC}"
  else
    echo -e "${RED}✗ Could not apply branch protection rules.${NC}"
    echo -e "${YELLOW}  You may need admin permissions or the repository may be private.${NC}"
  fi
fi

# Show current protection status
echo -e "\n${GREEN}Current branch protection status:${NC}"
gh api \
  -H "Accept: application/vnd.github+json" \
  "/repos/$OWNER/$REPO/branches/$BRANCH/protection" 2>/dev/null | jq '{
    required_status_checks: .required_status_checks,
    enforce_admins: .enforce_admins.enabled,
    required_pull_request_reviews: .required_pull_request_reviews,
    restrictions: .restrictions
  }' || echo -e "${YELLOW}Could not fetch protection status.${NC}"

echo -e "\n${GREEN}Branch protection setup complete!${NC}"
echo -e "${YELLOW}Note: You'll need to set up the following GitHub Actions workflows:${NC}"
echo "  - Type Check workflow (runs 'npm run type-check')"
echo "  - Unit Tests workflow (runs 'npm test')"
echo "  - Build workflow (runs 'npm run build')"
echo -e "\n${YELLOW}These workflows should report their status as:${NC}"
echo "  - 'Type Check'"
echo "  - 'Unit Tests'"
echo "  - 'Build'"