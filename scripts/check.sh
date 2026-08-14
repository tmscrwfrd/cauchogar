#!/usr/bin/env bash
# Corre en local los mismos chequeos que .github/workflows/ci.yml.
# Si falta una herramienta el paso se saltea con aviso (la CI igual lo va a correr).
# Uso: ./scripts/check.sh
set -uo pipefail

cd "$(dirname "$0")/.."

FAILED=()

info() { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
skip() { printf '\033[1;33m-- \033[0m %s\n' "$1"; }
fail() { printf '\033[1;31mFAIL\033[0m %s\n' "$1"; FAILED+=("$1"); }
ok()   { printf '\033[1;32mOK  \033[0m %s\n' "$1"; }

# 1) Sintaxis JS
info "Sintaxis JS (node --check)"
if command -v node >/dev/null 2>&1; then
  if node --check app.js && node --check data.js; then ok "JS"; else fail "sintaxis JS"; fi
else
  skip "node no está instalado (corré ./scripts/setup-mac.sh)"
fi

# 2) HTML (W3C Nu) — mismo alcance que la CI: raíz del repo, sin el esqueleto Django
info "Validar HTML (vnu)"
if command -v vnu >/dev/null 2>&1; then
  # Sin mapfile: el bash que trae macOS es 3.2
  HTML_FILES=()
  while IFS= read -r f; do HTML_FILES+=("$f"); done < <(
    find . -name '*.html' -not -path './cauchogar/*' -not -path './.git/*' | sort
  )
  if [ ${#HTML_FILES[@]} -eq 0 ]; then
    skip "no se encontraron archivos .html"
  elif vnu --errors-only "${HTML_FILES[@]}"; then
    ok "HTML"
  else
    fail "validación HTML"
  fi
else
  skip "vnu no está instalado (brew install vnu)"
fi

# 3) CSS
info "Lint CSS (stylelint)"
if command -v npx >/dev/null 2>&1; then
  if npx --yes stylelint@16 "**/*.css"; then ok "CSS"; else fail "stylelint"; fi
else
  skip "npx no está instalado (brew install node)"
fi

# 4) Links rotos
info "Links rotos (lychee)"
if command -v lychee >/dev/null 2>&1; then
  if lychee --no-progress --max-retries 3 --accept 200,206,403,429 layout.html; then
    ok "links"
  else
    fail "links rotos"
  fi
else
  skip "lychee no está instalado (brew install lychee)"
fi

echo
if [[ ${#FAILED[@]} -gt 0 ]]; then
  printf '\033[1;31mFallaron %d chequeo(s): %s\033[0m\n' "${#FAILED[@]}" "${FAILED[*]}"
  exit 1
fi
printf '\033[1;32mTodo en verde.\033[0m\n'
