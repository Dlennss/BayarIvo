package service

import "testing"

func TestParsePulsa24JamCallbackNestedTrx(t *testing.T) {
	data := parsePulsa24JamCallback("", nil, map[string]any{
		"refid":  "PKA3",
		"status": "success",
		"trx": map[string]any{
			"id":            115214268,
			"sn":            "07",
			"biaya_aktual":  101000,
			"provider_ref":  "07",
			"member_balance": 97800,
			"message":       "Transaksi berhasil. Ref: 07",
		},
	})
	if data.refid != "PKA3" || data.status != "success" || data.sn != "07" || data.providerRef != "07" || data.price != 101000 || data.balance != 97800 {
		t.Fatalf("unexpected parsed callback: %#v", data)
	}
}
