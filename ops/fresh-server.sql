\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public') THEN
    RAISE EXCEPTION 'Fresh installation requires an empty public schema';
  END IF;
END $$;

\ir ../pulsa-be/sql/00000000_local_bootstrap_full_schema.sql

-- The inferred baseline contains legacy catalogue defaults, not live P24 data.
DELETE FROM public.provider;
DELETE FROM public.brand;
DELETE FROM public.kategori;

\ir ../pulsa-be/sql/20260330_alter_produk_provider_map_add_open_amount_limits.sql
\ir ../pulsa-be/sql/20260401_alter_transaksi_provider_add_route_candidate.sql
\ir ../pulsa-be/sql/20260406_add_transaksi_provider_status.sql
\ir ../pulsa-be/sql/20260424_alter_produk_provider_map_add_mode.sql
\ir ../pulsa-be/sql/20260505_deposit_ticket_status.sql
-- No concurrent indexes or nested COMMIT statements in this atomic bootstrap.
ALTER TABLE public.mutasi_bank
  ADD COLUMN IF NOT EXISTS waktu_mutasi_bank TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pengirim TEXT,
  ADD COLUMN IF NOT EXISTS penerima TEXT;
CREATE INDEX mutasi_bank_bank_waktu_mutasi_idx
  ON public.mutasi_bank (bank_id, waktu_mutasi_bank DESC, id DESC)
  WHERE waktu_mutasi_bank IS NOT NULL;
CREATE INDEX mutasi_bank_bank_identity_idx
  ON public.mutasi_bank (bank_id, arah, jumlah, waktu_mutasi_bank)
  WHERE waktu_mutasi_bank IS NOT NULL;
\ir ../pulsa-be/sql/20260603_allow_negative_kategori_fee_app.sql
\ir ../pulsa-be/sql/20260605_allow_negative_app_order_fee.sql
\ir ../pulsa-be/sql/20260715_add_produk_app_pricing_compat_columns.sql
-- Baseline already has the current ads/retail columns; their legacy data
-- conversion migrations reference columns that never exist on a fresh DB.
CREATE INDEX idx_app_ads_active_urutan ON public.app_ads (aktif, urutan, id DESC);
\ir ../pulsa-be/sql/20260716_add_member_oauth_sub_columns.sql
\ir ../pulsa-be/sql/20260717_fix_app_order_guest_refund_schema.sql
\ir ../pulsa-be/sql/20260718_fix_internal_finance_schema.sql
\ir ../pulsa-be/sql/20260718_fix_local_schema_compat.sql
\ir ../pulsa-be/sql/20260718_fix_provider_rekening_schema.sql
\ir ../pulsa-be/sql/20260724_add_member_phone.sql
\ir ../pulsa-be/sql/20260724_create_agent_credit_schema.sql
\ir ../pulsa-be/sql/20260727_add_agent_credit_analyst_workflow.sql
\ir ../pulsa-be/sql/20260729_add_member_profile_photo.sql
\ir ../pulsa-be/sql/20260801_update_agent_credit_level_limits.sql
\ir ../pulsa-be/sql/20260804_agent_credit_available_balance.sql
\ir ../pulsa-be/sql/20260804_reduce_agent_credit_levels.sql
\ir ../pulsa-be/sql/20260806_align_agent_credit_workflow.sql
\ir ../pulsa-be/sql/20260808_agent_credit_wallet_transfer.sql
\ir ../pulsa-be/sql/20260808_retail_withdraw_funding_source.sql
\ir ../pulsa-be/sql/20260820_agent_credit_single_main_balance.sql
\ir ../pulsa-be/sql/20260821_add_marketing_agent_relation.sql
\ir ../pulsa-be/sql/20260821_enforce_single_agent_balance.sql
\ir ../pulsa-be/sql/20260824_agent_credit_flexible_limit.sql
\ir ../pulsa-be/sql/20260828_add_member_store_name.sql
\ir ../pulsa-be/sql/20261007_add_member_phone_column.sql
\ir ../pulsa-be/sql/20261007_fix_provider_map_schema_compat.sql
\ir ../pulsa-be/sql/20260601_provider_wallet_refund_on_failed.sql
-- Replace the empty inferred guard table with the canonical trigger schema.
DROP TABLE public.provider_failed_then_success_guard;
\ir ../pulsa-be/sql/20260608_provider_failed_then_success_guard.sql
\ir ../pulsa-be/sql/20260624_remove_provider_wallet_auto_align.sql

-- Credit facilities require explicit business configuration after installation.
DELETE FROM public.agent_credit_rank;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE TABLE public.bayarivo_installation (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mode TEXT NOT NULL CHECK (mode = 'fresh')
);
INSERT INTO public.bayarivo_installation (id, mode) VALUES (1, 'fresh');
COMMIT;
