#!/usr/bin/env bash
# Sirve el sitio estático en local y abre el navegador.
# El sitio es HTML/CSS/JS puro: no hay build ni dependencias en runtime.
# Uso: ./scripts/dev.sh [puerto]   (por defecto 8000)
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${1:-8000}"
URL="http://localhost:${PORT}/layout.html"

printf '\033[1;34m==>\033[0m Sirviendo %s en %s (Ctrl+C para cortar)\n' "$(pwd)" "$URL"

# Abre el navegador cuando el server ya esté escuchando.
(
  for _ in $(seq 1 40); do
    if curl -fsS -o /dev/null "http://localhost:${PORT}/" 2>/dev/null; then
      case "$(uname -s)" in
        Darwin) open "$URL" ;;
        Linux) command -v xdg-open >/dev/null && xdg-open "$URL" ;;
      esac
      break
    fi
    sleep 0.25
  done
) &

exec python3 -m http.server "$PORT" --bind 127.0.0.1
