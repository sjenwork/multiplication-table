#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

chrome_bin="${CHROME_BIN:-$(command -v google-chrome || command -v chromium || true)}"
if [[ -z "$chrome_bin" ]]; then
    echo "browser smoke failed: Chrome/Chromium is not installed" >&2
    exit 1
fi
if ! python3 -c 'import websocket' >/dev/null 2>&1; then
    echo "browser smoke failed: Python websocket module is not installed" >&2
    exit 1
fi

port="${SMOKE_PORT:-9227}"
target_url="${SMOKE_URL:-}"
profile_dir="$(mktemp -d -t multiplication-smoke-profile.XXXXXX)"
fixture_dir=""
server_log="$(mktemp -t multiplication-smoke-server.XXXXXX.log)"
chrome_log="$(mktemp -t multiplication-smoke-chrome.XXXXXX.log)"
cleanup() {
    [[ -n "${chrome_pid:-}" ]] && kill "$chrome_pid" 2>/dev/null || true
    [[ -n "${server_pid:-}" ]] && kill "$server_pid" 2>/dev/null || true
    [[ -n "${chrome_pid:-}" ]] && wait "$chrome_pid" 2>/dev/null || true
    [[ -n "${server_pid:-}" ]] && wait "$server_pid" 2>/dev/null || true
    rm -rf "$profile_dir" ${fixture_dir:+"$fixture_dir"} "$server_log" "$chrome_log" 2>/dev/null || true
}
trap cleanup EXIT

if [[ -z "$target_url" ]]; then
    fixture_dir="$(mktemp -d -t multiplication-smoke-fixture.XXXXXX)"
    cp index.html quiz.html study.html app.js sw.js design-tokens.css pwa.css tailwind.css theme-init.js manifest.webmanifest "$fixture_dir/"
    cp -R app icons vendor "$fixture_dir/"
    perl -0pi -e 's#\s*<script src="https://cdn\.tailwindcss\.com"></script>##g' "$fixture_dir/index.html" "$fixture_dir/quiz.html"
    perl -0pi -e 's#\s*<script src="theme-init\.js[^"]*"></script>##g' "$fixture_dir/index.html" "$fixture_dir/quiz.html"
    (cd "$fixture_dir" && python3 -m http.server 8766 --bind 127.0.0.1) >"$server_log" 2>&1 &
    server_pid=$!
    target_url="http://127.0.0.1:8766/index.html"
    for _ in {1..20}; do
        if curl -fsS "$target_url" >/dev/null; then break; fi
        sleep 0.1
    done
else
    fixture_dir="$(mktemp -d -t multiplication-smoke-fixture.XXXXXX)"
    remote_root="${target_url%/index.html}"
    curl -fsSL "$target_url" >"$fixture_dir/index.html"
    curl -fsSL "$remote_root/quiz.html" >"$fixture_dir/quiz.html"
    curl -fsSL "$remote_root/study.html" >"$fixture_dir/study.html"
    for asset in pwa.css tailwind.css design-tokens.css theme-init.js manifest.webmanifest; do
        curl -fsSL "$remote_root/$asset" >"$fixture_dir/$asset"
    done
    mkdir -p "$fixture_dir/app"
    curl -fsSL "$remote_root/app/theme-colors.js" >"$fixture_dir/app/theme-colors.js"
    mkdir -p "$fixture_dir/icons"
    for asset in icon.svg icon-192.png icon-512.png; do
        curl -fsSL "$remote_root/icons/$asset" >"$fixture_dir/icons/$asset"
    done
    perl -0pi -e 's#\s*<script src="https://cdn\.tailwindcss\.com"></script>##g' "$fixture_dir/index.html" "$fixture_dir/quiz.html"
    perl -0pi -e 's#\s*<script src="theme-init\.js[^"]*"></script>##g' "$fixture_dir/index.html" "$fixture_dir/quiz.html"
    perl -0pi -e "s#src=\"app\\.js\\?v=([^\"]*)\"#src=\"${remote_root}/app.js?v=\$1\"#g" "$fixture_dir/index.html" "$fixture_dir/quiz.html" "$fixture_dir/study.html"
    (cd "$fixture_dir" && python3 -m http.server 8766 --bind 127.0.0.1) >"$server_log" 2>&1 &
    server_pid=$!
    target_url="http://127.0.0.1:8766/index.html"
    for _ in {1..20}; do
        if curl -fsS "$target_url" >/dev/null; then break; fi
        sleep 0.1
    done
