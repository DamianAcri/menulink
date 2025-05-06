"use client";

import Image from 'next/image';
import Link from 'next/link';
import MenuSection from '../components/MenuSection';
import ContactSection from '../components/ContactSection';
import ReservationSection from '../components/ReservationSection';
import SocialLinks from '../components/SocialLinks';
import DeliveryLinks from '../components/DeliveryLinks';
import Navigation from '../components/Navigation';
import SessionTracker from '../components/SessionTracker';
import { useState, useEffect } from 'react';

interface MinimalistLayoutProps {
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

export default function MinimalistLayout({
  restaurant,
  coverUrl,
  logoUrl,
  themeColors,
  fontFamily,
  showReservationForm = true,
  enableLanguageSelector = false,
  defaultLanguage = 'en',
}: MinimalistLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('menu');

  // Navigation scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentActiveSection = 'menu';
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < window.innerHeight / 3) {
          currentActiveSection = section.id;
        }
      });
      
      setActiveSection(currentActiveSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    { id: 'menu', label: 'Menú' },
    ...(showReservationForm ? [{ id: 'reserva', label: 'Reservas' }] : []),
    { id: 'contacto', label: 'Contacto' },
    ...(restaurant.delivery_links && restaurant.delivery_links.length > 0 ? [{ id: 'delivery', label: 'Delivery' }] : []),
  ];

  return (
    <main className="min-h-screen bg-white" style={{ color: themeColors.text, fontFamily }}>
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
      {/* LAYOUT MINIMALISTA - Texto distintivo para confirmar que se ha aplicado */}
      <div className="fixed top-0 left-0 z-50 bg-black text-white text-xs px-2 py-1">LAYOUT MINIMALISTA</div>
      
      {/* Fixed top navigation - extremely simple */}
      <nav className="fixed top-0 left-0 z-40 w-full bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
          {/* Logo/Name */}
          <div className="flex items-center space-x-3">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={restaurant.name}
                width={30}
                height={30}
                className="object-contain"
              />
            )}
            <span className="font-light tracking-wider text-lg">{restaurant.name}</span>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
          
          {/* Desktop navigation - simple text links */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#menu" 
              className={`text-sm hover:opacity-100 transition-opacity ${
                activeSection === 'menu' ? 'opacity-100 font-medium' : 'opacity-60'
              }`}
            >
              MENÚ
            </a>
            
            {/* Only show reservation link if reservations are enabled */}
            {showReservationForm && (
              <a 
                href="#reserva" 
                className={`text-sm hover:opacity-100 transition-opacity ${
                  activeSection === 'reserva' ? 'opacity-100 font-medium' : 'opacity-60'
                }`}
              >
                RESERVAS
              </a>
            )}
            
            <a 
              href="#contacto" 
              className={`text-sm hover:opacity-100 transition-opacity ${
                activeSection === 'contacto' ? 'opacity-100 font-medium' : 'opacity-60'
              }`}
            >
              CONTACTO
            </a>
            <a 
              href="#delivery" 
              className={`text-sm hover:opacity-100 transition-opacity ${
                activeSection === 'delivery' ? 'opacity-100 font-medium' : 'opacity-60'
              }`}
            >
              DELIVERY
            </a>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div 
          className={`md:hidden absolute w-full bg-white shadow-lg transition-all duration-300 ${
            isMenuOpen ? 'max-h-64 py-4' : 'max-h-0 overflow-hidden'
          }`}
        >
          <div className="flex flex-col space-y-4 px-4">
            <a 
              href="#menu" 
              className="py-2 text-sm"
              style={{ color: activeSection === 'menu' ? themeColors.primary : '' }}
              onClick={() => setIsMenuOpen(false)}
            >
              MENÚ
            </a>
            
            {/* Only show reservation link if reservations are enabled */}
            {showReservationForm && (
              <a 
                href="#reserva" 
                className="py-2 text-sm"
                style={{ color: activeSection === 'reserva' ? themeColors.primary : '' }}
                onClick={() => setIsMenuOpen(false)}
              >
                RESERVAS
              </a>
            )}
            
            <a 
              href="#contacto" 
              className="py-2 text-sm"
              style={{ color: activeSection === 'contacto' ? themeColors.primary : '' }}
              onClick={() => setIsMenuOpen(false)}
            >
              CONTACTO
            </a>
            <a 
              href="#delivery" 
              className="py-2 text-sm"
              style={{ color: activeSection === 'delivery' ? themeColors.primary : '' }}
              onClick={() => setIsMenuOpen(false)}
            >
              DELIVERY
            </a>
          </div>
        </div>
      </nav>
      
      {/* Simple header with restaurant name */}
      <header className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-light tracking-wide mb-6">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="max-w-xl mx-auto text-gray-600 text-sm">
              {restaurant.description}
            </p>
          )}
        </div>
      </header>
      
      {/* Content sections with minimal styling */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-24">
        {/* Menu Section */}
        <section id="menu">
          <h2 className="text-2xl font-light mb-8 text-center">MENÚ</h2>
          <MenuSection 
            categories={restaurant.menu_categories} 
            themeColors={themeColors} 
            restaurantId={restaurant.id}
            layoutName="minimalist"
          />
        </section>
        
        {/* Reservation Section - only show if enabled */}
        {showReservationForm && (
          <section id="reserva">
            <h2 className="text-2xl font-light mb-8 text-center">RESERVAS</h2>
            <div className="border border-gray-200 p-6">
              <ReservationSection
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                themeColors={themeColors}
                showReservationForm={showReservationForm}
              />
            </div>
          </section>
        )}
        
        {/* Contact Section */}
        <section id="contacto">
          <h2 className="text-2xl font-light mb-8 text-center">CONTACTO</h2>
          <ContactSection 
            restaurant={restaurant} 
            themeColors={themeColors} 
          />
        </section>
        
        {/* Only show Delivery section if there are delivery links */}
        {restaurant.delivery_links && restaurant.delivery_links.length > 0 && (
          <section id="delivery">
            <h2 className="text-2xl font-light mb-8 text-center">DELIVERY</h2>
            <div className="border border-gray-200 p-6">
              <DeliveryLinks 
                links={restaurant.delivery_links}
                themeColors={themeColors}
                restaurantId={restaurant.id}
                layoutName="minimalist"
              />
            </div>
          </section>
        )}
      </div>
      
      {/* Super minimalist footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          {/* Social links in a minimalist row */}
          {restaurant.social_links && restaurant.social_links.length > 0 && (
            <div className="mb-6">
              <SocialLinks 
                links={restaurant.social_links}
                themeColors={themeColors}
                restaurantId={restaurant.id}
                layoutName="minimalist"
              />
            </div>
          )}
          
          <p className="mt-4">© {new Date().getFullYear()} {restaurant.name}</p>
          <p className="mt-2 text-xs">
            <Link href="/" className="text-gray-400 hover:text-gray-600">MenuLink</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}