ALTER TABLE kontrak_item ALTER COLUMN ppn_include SET DEFAULT false;
UPDATE kontrak_item SET ppn_include = false WHERE ppn_include IS NULL OR ppn_include = true;
UPDATE kontrak_item SET nama_kontrak = k.nama FROM kontrak k WHERE k.id = kontrak_item.kontrak_id AND kontrak_item.nama_kontrak IS NULL;
