# Belgelerimi Nereye Yüklerim?

Bu rehber, profilinize CV, sunum ve ruhsat/lisans belgesi yüklemeyi açıklar.

## CV / Özgeçmiş Yükleme

1. Profil sayfanıza gidin (sol üstteki profil ikonuna tıklayın)
2. Sol menüden **"Belgeler"** sekmesini seçin
3. **"CV / Özgeçmiş"** kartındaki **"Yükle"** butonuna tıklayın
4. Dosyanızı seçin (PDF, DOC, DOCX formatları desteklenir, max 5 MB)
5. Yükleme tamamlandıktan sonra belgeniz **private bucket**'ta güvenle saklanır

### Kim görebilir?

- **Varsayılan**: Sadece siz ve admin erişebilir
- **Premium üyelerle paylaşım**: CV'nizi Premium üyelerin görebilmesini istiyorsanız:
  1. CV yükledikten sonra belgenin altında çıkan **"CV'mi Premium üyeler görebilsin"** anahtarını açın
  2. Bu anahtar **varsayılan olarak kapalıdır** — siz açmadığınız sürece kimse CV'nizi göremez
  3. Anahtarı istediğiniz zaman kapatabilirsiniz

## Sunum / Tanıtım Yükleme

1. **"Belgeler"** sekmesinde **"Sunum / Tanıtım"** kartına gidin
2. **"Yükle"** butonuna tıklayın
3. Dosyanızı seçin (PDF, PPT, PPTX, KEY formatları desteklenir, max 10 MB)
4. Sunumunuz public profil sayfanıza **eklenmez** — yalnızca siz ve admin erişebilir

## İşletme Ruhsatı / Meslek Lisansı Yükleme

1. **"Belgeler"** sekmesinde **"İşletme Ruhsatı / Meslek Lisansı"** kartına gidin
2. **"Yükle"** butonuna tıklayın
3. Dosyanızı seçin (PDF, JPG, PNG formatları desteklenir, max 5 MB)
4. Belgeniz **yalnızca siz ve admin** tarafından görülebilir

## Sık Sorulan Sorular

### Belgelerim güvende mi?

Evet. Tüm belgeler **private bucket**'ta saklanır ve yalnızca siz (ve admin) erişebilir. Storage RLS politikaları ile korunur.

### CV'mi sildiğimde ne olur?

CV'nizi kaldırdığınızda hem profil attribute kaydı hem de storage'daki dosya silinir. Geri getirilemez.

### Premium üyeler CV'mi görebilir mi?

Yalnızca **"CV'mi Premium üyeler görebilsin"** anahtarını açarsanız. Bu anahtar varsayılan olarak kapalıdır. Açtığınızda, `career.cv.view` yetkisine sahip Premium üyeler kısa ömürlü (5 dk) signed URL ile CV'nizi görüntüleyebilir.

### Belge yükleme butonu görünmüyor

Belge yükleme özelliği rolünüze bağlıdır. Bireysel profillerde CV yükleme varsayılan olarak açıktır. Eğer buton görünmüyorsa rolünüz bu özelliği içermiyor olabilir — rol başvurusu yaparak değiştirebilirsiniz.

## Sorun mu yaşıyorsunuz?

Belge yükleme sırasında hata alıyorsanız:
- Dosya boyutunun 5 MB (CV/ruhsat) veya 10 MB (sunum) altında olduğundan emin olun
- Dosya formatının desteklenen formatlardan biri olduğunu kontrol edin
- Tarayıcınızın güncel olduğundan emin olun

Sorun devam ederse **info@corteqs.net** adresine e-posta gönderin.
