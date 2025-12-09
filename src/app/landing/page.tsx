"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// Collections data
const collections = [
  {
    id: 1,
    title: "Romantica",
    subtitle: "FLORES E DELICADEZA",
    image: "/landing/collection-1.jpg",
    description: "Pecas com estampas florais e tons suaves para um visual romantico e feminino.",
  },
  {
    id: 2,
    title: "Naturale",
    subtitle: "TONS DA TERRA",
    image: "/landing/collection-2.jpg",
    description: "A elegancia dos tons naturais em tecidos fluidos e confortaveis.",
  },
  {
    id: 3,
    title: "Essencial",
    subtitle: "CLASSICOS ATEMPORAIS",
    image: "/landing/collection-3.jpg",
    description: "Pecas versateis que formam a base de um guarda-roupa sofisticado.",
  },
];

// Features data
const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title: "Design Exclusivo",
    description: "Cada peca e cuidadosamente desenhada para realcar a beleza feminina.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6.5 6.5C6.5 4 9 2 12 2s5.5 2 5.5 4.5c0 2.5-2.5 4-5.5 5.5-3-1.5-5.5-3-5.5-5.5z"/>
        <path d="M12 22v-8M9 18l3 4 3-4"/>
      </svg>
    ),
    title: "Materiais Sustentaveis",
    description: "Priorizamos tecidos naturais e praticas conscientes de producao.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: "Feito com Amor",
    description: "Atencao aos detalhes em cada costura e acabamento.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    title: "Qualidade Premium",
    description: "Pecas duradouras que mantem sua elegancia ao longo do tempo.",
  },
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collectionsVisible, setCollectionsVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [newsletterVisible, setNewsletterVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const collectionsRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const newsletterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = { threshold: 0.2 };

    const collectionsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCollectionsVisible(true);
    }, observerOptions);

    const aboutObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setAboutVisible(true);
    }, observerOptions);

    const newsletterObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNewsletterVisible(true);
    }, observerOptions);

    if (collectionsRef.current) collectionsObserver.observe(collectionsRef.current);
    if (aboutRef.current) aboutObserver.observe(aboutRef.current);
    if (newsletterRef.current) newsletterObserver.observe(newsletterRef.current);

    return () => {
      collectionsObserver.disconnect();
      aboutObserver.disconnect();
      newsletterObserver.disconnect();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  const navLinks = [
    { name: "Inicio", href: "#" },
    { name: "Colecoes", href: "#collections" },
    { name: "Novidades", href: "#new" },
    { name: "Sobre", href: "#about" },
    { name: "Contato", href: "#contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[var(--background)]/95 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl md:text-3xl tracking-wide text-[var(--foreground)]">
                  D&apos; flor
                </span>
                <span className="font-body text-[10px] md:text-xs tracking-[0.4em] uppercase text-[var(--muted-foreground)] -mt-1">
                  elegance
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-body text-sm tracking-widest uppercase text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[var(--primary)] hover:after:w-full after:transition-all after:duration-300"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <button
                className="p-2 hover:text-[var(--primary)] transition-colors duration-300"
                aria-label="Buscar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <button
                className="p-2 hover:text-[var(--primary)] transition-colors duration-300 hidden md:block"
                aria-label="Favoritos"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <button
                className="p-2 hover:text-[var(--primary)] transition-colors duration-300"
                aria-label="Sacola"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </button>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" x2="20" y1="12" y2="12"/>
                    <line x1="4" x2="20" y1="6" y2="6"/>
                    <line x1="4" x2="20" y1="18" y2="18"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-500 ${
              isMobileMenuOpen ? "max-h-96 opacity-100 mt-6" : "max-h-0 opacity-0"
            }`}
          >
            <nav className="flex flex-col gap-4 py-4 border-t border-[var(--border)]">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-body text-sm tracking-widest uppercase text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors duration-300 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Full Screen with Background Image */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/landing/hero-image.jpg"
              alt="D' flor elegance - Moda feminina elegante"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/90 via-[var(--background)]/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative container mx-auto px-6 lg:px-12 pt-32">
            <div className="max-w-2xl">
              {/* Decorative element */}
              <div
                className="w-20 h-[1px] bg-[var(--primary)] mb-8 opacity-0 animate-slide-in-left"
                style={{ animationDelay: "0.3s" }}
              />

              {/* Tagline */}
              <p
                className="font-body text-sm tracking-[0.3em] uppercase text-[var(--muted-foreground)] mb-4 opacity-0 animate-reveal-up"
                style={{ animationDelay: "0.4s" }}
              >
                Nova Colecao Primavera/Verao
              </p>

              {/* Main heading */}
              <h1
                className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 text-[var(--foreground)] opacity-0 animate-reveal-up"
                style={{ animationDelay: "0.6s" }}
              >
                Elegancia
                <span className="block italic text-[var(--primary)]">que Floresce</span>
              </h1>

              {/* Description */}
              <p
                className="font-body text-lg md:text-xl text-[var(--muted-foreground)] max-w-md mb-10 opacity-0 animate-reveal-up"
                style={{ animationDelay: "0.8s" }}
              >
                Descubra pecas unicas que celebram a feminilidade com sofisticacao e conforto incomparaveis.
              </p>

              {/* CTA Buttons */}
              <div
                className="flex flex-col sm:flex-row gap-4 opacity-0 animate-reveal-up"
                style={{ animationDelay: "1s" }}
              >
                <a href="#collections" className="btn-elegant text-center">
                  Explorar Colecao
                </a>
                <a href="#about" className="btn-outline-elegant text-center">
                  Nossa Historia
                </a>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-fade-in"
            style={{ animationDelay: "1.5s" }}
          >
            <span className="font-body text-xs tracking-widest uppercase text-[var(--muted-foreground)]">Scroll</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--primary)] to-transparent" />
          </div>

          {/* Decorative floating elements */}
          <div className="absolute top-1/4 right-20 w-32 h-32 rounded-full bg-[var(--primary)]/10 blur-3xl animate-float hidden lg:block" />
          <div
            className="absolute bottom-1/4 right-40 w-48 h-48 rounded-full bg-[var(--accent)]/10 blur-3xl animate-float hidden lg:block"
            style={{ animationDelay: "1s" }}
          />
        </section>

        {/* Collections Section */}
        <section
          id="collections"
          ref={collectionsRef}
          className="section-padding bg-[var(--secondary)]"
        >
          <div className="container mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <div className="text-center mb-16 md:mb-24">
              <span className="font-body text-xs tracking-[0.3em] uppercase text-[var(--muted-foreground)]">
                Nossas Colecoes
              </span>
              <h2
                className={`font-display text-4xl md:text-6xl mt-4 text-[var(--foreground)] transition-all duration-1000 ${
                  collectionsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                Explore a <span className="italic text-[var(--primary)]">Elegancia</span>
              </h2>
            </div>

            {/* Collections Grid */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {collections.map((collection, index) => (
                <article
                  key={collection.id}
                  className={`group cursor-pointer transition-all duration-700 ${
                    collectionsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden mb-6 aspect-[3/4]">
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-[var(--foreground)]/0 group-hover:bg-[var(--foreground)]/20 transition-colors duration-500" />

                    {/* Hover Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="btn-elegant flex items-center gap-2">
                        Ver Colecao
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <span className="font-body text-xs tracking-widest uppercase text-[var(--muted-foreground)]">
                      {collection.subtitle}
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
                      {collection.title}
                    </h3>
                    <p className="font-body text-[var(--muted-foreground)] text-sm leading-relaxed">
                      {collection.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* About Section - Nossa Essencia */}
        <section
          id="about"
          ref={aboutRef}
          className="section-padding bg-[var(--background)] relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--accent)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="container mx-auto px-6 lg:px-12 relative">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Left Content */}
              <div>
                <span className="font-body text-xs tracking-[0.3em] uppercase text-[var(--muted-foreground)]">
                  Nossa Essencia
                </span>
                <h2
                  className={`font-display text-4xl md:text-5xl lg:text-6xl mt-4 mb-8 text-[var(--foreground)] transition-all duration-1000 ${
                    aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  Onde a <span className="italic text-[var(--primary)]">Natureza</span> encontra o{" "}
                  <span className="italic text-[var(--accent)]">Estilo</span>
                </h2>

                <div
                  className={`space-y-6 text-[var(--muted-foreground)] transition-all duration-1000 delay-200 ${
                    aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <p className="text-lg leading-relaxed">
                    A D&apos; flor elegance nasceu do desejo de criar pecas que celebram a feminilidade em sua forma mais autentica e elegante.
                  </p>
                  <p className="leading-relaxed">
                    Inspiradas pela beleza das flores e pela sofisticacao atemporal, nossas criacoes trazem conforto e estilo para mulheres que valorizam qualidade e exclusividade.
                  </p>
                </div>

                <div
                  className={`mt-10 flex flex-wrap gap-8 transition-all duration-1000 delay-400 ${
                    aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <div className="text-center">
                    <span className="font-display text-4xl text-[var(--primary)]">5+</span>
                    <p className="font-body text-sm text-[var(--muted-foreground)] mt-1">Anos de historia</p>
                  </div>
                  <div className="text-center">
                    <span className="font-display text-4xl text-[var(--primary)]">1000+</span>
                    <p className="font-body text-sm text-[var(--muted-foreground)] mt-1">Clientes felizes</p>
                  </div>
                  <div className="text-center">
                    <span className="font-display text-4xl text-[var(--primary)]">100%</span>
                    <p className="font-body text-sm text-[var(--muted-foreground)] mt-1">Pecas exclusivas</p>
                  </div>
                </div>
              </div>

              {/* Right Content - Features Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className={`card-elegant transition-all duration-700 ${
                      aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                    }`}
                    style={{ transitionDelay: `${index * 100 + 300}ms` }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4 text-[var(--primary)]">
                      {feature.icon}
                    </div>
                    <h3 className="font-display text-xl mb-2 text-[var(--foreground)]">{feature.title}</h3>
                    <p className="font-body text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section
          id="contact"
          ref={newsletterRef}
          className="section-padding bg-[var(--foreground)] text-[var(--background)] relative overflow-hidden"
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-40 h-40 border border-[var(--background)] rounded-full" />
            <div className="absolute top-20 left-20 w-40 h-40 border border-[var(--background)] rounded-full" />
            <div className="absolute bottom-10 right-10 w-60 h-60 border border-[var(--background)] rounded-full" />
            <div className="absolute bottom-20 right-20 w-60 h-60 border border-[var(--background)] rounded-full" />
          </div>

          <div className="container mx-auto px-6 lg:px-12 relative">
            <div className="max-w-2xl mx-auto text-center">
              <span
                className={`font-body text-xs tracking-[0.3em] uppercase text-[var(--primary)] transition-all duration-700 ${
                  newsletterVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                Fique por dentro
              </span>

              <h2
                className={`font-display text-4xl md:text-5xl lg:text-6xl mt-4 mb-6 transition-all duration-700 delay-100 ${
                  newsletterVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                Receba <span className="italic text-[var(--primary)]">Novidades</span>
              </h2>

              <p
                className={`text-[var(--background)]/70 mb-10 transition-all duration-700 delay-200 ${
                  newsletterVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                Cadastre-se para receber em primeira mao lancamentos exclusivos, promocoes especiais e tendencias de moda.
              </p>

              <form
                onSubmit={handleSubmit}
                className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${
                  newsletterVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <div className="relative flex-1 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu melhor e-mail"
                    required
                    className="w-full px-6 py-4 bg-[var(--background)]/10 border border-[var(--background)]/20 text-[var(--background)] placeholder:text-[var(--background)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors duration-300 font-body"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitted}
                  className="px-8 py-4 bg-[var(--primary)] text-[var(--background)] font-body font-medium tracking-wider uppercase text-sm transition-all duration-500 hover:shadow-[0_0_40px_var(--primary)] hover:scale-105 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitted ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Inscrito!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Inscrever
                    </>
                  )}
                </button>
              </form>

              <p
                className={`text-[var(--background)]/40 text-xs mt-6 transition-all duration-700 delay-400 ${
                  newsletterVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                Respeitamos sua privacidade. Cancele a qualquer momento.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--secondary)] section-padding">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href="/landing" className="inline-block mb-6">
                <div className="flex flex-col items-start">
                  <span className="font-display text-3xl tracking-wide text-[var(--foreground)]">D&apos; flor</span>
                  <span className="font-body text-xs tracking-[0.4em] uppercase text-[var(--muted-foreground)] -mt-1">
                    elegance
                  </span>
                </div>
              </Link>
              <p className="font-body text-[var(--muted-foreground)] text-sm leading-relaxed mb-6">
                Celebrando a feminilidade com elegancia e sofisticacao desde 2019.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--primary)] hover:text-[var(--background)] transition-colors duration-300"
                  aria-label="Instagram"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--primary)] hover:text-[var(--background)] transition-colors duration-300"
                  aria-label="Facebook"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-6">Navegacao</h4>
              <nav className="flex flex-col gap-3">
                {["Inicio", "Colecoes", "Novidades", "Sobre", "Contato"].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="font-body text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-300"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-6">Atendimento</h4>
              <nav className="flex flex-col gap-3">
                {["Politica de Troca", "Formas de Pagamento", "Prazo de Entrega", "Rastrear Pedido", "FAQ"].map(
                  (link) => (
                    <a
                      key={link}
                      href="#"
                      className="font-body text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-300"
                    >
                      {link}
                    </a>
                  )
                )}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-6">Contato</h4>
              <div className="space-y-4">
                <a
                  href="tel:+5511999999999"
                  className="flex items-center gap-3 font-body text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  (11) 99999-9999
                </a>
                <a
                  href="mailto:contato@dflorelegance.com.br"
                  className="flex items-center gap-3 font-body text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  contato@dflorelegance.com.br
                </a>
                <div className="flex items-start gap-3 font-body text-sm text-[var(--muted-foreground)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>
                    Rua das Flores, 123
                    <br />
                    Sao Paulo - SP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-xs text-[var(--muted-foreground)]">
              &copy; {new Date().getFullYear()} D&apos; flor elegance. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="font-body text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-300"
              >
                Termos de Uso
              </a>
              <a
                href="#"
                className="font-body text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-300"
              >
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
