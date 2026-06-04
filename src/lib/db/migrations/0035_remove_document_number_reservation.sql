-- Migration: 0035_remove_document_number_reservation.sql
-- Drops the document number reservation system (replaced by global counter in 0034)

DROP VIEW IF EXISTS expired_reservations;

DROP FUNCTION IF EXISTS cleanup_expired_reservations();
DROP FUNCTION IF EXISTS use_reserved_number(uuid, uuid);
DROP FUNCTION IF EXISTS reserve_document_number(text, text, text, uuid, text, int);

DROP INDEX IF EXISTS idx_reservation_expires;
DROP INDEX IF EXISTS idx_reservation_user;
DROP INDEX IF EXISTS idx_reservation_kode;

DROP TABLE IF EXISTS document_number_reservation;
