package service

import (
	"context"
	"crypto/sha256"
	"encoding/base32"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"pulsa2/internal/helper"
	providerpkg "pulsa2/internal/provider"
	"pulsa2/internal/repository"
)

var pulsa24JamFixedWalletAmountPattern = regexp.MustCompile(`([0-9]+)$`)

func (s *AppOrderFulfillmentService) handleFailedOrder(ctx context.Context, order *repository.AppOrderRow, providerTrxID int64, msg, reasonPrefix string) error {
	if order == nil {
		return fmt.Errorf("order not found")
	}

	reason := strings.TrimSpace(reasonPrefix)
	if reason == "" {
		reason = "transaksi provider aplikasi gagal"
	}
	if strings.TrimSpace(msg) != "" {
		reason = fmt.Sprintf("%s: %s", reason, strings.TrimSpace(msg))
	}

	if order.BuyerType == "user" && order.MemberID != nil && *order.MemberID > 0 && order.HargaFinal > 0 {
		if err := s.callbackRepo.RefundAppOrderFunding(ctx, *order.MemberID, order.InvoiceID, "refund saldo otomatis: "+reason); err != nil {
			_ = s.orderRepo.UpdateStatusByID(ctx, order.ID, "failed")
			return fmt.Errorf("refund app order gagal member_id=%d invoice=%s err=%w", *order.MemberID, order.InvoiceID, err)
		}
		if err := s.orderRepo.UpdateStatusByID(ctx, order.ID, "refunded"); err != nil {
			return err
		}
		helper.AppendProviderServiceLog("provider_wallet.log", "app order dispatch fail refunded member_id=%d invoice=%s provider_trx_id=%d", *order.MemberID, order.InvoiceID, providerTrxID)
		return nil
	}

	if strings.TrimSpace(strings.ToLower(order.BuyerType)) == "guest" && order.HargaFinal > 0 {
		if err := s.orderRepo.UpsertGuestRefundTicket(ctx, order, "refund guest pending claim: "+reason); err != nil {
			helper.AppendProviderServiceLog("provider_callback_service.log", "guest refund ticket create failed invoice=%s provider_trx_id=%d err=%v", order.InvoiceID, providerTrxID, err)
		}
	}

	return s.orderRepo.UpdateStatusByID(ctx, order.ID, "failed")
}

func appOrderProviderLooksLikeSystemIssue(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "SYSTEM ERROR") || strings.Contains(upper, "MAINTENANCE")
	default:
		return true
	}
}

func appOrderProviderLooksLikePending(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "TIMEOUT") ||
			strings.Contains(upper, "SEDANG DIPROSES") ||
			strings.Contains(upper, "AKAN DIPROSES") ||
			strings.Contains(upper, "PENDING") ||
			strings.Contains(upper, `"STATUS":1`) ||
			strings.Contains(upper, `"STATUS":"1"`)
	default:
		return false
	}
}

func appOrderProviderImmediateReject(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "GAGAL") ||
			strings.Contains(upper, "FAILED") ||
			strings.Contains(upper, "SALDO TIDAK CUKUP") ||
			strings.Contains(upper, `"STATUS":3`) ||
			strings.Contains(upper, `"STATUS":"3"`) ||
			strings.Contains(upper, `"STATUS":"FAILED"`) ||
			strings.Contains(upper, `"SUCCESS":FALSE`)
	default:
		return true
	}
}

func appOrderProviderProductUnavailable(provider, body string) bool {
	if !strings.EqualFold(strings.TrimSpace(provider), providerpkg.Pulsa24JamProviderName) {
		return false
	}
	upper := strings.ToUpper(strings.TrimSpace(body))
	return strings.Contains(upper, "PRODUK KEHABISAN STOK") ||
		strings.Contains(upper, "PRODUCT OUT OF STOCK")
}

