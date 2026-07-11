#!/usr/bin/env bash
# Toonflow-app 构建/同步操作菜单
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

# ---- Sync 参数（可按需修改默认值） ----
FEATURE_BRANCH="burnlife001"
TARGET_BRANCH="master"
UPSTREAM_REMOTE="upstream"
ORIGIN_REMOTE="origin"

# Electron 下载镜像（中国网络建议开启）
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_CUSTOM_DIR="{{ version }}"

show_menu() {
    clear
    echo -e "\e[36m===== Toonflow-app Ops =====\e[0m"
    echo ""
    echo "  1. Install deps & Build"
    echo "  2. Fetch upstream & rebase"
    echo -e "\e[33m  0. Exit\e[0m"
    echo ""
}

build() {
    echo ""
    echo -e "\e[32m>>> Installing dependencies...\e[0m"
    if ! npm install --legacy-peer-deps --foreground-scripts; then
        echo -e "\e[31m<<< Dependency installation FAILED\e[0m"
        return 1
    fi
    echo -e "\e[32m<<< Dependencies installed\e[0m"

    echo ""
    echo -e "\e[32m>>> Building...\e[0m"
    if ! npm run build; then
        echo -e "\e[31m<<< Build FAILED\e[0m"
        return 1
    fi
    echo -e "\e[32m<<< Build OK\e[0m"

    echo ""
    echo -e "\e[32m>>> Running type check...\e[0m"
    if ! npm run lint; then
        echo -e "\e[31m<<< Type check FAILED\e[0m"
        return 1
    fi
    echo -e "\e[32m<<< Type check OK\e[0m"
    return 0
}

sync_upstream() {
    local feature_branch="$1" target_branch="$2" upstream_remote="$3" origin_remote="$4"

    step() { echo "[$1/$2] $3"; }

    local current_branch
    current_branch="$(git rev-parse --abbrev-ref HEAD)"
    if [ "$current_branch" = "HEAD" ]; then
        echo -e "\e[31mDetached HEAD. Please checkout a branch first.\e[0m"
        return 1
    fi
    step 1 8 "Current branch: $current_branch"

    local stashed=false
    local dirty
    dirty="$(git status --porcelain --untracked-files=no)"
    if [ -n "$dirty" ]; then
        echo -e "\e[33mWorking tree dirty — stashing tracked changes...\e[0m"
        echo "$dirty"
        git stash push -m "__toonflow_build_ops: auto stash $(date '+%Y-%m-%d %H:%M:%S')"
        stashed=true
    fi
    step 2 8 "Working tree clean (stashed: $stashed)."

    if ! git remote get-url "$upstream_remote" &>/dev/null; then
        echo -e "\e[31mUpstream remote '$upstream_remote' not configured.\e[0m"
        echo "Run: git remote add $upstream_remote https://github.com/HBAI-Ltd/Toonflow-app.git"
        return 1
    fi
    if ! git remote get-url "$origin_remote" &>/dev/null; then
        echo -e "\e[31mOrigin remote '$origin_remote' not configured.\e[0m"
        return 1
    fi
    step 3 8 "Remotes '$origin_remote' / '$upstream_remote' present."

    step 4 8 "Fetching $upstream_remote..."
    git fetch "$upstream_remote"
    step 5 8 "Fetch done."

    local upstream_ref="$upstream_remote/$target_branch"
    step 6 8 "Checking out '$target_branch' and merging $upstream_ref..."
    if git show-ref --verify --quiet "refs/heads/$target_branch"; then
        git checkout "$target_branch"
    else
        echo -e "\e[33mCreating local branch '$target_branch' from $upstream_ref...\e[0m"
        git checkout -b "$target_branch" "$upstream_ref"
    fi

    if ! git merge "$upstream_ref" --no-edit; then
        echo -e "\e[31mMerge of $upstream_ref into $target_branch failed.\e[0m"
        echo "Resolve conflicts manually, then re-run this script."
        return 1
    fi

    if ! git push "$origin_remote" "$target_branch"; then
        echo -e "\e[31mPush $target_branch to $origin_remote failed.\e[0m"
        return 1
    fi
    step 6 8 "$target_branch synced with $upstream_ref and pushed to $origin_remote."

    if [ "$current_branch" = "$target_branch" ]; then
        step 7 8 "Already on $target_branch — skipping feature rebase."
        step 8 8 "Nothing to push for feature branch."
        echo ""
        echo -e "\e[32mDone. $target_branch is up-to-date.\e[0m"
        [ "$stashed" = true ] && git stash pop
        return 0
    fi

    git checkout "$feature_branch"
    step 7 8 "Rebasing $feature_branch onto $target_branch..."
    if ! git rebase "$target_branch"; then
        echo -e "\e[31mRebase hit conflicts.\e[0m"
        echo "Recovery:"
        echo "  1. Resolve conflicts"
        echo "  2. git add <files>"
        echo "  3. git rebase --continue"
        echo "  4. Re-run this script to push"
        return 1
    fi

    local local_head
    local_head="$(git rev-parse HEAD)"
    if ! git push --force-with-lease "$origin_remote" "$feature_branch"; then
        echo -e "\e[31mPush $feature_branch failed. Local $feature_branch at $local_head\e[0m"
        echo "Run: git push --force-with-lease $origin_remote $feature_branch"
        return 1
    fi
    step 8 8 "Pushed $feature_branch to $origin_remote."

    echo ""
    echo -e "\e[32mDone. Sync complete:\e[0m"
    echo "  $target_branch = $upstream_ref = $origin_remote/$target_branch"
    echo "  $feature_branch rebased onto $target_branch and pushed."

    if [ "$stashed" = true ]; then
        echo -e "\e[33mRestoring stashed changes...\e[0m"
        git stash pop
    fi

    if [ "$current_branch" != "$feature_branch" ]; then
        echo "Switching back to: $current_branch"
        git checkout "$current_branch"
    fi
    return 0
}

# ---- 主循环 ----
while true; do
    show_menu
    if ! read -rp "Select option: " choice; then
        echo "Bye."
        exit 0
    fi

    case "$choice" in
        1) build ;;
        2) sync_upstream "$FEATURE_BRANCH" "$TARGET_BRANCH" "$UPSTREAM_REMOTE" "$ORIGIN_REMOTE" ;;
        0) echo "Bye."; exit 0 ;;
        *) echo -e "\e[31mInvalid option: $choice\e[0m" ;;
    esac

    if [ "$choice" != "0" ]; then
        echo ""
        read -rp "Press Enter to return to menu..." || true
    fi
done
