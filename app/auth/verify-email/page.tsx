"use client";

import Link from "next/link";

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Verifica tu correo electrónico
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Hemos enviado un correo electrónico de verificación a tu dirección de correo.
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para confirmar tu cuenta.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Importante
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                <p>
                  Si no encuentras el correo en tu bandeja de entrada, revisa también tu carpeta de spam o correo no deseado.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/auth/login" 
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}