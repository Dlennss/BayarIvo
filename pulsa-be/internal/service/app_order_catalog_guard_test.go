package service

import (
	"context"
	"strings"
	"testing"

	"pulsa2/internal/provider"
)

func TestCatalogWithoutProviderCannotBePurchased(t *testing.T) {
	for _, client := range []*provider.Pulsa24JamAdapter{nil, {}} {
		svc := &AppOrderService{pulsa24JamClient: client}
		product, err := svc.validatePulsa24JamProduct(context.Background(), "TEST")
		if product != nil || err == nil || !strings.Contains(err.Error(), "belum dikonfigurasi") {
			t.Fatalf("unconfigured provider must reject purchase: product=%v err=%v", product, err)
		}
	}
}
