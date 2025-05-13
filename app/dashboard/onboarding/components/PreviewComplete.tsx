import React from 'react';
import Link from 'next/link';

interface PreviewCompleteProps {
  restaurantSlug: string;
  finishOnboarding: () => void;
}

const PreviewComplete: React.FC<PreviewCompleteProps> = ({ restaurantSlug, finishOnboarding }) => {
  return (
    <div className="text-center space-y-8">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
        <svg className="h-10 w-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          ¡Felicidades! Tu menú está listo
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Has completado con éxito la configuración de tu restaurante en MenuLink.
        </p>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Tu enlace personalizado:
        </h3>
        <div className="flex justify-center items-center space-x-2">
          <span className="text-gray-800 dark:text-gray-200 font-medium">
            menulink.com/r/{restaurantSlug}
          </span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`https://menulink.com/r/${restaurantSlug}`);
              alert('Enlace copiado al portapapeles');
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            title="Copiar enlace"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
          Vista previa
        </div>
        <div className="h-96 bg-white dark:bg-gray-900 relative">
          <iframe
            src={`/r/${restaurantSlug}?preview=1`}
            className="absolute inset-0 w-full h-full border-0"
            title="Vista previa del menú"
          ></iframe>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center pt-4">
        <Link
          href={`/r/${restaurantSlug}`}
          target="_blank"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Ver mi página <span className="ml-1">→</span>
        </Link>
        <button
          onClick={finishOnboarding}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Ir al Dashboard
        </button>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Próximos pasos recomendados:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white text-base mb-2">
              Completa tu menú
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Añade más categorías y platos a tu menú para ofrecer una experiencia completa.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white text-base mb-2">
              Información de contacto
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Añade tu dirección, teléfono y correo electrónico para facilitar el contacto.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white text-base mb-2">
              Redes sociales
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conecta tus redes sociales para aumentar tu presencia online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewComplete;