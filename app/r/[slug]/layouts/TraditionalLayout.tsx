"use client";

import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/Header';
import MenuSection from '../components/MenuSection';
import ContactSection from '../components/ContactSection';
import ReservationSection from '../components/ReservationSection';
import SocialLinks from '../components/SocialLinks';
import DeliveryLinks from '../components/DeliveryLinks';
import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import SessionTracker from '../components/SessionTracker';

interface TraditionalLayoutProps {
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

export default function TraditionalLayout({
  restaurant,
  coverUrl,
  logoUrl,
  themeColors,
  fontFamily,
  showReservationForm = true,
  enableLanguageSelector = false,
  defaultLanguage = 'en',
}: TraditionalLayoutProps) {
  const [activeSection, setActiveSection] = useState('menu');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Secciones para Navigation
  const sections = [
    { id: 'menu', label: 'Menú' },
    ...(showReservationForm ? [{ id: 'reserva', label: 'Reservas' }] : []),
    { id: 'contacto', label: 'Contacto' },
    ...(restaurant.delivery_links && restaurant.delivery_links.length > 0 ? [{ id: 'delivery', label: 'Delivery' }] : []),
  ];

  return (
    <main className="min-h-screen bg-white" style={{ color: themeColors.text, fontFamily: 'Georgia, serif' }}>
      {/* Session tracking component */}
      <SessionTracker restaurantId={restaurant.id} />
      
      {/* Selector de idioma y navegación */}
      <Navigation
        sections={sections}
        themeColors={themeColors}
        logoUrl={logoUrl}
        restaurantName={restaurant.name}
        enableLanguageSelector={enableLanguageSelector}
        defaultLanguage={defaultLanguage}
      />
      {/* LAYOUT TRADICIONAL - Texto distintivo para confirmar que se ha aplicado */}
      <div className="fixed top-0 left-0 z-50 bg-red-700 text-white text-xs px-2 py-1">LAYOUT TRADICIONAL</div>
      
      {/* Header with large background image */}
      <div className="relative">
        {coverUrl ? (
          <div className="h-64 md:h-96 w-full relative">
            <Image
              src={coverUrl}
              alt={restaurant.name}
              fill
              className="object-cover brightness-50"
              priority
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              {logoUrl && (
                <div className="mb-4 bg-white/90 p-3 rounded-full">
                  <Image
                    src={logoUrl}
                    alt={restaurant.name}
                    width={80}
                    height={80}
                    className="object-contain rounded-full"
                  />
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-shadow-lg">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="max-w-xl text-center text-lg md:text-xl text-white/90 text-shadow">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 h-64 flex items-center justify-center">
            <div className="text-center p-8">
              {logoUrl && (
                <div className="mx-auto mb-4 bg-white p-3 rounded-full w-20 h-20 flex items-center justify-center">
                  <Image
                    src={logoUrl}
                    alt={restaurant.name}
                    width={60}
                    height={60}
                    className="object-contain rounded-full"
                  />
                </div>
              )}
              <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="max-w-xl mx-auto text-white/80 text-lg">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation overlaid on the bottom of the header image */}
        <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-md">
          <div className="max-w-5xl mx-auto">
            {/* Mobile navigation */}
            <div className="md:hidden">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-medium">{restaurant.name}</h2>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    )}
                  </svg>
                </button>
              </div>
              
              {/* Mobile menu dropdown */}
              <div className={`${isMenuOpen ? 'block' : 'hidden'} border-t border-gray-200`}>
                <div className="flex flex-col">
                  <a 
                    href="#menu" 
                    className={`px-4 py-3 ${activeSection === 'menu' ? 'bg-gray-50 font-medium' : ''}`}
                    style={{ color: activeSection === 'menu' ? themeColors.primary : '' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Menú
                  </a>
                  
                  {/* Only show reservation link if reservations are enabled */}
                  {showReservationForm && (
                    <a 
                      href="#reserva" 
                      className={`px-4 py-3 ${activeSection === 'reserva' ? 'bg-gray-50 font-medium' : ''}`}
                      style={{ color: activeSection === 'reserva' ? themeColors.primary : '' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Reservas
                    </a>
                  )}
                  
                  <a 
                    href="#contacto" 
                    className={`px-4 py-3 ${activeSection === 'contacto' ? 'bg-gray-50 font-medium' : ''}`}
                    style={{ color: activeSection === 'contacto' ? themeColors.primary : '' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contacto
                  </a>
                  <a 
                    href="#delivery" 
                    className={`px-4 py-3 ${activeSection === 'delivery' ? 'bg-gray-50 font-medium' : ''}`}
                    style={{ color: activeSection === 'delivery' ? themeColors.primary : '' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Delivery
                  </a>
                </div>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex justify-center">
              <div className="flex">
                <a 
                  href="#menu" 
                  className={`px-6 py-4 ${activeSection === 'menu' ? 'border-b-2 font-medium' : 'hover:bg-gray-50'}`}
                  style={{ borderColor: activeSection === 'menu' ? themeColors.primary : 'transparent' }}
                >
                  Nuestro Menú
                </a>
                
                {/* Only show reservation link if reservations are enabled */}
                {showReservationForm && (
                  <a 
                    href="#reserva" 
                    className={`px-6 py-4 ${activeSection === 'reserva' ? 'border-b-2 font-medium' : 'hover:bg-gray-50'}`}
                    style={{ borderColor: activeSection === 'reserva' ? themeColors.primary : 'transparent' }}
                  >
                    Reservas
                  </a>
                )}
                
                <a 
                  href="#contacto" 
                  className={`px-6 py-4 ${activeSection === 'contacto' ? 'border-b-2 font-medium' : 'hover:bg-gray-50'}`}
                  style={{ borderColor: activeSection === 'contacto' ? themeColors.primary : 'transparent' }}
                >
                  Contacto
                </a>
                <a 
                  href="#delivery" 
                  className={`px-6 py-4 ${activeSection === 'delivery' ? 'border-b-2 font-medium' : 'hover:bg-gray-50'}`}
                  style={{ borderColor: activeSection === 'delivery' ? themeColors.primary : 'transparent' }}
                >
                  Delivery
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main sections with traditional serif font */}
      <div className="max-w-5xl mx-auto px-4 pt-14 pb-20" style={{ fontFamily: 'Georgia, serif' }}>
        {/* Menu section with elegant styling */}
        <section id="menu" className="mb-20">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: themeColors.primary }}
            >
              Nuestro Menú
            </h2>
            <div className="w-24 h-1 mx-auto" style={{ backgroundColor: themeColors.secondary }}></div>
          </div>
          
          {/* Menu with traditional styling */}
          <div className="bg-white border-2 border-gray-200 rounded-md p-8 shadow-md">
            <MenuSection 
              categories={restaurant.menu_categories} 
              themeColors={{
                ...themeColors,
                text: '#333333'
              }} 
              restaurantId={restaurant.id}
              layoutName="traditional"
            />
          </div>
        </section>
        
        {/* Only show reservation section if enabled */}
        {showReservationForm && (
          <>
            {/* Ornamental divider */}
            <div className="flex items-center justify-center my-16">
              <div className="w-1/4 h-px bg-gray-300"></div>
              <div className="mx-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </div>
              <div className="w-1/4 h-px bg-gray-300"></div>
            </div>
            
            {/* Reservation section */}
            <section id="reserva" className="mb-20">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-2"
                  style={{ color: themeColors.primary }}
                >
                  Reserva Tu Mesa
                </h2>
                <div className="w-24 h-1 mx-auto" style={{ backgroundColor: themeColors.secondary }}></div>
              </div>
              
              {/* Reservation form with traditional styling */}
              <div className="bg-white border-2 border-gray-200 rounded-md p-8 shadow-md">
                <ReservationSection
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                  themeColors={themeColors}
                  showReservationForm={showReservationForm}
                />
              </div>
            </section>
          </>
        )}
        
        {/* Ornamental divider */}
        <div className="flex items-center justify-center my-16">
          <div className="w-1/4 h-px bg-gray-300"></div>
          <div className="mx-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </div>
          <div className="w-1/4 h-px bg-gray-300"></div>
        </div>
        
        {/* Contact section */}
        <section id="contacto" className="mb-20">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: themeColors.primary }}
            >
              Contacto & Ubicación
            </h2>
            <div className="w-24 h-1 mx-auto" style={{ backgroundColor: themeColors.secondary }}></div>
          </div>
          
          {/* Contact info with traditional styling */}
          <div className="bg-white border-2 border-gray-200 rounded-md p-8 shadow-md">
            <ContactSection restaurant={restaurant} themeColors={themeColors} />
          </div>
        </section>
        
        {/* Only show delivery section if there are delivery links */}
        {restaurant.delivery_links && restaurant.delivery_links.length > 0 && (
          <>
            {/* Ornamental divider */}
            <div className="flex items-center justify-center my-16">
              <div className="w-1/4 h-px bg-gray-300"></div>
              <div className="mx-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </div>
              <div className="w-1/4 h-px bg-gray-300"></div>
            </div>
            
            {/* Delivery section */}
            <section id="delivery" className="mb-10">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-2"
                  style={{ color: themeColors.primary }}
                >
                  Servicio a Domicilio
                </h2>
                <div className="w-24 h-1 mx-auto" style={{ backgroundColor: themeColors.secondary }}></div>
              </div>
              
              {/* Delivery links with traditional styling */}
              <div className="bg-white border-2 border-gray-200 rounded-md p-8 shadow-md">
                <DeliveryLinks 
                  links={restaurant.delivery_links} 
                  themeColors={themeColors} 
                  restaurantId={restaurant.id}
                  layoutName="traditional"
                />
              </div>
            </section>
          </>
        )}
      </div>
      
      {/* Footer with traditional styling */}
      <footer className="py-10" style={{ backgroundColor: themeColors.secondary }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Restaurant info */}
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">{restaurant.name}</h3>
              {restaurant.contact_info && restaurant.contact_info.address && (
                <p className="text-white/70">{restaurant.contact_info.address}</p>
              )}
              {restaurant.contact_info && restaurant.contact_info.phone && (
                <p className="text-white/70">Tel: {restaurant.contact_info.phone}</p>
              )}
            </div>
            
            {/* Social links */}
            {restaurant.social_links && restaurant.social_links.length > 0 && (
              <div className="text-center md:text-right">
                <h4 className="text-sm font-bold uppercase tracking-wide mb-4 text-white">Síguenos</h4>
                <SocialLinks 
                  links={restaurant.social_links}
                  themeColors={{
                    ...themeColors,
                    primary: '#ffffff'
                  }}
                  restaurantId={restaurant.id}
                  layoutName="traditional"
                />
              </div>
            )}
          </div>
          
          {/* Copyright */}
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/70">© {new Date().getFullYear()} {restaurant.name}. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs text-white/50">
              Desarrollado por{' '}
              <Link href="/" className="text-white hover:text-white/80 transition-colors">
                MenuLink
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}