import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'Falta el ID de la reserva' }, { status: 400 });
    }

    // 1. Obtener datos de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        restaurants(
          id,
          name,
          slug,
          contact_info(
            email
          )
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      console.error('Error al obtener datos de la reserva:', reservationError);
      return NextResponse.json({ error: 'No se pudo encontrar la reserva' }, { status: 404 });
    }

    // 2. Verificar que la reserva esté marcada como completada
    if (reservation.status !== 'completed') {
      return NextResponse.json(
        { error: 'La reserva no está marcada como completada' }, 
        { status: 400 }
      );
    }

    // 3. Verificar si ya se envió un correo de agradecimiento para esta reserva
    const { data: existingEmail } = await supabase
      .from('email_logs')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('type', 'thank_you')
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Ya se envió un correo de agradecimiento para esta reserva', already_sent: true },
        { status: 200 }
      );
    }

    // 4. Obtener la información necesaria
    const restaurants = reservation.restaurants;
    if (!restaurants) {
      return NextResponse.json(
        { error: 'No se encontró información del restaurante' },
        { status: 404 }
      );
    }

    const restaurantName = restaurants.name;
    const restaurantEmail = restaurants.contact_info?.email || null;
    const customerName = reservation.customer_name;
    const customerEmail = reservation.customer_email;

    // 5. Enviar el correo de agradecimiento usando el servicio unificado
    const emailResult = await EmailService.sendThankYouEmail(
      customerName,
      customerEmail,
      restaurantName,
      restaurantEmail
    );

    if (!emailResult.success) {
      console.error('Error al enviar el correo de agradecimiento:', emailResult.error);
      return NextResponse.json(
        { error: 'Error al enviar el correo de agradecimiento' },
        { status: 500 }
      );
    }

    // 6. Registrar el envío en la tabla email_logs
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        reservation_id: reservationId,
        restaurant_id: reservation.restaurant_id,
        customer_email: customerEmail,
        type: 'thank_you',
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error al registrar el envío del correo:', logError);
      // El correo se envió, pero hubo un error al registrarlo
    }

    // 7. Programar el correo de solicitud de reseña para 24 horas después
    const reviewDate = new Date();
    reviewDate.setHours(reviewDate.getHours() + 24); // 24 horas después

    const { error: scheduleError } = await supabase
      .from('email_logs')
      .insert({
        reservation_id: reservationId,
        restaurant_id: reservation.restaurant_id,
        customer_email: customerEmail,
        type: 'review_request',
        status: 'scheduled',
        scheduled_for: reviewDate.toISOString()
      });

    if (scheduleError) {
      console.error('Error al programar el correo de solicitud de reseña:', scheduleError);
    }

    // Obtener el ID del mensaje de manera segura
    const emailId = emailResult.data?.id || emailResult.data?.messageId || 'unknown';

    return NextResponse.json({
      success: true,
      message: 'Correo de agradecimiento enviado con éxito',
      emailId
    });

  } catch (error: unknown) {
    console.error('Error en el endpoint de envío de correo de agradecimiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}