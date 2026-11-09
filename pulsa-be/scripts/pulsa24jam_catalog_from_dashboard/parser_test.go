package main

import (
	"strings"
	"testing"
)

const sample = `Total Produk Aktif
3
Produk Dengan Harga Tetap
2
BPJS
BPJS Kesehatan
SKU
Keterangan
Harga
BPJS
BPJS KESEHATAN
PPOB
FIXED
Rp 2.600
BPJS Ketenagakerjaan
SKU
Keterangan
Harga
BPJSTK
BPJS TENAGA KERJA
PPOB
FIXED
Rp 2.100
E-Money
SHOPEEPAY
SKU
Keterangan
Harga
SHOPEE
Shopeepay Bebas Nominal
BEBAS NOMINAL
OPEN_AMOUNT
+ Rp 1.000`

func TestParseDashboardPreservesProviderFields(t *testing.T) {
	rows, err := parseDashboardProducts(strings.Split(sample, "\n"))
	if err != nil {
		t.Fatal(err)
	}
	if rows[0].Category != "BPJS" || rows[0].GroupName != "PPOB" || rows[0].Price != 2600 {
		t.Fatalf("incorrect fixed row: %+v", rows[0])
	}
	if rows[1].Category != "BPJS" || rows[1].Brand != "BPJS Ketenagakerjaan" {
		t.Fatalf("incorrect repeated category: %+v", rows[1])
	}
	if rows[2].PriceType != "OPEN_AMOUNT" || rows[2].Price != 1000 || rows[2].Brand != "SHOPEEPAY" {
		t.Fatalf("incorrect open row: %+v", rows[2])
	}
}

func TestParseDashboardRejectsIncompleteOrAmbiguousInput(t *testing.T) {
	for name, input := range map[string]string{
		"count":     strings.Replace(sample, "3\n", "4\n", 1),
		"duplicate": strings.Replace(sample, "\nBPJSTK\n", "\nBPJS\n", 1),
		"price":     strings.Replace(sample, "Rp 2.600", "Rp 2.60", 1),
		"truncated": strings.TrimSuffix(sample, "+ Rp 1.000"),
		"type":      strings.Replace(sample, "FIXED", "UNKNOWN", 1),
		"fee":       strings.Replace(sample, "+ Rp 1.000", "Rp 1.000", 1),
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := parseDashboardProducts(strings.Split(input, "\n")); err == nil {
				t.Fatal("expected error")
			}
		})
	}
}

func TestParseMaximumAndZeroFee(t *testing.T) {
	input := strings.Replace(sample, "OPEN_AMOUNT\n", "OPEN_AMOUNT \u2022 Maks 1.000.000\n", 1)
	input = strings.Replace(input, "+ Rp 1.000", "+ Rp 0", 1)
	rows, err := parseDashboardProducts(strings.Split(input, "\n"))
	if err != nil {
		t.Fatal(err)
	}
	if rows[2].MaximumNominal != "1000000" || rows[2].Price != 0 {
		t.Fatal(rows[2])
	}
}

func TestPreservesSpacesInProviderSKU(t *testing.T) {
	input := strings.Replace(sample, "\nBPJSTK\n", "\nDB COMMONWEALTH\n", 1)
	rows, err := parseDashboardProducts(strings.Split(input, "\n"))
	if err != nil || rows[1].SKU != "DB COMMONWEALTH" {
		t.Fatalf("provider SKU must remain unchanged: %v, %+v", err, rows)
	}
}
