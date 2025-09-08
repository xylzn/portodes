Front end untuk Portfolio Design

Struktur:
- index.html — halaman utama (Tailwind CDN)
- config.js — konfigurasi endpoint API
- api.js — adapter fetch API
- app.js — inisialisasi aplikasi & interaksi UI
- components/Card.js — komponen kartu project

Konfigurasi:
Edit `web/config.js` untuk menyesuaikan `BASE_URL` sesuai API kamu. Default `http://localhost:3000` dan endpoint `/projects`, `/contact`.

Jalankan lokal:
Gunakan Live Server di editor, atau server statis sederhana. Contoh dengan Python:

python -m http.server 8080 -d web

Lalu buka http://localhost:8080

