package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type productRow struct {
	Category       string
	Brand          string
	SKU            string
	Name           string
	GroupName      string
	PriceType      string
	Price          int64
	MaximumNominal string
}

func main() {
	log.SetFlags(0)
	if len(os.Args) != 3 {
		log.Fatal("usage: go run ./scripts/pulsa24jam_catalog_from_dashboard <pasted-text.txt> <output.sql>")
	}

	inputPath := filepath.Clean(os.Args[1])
	outputPath := filepath.Clean(os.Args[2])

	lines, err := readLines(inputPath)
	if err != nil {
		log.Fatalf("read %s: %v", inputPath, err)
	}

	products, err := parseDashboardProducts(lines)
	if err != nil {
		log.Fatal(err)
	}
	if len(products) == 0 {
		log.Fatal("no Pulsa24Jam products parsed")
	}

	if err := writeMigration(outputPath, products); err != nil {
		log.Fatalf("write %s: %v", outputPath, err)
	}
	input, err := os.ReadFile(inputPath)
	if err != nil {
		log.Fatal(err)
	}
	report, err := json.MarshalIndent(struct {
		SourceSHA256 string
		Products     []productRow
	}{fmt.Sprintf("%x", sha256.Sum256(input)), products}, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	if err := os.WriteFile(outputPath+".json", report, 0644); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Generated %s with %d Pulsa24Jam products\n", outputPath, len(products))
}

func readLines(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 1024), 1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			lines = append(lines, line)
		}
	}
	return lines, scanner.Err()
}

