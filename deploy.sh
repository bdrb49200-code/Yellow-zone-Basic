#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "توقف النشر عند السطر $LINENO. لم يتم تأكيد نشر الموقع؛ راجع الخطأ الظاهر فوق." >&2' ERR
: "${SM_ARCHIVE:?حدد مسار ملف ZIP}"
for tool in git gh python3; do command -v "$tool" >/dev/null; done
test -f "$SM_ARCHIVE"
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
echo "المستودع المستهدف: $repo"
stage=$(mktemp -d)
export SM_STAGE="$stage"
python3 - <<'PY'
import os,zipfile,pathlib
target=pathlib.Path(os.environ['SM_STAGE'])/'site'
with zipfile.ZipFile(os.environ['SM_ARCHIVE']) as z:
    assert 'index.html' in z.namelist(), 'Missing index.html'
    for name in z.namelist():
        p=pathlib.PurePosixPath(name)
        assert not p.is_absolute() and '..' not in p.parts and '.git' not in p.parts, 'Unsafe archive path'
    z.extractall(target)
PY
gh repo clone "$repo" "$stage/repo" -- --branch main --single-branch
cd "$stage/repo"
backup="backup-sm-$(date -u +%Y%m%d-%H%M%S)-$$"
git push origin "HEAD:refs/heads/$backup"
echo "حُفظت النسخة القديمة في فرع: $backup"
if test -f CNAME; then cp CNAME "$stage/site/CNAME"; fi
git rm -r --ignore-unmatch -- . >/dev/null
cp -a "$stage/site/." .
git add -A
if ! git diff --cached --quiet; then
  git -c user.name="Smile Makers Deploy" -c user.email="deploy@users.noreply.github.com" commit -m "Deploy separate Smile Makers site"
  git push origin HEAD:main
fi
printf '%s\n' '{"build_type":"legacy","source":{"branch":"main","path":"/"}}' > "$stage/pages.json"
if gh api "repos/$repo/pages" > "$stage/pages-current.json" 2> "$stage/pages-error.txt"; then
  method=PUT
elif grep -q '404' "$stage/pages-error.txt"; then
  method=POST
else
  cat "$stage/pages-error.txt" >&2
  echo "تم رفع الملفات. تعذر قراءة إعدادات Pages؛ افتح Settings ثم Pages واختر main و / (root)." >&2
  exit 1
fi
if ! gh api --method "$method" "repos/$repo/pages" --input "$stage/pages.json" > /dev/null; then
  echo "تم رفع الملفات. تعذر ضبط Pages تلقائيًا؛ افتح Settings ثم Pages واختر Deploy from a branch ثم main و / (root)." >&2
  exit 1
fi
echo "تم رفع الملفات وضبط Pages. اكتمال بناء الموقع يُراجع في Actions:"
echo "https://github.com/$repo/actions"
gh api "repos/$repo/pages" --jq .html_url
echo "الموقعان ما زالا يحتاجان إعداد قاعدة البيانات لتفعيل الحسابات والطلبات والتحكم المشترك."
