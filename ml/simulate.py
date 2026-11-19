"""Generates SIMULATED MealDeck orders with a preparation time for each.

MealDeck has almost no real order history yet, so this builds a training
set from the real menus (menu/*.csv) and a hand-written model of a campus
kitchen. The prep times come from the formula in `prep_minutes` below, plus
noise. A model trained on this data learns that formula, not real kitchens:
its accuracy says how well it recovers the simulator, and nothing more.

Usage:
    python3 ml/simulate.py                         # menus from ./menu, 2000 orders
    python3 ml/simulate.py --menu-dir ../Mealdeck-sem3/menu --orders 3000
"""

import argparse
import csv
import json
import math
import os
import random
from pathlib import Path

from features import FEATURE_NAMES, is_rush, order_features, prep_class

ROOT = Path(__file__).resolve().parent

# Minutes one portion takes, per prep class. The "truth" of the simulation.
BASE_MINUTES = {
    "packaged": 0.5,
    "cold_drink": 2.5,
    "hot_drink": 3.0,
    "dessert": 2.0,
    "snack": 6.0,
    "roll": 7.0,
    "sandwich_burger": 6.5,
    "main": 10.0,
    "tandoor": 15.0,
}

# How likely an order is to be for each hour the stalls are open (8-22).
HOUR_WEIGHTS = {8: 3, 9: 5, 10: 6, 11: 7, 12: 12, 13: 13, 14: 7, 15: 5, 16: 6,
                17: 7, 18: 6, 19: 9, 20: 8, 21: 4}


def load_menu(menu_dir):
    """Every dish in every CSV, grouped by stall."""
    stalls = {}
    for path in sorted(Path(menu_dir).glob("*.csv")):
        with open(path, encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                stalls.setdefault(row["stall"], []).append({"name": row["name"], "category": row["category"]})
    if not stalls:
        raise SystemExit(f"No menu CSVs in {menu_dir}")
    return stalls


def prep_minutes(items, hour, weekday, orders_ahead, slot_load, rng):
    """The simulated time from placing an order to it being ready.

    The longest dish sets the pace; other dishes add 30% of their time
    (one cook, some parallel work). Extra portions of a dish add 45% each
    (batch cooking). Every order ahead in the queue adds time, rushes slow the
    kitchen by 20%, weekends are a little quieter, and about 4% of orders hit
    a mishap (a dropped tray, a gas refill) that adds 4-12 minutes.
    """
    times = sorted(
        (BASE_MINUTES[prep_class(item["name"], item["category"])] * (1 + 0.45 * (item["quantity"] - 1))
         for item in items),
        reverse=True,
    )
    kitchen = times[0] + 0.3 * sum(times[1:])
    kitchen *= 1.2 if is_rush(hour) else 1.0
    kitchen *= 0.92 if weekday >= 5 else 1.0
    queue = 1.8 * orders_ahead ** 0.9
    minutes = (kitchen + queue + 0.25 * slot_load + 1.5) * math.exp(rng.gauss(0, 0.12))
    if rng.random() < 0.04:
        minutes += rng.uniform(4, 12)
    return round(minutes, 1)


def poisson(rng, lam):
    """Knuth's method; fine for the small rates used here."""
    limit, count, product = math.exp(-lam), 0, rng.random()
    while product > limit:
        count += 1
        product *= rng.random()
    return count


def simulate(stalls, n_orders, seed):
    rng = random.Random(seed)
    names = list(stalls)
    hours, weights = zip(*HOUR_WEIGHTS.items())
    rows = []
    for _ in range(n_orders):
        menu = stalls[rng.choice(names)]
        hour = rng.choices(hours, weights)[0]
        weekday = rng.randrange(7)
        lines = rng.choices([1, 2, 3, 4], [55, 28, 12, 5])[0]
        items = [
            {**dish, "quantity": rng.choices([1, 2, 3], [75, 20, 5])[0]}
            for dish in rng.sample(menu, min(lines, len(menu)))
        ]
        busy = (5.0 if is_rush(hour) else 1.5) * (0.6 if weekday >= 5 else 1.0)
        orders_ahead = poisson(rng, busy)
        slot_load = min(15, poisson(rng, busy * 0.8))
        rows.append({
            "features": order_features(items, hour, weekday, orders_ahead, slot_load),
            "prep_minutes": prep_minutes(items, hour, weekday, orders_ahead, slot_load, rng),
            "items": items,
        })
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--menu-dir", default=str(ROOT.parent / "menu"))
    parser.add_argument("--orders", type=int, default=2000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", default=str(ROOT / "data" / "simulated_orders.csv"))
    args = parser.parse_args()

    stalls = load_menu(args.menu_dir)
    rows = simulate(stalls, args.orders, args.seed)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(FEATURE_NAMES + ["prep_minutes", "items_json"])
        for row in rows:
            writer.writerow(row["features"] + [row["prep_minutes"], json.dumps(row["items"])])

    minutes = sorted(row["prep_minutes"] for row in rows)
    dishes = sum(len(menu) for menu in stalls.values())
    print(f"SIMULATED {len(rows)} orders from {len(stalls)} stalls ({dishes} dishes) -> {args.out}")
    print(f"prep minutes: min {minutes[0]}, median {minutes[len(minutes) // 2]}, max {minutes[-1]}")


if __name__ == "__main__":
    main()
