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
    cp -R app icons "$fixture_dir/"
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
    remote_root="${target_url%%\?*}"
    remote_root="${remote_root%/index.html}"
    remote_root="${remote_root%/}"
    curl -fsSL "$target_url" >"$fixture_dir/index.html"
    curl -fsSL "$remote_root/quiz.html" >"$fixture_dir/quiz.html"
    curl -fsSL "$remote_root/study.html" >"$fixture_dir/study.html"
    for asset in design-tokens.css pwa.css tailwind.css theme-init.js manifest.webmanifest; do
        curl -fsSL "$remote_root/$asset" >"$fixture_dir/$asset"
    done
    perl -0pi -e 's#\s*<script src="https://cdn\.tailwindcss\.com"></script>##g' "$fixture_dir/index.html" "$fixture_dir/quiz.html"
    perl -0pi -e 's#\s*<script src="theme-init\.js[^"]*"></script>##g' "$fixture_dir/index.html" "$fixture_dir/quiz.html"
    perl -0pi -e "s#src=\"app\\.js[^\"]*\"#src=\"${remote_root}/app.js\"#g" "$fixture_dir/index.html" "$fixture_dir/quiz.html" "$fixture_dir/study.html"
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
print('smoke page state:', evaluate("JSON.stringify({readyState: document.readyState, scripts: [...document.scripts].map((script) => script.src), cells: document.querySelectorAll('#multiplication-grid td[data-question]').length})"), flush=True)
grid_cells = evaluate("document.querySelectorAll('#multiplication-grid td[data-question]').length")
if grid_cells != 81:
    raise SystemExit(f'browser smoke failed: home grid did not render 81 cells (got {grid_cells})')
def click_question(index):
    point = evaluate(f"(() => {{ const rect = document.querySelectorAll('td[data-question]')[{index}].getBoundingClientRect(); return {{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }}; }})()")
    send('Input.dispatchMouseEvent', {**point, 'type': 'mousePressed', 'button': 'left', 'clickCount': 1})
    send('Input.dispatchMouseEvent', {**point, 'type': 'mouseReleased', 'button': 'left', 'clickCount': 1})

click_question(0)
if evaluate("document.getElementById('selection-status').textContent") != '已選擇 1 題，準備好就開始挑戰！':
    raise SystemExit('browser smoke failed: selection interaction did not work')
click_question(1)
if not evaluate("document.getElementById('open-settings').click(); document.getElementById('settings-modal').classList.contains('flex')"):
    raise SystemExit('browser smoke failed: settings modal did not open')
evaluate("document.getElementById('close-settings').click(); document.getElementById('start-study').click()")
time.sleep(2)
if evaluate("document.querySelectorAll('#study-table .study-equation').length") != 9:
    raise SystemExit('browser smoke failed: home study entry did not open the study page')
evaluate("document.getElementById('back-home').click()")
time.sleep(1)
evaluate("document.getElementById('start-quiz').click()")
time.sleep(2)
if evaluate("document.querySelectorAll('#question-list article').length") == 0:
    raise SystemExit('browser smoke failed: quiz questions did not render')
if not evaluate("document.getElementById('completion-overlay').classList.contains('hidden')"):
    raise SystemExit('browser smoke failed: completion overlay was visible on quiz start')
if evaluate("document.getElementById('number-pad').classList.contains('hidden')"):
    raise SystemExit('browser smoke failed: numeric keypad was hidden on quiz start')
if evaluate("document.querySelectorAll('input[data-question]').length < 2"):
    raise SystemExit('browser smoke failed: quiz did not render multiple answer inputs')
evaluate("document.querySelectorAll('input[data-question]')[1].click(); document.getElementById('close-keypad').click()")
if not evaluate("document.getElementById('number-pad').classList.contains('hidden')"):
    raise SystemExit('browser smoke failed: numeric keypad close action did not hide it')
evaluate("document.querySelectorAll('input[data-question]')[1].click()")
if evaluate("document.getElementById('number-pad').classList.contains('hidden')"):
    raise SystemExit('browser smoke failed: clicking a non-first answer did not reopen the keypad')
evaluate("window.location.href = 'study.html'")
time.sleep(2)
if evaluate("document.querySelectorAll('#study-table .study-equation').length") != 9:
    raise SystemExit('browser smoke failed: vanilla study table did not render 9 equations')
if evaluate("document.querySelectorAll('#study-factor-buttons [data-factor]').length") != 8:
    raise SystemExit('browser smoke failed: vanilla study factor buttons did not render')
if evaluate("document.querySelectorAll('#study-table [data-play-question]').length") != 9:
    raise SystemExit('browser smoke failed: vanilla study question controls did not render')
if evaluate("document.querySelectorAll('#study-table [data-play-factor], #study-table [data-toggle-playback], #study-table [data-play-all], #study-table [data-auto-play]').length") != 3:
    raise SystemExit('browser smoke failed: vanilla study playback controls did not render')
if evaluate("document.getElementById('open-settings').click(); document.querySelectorAll('[data-voice-choice]').length") != 2:
    raise SystemExit('browser smoke failed: vanilla settings voice choices did not render')
print('browser smoke passed')
ws.close()
PY
