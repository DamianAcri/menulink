import { sendThankYouEmail, sendReviewRequestEmail } from './resend';
import { sendThankYouEmailDev, sendReviewRequestEmailDev } from './mailtrap';

// Determinar si estamos en desarrollo o producción
const isDevelopment = process.env.NODE_ENV === 'development';

// Tipo unificado para respuestas de correo electrónico
export type EmailResponse = {
  success: boolean;
  data?: {
    id?: string;
    messageId?: string;
    [key: string]: unknown;
  };
  error?: unknown;
};

/**
 * Servicio unificado de envío de correos que utiliza Mailtrap en desarrollo y Resend en producción
 */
export const EmailService = {
  /**
   * Envía un correo de agradecimiento al cliente después de su visita
   */
  sendThankYouEmail: async (
    customerName: string,
    customerEmail: string,
    restaurantName: string,
    restaurantEmail: string | null = null
  ): Promise<EmailResponse> => {
    if (isDevelopment) {
      console.log('Enviando correo de agradecimiento en entorno de DESARROLLO usando Mailtrap');
      return sendThankYouEmailDev(customerName, customerEmail, restaurantName, restaurantEmail);
    } else {
      console.log('Enviando correo de agradecimiento en entorno de PRODUCCIÓN usando Resend');
      return sendThankYouEmail(customerName, customerEmail, restaurantName, restaurantEmail);
    }
  },

  /**
   * Envía un correo solicitando una reseña al cliente 24 horas después de su visita
   */
  sendReviewRequestEmail: async (
    customerName: string,
    customerEmail: string,
    restaurantName: string,
    restaurantSlug: string,
    reviewLink: string | null = null
  ): Promise<EmailResponse> => {
    if (isDevelopment) {
      console.log('Enviando solicitud de reseña en entorno de DESARROLLO usando Mailtrap');
      return sendReviewRequestEmailDev(customerName, customerEmail, restaurantName, restaurantSlug, reviewLink);
    } else {
      console.log('Enviando solicitud de reseña en entorno de PRODUCCIÓN usando Resend');
      return sendReviewRequestEmail(customerName, customerEmail, restaurantName, restaurantSlug, reviewLink);
    }
  }
};