fi
"$chrome_bin" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --ignore-certificate-errors \
    --no-first-run --no-default-browser-check --remote-allow-origins='*' \
    --user-data-dir="$profile_dir" --remote-debugging-port="$port" about:blank >"$chrome_log" 2>&1 &
chrome_pid=$!

python3 - "$port" "$target_url" <<'PY'
import json
import sys
import time
import urllib.request
import websocket

port = sys.argv[1]
target_url = sys.argv[2]
for _ in range(40):
    try:
        pages = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list'))
        page = next(item for item in pages if item['type'] == 'page' and item['url'] == 'about:blank')
        break
    except Exception:
        time.sleep(0.25)
else:
    raise SystemExit('browser smoke failed: Chrome DevTools did not start')

ws = websocket.create_connection(page['webSocketDebuggerUrl'], timeout=1, origin=f'http://127.0.0.1:{port}')
sequence = 0

def send(method, params=None):
    global sequence
    sequence += 1
    ws.send(json.dumps({'id': sequence, 'method': method, 'params': params or {}}))
    return sequence

for method in ('Runtime.enable', 'Log.enable', 'Network.enable', 'Page.enable'):
    send(method)
send('Page.navigate', {'url': target_url})

exceptions = []
deadline = time.time() + 30
while time.time() < deadline:
    try:
        message = json.loads(ws.recv())
    except Exception:
        continue
    if message.get('method') == 'Runtime.exceptionThrown':
        details = message['params']['exceptionDetails']
        exceptions.append(details.get('exception', {}).get('description', details.get('text', 'unknown exception')))
    if message.get('method') == 'Network.loadingFailed':
        print('smoke network failed:', message['params'].get('errorText'), message['params'].get('blockedReason'), flush=True)

