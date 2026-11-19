"""Turns an order into the numeric features the ETA model sees.

Shared by the simulator, the trainer and the prediction server, so the model
is always fed features built exactly the way it was trained on. Menu items
are bucketed into prep classes from their category and name, because the
backend only knows a dish's name and (optional) category, and the demo's
seeded dishes have no category at all.
"""

import re

PREP_CLASSES = [
    "packaged",
    "cold_drink",
    "hot_drink",
    "dessert",
    "snack",
    "roll",
    "sandwich_burger",
    "main",
    "tandoor",
]

# Checked in this order; the first class with a matching keyword wins, so the
# more specific rules come first: "spring roll" is a snack, not a roll; a
# "Paneer Tikka Sandwich" is a sandwich, not tandoor; "Hot Chocolate" is hot.
# Keywords match at the start of a word only, so "lassi" doesn't fire on
# "classic" or "cola" on "chocolate", while plurals ("rolls") still match.
# The dish name is checked before its category, so "Pasta" filed under
# "Crispy Snacks" still counts as a main. Anything unmatched is a snack.
_RULES = [
    ("packaged", ["packaged", "bottled", "mineral water"]),
    ("dessert", ["cream roll", "swiss roll"]),
    ("snack", ["spring roll", "cigar roll", "dimsum", "momo", "fries", "nachos", "samosa", "pakora",
               "soup", "sweet corn", "wedges", "crispy corn"]),
    ("roll", ["roll", "wrap", "kathi", "frankie", "shawarma"]),
    ("sandwich_burger", ["sandwich", "burger", "sub", "toast", "panini", "hot dog"]),
    ("tandoor", ["tandoor", "tikka", "kebab", "seekh", "malai chaap", "afghani"]),
    ("hot_drink", ["hot chocolate", "hot coffee", "hot beverage", "chai", "tea", "cappuccino", "latte",
                   "espresso", "americano", "mocha"]),
    ("cold_drink", ["cold", "shake", "soda", "lime", "juice", "smoothie", "lassi", "mojito", "cooler",
                    "iced", "frappe", "lemonade", "milkshake", "cola", "slush", "beverage"]),
    ("hot_drink", ["coffee"]),
    ("dessert", ["cake", "cupcake", "brownie", "ice cream", "dessert", "sweet", "gulab", "pastry",
                 "muffin", "cookie", "sundae", "truffle", "donut", "waffle"]),
    ("main", ["rice", "biryani", "thali", "combo", "meal", "noodle", "chowmein", "hakka", "paratha",
              "parantha", "naan", "roti", "curry", "dal", "paneer", "pasta", "pizza", "dosa", "idli",
              "uttapam", "vada", "manchurian", "gravy", "maggi", "chole", "rajma", "khichdi", "pulao",
              "omelette", "egg", "main course"]),
]

_PATTERNS = [(klass, re.compile(r"\b(?:" + "|".join(map(re.escape, keywords)) + ")")) for klass, keywords in _RULES]


def _match(text):
    for klass, pattern in _PATTERNS:
        if pattern.search(text):
            return klass
    return None


def prep_class(name, category=""):
    """The prep class of one dish: from its name if that says enough, else
    from its category, else a snack."""
    return _match((name or "").lower()) or _match((category or "").lower()) or "snack"


FEATURE_NAMES = (
    [f"qty_{klass}" for klass in PREP_CLASSES]
    + ["lines", "total_qty", "hour", "rush_hour", "weekday", "weekend", "orders_ahead", "slot_load"]
)


def is_rush(hour):
    """Lunch (12-14) and dinner (19-21) rushes on campus."""
    return 12 <= hour < 14 or 19 <= hour < 21


def order_features(items, hour, weekday, orders_ahead, slot_load):
    """One order as a feature row, in FEATURE_NAMES order.

    items: [{"name": str, "category": str | None, "quantity": int}, ...]
    hour: 0-23, campus time. weekday: 0 = Monday ... 6 = Sunday.
    orders_ahead: unfinished orders at the stall before this one.
    slot_load: orders already booked in the chosen 15-minute slot.
    """
    per_class = dict.fromkeys(PREP_CLASSES, 0)
    total = 0
    for item in items:
        quantity = int(item["quantity"])
        per_class[prep_class(item.get("name"), item.get("category"))] += quantity
        total += quantity
    return (
        [per_class[klass] for klass in PREP_CLASSES]
        + [len(items), total, hour, int(is_rush(hour)), weekday, int(weekday >= 5), orders_ahead, slot_load]
    )
