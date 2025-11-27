# Environment Variables Kurulumu

Railway bağlantıları kaldırıldı. Artık tüm database ve backend bağlantıları environment variable'lardan çalışıyor.

## Frontend (Next.js) Kurulumu

1. `bbsm-garage-front` klasöründe `.env.local` dosyası oluşturun:

```bash
cd bbsm-garage-front
touch .env.local
```

2. `.env.local` dosyasına şunu ekleyin:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Production için:** Kendi backend URL'inizi yazın:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Backend (NestJS) Kurulumu

1. `bbsm-garage-back` klasöründe `.env` dosyası oluşturun:

```bash
cd bbsm-garage-back
touch .env
```

2. `.env` dosyasına şunları ekleyin:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# SSL Configuration (opsiyonel, production için gerekebilir)
DB_SSL=false
DB_SSL_CERT=
DB_SSL_REJECT_UNAUTHORIZED=true

# JWT Secret (güçlü bir key kullanın)
JWT_SECRET=your_jwt_secret_key_here

# Node Environment
NODE_ENV=development
```

**Önemli Notlar:**
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, ve `JWT_SECRET` zorunludur
- Eğer bu değişkenler eksikse uygulama başlatıldığında hata verecektir
- Production ortamında güçlü şifreler ve JWT secret kullanın
- SSL kullanıyorsanız `DB_SSL=true` yapın ve gerekirse `DB_SSL_CERT` ekleyin

## Değişiklikler

✅ Tüm Railway URL'leri (`https://syoto-garage.up.railway.app`) kaldırıldı
✅ Frontend'deki tüm API çağrıları artık `NEXT_PUBLIC_API_URL` environment variable'ından okuyor
✅ Backend'deki database bağlantıları tamamen environment variable'lardan çalışıyor
✅ Varsayılan değerler kaldırıldı, tüm değerler env'den zorunlu olarak alınıyor

## Test Etme

1. Backend'i başlatın:
```bash
cd bbsm-garage-back
npm run start:dev
```

2. Frontend'i başlatın:
```bash
cd bbsm-garage-front
npm run dev
```

3. Tarayıcıda `http://localhost:3000` adresine gidin

Eğer environment variable'lar eksikse, backend başlatıldığında hata mesajı alacaksınız.

