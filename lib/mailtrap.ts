import nodemailer from 'nodemailer';
import { EmailResponse } from './email-service';

// Configuración de Mailtrap para entorno de desarrollo
const mailtrapTransport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

// Función para enviar correo de agradecimiento por visita usando Mailtrap
export async function sendThankYouEmailDev(
  customerName: string,
  customerEmail: string,
  restaurantName: string,
  restaurantEmail: string | null = null
): Promise<EmailResponse> {
  try {
    const info = await mailtrapTransport.sendMail({
      from: `"MenuLink" <mailer>`,
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

    console.log("Mensaje enviado a Mailtrap:", info.messageId);
    return { 
      success: true, 
      data: {
        messageId: info.messageId,
        response: info.response
      }
    };
  } catch (error) {
    console.error('Error al enviar correo de prueba a Mailtrap:', error);
    return { success: false, error };
  }
}

// Función para enviar correo solicitando reseña usando Mailtrap
export async function sendReviewRequestEmailDev(
  customerName: string,
  customerEmail: string,
  restaurantName: string,
  restaurantSlug: string,
  reviewLink: string | null = null
): Promise<EmailResponse> {
  try {
    // Usar el enlace de reseña proporcionado o crear enlace a la página de MenuLink
    const actionLink = reviewLink || `https://menulink.app/r/${restaurantSlug}`;
    
    const info = await mailtrapTransport.sendMail({
      from: `"MenuLink" <mailer>`,
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

    console.log("Mensaje de reseña enviado a Mailtrap:", info.messageId);
    return { 
      success: true, 
      data: {
        messageId: info.messageId,
        response: info.response
      }
    };
  } catch (error) {
    console.error('Error al enviar correo de solicitud de reseña a Mailtrap:', error);
    return { success: false, error };
  }
}

export async function sendOwnerNewReservationEmailDev(ownerEmail: string, ownerName: string, reservation: any, dashboardLink: string) {
  return mailtrapTransport.sendMail({
    from: 'MenuLink <mailer@menulink.app>',
    to: ownerEmail,
    subject: `Nueva reserva recibida en ${ownerName}`,
    html: `
      <h2>Nueva reserva recibida</h2>
      <p><b>Cliente:</b> ${reservation.customer_name}</p>
      <p><b>Email:</b> ${reservation.customer_email}</p>
      <p><b>Teléfono:</b> ${reservation.customer_phone}</p>
      <p><b>Fecha:</b> ${reservation.reservation_date} a las ${reservation.reservation_time?.substring(0,5)}</p>
      <p><b>Personas:</b> ${reservation.party_size}</p>
      <p><b>Petición especial:</b> ${reservation.special_requests || '-'}</p>
      <p><a href="${dashboardLink}" style="background:#3b82f6;color:white;padding:10px 20px;border-radius:4px;text-decoration:none;">Gestionar reserva</a></p>
      <p style="color:#888;font-size:12px;">Este correo es solo informativo. Gestiona la reserva desde tu panel MenuLink.</p>
    `
  });
}

export async function sendClientPendingReservationEmailDev(clientEmail: string, clientName: string, restaurantName: string, reservation: any) {
  return mailtrapTransport.sendMail({
    from: 'MenuLink <mailer@menulink.app>',
    to: clientEmail,
    subject: `Tu reserva en ${restaurantName} está pendiente de confirmación`,
    html: `
      <h2>¡Reserva recibida!</h2>
      <p>Hola ${clientName},</p>
      <p>Hemos recibido tu solicitud de reserva en <b>${restaurantName}</b> para el día <b>${reservation.reservation_date}</b> a las <b>${reservation.reservation_time?.substring(0,5)}</b>.</p>
      <p>En cuanto el restaurante confirme tu reserva, te avisaremos por email.</p>
      <p style="color:#888;font-size:12px;">No respondas a este correo. Si tienes dudas, contacta directamente con el restaurante.</p>
    `
  });
}

export async function sendClientReservationStatusEmailDev(clientEmail: string, clientName: string, restaurantName: string, reservation: any, status: 'confirmed' | 'cancelled') {
  const statusText = status === 'confirmed' ? 'confirmada' : 'rechazada';
  const color = status === 'confirmed' ? '#22c55e' : '#ef4444';
  return mailtrapTransport.sendMail({
    from: 'MenuLink <mailer@menulink.app>',
    to: clientEmail,
    subject: `Tu reserva en ${restaurantName} ha sido ${statusText}`,
    html: `
      <h2 style="color:${color}">Tu reserva ha sido ${statusText}</h2>
      <p>Hola ${clientName},</p>
      <p>La reserva para el día <b>${reservation.reservation_date}</b> a las <b>${reservation.reservation_time?.substring(0,5)}</b> ha sido <b>${statusText}</b> por el restaurante <b>${restaurantName}</b>.</p>
      <p>${status === 'confirmed' ? '¡Te esperamos!' : 'Puedes reservar otro día cuando quieras.'}</p>
      <p style="color:#888;font-size:12px;">No respondas a este correo. Si tienes dudas, contacta directamente con el restaurante.</p>
    `
  });
}