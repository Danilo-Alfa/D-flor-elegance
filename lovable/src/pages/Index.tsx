import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CollectionsSection from '@/components/CollectionsSection';
import AboutSection from '@/components/AboutSection';
import NewsletterSection from '@/components/NewsletterSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CollectionsSection />
        <AboutSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
