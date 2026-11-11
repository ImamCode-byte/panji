# PANJI · Penilaian Parisada XXI

Vite + React + TypeScript, CSS murni. Database dan login: Supabase. Hosting: Vercel.

## Deploy
1. **Supabase**: buat project, buka SQL Editor, jalankan `supabase/schema.sql`.
2. **Akun admin pertama**: Authentication → Users → Add user (email + sandi, centang auto-confirm). Akun pertama otomatis jadi admin.
3. **Vercel**: import repo, isi Environment Variables dari `.env.example`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Deploy.
4. Masuk dengan email admin tadi → menu **Regu** (impor 40 regu) → **Akun juri** (buat akun + tugaskan lomba).
5. Tombol **Terbitkan** (Beranda/Klasemen) mengirim klasemen ke halaman publik `/`.

Lokal: `npm i && npm run demo` (tanpa Supabase, data di perangkat; login `admin/admin`, `juri/juri`). `npm test` menjalankan 19 tes perhitungan.

## Asumsi yang perlu dikonfirmasi panitia (semua bisa diubah di Pengaturan)
- Persentase di juklak dibaca sebagai poin maksimum (Tapak 60+45+35+60=200, LKBB 120+45+35=200).
- Festival Tari: bobot berjumlah 150, skala 200 → dinormalkan ke 200.
- MSC: nilai tiap tahap dinormalkan 0–100; masuk klasemen sebagai rata-rata tertimbang 40/30/30; jumlah soal final diasumsikan 10.
- Sandi dan Semaphore: nilai dari jawaban benar; kecepatan hanya penentu seri.
- Memanah: 3 panah × maks 10, dinormalkan ke 100.
- Halang Rintang: 100 − (menit.detik), sesuai contoh juklak (5.45 → 94,55).
- Huruf poin pengurangan (D, E, F, H) ditafsirkan dari isi aturan.
- Typo kategori diperbaiki: Harapan Terap XI–XIII, Harapan Madya XXXV–XXXVII, Caraka XXXVIII–XL.
- Seri total klasemen: jumlah juara 1/2/3 per lomba, lalu urutan manual (menu Regu).
- Regu Tergiat dan Danton Terbaik: skala 0–100, tidak masuk klasemen umum.
