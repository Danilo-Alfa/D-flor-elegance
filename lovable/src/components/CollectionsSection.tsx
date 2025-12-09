import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import collection1 from '@/assets/collection-1.jpg';
import collection2 from '@/assets/collection-2.jpg';
import collection3 from '@/assets/collection-3.jpg';

const collections = [
  {
    id: 1,
    title: 'Romantica',
    subtitle: 'Flores e delicadeza',
    image: collection1,
    description: 'Peças com estampas florais e tons suaves para um visual romântico e feminino.',
  },
  {
    id: 2,
    title: 'Naturale',
    subtitle: 'Tons da terra',
    image: collection2,
    description: 'A elegância dos tons naturais em tecidos fluidos e confortáveis.',
  },
  {
    id: 3,
    title: 'Essencial',
    subtitle: 'Clássicos atemporais',
    image: collection3,
    description: 'Peças versáteis que formam a base de um guarda-roupa sofisticado.',
  },
];

const CollectionsSection = () => {
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
      id="collections"
      ref={sectionRef}
      className="section-padding bg-secondary"
    >
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Nossas Coleções
          </span>
          <h2
            className={`font-display text-4xl md:text-6xl mt-4 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Explore a <span className="italic text-primary">Elegância</span>
          </h2>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {collections.map((collection, index) => (
            <article
              key={collection.id}
              className={`group cursor-pointer transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Image Container */}
              <div className="relative overflow-hidden mb-6 aspect-[3/4]">
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-500" />

                {/* Hover Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="btn-elegant flex items-center gap-2">
                    Ver Coleção
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <span className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                  {collection.subtitle}
                </span>
                <h3 className="font-display text-2xl md:text-3xl group-hover:text-primary transition-colors duration-300">
                  {collection.title}
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {collection.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsSection;
