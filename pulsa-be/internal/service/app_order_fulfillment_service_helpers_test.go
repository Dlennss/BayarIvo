package service

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"pulsa2/internal/repository"
)

func TestAppOrderProviderImmediateRejectPulsa24Jam(t *testing.T) {
	tests := []struct {
		name string
		body string
		want bool
	}{
		{
			name: "insufficient provider balance",
			body: `{"message":"saldo tidak cukup","ok":true,"refid":"INV-1","status":3}`,
			want: true,
		},
		{
			name: "numeric rejected status",
			body: `{"message":"produk tidak ditemukan","ok":true,"refid":"INV-2","status":3}`,
			want: true,
		},
		{
			name: "pending accepted",
			body: `{"message":"Transaksi sedang diproses","ok":true,"refid":"INV-3","status":"pending"}`,
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := appOrderProviderImmediateReject("pulsa24jam", tt.body); got != tt.want {
				t.Fatalf("appOrderProviderImmediateReject() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAppOrderProviderTimeoutPulsa24JamStaysPending(t *testing.T) {
	body := `{"ok":true,"refid":"PKA2B","status":1,"message":"Provider timeout"}`
	if appOrderProviderLooksLikeSystemIssue("pulsa24jam", body) {
		t.Fatal("pulsa24jam timeout must not be treated as system failure for app orders")
	}
	if !appOrderProviderLooksLikePending("pulsa24jam", body) {
		t.Fatal("pulsa24jam timeout should stay pending for status-pay/callback reconciliation")
	}
	if !appOrderProviderLooksLikeAccepted("pulsa24jam", body) {
		t.Fatal("pulsa24jam timeout should be accepted as pending")
	}
}

func TestAppOrderProviderProductUnavailable(t *testing.T) {
	if !appOrderProviderProductUnavailable("pulsa24jam", `{"message":"Produk kehabisan stok","status":3}`) {
		t.Fatal("out-of-stock response should quarantine the product")
	}
	if appOrderProviderProductUnavailable("pulsa24jam", `{"message":"Nomor tujuan salah","status":3}`) {
		t.Fatal("business rejection unrelated to stock must not quarantine the product")
	}
	if appOrderProviderProductUnavailable("yuscom", `{"message":"Produk kehabisan stok","status":3}`) {
		t.Fatal("only Pulsa24Jam products should be quarantined")
	}
}

func TestResolvePulsa24JamAppRequest(t *testing.T) {
	tests := []struct {
		name        string
		order       repository.AppOrderRow
		wantProduct string
		wantQty     int64
	}{
		{
			name:        "fixed dana uses open amount route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDDND10", ProdukNamaSnapshot: "Dana 10.000", Qty: 1, HargaDasar: 11055},
			wantProduct: "DANA", wantQty: 10000,
		},
		{
			name:        "fixed gopay uses open amount route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDGP10", ProdukNamaSnapshot: "Gopay 10.000", Qty: 1, HargaDasar: 11650},
			wantProduct: "GOPAY", wantQty: 10000,
		},
		{
			name:        "gopay driver keeps dedicated route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDGD15", ProdukNamaSnapshot: "Gopay Driver 15.000", Qty: 1, HargaDasar: 16450},
			wantProduct: "UDGD15", wantQty: 1,
		},
		{
			name:        "open amount remains unchanged",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "DANA", ProdukNamaSnapshot: "Dana Bebas Nominal", Qty: 25000, HargaDasar: 26000},
			wantProduct: "DANA", wantQty: 25000,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			product, qty := resolvePulsa24JamAppRequest(tt.order.ProdukSKUSnapshot, &tt.order)
			if product != tt.wantProduct || qty != tt.wantQty {
				t.Fatalf("got product=%s qty=%d, want product=%s qty=%d", product, qty, tt.wantProduct, tt.wantQty)
			}
		})
	}
}

func TestPulsa24JamAppOrderRefIDFitsH2HRLimit(t *testing.T) {
	got := pulsa24JamAppOrderRefID(&repository.AppOrderRow{
		ID:        81,
		InvoiceID: "INV-20260921170504-F95D2B50",
	})
	if !strings.HasPrefix(got, "BVA") {
		t.Fatalf("unexpected refid = %q", got)
	}
	if len(got) > 20 {
		t.Fatalf("refid length = %d, want <= 20", len(got))
	}
}

