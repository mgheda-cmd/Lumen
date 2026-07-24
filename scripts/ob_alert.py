#!/usr/bin/env python3
"""Surveille les Order Blocks sur Binance et envoie une notification ntfy.

Lancé par GitHub Actions toutes les 5 minutes. L'état des alertes déjà
envoyées est conservé dans alerts-state.json pour éviter les doublons.
"""
import json, os, sys, urllib.request, urllib.parse

TOPIC   = os.environ.get("NTFY_TOPIC", "").strip()
SYMBOLS = [s.strip().upper() for s in os.environ.get("SYMBOLS", "BTCUSDT").split(",") if s.strip()]
TFS     = [("5m", "5m"), ("15m", "15m"), ("1h", "1H")]
STATE   = "alerts-state.json"
PIVOT   = 5
LOOKBACK = 10


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "lumen-bot"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def klines(symbol, interval, limit=300):
    url = ("https://fapi.binance.com/fapi/v1/klines"
           f"?symbol={symbol}&interval={interval}&limit={limit}")
    return [{"t": int(k[0]), "o": float(k[1]), "h": float(k[2]),
             "l": float(k[3]), "c": float(k[4])} for k in get(url)]


def pivots(bars, L):
    highs, lows = [], []
    for i in range(L, len(bars) - L):
        if all(bars[i]["h"] >= bars[i + d]["h"] for d in range(-L, L + 1)):
            highs.append(i)
        if all(bars[i]["l"] <= bars[i + d]["l"] for d in range(-L, L + 1)):
            lows.append(i)
    return highs, lows


def order_blocks(bars):
    """Dernière bougie opposée avant une cassure de structure."""
    ph, pl = pivots(bars, PIVOT)
    out = []
    last_h = last_l = None
    hp = lp = 0
    for i in range(1, len(bars)):
        while hp < len(ph) and ph[hp] + PIVOT <= i:
            last_h = bars[ph[hp]]["h"]; hp += 1
        while lp < len(pl) and pl[lp] + PIVOT <= i:
            last_l = bars[pl[lp]]["l"]; lp += 1
        if last_h is not None and bars[i]["c"] > last_h:
            for j in range(i - 1, max(i - LOOKBACK - 1, 0), -1):
                if bars[j]["c"] < bars[j]["o"]:
                    out.append({"type": "bull", "t": bars[j]["t"], "brk": bars[i]["t"],
                                "top": bars[j]["h"], "bot": bars[j]["l"]})
                    break
            last_h = None
        elif last_l is not None and bars[i]["c"] < last_l:
            for j in range(i - 1, max(i - LOOKBACK - 1, 0), -1):
                if bars[j]["c"] > bars[j]["o"]:
                    out.append({"type": "bear", "t": bars[j]["t"], "brk": bars[i]["t"],
                                "top": bars[j]["h"], "bot": bars[j]["l"]})
                    break
            last_l = None
    return out


def notify(title, body, tags):
    data = body.encode("utf-8")
    req = urllib.request.Request("https://ntfy.sh/" + TOPIC, data=data, method="POST")
    req.add_header("Title", title)
    req.add_header("Tags", tags)
    req.add_header("Priority", "default")
    with urllib.request.urlopen(req, timeout=20) as r:
        r.read()


def main():
    if not TOPIC:
        print("NTFY_TOPIC absent : rien à faire.")
        return 0

    try:
        with open(STATE) as f:
            state = json.load(f)
    except Exception:
        state = {}
    sent = set(state.get("sent", []))
    first_run = not sent

    new_ids, messages = [], []
    for sym in SYMBOLS:
        for interval, label in TFS:
            try:
                bars = klines(sym, interval)
            except Exception as e:
                print(f"{sym} {interval} : échec ({e})")
                continue
            if len(bars) < 60:
                continue
            # on ignore la bougie en cours : seules les clôtures comptent
            closed = bars[:-1]
            obs = order_blocks(closed)
            if not obs:
                continue
            last = obs[-1]
            # ne signaler que si la cassure vient de se produire
            recent = closed[-3:]
            if last["brk"] < recent[0]["t"]:
                continue
            oid = f"{sym}|{label}|{last['type']}|{last['t']}"
            if oid in sent:
                continue
            new_ids.append(oid)
            sens = "achat" if last["type"] == "bull" else "vente"
            mid = (last["top"] + last["bot"]) / 2
            messages.append((f"Order Block {sens} · {label}",
                             f"{sym} — zone {last['bot']:.2f} / {last['top']:.2f} "
                             f"(milieu {mid:.2f})",
                             "green_circle" if last["type"] == "bull" else "red_circle"))

    sent.update(new_ids)
    state["sent"] = sorted(sent)[-500:]
    with open(STATE, "w") as f:
        json.dump(state, f, indent=1)

    if first_run:
        print(f"Première exécution : {len(new_ids)} évènements mémorisés sans alerte.")
        return 0

    for title, body, tag in messages:
        try:
            notify(title, body, tag)
            print("Notifié :", title, "|", body)
        except Exception as e:
            print("Échec d'envoi :", e)

    if not messages:
        print("Aucune nouvelle Order Block.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
