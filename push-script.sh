#!/bin/bash
set -e
API="https://api.github.com/repos/Pavani-170706/Smart-Queue-System"

echo "Step 1: Getting current state..."
HEAD_SHA=$(curl -s -H "Authorization: token $GH_TOKEN" "$API/git/refs/heads/main" | jq -r '.object.sha')
TREE_SHA=$(curl -s -H "Authorization: token $GH_TOKEN" "$API/git/commits/$HEAD_SHA" | jq -r '.tree.sha')
echo "HEAD: $HEAD_SHA | TREE: $TREE_SHA"

echo ""
echo "Step 2: Creating blobs for all project files..."
BLOBS="{}"
COUNT=0
while IFS= read -r f; do
    rel="${f#./}"
    B64=$(base64 -w0 "$f")
    SHA=$(curl -s -X POST -H "Authorization: token $GH_TOKEN" -H "Content-Type: application/json" "$API/git/blobs" -d "{\"encoding\":\"base64\",\"content\":\"$B64\"}" | jq -r '.sha')
    COUNT=$((COUNT+1))
    echo "  [$COUNT] $rel"
    BLOBS=$(echo "$BLOBS" | jq --arg p "$rel" --arg s "$SHA" '. + {($p): $s}')
done < <(find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './setup-*' -not -path '*.zip' -not -name 'package.json' -not -name 'bun.lock' -not -name 'integrations.md' -not -name '.env*' -not -name 'push-to-github.sh' -not -name 'setup-all.ps1' | sort)
echo "Created $COUNT blobs"

echo ""
echo "Step 3: Building tree..."
TREE_JSON="["
FIRST=true
for key in $(echo "$BLOBS" | jq -r 'keys[]'); do
    sha=$(echo "$BLOBS" | jq -r --arg k "$key" '.[$k]')
    if [ "$FIRST" = true ]; then FIRST=false; else TREE_JSON="$TREE_JSON,"; fi
    TREE_JSON="$TREE_JSON$(jq -n --arg p "$key" --arg s "$sha" '{path:$p,mode:"100644",type:"blob",sha:$s}')"
done
TREE_JSON="$TREE_JSON]"

echo ""
echo "Step 4: Creating tree..."
NEW_TREE_SHA=$(curl -s -X POST -H "Authorization: token $GH_TOKEN" -H "Content-Type: application/json" "$API/git/trees" -d "{\"base_tree\":\"$TREE_SHA\",\"tree\":$TREE_JSON}" | jq -r '.sha')
echo "New tree: $NEW_TREE_SHA"

echo ""
echo "Step 5: Creating commit..."
COMMIT_SHA=$(curl -s -X POST -H "Authorization: token $GH_TOKEN" -H "Content-Type: application/json" "$API/git/commits" -d "{\"message\":\"Complete Smart Hospital QMS - Spring Boot microservices + React frontend\",\"tree\":\"$NEW_TREE_SHA\",\"parents\":[\"$HEAD_SHA\"]}" | jq -r '.sha')
echo "Commit: $COMMIT_SHA"

echo ""
echo "Step 6: Updating main branch..."
curl -s -X PATCH -H "Authorization: token $GH_TOKEN" -H "Content-Type: application/json" "$API/git/refs/heads/main" -d "{\"sha\":\"$COMMIT_SHA\"}" | jq -r '.object.sha'

echo ""
echo "=== ALL FILES PUSHED TO GITHUB! ==="
echo "https://github.com/Pavani-170706/Smart-Queue-System"
