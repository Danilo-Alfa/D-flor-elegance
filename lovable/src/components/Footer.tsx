import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary section-padding">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-start mb-6">
              <span className="font-display text-3xl tracking-wide">D' flor</span>
              <span className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground -mt-1">elegance</span>
            </div>
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
              Celebrando a feminilidade com elegância e sofisticação desde 2019.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-6">Navegação</h4>
            <nav className="flex flex-col gap-3">
              {['Início', 'Coleções', 'Novidades', 'Sobre', 'Contato'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-display text-lg mb-6">Atendimento</h4>
            <nav className="flex flex-col gap-3">
              {['Política de Troca', 'Formas de Pagamento', 'Prazo de Entrega', 'Rastrear Pedido', 'FAQ'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg mb-6">Contato</h4>
            <div className="space-y-4">
              <a
                href="tel:+5511999999999"
                className="flex items-center gap-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                <Phone className="w-4 h-4 text-primary" />
                (11) 99999-9999
              </a>
              <a
                href="mailto:contato@dflorelegance.com.br"
                className="flex items-center gap-3 font-body text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                <Mail className="w-4 h-4 text-primary" />
                contato@dflorelegance.com.br
              </a>
              <div className="flex items-start gap-3 font-body text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Rua das Flores, 123<br />São Paulo - SP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-muted-foreground">
            © {currentYear} D' flor elegance. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors duration-300">
              Termos de Uso
            </a>
            <a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors duration-300">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
