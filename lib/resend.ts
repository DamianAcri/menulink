import { Resend } from 'resend';
import { EmailResponse } from './email-service';

// Inicializar cliente de Resend con la API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Función para enviar correo de agradecimiento por visita
export async function sendThankYouEmail(
  customerName: string,
  customerEmail: string,
  restaurantName: string,
  restaurantEmail: string | null = null
): Promise<EmailResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: `MenuLink <no-reply@menulink.app>`,
      replyTo: restaurantEmail || 'support@menulink.app',
      to: customerEmail,
      subject: `¡Gracias por tu visita a ${restaurantName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">¡Gracias por tu visita!</h2>
          <p>Hola ${customerName},</p>
          <p>¡Esperamos que hayas disfrutado tu visita a <strong>${restaurantName}</strong>! Fue un placer tenerte como cliente.</p>
          <p>Si tienes cualquier duda o comentario, estamos aquí para ayudarte.</p>
          <p>¡Te esperamos pronto!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666;">
            <p>Este correo fue enviado a través de MenuLink, la plataforma que conecta restaurantes con sus clientes.</p>
          </div>
        </div>
      `,
    });

    return { 
      success: !error, 
      data: data ? {
        id: data.id,
        // Transformamos la respuesta para mantener compatibilidad entre ambos servicios
        messageId: data.id
      } : undefined, 
      error 
    };
  } catch (error) {
    console.error('Error al enviar correo de agradecimiento:', error);
    return { success: false, error };
  }
}

// Función para enviar correo solicitando reseña
export async function sendReviewRequestEmail(
  customerName: string,
  customerEmail: string,
  restaurantName: string,
  restaurantSlug: string,
  reviewLink: string | null = null
): Promise<EmailResponse> {
  try {
    // Usar el enlace de reseña proporcionado o crear enlace a la página de MenuLink
    const actionLink = reviewLink || `https://menulink.app/r/${restaurantSlug}`;
    
    const { data, error } = await resend.emails.send({
      from: `MenuLink <no-reply@menulink.app>`,
      to: customerEmail,
      subject: `¿Nos cuentas cómo fue tu experiencia en ${restaurantName}?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">Tu opinión es importante</h2>
          <p>Hola ${customerName},</p>
          <p>Ayer estuviste en <strong>${restaurantName}</strong> y nos encantaría saber qué te pareció la experiencia.</p>
          <p>Tu opinión ayuda a otros clientes y al negocio a seguir mejorando.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Dejar reseña</a>
          </div>
          <p>¡Gracias por tu tiempo!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666;">
            <p>Este correo fue enviado a través de MenuLink, la plataforma que conecta restaurantes con sus clientes.</p>
          </div>
        </div>
      `,
    });

    return { 
      success: !error, 
      data: data ? {
        id: data.id,
        // Transformamos la respuesta para mantener compatibilidad entre ambos servicios
        messageId: data.id
      } : undefined, 
      error 
    };
  } catch (error) {
    console.error('Error al enviar correo de solicitud de reseña:', error);
    return { success: false, error };
  }
}