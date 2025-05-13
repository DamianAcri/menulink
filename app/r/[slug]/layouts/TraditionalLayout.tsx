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
import React from 'react';
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";

// Si existe FeedbackSection y Footer, los importamos dinámicamente solo en entorno cliente
let FeedbackSection: any = null;
let Footer: any = null;
if (typeof window !== 'undefined') {
  try { FeedbackSection = (window as any).__FeedbackSection__ || null; } catch {}
  try { Footer = (window as any).__Footer__ || null; } catch {}
}

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

const COLORS = {
  burgundy: "#6D2E46",
  gold: "#D4AF37",
  cream: "#FFF8E7",
  dark: "#2C1A1D",
  light: "#F9F5F1",
};

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
  const sections = [
    { id: 'menu', label: 'Menú' },
    ...(showReservationForm ? [{ id: 'reserva', label: 'Reservas' }] : []),
    { id: 'contacto', label: 'Contacto' },
    ...(restaurant.delivery_links && restaurant.delivery_links.length > 0 ? [{ id: 'delivery', label: 'Delivery' }] : []),
    { id: 'feedback', label: 'Opiniones' },
  ];

  return (
    <main className="min-h-screen bg-[#F9F5F1]" style={{ fontFamily: 'Inter, sans-serif', color: COLORS.dark }}>
      <SessionTracker restaurantId={restaurant.id} />
      <Navigation
        sections={sections}
        themeColors={{
          primary: COLORS.burgundy,
          secondary: COLORS.gold,
          background: COLORS.light,
          text: COLORS.dark,
        }}
        logoUrl={logoUrl}
        restaurantName={restaurant.name}
        enableLanguageSelector={enableLanguageSelector}
        defaultLanguage={defaultLanguage}
      />
      {/* HEADER HERO NUEVO */}
      <header
        className="relative h-screen min-h-[500px] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: coverUrl ? `url(${coverUrl})` : undefined }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
          <div className="text-white text-2xl font-bold tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>{restaurant.name}</div>
          <ul className="hidden md:flex space-x-8 text-white uppercase text-sm tracking-widest">
            <li><a href="#menu" className="hover:text-amber-200 transition-colors">Menú</a></li>
            {showReservationForm && <li><a href="#reserva" className="hover:text-amber-200 transition-colors">Reservas</a></li>}
            <li><a href="#contacto" className="hover:text-amber-200 transition-colors">Contacto</a></li>
            {restaurant.delivery_links && restaurant.delivery_links.length > 0 && <li><a href="#delivery" className="hover:text-amber-200 transition-colors">Delivery</a></li>}
            {typeof FeedbackSection === 'function' && <li><a href="#feedback" className="hover:text-amber-200 transition-colors">Opiniones</a></li>}
          </ul>
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          {logoUrl && (
            <div className="w-40 h-40 rounded-full bg-white/90 flex items-center justify-center shadow-lg mb-8 border-4 border-[#FFF8E7]">
              <img src={logoUrl} alt={restaurant.name} className="object-contain w-32 h-32" />
            </div>
          )}
          <div className="border-2 border-white/30 p-8 md:p-12 max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-widest uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>{restaurant.name}</h1>
            <div className="w-16 h-px bg-amber-200 mx-auto my-6"></div>
            {restaurant.description && (
              <p className="text-lg md:text-xl font-light tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>{restaurant.description}</p>
            )}
          </div>
          <div className="mt-16 animate-bounce">
            <a href="#menu" aria-label="Scroll down">
              <svg className="h-8 w-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
          </div>
        </div>
      </header>

      {/* MENU SECTION */}
      <section id="menu" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light uppercase tracking-widest" style={{ fontFamily: 'Playfair Display, serif' }}>Carta</h2>
          <div className="w-16 h-px bg-amber-800/40 mx-auto my-6"></div>
          <p className="text-lg text-gray-600 italic">Nuestro Menú</p>
        </div>
        <MenuSection
          categories={restaurant.menu_categories}
          themeColors={{
            primary: COLORS.burgundy,
            secondary: COLORS.gold,
            background: COLORS.cream,
            text: COLORS.dark,
          }}
          restaurantId={restaurant.id}
          layoutName="traditional"
        />
      </section>

      {/* RESERVAS */}
      {showReservationForm && (
        <section id="reserva" className="py-24 px-4 md:px-8 bg-[#2a2a2a] text-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light uppercase tracking-widest" style={{ fontFamily: 'Playfair Display, serif' }}>Reservas</h2>
              <div className="w-16 h-px bg-amber-200 mx-auto my-6"></div>
              <p className="text-lg italic">Reserva tu mesa</p>
            </div>
            <div className="bg-transparent">
              <ReservationSection
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                themeColors={{
                  primary: COLORS.burgundy,
                  secondary: COLORS.gold,
                  background: COLORS.light,
                  text: COLORS.dark,
                }}
                showReservationForm={showReservationForm}
              />
            </div>
          </div>
        </section>
      )}

      {/* DELIVERY SECTION */}
      {restaurant.delivery_links && restaurant.delivery_links.length > 0 && (
        <section id="delivery" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light uppercase tracking-widest" style={{ fontFamily: 'Playfair Display, serif' }}>Delivery</h2>
            <div className="w-16 h-px bg-amber-800/40 mx-auto my-6"></div>
            <p className="text-lg text-gray-600 italic">Pedir a domicilio</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <DeliveryLinks
              links={restaurant.delivery_links}
              themeColors={{
                primary: COLORS.burgundy,
                secondary: COLORS.gold,
                background: COLORS.cream,
                text: COLORS.dark,
              }}
              restaurantId={restaurant.id}
              layoutName="traditional"
            />
          </div>
        </section>
      )}

      {/* OPINIONES */}
      {typeof FeedbackSection === 'function' && (
        <section id="feedback" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light uppercase tracking-widest" style={{ fontFamily: 'Playfair Display, serif' }}>Opiniones</h2>
            <div className="w-16 h-px bg-amber-800/40 mx-auto my-6"></div>
            <p className="text-lg text-gray-600 italic">Lo que opinan nuestros clientes</p>
          </div>
          <FeedbackSection restaurantId={restaurant.id} />
        </section>
      )}

      {/* CONTACTO */}
      <section id="contacto" className="py-24 px-4 md:px-8 bg-[#f8f5f0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light uppercase tracking-widest" style={{ fontFamily: 'Playfair Display, serif' }}>Contacto</h2>
            <div className="w-16 h-px bg-amber-800/40 mx-auto my-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <ContactSection restaurant={restaurant} themeColors={{
              primary: COLORS.burgundy,
              secondary: COLORS.gold,
              background: COLORS.cream,
              text: COLORS.dark,
            }} />
            {/* Aquí puedes añadir el bloque de horarios y ubicación si lo tienes en tu ContactSection */}
          </div>
        </div>
      </section>

      {/* SOCIAL LINKS */}
      {restaurant.social_links && restaurant.social_links.length > 0 && (
        <div className="flex justify-center gap-6 py-8">
          <SocialLinks
            links={restaurant.social_links}
            themeColors={{
              primary: COLORS.gold,
              secondary: COLORS.burgundy,
              background: COLORS.light,
              text: COLORS.dark,
            }}
            restaurantId={restaurant.id}
            layoutName="traditional"
          />
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#2C1A1D] text-[#FFF8E7] py-16 px-4 md:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-lg font-light uppercase tracking-wider mb-6">Contacto</h3>
              <p className="mb-2 text-gray-300">{restaurant.contact_info?.address}</p>
              <p className="mb-2 text-gray-300">{restaurant.contact_info?.phone}</p>
              <p className="text-gray-300">{restaurant.contact_info?.email}</p>
            </div>
            <div>
              <h3 className="text-lg font-light uppercase tracking-wider mb-6">Horario</h3>
              <p className="text-gray-300">{restaurant.schedule || 'Consultar horarios en el local'}</p>
            </div>
            <div>
              <h3 className="text-lg font-light uppercase tracking-wider mb-6">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-amber-200 transition-colors">Aviso legal</a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-amber-200 transition-colors">Política de privacidad</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p className="text-sm tracking-wider">© {new Date().getFullYear()} {restaurant.name} · Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </main>
  );
}