Determine base branch (first existing wins): develop → origin/develop → main → origin/main. Use `git show-ref --verify` to check.

Then inspect:
- `git status --short`
- `git diff --name-status`
- `git diff`
- `git diff --cached`
- `git diff <base>...HEAD`
- `git diff <base>...HEAD --stat`

Review all current work: committed branch changes, staged changes, unstaged changes, and relevant untracked files when visible in git status.

Focus on correctness, subtle bugs, edge cases, security, performance, maintainability, tests, and readability. Do not edit files.

For each finding, include:
- severity: critical, high, medium, low
- file or area
- issue
- why it matters
- suggested fix

Avoid style nitpicks unless they affect correctness, maintainability, or consistency.

Return a clear verdict: accepted, needs revision, or rejected. Keep the justification dense and actionable.
