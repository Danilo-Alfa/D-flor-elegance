import heroImage from '@/assets/hero-image.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="D' flor elegance - Moda feminina elegante"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 lg:px-12 pt-32">
        <div className="max-w-2xl">
          {/* Decorative element */}
          <div
            className="w-20 h-[1px] bg-primary mb-8 opacity-0 animate-slide-in-left"
            style={{ animationDelay: '0.3s' }}
          />

          {/* Tagline */}
          <p
            className="font-body text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4 opacity-0 animate-reveal-up"
            style={{ animationDelay: '0.4s' }}
          >
            Nova Coleção Primavera/Verão
          </p>

          {/* Main heading */}
          <h1
            className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 opacity-0 animate-reveal-up"
            style={{ animationDelay: '0.6s' }}
          >
            Elegância
            <span className="block italic text-primary">que Floresce</span>
          </h1>

          {/* Description */}
          <p
            className="font-body text-lg md:text-xl text-muted-foreground max-w-md mb-10 opacity-0 animate-reveal-up"
            style={{ animationDelay: '0.8s' }}
          >
            Descubra peças únicas que celebram a feminilidade com sofisticação e conforto incomparáveis.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 opacity-0 animate-reveal-up"
            style={{ animationDelay: '1s' }}
          >
            <a href="#collections" className="btn-elegant text-center">
              Explorar Coleção
            </a>
            <a href="#about" className="btn-outline-elegant text-center">
              Nossa História
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-fade-in" style={{ animationDelay: '1.5s' }}>
        <span className="font-body text-xs tracking-widest uppercase text-muted-foreground">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-1/4 right-20 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-float hidden lg:block" />
      <div className="absolute bottom-1/4 right-40 w-48 h-48 rounded-full bg-accent/10 blur-3xl animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default HeroSection;
