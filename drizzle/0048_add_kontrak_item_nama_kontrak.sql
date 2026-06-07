ALTER TABLE kontrak_item ADD COLUMN IF NOT EXISTS nama_kontrak text;

UPDATE kontrak_item ki
SET nama_kontrak = k.nama
FROM kontrak k
WHERE k.id = ki.kontrak_id
  AND ki.nama_kontrak IS NULL;
