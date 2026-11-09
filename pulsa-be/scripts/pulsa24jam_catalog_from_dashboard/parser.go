package main

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var skuPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.:/+ \-]*$`)
var amountPattern = regexp.MustCompile(`^(?:\+\s*)?Rp\s*(0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:\.[0-9]{3})+)$`)
var openTypePattern = regexp.MustCompile(`^OPEN_AMOUNT(?:\s*\x{2022}\s*Maks\s+([0-9.]+))?$`)

func dashboardCount(lines []string, label string) (int, error) {
	for i, line := range lines {
		if line == label && i+1 < len(lines) {
			count, err := strconv.Atoi(strings.ReplaceAll(lines[i+1], ".", ""))
			if err == nil && count >= 0 {
				return count, nil
			}
		}
	}
	return 0, fmt.Errorf("missing/invalid dashboard count: %s", label)
}

func tableHeader(lines []string, i int) bool {
	return i >= 0 && i+2 < len(lines) && lines[i] == "SKU" && lines[i+1] == "Keterangan" && lines[i+2] == "Harga"
}

func parseDashboardProducts(lines []string) ([]productRow, error) {
	total, err := dashboardCount(lines, "Total Produk Aktif")
	if err != nil {
		return nil, err
	}
	fixed, err := dashboardCount(lines, "Produk Dengan Harga Tetap")
	if err != nil {
		return nil, err
	}
	start := -1
	for i := range lines {
		if tableHeader(lines, i) {
			start = i
			break
		}
	}
	if start < 2 {
		return nil, fmt.Errorf("missing category/brand table")
	}
	category, brand := lines[start-2], lines[start-1]
	products := make([]productRow, 0, total)
	seen := make(map[string]bool)
	fixedCount := 0
	for i := start + 3; i < len(lines); {
		if tableHeader(lines, i+1) {
			brand = lines[i]
			i += 4
			continue
		}
		if tableHeader(lines, i+2) {
			category, brand = lines[i], lines[i+1]
			i += 5
			continue
		}
		if i+4 >= len(lines) {
			return nil, fmt.Errorf("truncated product at line %d", i+1)
		}
		sku, name, group, priceType, priceLine := lines[i], lines[i+1], lines[i+2], lines[i+3], lines[i+4]
		if !skuPattern.MatchString(sku) || seen[strings.ToUpper(sku)] {
			return nil, fmt.Errorf("invalid or duplicate SKU %q at line %d", sku, i+1)
		}
		match := amountPattern.FindStringSubmatch(priceLine)
		if match == nil {
			return nil, fmt.Errorf("invalid price for %s: %q", sku, priceLine)
		}
		price, err := strconv.ParseInt(strings.ReplaceAll(match[1], ".", ""), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("price overflow for %s", sku)
		}
		maximum := ""
		switch {
		case priceType == "FIXED":
			if strings.HasPrefix(priceLine, "+") {
				return nil, fmt.Errorf("fixed price marked as fee: %s", sku)
			}
			fixedCount++
		case openTypePattern.MatchString(priceType):
			if !strings.HasPrefix(priceLine, "+") {
				return nil, fmt.Errorf("open amount missing fee marker: %s", sku)
			}
			maximum = strings.ReplaceAll(openTypePattern.FindStringSubmatch(priceType)[1], ".", "")
			if maximum != "" {
				max, err := strconv.ParseInt(maximum, 10, 64)
				if err != nil || max <= 0 {
					return nil, fmt.Errorf("invalid maximum for %s", sku)
				}
			}
			priceType = "OPEN_AMOUNT"
		default:
			return nil, fmt.Errorf("unknown price type for %s: %q", sku, priceType)
		}
		if name == "" || group == "" || category == "" || brand == "" {
			return nil, fmt.Errorf("incomplete product %s", sku)
		}
		seen[strings.ToUpper(sku)] = true
		products = append(products, productRow{Category: category, Brand: brand, SKU: sku, Name: name,
			GroupName: group, PriceType: priceType, Price: price, MaximumNominal: maximum})
		i += 5
	}
	if len(products) != total || fixedCount != fixed {
		return nil, fmt.Errorf("catalog count mismatch: parsed=%d fixed=%d; dashboard=%d fixed=%d", len(products), fixedCount, total, fixed)
	}
	return products, nil
}
