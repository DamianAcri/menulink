"use client";

import Image from 'next/image';
import Link from 'next/link';
import MenuSection from '../components/MenuSection';
import ContactSection from '../components/ContactSection';
import ReservationSection from '../components/ReservationSection';
import SocialLinks from '../components/SocialLinks';
import DeliveryLinks from '../components/DeliveryLinks';
import Navigation from '../components/Navigation';
import { useState, useEffect } from 'react';
import SessionTracker from '../components/SessionTracker';

interface VisualLayoutProps {
  restaurant: any;
  coverUrl?: string;
  logoUrl?: string;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fontFamily: string;
  showReservationForm?: boolean;
  enableLanguageSelector?: boolean;
  defaultLanguage?: string;
}

export default function VisualLayout({
  restaurant,
  coverUrl,
  logoUrl,
  themeColors,
  fontFamily,
  showReservationForm = true,
  enableLanguageSelector = false,
  defaultLanguage = 'en',
}: VisualLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('menu');

  // Handle scroll for navigation styling
  useEffect(() => {
    const handleScroll = () => {
      // Add background to nav when scrolled
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Track active section
      const sections = document.querySelectorAll('section[id]');
      let currentActiveSection = activeSection;
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < window.innerHeight / 3) {
          currentActiveSection = section.id;
        }
      });
      
      if (currentActiveSection !== activeSection) {
        setActiveSection(currentActiveSection);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  const sections = [
    { id: 'menu', label: 'Menú' },
    ...(showReservationForm ? [{ id: 'reserva', label: 'Reservas' }] : []),
    { id: 'contacto', label: 'Contacto' },
    ...(restaurant.delivery_links && restaurant.delivery_links.length > 0 ? [{ id: 'delivery', label: 'Delivery' }] : []),
  ];
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black" style={{ fontFamily }}>
      {/* Session tracking component */}
      <SessionTracker restaurantId={restaurant.id} />
      
      <Navigation
        sections={sections}
        themeColors={themeColors}
        logoUrl={logoUrl}
        restaurantName={restaurant.name}
        enableLanguageSelector={enableLanguageSelector}
        defaultLanguage={defaultLanguage}
      />
      {/* LAYOUT VISUAL - Texto distintivo para confirmar que se ha aplicado */}
      <div className="fixed top-0 left-0 z-50 bg-black text-white text-xs px-2 py-1">LAYOUT VISUAL</div>
      
      {/* Hero section with full-screen background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background image or gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: coverUrl ? `url(${coverUrl})` : 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070")',
            filter: 'brightness(0.4)'
          }}
        />

        {/* Moving particles background for visual effect */}
        <div className="absolute inset-0 z-10">
          <div className="absolute top-1/4 left-1/5 w-40 h-40 rounded-full bg-indigo-500/20 blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 text-center">
          {/* Logo with glow effect */}
          {logoUrl && (
            <div className="w-32 h-32 mx-auto mb-8">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                <Image
                  src={logoUrl}
                  alt={restaurant.name}
                  width={128}
                  height={128}
                  className="relative z-10 object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Restaurant name with visual styling */}
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight"
            style={{ 
              textShadow: '0 0 15px rgba(255,255,255,0.5)'
            }}
          >
            {restaurant.name}
          </h1>
          
          {/* Description with gradient text */}
          {restaurant.description && (
            <p 
              className="text-xl md:text-2xl max-w-2xl mx-auto bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-pink-200"
            >
              {restaurant.description}
            </p>
          )}
          
          {/* Scroll down indicator */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center animate-bounce">
            <a 
              href="#menu"
              className="text-white flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="mb-2 text-sm font-light">DESCUBRIR</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>
      </section>
      
      {/* Sticky navigation with glass morphism */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? 'bg-black/50 backdrop-blur-xl py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo/name */}
            <Link href="#" className="flex items-center space-x-3 text-white">
              <span className="text-xl font-medium">{restaurant.name}</span>
            </Link>
            
            {/* Desktop navigation */}
            <ul className="hidden md:flex space-x-8">
              <li>
                <a 
                  href="#menu" 
                  className={`text-sm font-medium uppercase tracking-wider transition-colors ${
                    activeSection === 'menu' 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  style={{
                    borderBottom: activeSection === 'menu' ? `2px solid ${themeColors.primary}` : 'none',
                    paddingBottom: '0.25rem'
                  }}
                >
                  Menú
                </a>
              </li>
              
              {/* Only show reservation link if reservations are enabled */}
              {showReservationForm && (
                <li>
                  <a 
                    href="#reserva" 
                    className={`text-sm font-medium uppercase tracking-wider transition-colors ${
                      activeSection === 'reserva' 
                        ? 'text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                    style={{
                      borderBottom: activeSection === 'reserva' ? `2px solid ${themeColors.primary}` : 'none',
                      paddingBottom: '0.25rem'
                    }}
                  >
                    Reservas
                  </a>
                </li>
              )}
              
              <li>
                <a 
                  href="#contacto" 
                  className={`text-sm font-medium uppercase tracking-wider transition-colors ${
                    activeSection === 'contacto' 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  style={{
                    borderBottom: activeSection === 'contacto' ? `2px solid ${themeColors.primary}` : 'none',
                    paddingBottom: '0.25rem'
                  }}
                >
                  Contacto
                </a>
              </li>
              <li>
                <a 
                  href="#delivery" 
                  className={`text-sm font-medium uppercase tracking-wider transition-colors ${
                    activeSection === 'delivery' 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  style={{
                    borderBottom: activeSection === 'delivery' ? `2px solid ${themeColors.primary}` : 'none',
                    paddingBottom: '0.25rem'
                  }}
                >
                  Delivery
                </a>
              </li>
            </ul>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Menu</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu dropdown with blur backdrop */}
        <div 
          className={`md:hidden fixed top-[60px] left-0 right-0 bg-black/80 backdrop-blur-lg transition-all duration-300 ${
            isMenuOpen ? 'max-h-64 py-6' : 'max-h-0 overflow-hidden'
          }`}
        >
          <ul className="flex flex-col space-y-6 px-8">
            <li>
              <a 
                href="#menu" 
                className="block text-lg font-medium text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Menú
              </a>
            </li>
            
            {/* Only show reservation link if reservations are enabled */}
            {showReservationForm && (
              <li>
                <a 
                  href="#reserva" 
                  className="block text-lg font-medium text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reservas
                </a>
              </li>
            )}
            
            <li>
              <a 
                href="#contacto" 
                className="block text-lg font-medium text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </a>
            </li>
            <li>
              <a 
                href="#delivery" 
                className="block text-lg font-medium text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Delivery
              </a>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Menu section with angled divider */}
      <section id="menu" className="relative py-32 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4">
          {/* Visually striking heading */}
          <h2 
            className="text-center text-5xl font-bold mb-16 text-white"
            style={{
              textShadow: '0 0 20px rgba(255,255,255,0.3)'
            }}
          >
            <span className="text-sm uppercase tracking-[0.3em] block mb-3 opacity-70">Descubre</span>
            Nuestro Menú
          </h2>
          
          {/* Modern card design for menu */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl shadow-purple-500/10">
            <MenuSection 
              categories={restaurant.menu_categories} 
              themeColors={{
                ...themeColors,
                primary: '#c084fc', // purple-400
                text: '#ffffff'
              }} 
              restaurantId={restaurant.id}
              layoutName="visual"
            />
          </div>
        </div>
        
        {/* Curved divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <svg 
            viewBox="0 0 500 150" 
            preserveAspectRatio="none" 
            className="h-full w-full"
          >
            <path 
              d="M0.00,49.98 C150.00,150.00 271.49,-50.00 500.00,49.98 L500.00,0.00 L0.00,0.00 Z" 
              style={{ fill: '#111827', stroke: 'none' }}
            />
          </svg>
        </div>
      </section>
      
      {/* Reservation section - only show if enabled */}
      {showReservationForm && (
        <section id="reserva" className="relative py-32 bg-gradient-to-b from-gray-800 to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-16">
              <h2 
                className="text-4xl lg:text-5xl font-bold mb-8 lg:mb-0 text-white"
                style={{
                  textShadow: '0 0 20px rgba(255,255,255,0.3)'
                }}
              >
                <span className="text-sm uppercase tracking-[0.3em] block mb-3 opacity-70">Experiencia</span>
                Reserva Tu Mesa
              </h2>
              
              <p className="lg:max-w-md text-white/80 text-lg">
                Asegura tu lugar en nuestro restaurante. Reserva tu mesa y disfruta de una experiencia gastronómica incomparable.
              </p>
            </div>
            
            {/* Glass card for reservation form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl shadow-blue-500/10">
              <ReservationSection
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                themeColors={{
                  ...themeColors,
                  primary: '#60a5fa', // blue-400
                  text: '#ffffff'
                }}
                showReservationForm={showReservationForm}
              />
            </div>
          </div>
          
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
            <svg 
              viewBox="0 0 500 150" 
              preserveAspectRatio="none" 
              className="h-full w-full"
            >
              <path 
                d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" 
                style={{ fill: '#1f2937', stroke: 'none' }}
              />
            </svg>
          </div>
        </section>
      )}
      
      {/* Contact section */}
      <section id="contacto" className="relative py-32 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 
            className="text-center text-5xl font-bold mb-16 text-white"
            style={{
              textShadow: '0 0 20px rgba(255,255,255,0.3)'
            }}
          >
            <span className="text-sm uppercase tracking-[0.3em] block mb-3 opacity-70">Encuentranos</span>
            Contacto & Ubicación
          </h2>
          
          {/* Glass card for contact info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl shadow-emerald-500/10">
            <ContactSection 
              restaurant={restaurant} 
              themeColors={{
                ...themeColors,
                primary: '#34d399', // emerald-400
                text: '#ffffff'
              }} 
            />
          </div>
        </div>
      </section>
      
      {/* Only show Delivery section if there are delivery links */}
      {restaurant.delivery_links && restaurant.delivery_links.length > 0 && (
        <section id="delivery" className="relative py-32 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4">
            <h2 
              className="text-center text-5xl font-bold mb-16 text-white"
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.3)'
              }}
            >
              <span className="text-sm uppercase tracking-[0.3em] block mb-3 opacity-70">A Domicilio</span>
              Servicio de Delivery
            </h2>
            
            {/* Glass card for delivery links */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl shadow-amber-500/10 max-w-2xl mx-auto">
              <DeliveryLinks 
                links={restaurant.delivery_links}
                themeColors={{
                  ...themeColors,
                  primary: '#fbbf24', // amber-400
                  text: '#ffffff'
                }}
                restaurantId={restaurant.id}
                layoutName="visual"
              />
            </div>
          </div>
        </section>
      )}
      
      {/* Modern footer with glow effects */}
      <footer className="bg-black py-20 px-4 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="mb-8 md:mb-0">
              <h3 className="text-3xl font-bold mb-4">{restaurant.name}</h3>
              {restaurant.contact_info && restaurant.contact_info.address && (
                <p className="text-white/70">{restaurant.contact_info.address}</p>
              )}
            </div>
            
            {/* Social links */}
            {restaurant.social_links && restaurant.social_links.length > 0 && (
              <div>
                <h4 className="text-sm uppercase tracking-wider mb-4 text-white/70">Síguenos</h4>
                <SocialLinks 
                  links={restaurant.social_links}
                  themeColors={{
                    ...themeColors,
                    primary: '#ffffff'
                  }}
                  restaurantId={restaurant.id}
                  layoutName="visual"
                />
              </div>
            )}
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center">
            <p>© {new Date().getFullYear()} {restaurant.name}. Todos los derechos reservados.</p>
            <p className="mt-2 text-sm text-white/50">
              Diseñado con <span className="text-pink-500">♥</span> por{' '}
              <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                MenuLink
              </Link>
            </p>
          </div>
        </div>
      </footer>
      
      {/* Add some custom styles for animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: scale(1) translate(0px, 0px); }
          33% { transform: scale(1.1) translate(30px, -50px); }
          66% { transform: scale(0.9) translate(-20px, 20px); }
          100% { transform: scale(1) translate(0px, 0px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}