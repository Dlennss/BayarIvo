# Deploy Bayarivo ke server baru

Target: `103.31.39.97:22`, arsitektur Linux AMD64 (bukan ARM64).
Root aplikasi: `/home/mitra-p24/hit/Bayarivo`.

## Repository Secrets

Atur di Settings > Secrets and variables > Actions pada repository Dlennss/BayarIvo:

| Secret | Nilai |
| --- | --- |
| SERVER_HOST | 103.31.39.97 |
| SERVER_PORT | 22 |
| SERVER_USER | root |
| SERVER_SSH_KEY | Private key OpenSSH yang public key-nya diizinkan untuk root di server baru |

Jangan gunakan password SSH sebagai SERVER_SSH_KEY. Key harus dapat digunakan
dengan BatchMode tanpa prompt passphrase. Jangan tempel private key di chat,
commit, atau log. Workflow menolak host, port, atau user server lama.

BACKEND_SOURCE_DIR, FRONTEND_SOURCE_DIR, dan FRONTEND_RELEASE_DIR dari konfigurasi
lama tidak lagi dibaca. Boleh dibiarkan; tidak memengaruhi deployment baru.
Folder sumber di repository tetap pulsa-be dan pulsa-fe. Lokasi server
ditetapkan di workflow dan helper, bukan dari ketiga secret tersebut.

Host key publik server dipin di ops/bayarivo_known_hosts. Jangan menonaktifkan
StrictHostKeyChecking atau mengganti key tanpa memverifikasinya melalui konsol
penyedia server. Ini bukan private key dan aman disimpan di repository.

## Alur

1. Push main menjalankan CI: seluruh tes Go, lint, build frontend, dan tes helper.
2. Setelah CI main berhasil, workflow Deploy berjalan melalui workflow_run.
   Pull request dan CI yang gagal tidak dapat memicu deploy.
3. Deploy membangun commit yang sama dengan CI di runner Ubuntu AMD64 dengan
   Node.js 24 dan versi Go dari go.mod. Rilis manual hanya dari main dan tetap
   melewati tes/build. Commit yang sudah tertinggal dari main ditolak.
4. Arsip frontend standalone (termasuk .next/static), backend AMD64, penanda
   commit, dan checksum diunggah ke incoming/ci-<sha>-<run>-<attempt>.
5. Helper memvalidasi prasyarat, checksum, arsitektur, penanda commit, dan arsip;
   mencadangkan database; kemudian mengganti symlink current secara atomik.
6. Hanya bayarivo-be.service dan bayarivo-fe.service yang direstart. Backend
   health, API kategori, halaman katalog, dan commit frontend diperiksa melalui
   localhost. Kegagalan setelah aktivasi mengembalikan symlink/rilis sebelumnya.
7. Hasil dicatat dalam GitHub Actions Summary. Domain tidak diubah atau dipakai
   untuk menentukan keberhasilan, karena DNS belum diarahkan ke server baru.

Deploy memakai isi commit GitHub, bukan perubahan manual yang ada di server.
Commit perubahan katalog terbaru BERSAMA workflow dan helper sebelum push;
jangan menimpa rilis katalog dengan source lama. Perubahan lokal belum otomatis
masuk GitHub, dan nilai repository secret tidak bisa dibaca dari screenshot.

## Batas Data

Tidak ada migrasi otomatis, impor katalog, pengisian saldo, atau reset database.
File shared/backend.env dan shared/frontend.env tidak ditimpa. Kredensial API
dan status pembelian tetap mengikuti konfigurasi server; deploy tidak
mengaktifkan API pembayaran atau login Google.

Rilis: releases/ci-<sha>-<run>-<attempt>.
Backup database: backups/ci-<sha>-<run>-<attempt>.dump (mode 0600).
Backend: 127.0.0.1:8104. Frontend: 127.0.0.1:33030.
Unit systemd harus tetap memakai current seperti instalasi server baru.
Rilis dan backup lama tidak dihapus otomatis.

## Pemeriksaan

Pada Linux, tes helper memakai direktori sementara dan subprocess tiruan,
tanpa mengubah layanan produksi:

```sh
python3 -m unittest discover -s ops -p test_bayarivo_activate.py -v
```

Preflight server tidak mengganti rilis atau merestart layanan:

```sh
/usr/local/sbin/bayarivo-activate --check
```

Workflow memasang helper dari commit yang sama sebelum aktivasi. Private key
sementara di runner dihapus pada langkah cleanup. Konfigurasi SSH produksi
tidak pernah dimasukkan ke artefak frontend.

Referensi pemicu:
[GitHub workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run).
