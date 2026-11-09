package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMigrationKeepsSourceValuesAndValidatesBeforeCommit(t *testing.T) {
	rows, err := parseDashboardProducts(strings.Split(sample, "\n"))
	if err != nil {
		t.Fatal(err)
	}
	rows[0].Name = "Name with ' quote"
	path := filepath.Join(t.TempDir(), "catalog.sql")
	if err := writeMigration(path, rows); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	sql := string(data)
	for _, expected := range []string{"Name with '' quote", "'PPOB','FIXED',2600,NULL", "WHERE nama = seed.brand_name", "import rolled back", "END $$;\nCOMMIT;"} {
		if !strings.Contains(sql, expected) {
			t.Fatalf("missing SQL invariant: %s", expected)
		}
	}
	if strings.Contains(sql, "LOWER(TRIM(seed.brand_name))") {
		t.Fatal("source brand spelling must not be merged")
	}
}
