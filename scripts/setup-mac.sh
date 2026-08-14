#!/usr/bin/env bash
# Prepara una Mac para trabajar en CauchoHogar.
# Instala Homebrew (si falta) y las herramientas que usa la CI:
# node, vnu (validador HTML del W3C) y lychee (links rotos).
# Uso: ./scripts/setup-mac.sh
set -euo pipefail

cd "$(dirname "$0")/.."

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m!! \033[0m %s\n' "$1"; }

if [[ "$(uname -s)" != "Darwin" ]]; then
  warn "Este script está pensado para macOS. En Linux instalá node, vnu y lychee a mano."
fi

# --- Xcode Command Line Tools (trae git) ---
if ! xcode-select -p >/dev/null 2>&1; then
  info "Instalando Xcode Command Line Tools (abre una ventana; esperá a que termine)…"
  xcode-select --install || true
  warn "Volvé a correr este script cuando termine la instalación."
  exit 1
fi

# --- Homebrew ---
if ! command -v brew >/dev/null 2>&1; then
  info "Instalando Homebrew…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Apple Silicon deja brew en /opt/homebrew; Intel en /usr/local
  for prefix in /opt/homebrew /usr/local; do
    if [[ -x "$prefix/bin/brew" ]]; then
      eval "$("$prefix/bin/brew" shellenv)"
      break
    fi
  done
else
  info "Homebrew ya instalado: $(brew --version | head -1)"
fi

# --- Dependencias ---
for pkg in node vnu lychee; do
  if brew list --formula "$pkg" >/dev/null 2>&1; then
    info "$pkg ya instalado"
  else
    info "Instalando $pkg…"
    brew install "$pkg"
  fi
done

info "Versiones:"
node --version
npx --yes stylelint@16 --version >/dev/null 2>&1 && echo "stylelint 16 disponible vía npx"
vnu --version 2>/dev/null || true
lychee --version 2>/dev/null || true

cat <<'EOF'

Listo. Siguientes pasos:

  ./scripts/dev.sh     # levanta la página en http://localhost:8000
  ./scripts/check.sh   # corre los mismos chequeos que la CI

EOF
