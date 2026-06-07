import csv, json

# --- 1. Parse DB data ---
with open('/tmp/db_prices.json') as f:
    data = json.load(f)

# Build per-kode mapping {kode: {kontrak_ke: harga}}
db_map = {}
for item in data:
    kode = item['kode']
    ke = item['kontrak_ke']
    harga = item['harga']
    if kode not in db_map:
        db_map[kode] = {}
    db_map[kode][ke] = harga

print(f"DB items loaded: {len(db_map)} unique kode_barang")

# --- 2. Parse CSV ---
rows = []
with open('penawaran-kontrak-BJS/304-item-barang.csv', newline='') as f:
    reader = csv.DictReader(f)
    price_col = [k for k in reader.fieldnames if 'PENAWARAN' in k][0]
    print(f"Price column: {repr(price_col)}")
    for r in reader:
        r['_price_raw'] = r[price_col]
        rows.append(r)

print(f"CSV rows: {len(rows)}")

def parse_price(s):
    if not s:
        return None
    s = s.strip()
    if not s:
        return None
    s = s.replace('Rp', '').replace('rp', '').replace('Rp.', '').strip()
    s = s.replace(',', '').replace('.', '')
    try:
        return int(s)
    except ValueError:
        return None

def fmt_price(val):
    if val is None or val == '':
        return ''
    return f"Rp {val:,}".replace(',', '.')

# --- 3. Build new CSV ---
new_rows = []
strat_counts = {'CARRY_FORWARD': 0, 'PRICE_UP': 0, 'PRICE_DOWN': 0, 'NEW_ITEM': 0, 'NO_PRICE': 0}

for r in rows:
    code = r['Material Number'].strip()
    h1 = db_map.get(code, {}).get(1, '')
    h2 = db_map.get(code, {}).get(2, '')
    h3 = db_map.get(code, {}).get(3, '')
    
    in_db = code in db_map
    csv_price = parse_price(r['_price_raw'])
    
    # Latest DB price (by kontrak ke)
    latest_db_price = None
    for ke in [3, 2, 1]:
        if ke in db_map.get(code, {}):
            latest_db_price = db_map[code][ke]
            break
    
    # Determine strategy and plan price
    if not in_db and csv_price is not None:
        strategy = 'NEW_ITEM'
        plan_price = csv_price
    elif not in_db and csv_price is None:
        strategy = 'NO_PRICE'
        plan_price = ''
    elif in_db and csv_price is not None and latest_db_price is not None and csv_price > latest_db_price:
        strategy = 'PRICE_UP'
        plan_price = csv_price
    elif in_db and csv_price is not None and latest_db_price is not None and csv_price < latest_db_price:
        strategy = 'PRICE_DOWN'
        plan_price = csv_price
    elif in_db and csv_price is not None and latest_db_price is not None and csv_price == latest_db_price:
        strategy = 'CARRY_FORWARD'
        plan_price = csv_price
    elif in_db and csv_price is None:
        strategy = 'CARRY_FORWARD'
        plan_price = latest_db_price
    else:
        strategy = 'CARRY_FORWARD'
        plan_price = latest_db_price if latest_db_price is not None else csv_price
    
    if plan_price is None:
        plan_price = ''
        strategy = 'NO_PRICE'
    
    strat_counts[strategy] = strat_counts.get(strategy, 0) + 1
    
    # Keterangan for specific items
    keterangan = ''
    if code == 'CLT015':
        keterangan = 'harga penawaran 450.000/roll'
    elif code == 'SNT008':
        keterangan = 'harga loncat jauh, cek harga aktual supplier'
    elif code == 'STR023':
        keterangan = 'harga turun jauh, cek harga aktual supplier'
    elif code == 'STR028':
        keterangan = 'harga turun jauh, cek harga sktual supplier'
    
    new_rows.append({
        'No': r['No'],
        'Category': r['Category'],
        'Material Number': code,
        'Detail Item': r['Detail Item'],
        'UoM': r['UoM'],
        'Harga Kontrak 1': fmt_price(h1) if h1 != '' else '',
        'Harga Kontrak 2': fmt_price(h2) if h2 != '' else '',
        'Harga Kontrak 3': fmt_price(h3) if h3 != '' else '',
        'PENAWARAN SAAT KONTRAK KE-3': r['_price_raw'].strip(),
        'Harga Planning Kontrak 4': fmt_price(plan_price) if plan_price != '' else '',
        'Strategy': strategy,
        'Keterangan': keterangan
    })

# --- 4. Write CSV ---
output_path = 'penawaran-kontrak-BJS/304-item-barang-planning-kontrak-ke4.csv'
fieldnames = [
    'No', 'Category', 'Material Number', 'Detail Item', 'UoM',
    'Harga Kontrak 1', 'Harga Kontrak 2', 'Harga Kontrak 3',
    'PENAWARAN SAAT KONTRAK KE-3',
    'Harga Planning Kontrak 4',
    'Strategy',
    'Keterangan'
]

with open(output_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(new_rows)

# --- 5. Print summary ---
print(f"\nFile saved: {output_path}")
print(f"\n=== Strategy Summary ===")
for s, count in sorted(strat_counts.items(), key=lambda x: -x[1]):
    print(f"  {s:<20} {count:>4} items")

# Category breakdown
from collections import Counter
cat_strat = {}
for r in new_rows:
    cat = r['Category']
    strat = r['Strategy']
    if cat not in cat_strat:
        cat_strat[cat] = Counter()
    cat_strat[cat][strat] += 1

print(f"\n{'Category':<18}", end='')
for s in ['CARRY_FORWARD', 'PRICE_UP', 'PRICE_DOWN', 'NEW_ITEM', 'NO_PRICE']:
    print(f" {s:<16}", end='')
print()
print('-' * 100)
for cat in ['Cleaning Tools', 'Cutleries', 'Others', 'Pantry', 'Sanitary', 'Stationeries']:
    print(f"{cat:<18}", end='')
    for s in ['CARRY_FORWARD', 'PRICE_UP', 'PRICE_DOWN', 'NEW_ITEM', 'NO_PRICE']:
        print(f" {cat_strat[cat][s]:<16}", end='')
    print()

# Price movement details
print(f"\n=== PRICE_UP Items (CSV > Latest DB) ===")
for r in new_rows:
    if r['Strategy'] == 'PRICE_UP':
        code = r['Material Number']
        for ke in [3, 2, 1]:
            if ke in db_map.get(code, {}):
                latest_db = db_map[code][ke]
                break
        csv_p = parse_price(r['PENAWARAN SAAT KONTRAK KE-3'])
        if latest_db and csv_p:
            diff = csv_p - latest_db
            print(f"  {code:>8} | DB:{latest_db:>8,} \u2192 CSV:{csv_p:>8,} (\u2191{diff:>6,}) | {r['Detail Item'][:55]}")

print(f"\n=== PRICE_DOWN Items (CSV < Latest DB) ===")
for r in new_rows:
    if r['Strategy'] == 'PRICE_DOWN':
        code = r['Material Number']
        for ke in [3, 2, 1]:
            if ke in db_map.get(code, {}):
                latest_db = db_map[code][ke]
                break
        csv_p = parse_price(r['PENAWARAN SAAT KONTRAK KE-3'])
        if latest_db and csv_p:
            diff = latest_db - csv_p
            print(f"  {code:>8} | DB:{latest_db:>8,} \u2192 CSV:{csv_p:>8,} (\u2193{diff:>6,}) | {r['Detail Item'][:55]}")
