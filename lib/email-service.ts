import { sendThankYouEmailDev, sendReviewRequestEmailDev, sendOwnerNewReservationEmailDev, sendClientPendingReservationEmailDev, sendClientReservationStatusEmailDev, sendReminderEmailDev } from './mailtrap';

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
      return sendThankYouEmailDev(customerName, customerEmail, restaurantName, restaurantEmail);
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
      return sendReviewRequestEmailDev(customerName, customerEmail, restaurantName, restaurantSlug, reviewLink);
    }
  },

  /**
   * Envía un correo de nueva reserva al dueño del restaurante
   */
  sendOwnerNewReservationEmail: async ({ ownerEmail, ownerName, reservation, dashboardLink }: { ownerEmail: string, ownerName: string, reservation: any, dashboardLink: string }) => {
    return sendOwnerNewReservationEmailDev(ownerEmail, ownerName, reservation, dashboardLink);
  },

  /**
   * Envía un correo de reserva pendiente al cliente
   */
  sendClientPendingReservationEmail: async ({ clientEmail, clientName, restaurantName, reservation }: { clientEmail: string, clientName: string, restaurantName: string, reservation: any }) => {
    return sendClientPendingReservationEmailDev(clientEmail, clientName, restaurantName, reservation);
  },

  /**
   * Envía un correo con el estado de la reserva al cliente
   */
  sendClientReservationStatusEmail: async ({ clientEmail, clientName, restaurantName, reservation, status }: { clientEmail: string, clientName: string, restaurantName: string, reservation: any, status: 'confirmed' | 'cancelled' }) => {
    return sendClientReservationStatusEmailDev(clientEmail, clientName, restaurantName, reservation, status);
  },

  /**
   * Envía un correo de recordatorio de reserva (cliente o restaurante)
   */
  sendReminderEmail: async ({ toEmail, restaurantName, reservationDate, reservationTime }: { toEmail: string, restaurantName: string, reservationDate: string, reservationTime: string }) => {
    if (isDevelopment) {
      return sendReminderEmailDev(toEmail, restaurantName, reservationDate, reservationTime);
    } else {
      return sendReminderEmailDev(toEmail, restaurantName, reservationDate, reservationTime);
    }
  },
};