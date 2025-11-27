# Sorun Giderme Rehberi

## Backend Başlamıyor

### Hata: "DB_HOST environment variable is required"
**Çözüm:** `bbsm-garage-back/.env` dosyasında `DB_HOST` değişkenini ekleyin.

### Hata: "DB_USERNAME environment variable is required"
**Çözüm:** `bbsm-garage-back/.env` dosyasında `DB_USERNAME` değişkenini ekleyin.

### Hata: Database bağlantı hatası
**Kontrol edin:**
- Database sunucusunun çalıştığından emin olun
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` değerlerinin doğru olduğundan emin olun
- Firewall ayarlarını kontrol edin

## Frontend API Çağrıları Çalışmıyor

### Hata: "Failed to fetch" veya CORS hatası
**Kontrol edin:**
1. Backend'in çalıştığından emin olun (`http://localhost:4000`)
2. `bbsm-garage-front/.env.local` dosyasında `NEXT_PUBLIC_API_URL` değişkeninin doğru olduğundan emin olun
3. Next.js dev server'ı yeniden başlatın (environment variable değişiklikleri için gerekli)

### API çağrıları hala Railway URL'ine gidiyor
**Çözüm:**
1. Next.js dev server'ı durdurun (Ctrl+C)
2. `.env.local` dosyasını kontrol edin
3. `npm run dev` ile tekrar başlatın
4. Tarayıcı cache'ini temizleyin (Ctrl+Shift+R veya Cmd+Shift+R)

## Environment Variable Kontrolü

### Frontend için kontrol:
```bash
cd bbsm-garage-front
cat .env.local
```

Şunu görmelisiniz:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend için kontrol:
```bash
cd bbsm-garage-back
cat .env
```

Şunları görmelisiniz:
```
DB_HOST=...
DB_PORT=5432
DB_USERNAME=...
DB_PASSWORD=...
DB_DATABASE=...
JWT_SECRET=...
```

## Network Tab Kontrolü

1. Tarayıcıda F12'ye basın
2. Network sekmesine gidin
3. Bir API çağrısı yapın (ör: giriş yap)
4. Request URL'ine bakın - `http://localhost:4000` ile başlamalı, `syoto-garage.up.railway.app` olmamalı

## Next.js Environment Variable Notları

- Next.js'te environment variable'lar build time'da dahil edilir
- `.env.local` dosyasındaki değişiklikler için dev server'ı yeniden başlatmanız gerekir
- `NEXT_PUBLIC_` prefix'i olan değişkenler client-side'da kullanılabilir
- Production build için: `npm run build` yapmadan önce `.env.local` dosyasının doğru olduğundan emin olun