func TestPulsa24JamAppOrderRefIDFallbackFitsH2HRLimit(t *testing.T) {
	got := pulsa24JamAppOrderRefID(&repository.AppOrderRow{InvoiceID: "INV-20260921170504-F95D2B50"})
	if len(got) > 20 {
		t.Fatalf("refid length = %d, want <= 20: %s", len(got), got)
	}
	if got[:3] != "BVA" {
		t.Fatalf("refid = %q, want BVA prefix", got)
	}
}

func TestPulsa24JamReferencesSurviveDatabaseReset(t *testing.T) {
	a := repository.AppOrderRow{ID: 2, InvoiceID: "INV-20261007141200-12345678"}
	b := repository.AppOrderRow{ID: 2, InvoiceID: "INV-20261110055852-CD48BFE0"}
	if pulsa24JamAppOrderRefID(&a) == pulsa24JamAppOrderRefID(&b) {
		t.Fatal("database ID reuse must not reuse provider reference")
	}
	ref := pulsa24JamAppOrderRefID(&b)
	b.ID = 987
	if ref != pulsa24JamAppOrderRefID(&b) {
		t.Fatal("same invoice must retain reference on retry/restore")
	}
	for _, order := range []*repository.AppOrderRow{nil, {ID: 2}} {
		if pulsa24JamAppOrderRefID(order) != "" {
			t.Fatal("missing invoice must fail closed")
		}
	}
}

func TestPulsa24JamAppResponseIdentity(t *testing.T) {
	now := time.Date(2026, 11, 10, 5, 58, 52, 0, time.UTC)
	order := &repository.AppOrderRow{Dest: "081234567890", DibuatPada: &now}
	for _, tc := range []struct {
		name, field string
		value       any
	}{
		{"wrong reference", "ref_id", "PKA2"}, {"wrong product", "kode_produk", "DANA"},
		{"wrong destination", "tujuan", "089999999999"}, {"old amount", "qty", 100000},
		{"old date", "dibuat_pada", "2026-10-07T14:12:00+07:00"}, {"missing quantity", "qty", nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			tx := map[string]any{"ref_id": "NEWREF", "kode_produk": "GOPAY", "tujuan": order.Dest, "qty": 20000, "dibuat_pada": now.Format(time.RFC3339)}
			valid, _ := json.Marshal(map[string]any{"ok": true, "existing": true, "transaksi_member": tx})
			if err := validatePulsa24JamAppResponse(string(valid), "NEWREF", "GOPAY", 20000, order); err != nil {
				t.Fatal(err)
			}
			tx[tc.field] = tc.value
			invalid, _ := json.Marshal(map[string]any{"ok": true, "existing": true, "transaksi_member": tx})
			if err := validatePulsa24JamAppResponse(string(invalid), "NEWREF", "GOPAY", 20000, order); err == nil {
				t.Fatal("mismatched response accepted")
			}
		})
	}
	for _, body := range []string{`{"ok":true,"refid":"NEWREF","status":1}`, `{"ok":true,"refid":"NEWREF","status":3}`} {
		if err := validatePulsa24JamAppResponse(body, "NEWREF", "GOPAY", 20000, order); err != nil {
			t.Fatal(err)
		}
	}
	for _, body := range []string{`{"ok":true,"existing":true}`, `{"refid":"OTHER"}`, `not JSON`} {
		if err := validatePulsa24JamAppResponse(body, "NEWREF", "GOPAY", 20000, order); err == nil {
			t.Fatal("unverified response accepted")
		}
	}
}

func TestPulsa24JamCallbackCannotFinalizeQuarantinedResponse(t *testing.T) {
	rc := "RECONCILE"
	svc := &ProviderCallbackService{}
	status, result := svc.processPulsa24JamAppCallback(context.Background(), pulsa24JamCallbackData{refid: "NEWREF"}, &repository.AppOrderProviderTrxRow{KodeRespon: &rc})
	if status != 200 || result["reconciliation_required"] != true {
		t.Fatal("callback bypassed reconciliation hold")
	}
}
