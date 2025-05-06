"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

function LanguageModal({ open, onSelect }: { open: boolean; onSelect: (lang: string) => void }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-xs w-full text-center">
        <h2 className="text-lg font-bold mb-4">{t('seleccionar_idioma')}</h2>
        <div className="flex justify-center gap-4 mb-4">
          <button onClick={() => onSelect('es')} className="focus:outline-none">
            <span role="img" aria-label="Español" className="text-3xl">🇪🇸</span>
            <div className="text-xs mt-1">{t('espanol')}</div>
          </button>
          <button onClick={() => onSelect('en')} className="focus:outline-none">
            <span role="img" aria-label="English" className="text-3xl">🇬🇧</span>
            <div className="text-xs mt-1">{t('ingles')}</div>
          </button>
          <button onClick={() => onSelect('fr')} className="focus:outline-none">
            <span role="img" aria-label="Français" className="text-3xl">🇫🇷</span>
            <div className="text-xs mt-1">{t('frances')}</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showLangModal, setShowLangModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (!savedLang) {
      // Detectar idioma navegador
      const navLang = navigator.language.slice(0, 2);
      if (["es", "en", "fr"].includes(navLang)) {
        setShowLangModal(true);
      } else {
        // Por defecto español
        i18n.changeLanguage('es');
        localStorage.setItem('lang', 'es');
      }
    } else {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  const handleSelectLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    setShowLangModal(false);
  };

  return (
    <div className="min-h-screen">
      <LanguageModal open={showLangModal} onSelect={handleSelectLang} />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">MenuLink</span>
              <span className="block text-blue-600 dark:text-blue-400">{t('hero_subtitle')}</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {t('hero_description')}
            </p>
            <div className="mt-10 flex justify-center">
              <div className="rounded-md shadow">
                <Link 
                  href="/auth/register" 
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  {t('cta_start_free')}
                </Link>
              </div>
              <div className="ml-3 rounded-md shadow">
                <Link
                  href="/demo"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 dark:text-blue-400 dark:bg-gray-800 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                >
                  {t('cta_view_demo')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">{t('features_title')}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {t('features_headline')}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              {t('features_description')}
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{t('feature_menu_title')}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                  {t('feature_menu_desc')}
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{t('feature_whatsapp_title')}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                  {t('feature_whatsapp_desc')}
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{t('feature_custom_title')}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                  {t('feature_custom_desc')}
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{t('feature_stats_title')}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                  {t('feature_stats_desc')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">{t('pricing_title')}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {t('pricing_headline')}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              {t('pricing_description')}
            </p>
          </div>

          <div className="mt-10 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="relative p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('plan_basic')}</h3>
                <p className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">{t('plan_basic_price')}</span>
                </p>
                <p className="mt-6 text-gray-500 dark:text-gray-400">{t('plan_basic_description')}</p>

                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_basic_feature1')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_basic_feature2')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_basic_feature3')}</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/register"
                className="mt-8 block w-full bg-gray-50 dark:bg-gray-700 py-3 px-6 border border-transparent rounded-md text-center font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {t('cta_start_free')}
              </Link>
            </div>

            <div className="relative p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('plan_pro')}</h3>
                <p className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">{t('plan_pro_price')}</span>
                  <span className="ml-1 text-xl font-semibold">{t('plan_pro_price_per_month')}</span>
                </p>
                <p className="mt-6 text-gray-500 dark:text-gray-400">{t('plan_pro_description')}</p>

                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_pro_feature1')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_pro_feature2')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_pro_feature3')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_pro_feature4')}</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/register"
                className="mt-8 block w-full bg-blue-600 py-3 px-6 border border-transparent rounded-md text-center font-medium text-white hover:bg-blue-700"
              >
                {t('cta_start_trial')}
              </Link>
            </div>

            <div className="relative p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('plan_premium')}</h3>
                <p className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">{t('plan_premium_price')}</span>
                  <span className="ml-1 text-xl font-semibold">{t('plan_premium_price_per_month')}</span>
                </p>
                <p className="mt-6 text-gray-500 dark:text-gray-400">{t('plan_premium_description')}</p>

                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_premium_feature1')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_premium_feature2')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_premium_feature3')}</span>
                  </li>
                  <li className="flex">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">{t('plan_premium_feature4')}</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/auth/register"
                className="mt-8 block w-full bg-blue-600 py-3 px-6 border border-transparent rounded-md text-center font-medium text-white hover:bg-blue-700"
              >
                {t('cta_start_trial')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">{t('testimonials_title')}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {t('testimonials_headline')}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300 italic">&quot;{t('testimonial1')}&quot;</p>
              <div className="mt-4 flex items-center">
                <div className="flex-shrink-0 rounded-full h-10 w-10 bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-bold">C</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Carlos Ramírez</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cafetería El Rincón</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300 italic">&quot;{t('testimonial2')}&quot;</p>
              <div className="mt-4 flex items-center">
                <div className="flex-shrink-0 rounded-full h-10 w-10 bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-bold">M</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">María González</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restaurante La Esquina</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 sm:col-span-2 lg:col-span-1">
              <p className="text-gray-600 dark:text-gray-300 italic">&quot;{t('testimonial3')}&quot;</p>
              <div className="mt-4 flex items-center">
                <div className="flex-shrink-0 rounded-full h-10 w-10 bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-bold">L</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Luis Hernández</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bar Urbano</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">{t('cta_ready')}</span>
            <span className="block text-blue-200">{t('cta_create_menu')}</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                {t('cta_start_now')}
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
              >
                {t('cta_contact_sales')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer_solutions')}</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="/features" className="text-base text-gray-300 hover:text-white">
                    {t('footer_features')}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-base text-gray-300 hover:text-white">
                    {t('footer_pricing')}
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="text-base text-gray-300 hover:text-white">
                    {t('footer_demo')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer_support')}</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="/help" className="text-base text-gray-300 hover:text-white">
                    {t('footer_help_center')}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-base text-gray-300 hover:text-white">
                    {t('footer_faq')}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-base text-gray-300 hover:text-white">
                    {t('footer_contact')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer_company')}</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="/about" className="text-base text-gray-300 hover:text-white">
                    {t('footer_about')}
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-base text-gray-300 hover:text-white">
                    {t('footer_blog')}
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="text-base text-gray-300 hover:text-white">
                    {t('footer_jobs')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{t('footer_legal')}</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="/privacy" className="text-base text-gray-300 hover:text-white">
                    {t('footer_privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-base text-gray-300 hover:text-white">
                    {t('footer_terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} MenuLink. {t('footer_rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