func writeMigration(path string, products []productRow) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	w := bufio.NewWriterSize(file, 1024*1024)

	fmt.Fprintln(w, "-- Generated from Pulsa24Jam H2HR dashboard export.")
	fmt.Fprintln(w, "-- Re-run safe: refreshes the app catalog so active retail products are Pulsa24Jam H2HR only.")
	fmt.Fprintln(w, "BEGIN;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS special_code TEXT;")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'normal';")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS minimal_nominal BIGINT NULL;")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS maksimal_nominal BIGINT NULL;")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS fee_rp BIGINT NOT NULL DEFAULT 0;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "DO $$")
	fmt.Fprintln(w, "BEGIN")
	fmt.Fprintln(w, "  IF NOT EXISTS (")
	fmt.Fprintln(w, "    SELECT 1 FROM pg_constraint")
	fmt.Fprintln(w, "    WHERE conname = 'uq_produk_provider_map_produk_provider_kode'")
	fmt.Fprintln(w, "      AND conrelid = 'public.produk_provider_map'::regclass")
	fmt.Fprintln(w, "  ) THEN")
	fmt.Fprintln(w, "    ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "      ADD CONSTRAINT uq_produk_provider_map_produk_provider_kode")
	fmt.Fprintln(w, "      UNIQUE (produk_id, provider, kode_provider);")
	fmt.Fprintln(w, "  END IF;")
	fmt.Fprintln(w, "END $$;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "CREATE TEMP TABLE p24_h2hr_seed (")
	fmt.Fprintln(w, "  category_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  brand_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  sku TEXT PRIMARY KEY,")
	fmt.Fprintln(w, "  product_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  group_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  price_type TEXT NOT NULL,")
	fmt.Fprintln(w, "  price BIGINT NOT NULL,")
	fmt.Fprintln(w, "  maximum_nominal BIGINT NULL")
	fmt.Fprintln(w, ") ON COMMIT DROP;")

	for start := 0; start < len(products); start += 500 {
		end := start + 500
		if end > len(products) {
			end = len(products)
		}
		fmt.Fprintln(w, "")
		fmt.Fprintln(w, "INSERT INTO p24_h2hr_seed")
		fmt.Fprintln(w, "  (category_name, brand_name, sku, product_name, group_name, price_type, price, maximum_nominal)")
		fmt.Fprintln(w, "VALUES")
		for i := start; i < end; i++ {
			item := products[i]
			suffix := ","
			if i == end-1 {
				suffix = ";"
			}
			maxNominal := "NULL"
			if item.MaximumNominal != "" {
				maxNominal = item.MaximumNominal
			}
			fmt.Fprintf(
				w,
				"  (%s,%s,%s,%s,%s,%s,%d,%s)%s\n",
				sqlQuote(item.Category),
				sqlQuote(item.Brand),
				sqlQuote(item.SKU),
				sqlQuote(item.Name),
				sqlQuote(item.GroupName),
				sqlQuote(item.PriceType),
				item.Price,
				maxNominal,
				suffix,
			)
		}
	}

	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "CREATE TEMP TABLE p24_h2hr_seed_unique AS")
	fmt.Fprintln(w, "SELECT DISTINCT ON (sku)")
	fmt.Fprintln(w, "  category_name, brand_name, sku, product_name, group_name, price_type, price, maximum_nominal")
	fmt.Fprintln(w, "FROM p24_h2hr_seed")
	fmt.Fprintln(w, "ORDER BY sku;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.provider (nama, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "VALUES ('pulsa24jam', true, now(), now())")
	fmt.Fprintln(w, "ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now();")
	fmt.Fprintln(w, "UPDATE public.provider SET aktif = false, diubah_pada = now() WHERE nama <> 'pulsa24jam' AND aktif;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk_app_pricing")
	fmt.Fprintln(w, "SET aktif = false, updated_at = now(), diubah_pada = now()")
	fmt.Fprintln(w, "WHERE aktif = true;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk_provider_map")
	fmt.Fprintln(w, "SET aktif = false, diubah_pada = now()")
	fmt.Fprintln(w, "WHERE aktif = true;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk")
	fmt.Fprintln(w, "SET aktif = false, diubah_pada = now()")
	fmt.Fprintln(w, "WHERE aktif = true")
	fmt.Fprintln(w, "  AND sku NOT IN (SELECT sku FROM p24_h2hr_seed_unique);")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.kategori (nama, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT DISTINCT category_name, true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique")
	fmt.Fprintln(w, "ORDER BY category_name")
	fmt.Fprintln(w, "ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.brand (nama, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT DISTINCT brand_name, true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique")
	fmt.Fprintln(w, "ORDER BY brand_name")
	fmt.Fprintln(w, "ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.kategori_fee_app")
	fmt.Fprintln(w, "  (kategori_id, fee_master, fee_agent, fee_user, fee_non_user, aktif, created_at, updated_at)")
	fmt.Fprintln(w, "SELECT DISTINCT k.id, 0, 0, 0, 0, true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN LATERAL (")
	fmt.Fprintln(w, "  SELECT id FROM public.kategori")
	fmt.Fprintln(w, "  WHERE nama = seed.category_name")
	fmt.Fprintln(w, "  ORDER BY id LIMIT 1")
	fmt.Fprintln(w, ") k ON true")
	fmt.Fprintln(w, "ON CONFLICT (kategori_id) DO UPDATE SET aktif = true, updated_at = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.produk")
	fmt.Fprintln(w, "  (sku, nama, group_name, kategori_id, brand_id, tipe_harga, nominal, maksimal_nominal, jam_buka, jam_tutup, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT seed.sku, seed.product_name, seed.group_name, k.id, b.id, seed.price_type,")
	fmt.Fprintln(w, "       NULL,")
	fmt.Fprintln(w, "       seed.maximum_nominal, '00:00', '23:59', true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN LATERAL (")
	fmt.Fprintln(w, "  SELECT id FROM public.kategori")
	fmt.Fprintln(w, "  WHERE nama = seed.category_name")
	fmt.Fprintln(w, "  ORDER BY id LIMIT 1")
	fmt.Fprintln(w, ") k ON true")
	fmt.Fprintln(w, "JOIN LATERAL (")
	fmt.Fprintln(w, "  SELECT id FROM public.brand")
	fmt.Fprintln(w, "  WHERE nama = seed.brand_name")
	fmt.Fprintln(w, "  ORDER BY id LIMIT 1")
	fmt.Fprintln(w, ") b ON true")
	fmt.Fprintln(w, "ON CONFLICT (sku) DO UPDATE SET")
	fmt.Fprintln(w, "  nama = EXCLUDED.nama,")
	fmt.Fprintln(w, "  group_name = EXCLUDED.group_name,")
	fmt.Fprintln(w, "  kategori_id = EXCLUDED.kategori_id,")
	fmt.Fprintln(w, "  brand_id = EXCLUDED.brand_id,")
	fmt.Fprintln(w, "  tipe_harga = EXCLUDED.tipe_harga,")
	fmt.Fprintln(w, "  nominal = EXCLUDED.nominal,")
	fmt.Fprintln(w, "  maksimal_nominal = EXCLUDED.maksimal_nominal,")
	fmt.Fprintln(w, "  jam_buka = EXCLUDED.jam_buka,")
	fmt.Fprintln(w, "  jam_tutup = EXCLUDED.jam_tutup,")
	fmt.Fprintln(w, "  aktif = true,")
	fmt.Fprintln(w, "  diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.produk_app_pricing")
	fmt.Fprintln(w, "  (produk_id, provider, harga, harga_dasar, yuscom_group, yuscom_category, yuscom_sku, yuscom_name, yuscom_status, yuscom_display_brand, aktif, fetched_at, created_at, updated_at, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT p.id, 'pulsa24jam', seed.price, seed.price, seed.group_name, seed.category_name, seed.sku, seed.product_name, 'ACTIVE', seed.brand_name, true, now(), now(), now(), now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN public.produk p ON p.sku = seed.sku")
	fmt.Fprintln(w, "ON CONFLICT (produk_id) DO UPDATE SET")
	fmt.Fprintln(w, "  provider = 'pulsa24jam',")
	fmt.Fprintln(w, "  harga = EXCLUDED.harga,")
	fmt.Fprintln(w, "  harga_dasar = EXCLUDED.harga_dasar,")
	fmt.Fprintln(w, "  yuscom_group = EXCLUDED.yuscom_group,")
	fmt.Fprintln(w, "  yuscom_category = EXCLUDED.yuscom_category,")
	fmt.Fprintln(w, "  yuscom_sku = EXCLUDED.yuscom_sku,")
	fmt.Fprintln(w, "  yuscom_name = EXCLUDED.yuscom_name,")
	fmt.Fprintln(w, "  yuscom_status = 'ACTIVE',")
	fmt.Fprintln(w, "  yuscom_display_brand = EXCLUDED.yuscom_display_brand,")
	fmt.Fprintln(w, "  aktif = true,")
	fmt.Fprintln(w, "  fetched_at = now(),")
	fmt.Fprintln(w, "  updated_at = now(),")
	fmt.Fprintln(w, "  diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.produk_provider_map")
	fmt.Fprintln(w, "  (produk_id, provider, kode_provider, mode, aktif, prioritas, minimal_nominal, maksimal_nominal, fee_rp, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT p.id, 'pulsa24jam', seed.sku, 'normal', true, 1,")
	fmt.Fprintln(w, "       NULL,")
	fmt.Fprintln(w, "       seed.maximum_nominal, 0, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN public.produk p ON p.sku = seed.sku")
	fmt.Fprintln(w, "ON CONFLICT (produk_id, provider, kode_provider) DO UPDATE SET")
	fmt.Fprintln(w, "  mode = 'normal',")
	fmt.Fprintln(w, "  aktif = true,")
	fmt.Fprintln(w, "  prioritas = 1,")
	fmt.Fprintln(w, "  minimal_nominal = EXCLUDED.minimal_nominal,")
	fmt.Fprintln(w, "  maksimal_nominal = EXCLUDED.maksimal_nominal,")
	fmt.Fprintln(w, "  fee_rp = 0,")
	fmt.Fprintln(w, "  diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.kategori SET aktif = false, diubah_pada = now() WHERE aktif AND nama NOT IN (SELECT category_name FROM p24_h2hr_seed);")
	fmt.Fprintln(w, "UPDATE public.brand SET aktif = false, diubah_pada = now() WHERE aktif AND nama NOT IN (SELECT brand_name FROM p24_h2hr_seed);")
	fmt.Fprintln(w, `DO $$ BEGIN
  IF (SELECT count(*) FROM public.produk WHERE aktif) <> (SELECT count(*) FROM p24_h2hr_seed)
    OR (SELECT count(*) FROM public.produk_provider_map WHERE aktif) <> (SELECT count(*) FROM p24_h2hr_seed)
    OR EXISTS (
      SELECT 1 FROM p24_h2hr_seed s
      LEFT JOIN public.produk p ON p.sku = s.sku
      LEFT JOIN public.kategori k ON k.id = p.kategori_id
      LEFT JOIN public.brand b ON b.id = p.brand_id
      LEFT JOIN public.produk_app_pricing a ON a.produk_id = p.id AND a.aktif
      LEFT JOIN public.produk_provider_map m ON m.produk_id = p.id AND m.aktif
      WHERE p.aktif IS DISTINCT FROM true OR p.nama IS DISTINCT FROM s.product_name
        OR p.group_name IS DISTINCT FROM s.group_name
        OR p.tipe_harga::text IS DISTINCT FROM s.price_type
        OR k.nama IS DISTINCT FROM s.category_name OR b.nama IS DISTINCT FROM s.brand_name
        OR a.provider IS DISTINCT FROM 'pulsa24jam' OR a.harga IS DISTINCT FROM s.price
        OR a.harga_dasar IS DISTINCT FROM s.price
        OR m.provider IS DISTINCT FROM 'pulsa24jam' OR m.kode_provider IS DISTINCT FROM s.sku
        OR p.maksimal_nominal IS DISTINCT FROM s.maximum_nominal
    ) THEN RAISE EXCEPTION 'Catalog does not match source; import rolled back';
  END IF;
END $$;`)
	fmt.Fprintln(w, "COMMIT;")
	if err := w.Flush(); err != nil {
		return err
	}
	return file.Close()
}

func sqlQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}
