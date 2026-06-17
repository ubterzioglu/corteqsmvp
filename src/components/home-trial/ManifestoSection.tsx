/**
 * 2. Devasa beyan (manifesto) bölümü.
 * Özellik gridi değil — diaspora ölçeğini ve aidiyeti tanımlayan büyük tipografi.
 */

const ManifestoSection = () => {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-glow-teal">
        Bir manifesto
      </p>
      <h2 className="mt-6 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
        8.8 Milyon Türk.
        <br />
        <span className="text-muted-foreground">Tek küresel ağ.</span>
      </h2>
      <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
        Dünyanın dört bir yanına dağılmış bir halk, görünmez bir ağla birbirine bağlı.
        CorteQS bu ağı görünür kılıyor: nerede olursan ol, kendi insanını, kendi
        topluluğunu ve kendi fırsatını bulabilmen için.
      </p>
    </section>
  );
};

export default ManifestoSection;
