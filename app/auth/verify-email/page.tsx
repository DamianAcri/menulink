"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleResendEmail = async () => {
    if (!email || !email.includes('@')) {
      setMessage({
        type: 'error',
        text: 'Por favor, introduce un correo electrónico válido'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Se ha reenviado el correo de verificación. Por favor, revisa tu bandeja de entrada.'
      });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (err as Error).message || 'Error al reenviar el correo de verificación'
      });
    } finally {
      setLoading(false);
    }
  };

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
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 000-2H9z" clipRule="evenodd" />
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

        {/* Formulario para reenviar el correo */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            ¿No has recibido el correo?
          </h3>
          <div className="flex flex-col space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introduce tu correo electrónico"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Reenviar correo de verificación"}
            </button>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'
            }`}>
              {message.text}
            </div>
          )}
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