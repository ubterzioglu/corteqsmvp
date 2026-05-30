# Workspace Resources Admin Kullanım Rehberi

Bu rehber `https://corteqs.net/admin/workspace/resources` ekranındaki günlük yönetim işlemleri içindir.

## 1. Filtreleme
- `Bölüm Filtresi` ile ana kategori seçin.
- `Alt Bölüm Filtresi` seçili bölüme göre daralır.
- `Arama` kutusunda başlık, açıklama, bölüm veya alt bölüm metniyle filtreleyin.
- `Temizle` ile tüm filtreleri sıfırlayın.

## 2. Kayıt İşlemleri
- `Yeni Kayıt Ekle` akordeonunu açarak yeni kayıt girin.
- Her satırda:
  - `Düzenle`: satırı düzenleme moduna alır.
  - `Gizle`: satırı aktif listeden kaldırır, gizlenmiş listeye taşır.
  - `Sil`: kaydı kalıcı siler.
  - `URL / Gör / İndir`: kayıt tipine göre erişim sağlar.

## 3. Gizlenmiş Dosyalar
- Ekranın altındaki `Gizlenmiş Dosyalar` akordeonunda gizlenmiş kayıtlar bulunur.
- `Göster` butonu kaydı tekrar aktif listeye taşır.

## 4. CSV ile Toplu Güncelleme
- Toplu yükleme standardı için `docs/operations/database/dosyalardatabase.md` dosyasını kullanın.
- Komut:
  - `npm run import:resources:replace`
- Bu komut mevcut kayıtları atomik şekilde CSV ile değiştirir.