func resolvePulsa24JamAppRequest(providerProductCode string, order *repository.AppOrderRow) (string, int64) {
	providerProductCode = strings.ToUpper(strings.TrimSpace(providerProductCode))
	if order == nil {
		return providerProductCode, 0
	}
	qty := order.Qty
	if qty <= 0 {
		qty = 1
	}
	if qty != 1 {
		return providerProductCode, qty
	}

	sku := strings.ToUpper(strings.TrimSpace(order.ProdukSKUSnapshot))
	name := strings.ToUpper(strings.TrimSpace(order.ProdukNamaSnapshot))
	genericCode := ""
	switch {
	case strings.HasPrefix(sku, "UDDND") && strings.Contains(name, "DANA"):
		genericCode = "DANA"
	case (strings.HasPrefix(sku, "UDGP") || strings.HasPrefix(sku, "UDGY")) && strings.Contains(name, "GOPAY") && !strings.Contains(name, "DRIVER"):
		genericCode = "GOPAY"
	default:
		return providerProductCode, qty
	}

	match := pulsa24JamFixedWalletAmountPattern.FindStringSubmatch(sku)
	if len(match) != 2 {
		return providerProductCode, qty
	}
	thousands, err := strconv.ParseInt(match[1], 10, 64)
	if err != nil || thousands <= 0 {
		return providerProductCode, qty
	}
	amount := thousands * 1000
	if amount <= 0 || (order.HargaDasar > 0 && amount >= order.HargaDasar) {
		return providerProductCode, qty
	}
	return genericCode, amount
}

func pulsa24JamAppOrderRefID(order *repository.AppOrderRow) string {
	if order == nil || strings.TrimSpace(order.InvoiceID) == "" {
		return ""
	}
	// A fresh database can reuse numeric IDs while P24 retains old references.
	sum := sha256.Sum256([]byte(strings.TrimSpace(order.InvoiceID)))
	return "BVA" + base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(sum[:])[:17]
}

func validatePulsa24JamAppResponse(body, refID, product string, qty int64, order *repository.AppOrderRow) error {
	var response struct {
		Existing    bool   `json:"existing"`
		RefID       string `json:"refid"`
		LegacyRefID string `json:"ref_id"`
		Transaction *struct {
			RefID     string      `json:"ref_id"`
			Product   string      `json:"kode_produk"`
			Dest      string      `json:"tujuan"`
			Qty       json.Number `json:"qty"`
			CreatedAt string      `json:"dibuat_pada"`
		} `json:"transaksi_member"`
	}
	if err := json.Unmarshal([]byte(body), &response); err != nil {
		return fmt.Errorf("respons P24 tidak dapat diverifikasi")
	}
	for _, returnedRef := range []string{response.RefID, response.LegacyRefID} {
		if returnedRef != "" && returnedRef != refID {
			return fmt.Errorf("referensi respons P24 tidak cocok")
		}
	}
	tx := response.Transaction
	if response.Existing && (tx == nil || tx.RefID == "" || tx.Product == "" || tx.Dest == "" || tx.Qty == "") {
		return fmt.Errorf("identitas transaksi lama P24 tidak lengkap")
	}
	if tx == nil {
		return nil
	}
	if tx.RefID != "" && tx.RefID != refID {
		return fmt.Errorf("referensi transaksi P24 tidak cocok")
	}
	if tx.Product != "" && !strings.EqualFold(tx.Product, product) {
		return fmt.Errorf("produk transaksi P24 tidak cocok")
	}
	if tx.Dest != "" && (order == nil || tx.Dest != order.Dest) {
		return fmt.Errorf("tujuan transaksi P24 tidak cocok")
	}
	if tx.Qty != "" {
		returnedQty, err := tx.Qty.Int64()
		if err != nil || returnedQty != qty {
			return fmt.Errorf("nominal/jumlah transaksi P24 tidak cocok")
		}
	}
	if tx.CreatedAt != "" && order != nil && order.DibuatPada != nil {
		created, err := time.Parse(time.RFC3339Nano, tx.CreatedAt)
		if err != nil || created.Before(order.DibuatPada.Add(-5*time.Minute)) {
			return fmt.Errorf("waktu transaksi P24 mendahului invoice")
		}
	}
	return nil
}

func appOrderProviderLooksLikeAccepted(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "SUKSES") ||
			strings.Contains(upper, "SUCCESS") ||
			strings.Contains(upper, "PENDING") ||
			strings.Contains(upper, "TIMEOUT") ||
			strings.Contains(upper, "SEDANG DIPROSES") ||
			strings.Contains(upper, "AKAN DIPROSES") ||
			strings.Contains(upper, `"OK":TRUE`) ||
			strings.Contains(upper, `"SUCCESS":TRUE`) ||
			strings.Contains(upper, `"STATUS":1`) ||
			strings.Contains(upper, `"STATUS":"1"`) ||
			strings.Contains(upper, `"RC":"00"`)
	default:
		return false
	}
}
