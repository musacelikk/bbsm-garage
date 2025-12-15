# BBSM Garage API Dokümantasyonu

## Versiyon
API v1 kullanılmaktadır.

## Base URL
```
http://localhost:4000/api/v1
```

## Authentication
Tüm endpoint'ler JWT token gerektirir. Token'ı header'da gönderin:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth
- `POST /auth` - Kullanıcı kaydı
- `POST /auth/control` - Giriş
- `GET /auth/profile` - Profil bilgisi
- `GET /auth/membership` - Üyelik bilgisi

### Cards
- `GET /card` - Tüm kartları listele
- `POST /card` - Yeni kart ekle
- `PATCH /card/:id` - Kart güncelle
- `DELETE /card/:id` - Kart sil

### Teklif
- `GET /teklif` - Tüm teklifleri listele
- `POST /teklif` - Yeni teklif ekle
- `PATCH /teklif/:id` - Teklif güncelle
- `DELETE /teklif/:id` - Teklif sil

### Stok
- `GET /stok` - Tüm stokları listele
- `POST /stok` - Yeni stok ekle
- `PATCH /stok/:id` - Stok güncelle
- `DELETE /stok/:id` - Stok sil

### Backup
- `POST /backup/create` - Yedek oluştur
- `POST /backup/restore` - Yedek geri yükle

### Webhook
- `POST /webhook/register` - Webhook kaydet
- `POST /webhook/trigger/:event` - Webhook tetikle
