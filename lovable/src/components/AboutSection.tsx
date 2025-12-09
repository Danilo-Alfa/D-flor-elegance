import { useEffect, useRef, useState } from 'react';
import { Flower2, Heart, Sparkles, Leaf } from 'lucide-react';

const features = [
  {
    icon: Flower2,
    title: 'Design Exclusivo',
    description: 'Cada peça é cuidadosamente desenhada para realçar a beleza feminina.',
  },
  {
    icon: Leaf,
    title: 'Materiais Sustentáveis',
    description: 'Priorizamos tecidos naturais e práticas conscientes de produção.',
  },
  {
    icon: Heart,
    title: 'Feito com Amor',
    description: 'Atenção aos detalhes em cada costura e acabamento.',
  },
  {
    icon: Sparkles,
    title: 'Qualidade Premium',
    description: 'Peças duradouras que mantêm sua elegância ao longo do tempo.',
  },
];

const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="section-padding bg-background relative overflow-hidden"
    >
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <div>
            <span className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Nossa Essência
            </span>
            <h2
              className={`font-display text-4xl md:text-5xl lg:text-6xl mt-4 mb-8 transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Onde a <span className="italic text-primary">Natureza</span> encontra o <span className="italic text-accent">Estilo</span>
            </h2>

            <div
              className={`space-y-6 text-muted-foreground transition-all duration-1000 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <p className="text-lg leading-relaxed">
                A D' flor elegance nasceu do desejo de criar peças que celebram a feminilidade em sua forma mais autêntica e elegante.
              </p>
              <p className="leading-relaxed">
                Inspiradas pela beleza das flores e pela sofisticação atemporal, nossas criações trazem conforto e estilo para mulheres que valorizam qualidade e exclusividade.
              </p>
            </div>

            <div
              className={`mt-10 flex flex-wrap gap-8 transition-all duration-1000 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center">
                <span className="font-display text-4xl text-primary">5+</span>
                <p className="font-body text-sm text-muted-foreground mt-1">Anos de história</p>
              </div>
              <div className="text-center">
                <span className="font-display text-4xl text-primary">1000+</span>
                <p className="font-body text-sm text-muted-foreground mt-1">Clientes felizes</p>
              </div>
              <div className="text-center">
                <span className="font-display text-4xl text-primary">100%</span>
                <p className="font-body text-sm text-muted-foreground mt-1">Peças exclusivas</p>
              </div>
            </div>
          </div>

          {/* Right Content - Features Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`card-elegant transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${index * 100 + 300}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl mb-2">{feature.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
