# cauchogar
Cauchogar is a business plan project in which me and my teammates started working in 2025 for UCES. 

The main idea is to produce and install rubber tile floors made with already recycled SBR granules that came from tires scrap.

At the same time I wanted to explore computer science/web programming knowledge and try claude code. 
The web page: tmscrwfrd.github.io/cauchogar
helps to pitch and catch investors eye's in a one pager with an interactive dashboard of the main business drivers.

The ultimate goal for me was to understand and visualize how this small changes affect the overall expected value of the investment. 
(Numbers are expressed in ARS, Argentine Peso. + a Dark Magician solved inflation.)

PD: at the beginning this was all Excel? ALWAYS HAS BEEN.

## Local setup (macOS)

The site is plain HTML/CSS/JS — no build step, no runtime dependencies. The only
tooling is what CI uses to validate it.

```bash
git clone https://github.com/tmscrwfrd/cauchogar.git
cd cauchogar
./scripts/setup-mac.sh   # Homebrew + node, vnu, lychee (skips whatever is already there)
```

Then:

| Command | What it does |
| --- | --- |
| `./scripts/dev.sh` | Serves the site at <http://localhost:8000/layout.html> and opens the browser. Takes an optional port: `./scripts/dev.sh 3000`. |
| `./scripts/check.sh` | Runs the same checks as `.github/workflows/ci.yml`: `node --check` on the JS, HTML validation (vnu), stylelint, and lychee for broken links. Missing tools are skipped with a warning instead of failing. |

Editing `app.js`, `data.js`, `styles.css` or `layout.html` only needs a browser
refresh — a hard reload (`Cmd+Shift+R`) if the CSS looks stale.

Run `./scripts/check.sh` before pushing: it catches the same things CI would,
minutes earlier.