def evaluate(expression):
    request_id = send('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
    ws.settimeout(10)
    deadline = time.time() + 20
    while time.time() < deadline:
        try:
            message = json.loads(ws.recv())
        except Exception:
            continue
        if message.get('id') == request_id:
            result = message.get('result', {}).get('result', {})
            if 'exceptionDetails' in message.get('result', {}):
                raise SystemExit(json.dumps(message['result']['exceptionDetails'], ensure_ascii=False))
            return result.get('value')
    raise SystemExit('browser smoke failed: evaluation timed out')

if exceptions:
    raise SystemExit('browser smoke failed: ' + ' | '.join(exceptions))
print('smoke page state:', evaluate("JSON.stringify({url: location.href, readyState: document.readyState, scripts: [...document.scripts].map((script) => script.src), appButton: !!document.querySelector('#open-settings'), selector: !!customElements.get('multiplication-selector'), cells: document.querySelectorAll('#multiplication-grid td[data-question]').length, button: (() => { const host = document.querySelector('#start-quiz'); const button = host?.querySelector('button'); return { hostClass: host?.className, buttonClass: button?.className, radius: button ? getComputedStyle(button).borderRadius : null }; })()})"), flush=True)
grid_cells = evaluate("document.querySelectorAll('#multiplication-grid td[data-question]').length")
if grid_cells != 81:
    raise SystemExit(f'browser smoke failed: home grid did not render 81 cells (got {grid_cells})')
if evaluate("getComputedStyle(document.querySelector('#start-quiz button')).borderRadius") != '9999px':
    raise SystemExit('browser smoke failed: shared action button is not pill-shaped')
if not evaluate("[...document.querySelectorAll('app-button')].every((host) => getComputedStyle(host).boxShadow === 'none' && [...host.querySelectorAll('button')].every((button) => getComputedStyle(button).borderRadius === '9999px'))"):
    raise SystemExit('browser smoke failed: app-button host leaked a non-rounded visual style')
if not evaluate("(() => { const corner = document.querySelector('#multiplication-grid th'); return corner?.classList.contains('sticky') && corner.classList.contains('left-0') && corner.classList.contains('top-0') && getComputedStyle(corner).zIndex === '30'; })()"):
    raise SystemExit('browser smoke failed: multiplication table corner is not fixed on both axes')
selection_status_height = evaluate("document.getElementById('selection-status').getBoundingClientRect().height")
if selection_status_height != 64:
    raise SystemExit(f'browser smoke failed: selection capsule height was not fixed at 64px (got {selection_status_height})')
if evaluate("document.getElementById('selection-status').textContent") != '點選或長按滑動選題；每次隨機 10 題，不足則全部出題。':
    raise SystemExit('browser smoke failed: empty selection did not show the instruction text')
if evaluate("document.querySelector('td[data-question]').click(); document.getElementById('selection-status').textContent") != '已選擇 1 題，準備好就開始挑戰！':
    raise SystemExit('browser smoke failed: selection interaction did not work')
if evaluate("document.getElementById('selection-status').getBoundingClientRect().height") != selection_status_height:
    raise SystemExit('browser smoke failed: selection capsule height changed after selection')
if not evaluate("(async () => { document.getElementById('open-settings').click(); await new Promise((resolve) => setTimeout(resolve, 50)); return document.querySelector('app-settings-modal [data-modal-scrim]').classList.contains('flex'); })()"):
    raise SystemExit('browser smoke failed: settings modal did not open')
if not evaluate("(() => { const scrim = document.querySelector('app-settings-modal [data-modal-scrim]'); const style = getComputedStyle(scrim); return style.backdropFilter === 'blur(16px)' && style.backgroundColor.includes('0.14'); })()"):
    raise SystemExit('browser smoke failed: modal scrim is not translucent glass')
evaluate("(async () => { document.querySelector('app-settings-modal [data-modal-close]').click(); await new Promise((resolve) => setTimeout(resolve, 50)); document.getElementById('start-quiz').click(); })()")
time.sleep(2)
if evaluate("document.querySelectorAll('#question-list article').length") == 0:
    raise SystemExit('browser smoke failed: quiz questions did not render')
if evaluate("document.querySelectorAll('#question-list input[data-question]').length") == 0:
    raise SystemExit('browser smoke failed: quiz answer inputs did not render')
if evaluate("getComputedStyle(document.getElementById('completion-overlay')).display") != 'none':
    raise SystemExit('browser smoke failed: completion overlay was visible before quiz completion')
if evaluate("document.querySelector('#question-list input[data-question]').click(); document.querySelector('[data-pad-value=\"1\"]').click(); document.querySelector('#question-list input[data-question]').value") != '1':
    raise SystemExit('browser smoke failed: keypad could not enter an answer')
evaluate("window.location.href = 'study.html'")
time.sleep(2)
evaluate("(async () => { await customElements.whenDefined('app-button'); await Promise.all([...document.querySelectorAll('#study-factor-buttons app-button')].map((button) => button.updateComplete)); return true; })()")
if evaluate("document.querySelectorAll('#study-factor-buttons [data-factor]').length") != 8:
    raise SystemExit('browser smoke failed: study factor buttons did not render')
if evaluate("document.querySelectorAll('#study-factor-buttons button').length") != 8:
    raise SystemExit('browser smoke failed: study factor buttons are not interactive')
if evaluate("document.querySelectorAll('.study-equation').length") != 9:
    raise SystemExit('browser smoke failed: study multiplication table did not render')
if evaluate("document.querySelector('.study-equation-list').textContent.includes('2')") is not True:
    raise SystemExit('browser smoke failed: default study table did not render factor 2')
if evaluate("(async () => { document.querySelector('[data-factor=\"7\"] button').click(); await document.querySelector('#study-table').updateComplete; return document.querySelector('.study-equation-list').textContent.includes('63'); })()") is not True:
    raise SystemExit('browser smoke failed: study factor selection did not update the table')
print('browser smoke passed')
ws.close()
PY
