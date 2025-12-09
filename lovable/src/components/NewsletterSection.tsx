import { useState, useRef, useEffect } from 'react';
import { Send, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      toast({
        title: "Inscrição realizada!",
        description: "Você receberá nossas novidades em breve.",
      });
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="section-padding bg-foreground text-background relative overflow-hidden"
    >
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-40 h-40 border border-background rounded-full" />
        <div className="absolute top-20 left-20 w-40 h-40 border border-background rounded-full" />
        <div className="absolute bottom-10 right-10 w-60 h-60 border border-background rounded-full" />
        <div className="absolute bottom-20 right-20 w-60 h-60 border border-background rounded-full" />
      </div>

      <div className="container mx-auto relative">
        <div className="max-w-2xl mx-auto text-center">
          <span
            className={`font-body text-xs tracking-[0.3em] uppercase text-primary transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Fique por dentro
          </span>

          <h2
            className={`font-display text-4xl md:text-5xl lg:text-6xl mt-4 mb-6 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Receba <span className="italic text-primary">Novidades</span>
          </h2>

          <p
            className={`text-background/70 mb-10 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Cadastre-se para receber em primeira mão lançamentos exclusivos, promoções especiais e tendências de moda.
          </p>

          <form
            onSubmit={handleSubmit}
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="relative flex-1 max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                className="w-full px-6 py-4 bg-background/10 border border-background/20 text-background placeholder:text-background/50 focus:outline-none focus:border-primary transition-colors duration-300 font-body"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitted}
              className="px-8 py-4 bg-primary text-primary-foreground font-body font-medium tracking-wider uppercase text-sm transition-all duration-500 hover:shadow-glow hover:scale-105 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitted ? (
                <>
                  <Check className="w-4 h-4" />
                  Inscrito!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Inscrever
                </>
              )}
            </button>
          </form>

          <p
            className={`text-background/40 text-xs mt-6 transition-all duration-700 delay-400 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Respeitamos sua privacidade. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
