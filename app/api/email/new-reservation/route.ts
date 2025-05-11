import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'Falta el ID de la reserva' }, { status: 400 });
    }

    // Obtener datos de la reserva y restaurante (incluyendo email del dueño)
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`*, restaurants(*, contact_info(*))`)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: 'No se pudo encontrar la reserva' }, { status: 404 });
    }

    const restaurant = reservation.restaurants;
    const contactInfo = restaurant?.contact_info;
    const ownerEmail = contactInfo?.email;
    const ownerName = restaurant?.name || 'Restaurante';
    const clientEmail = reservation.customer_email;
    const clientName = reservation.customer_name;

    // 1. Email al dueño SOLO si tiene notificaciones activadas
    if ((restaurant?.email_notifications === true || restaurant?.email_notifications === null || typeof restaurant?.email_notifications === 'undefined') && ownerEmail) {
      const ownerEmailResult = await EmailService.sendOwnerNewReservationEmail({
        ownerEmail,
        ownerName,
        reservation,
        dashboardLink: `http://localhost:3000/dashboard/reservations?highlight=${reservationId}`
      });
      // Registrar en email_logs
      const { error: logErrorOwner } = await supabase.from('email_logs').insert({
        reservation_id: reservation.id,
        restaurant_id: reservation.restaurant_id,
        customer_email: ownerEmail,
        type: 'new_reservation',
        status: 'sent',
        sent_at: new Date().toISOString()
      });
      if (logErrorOwner) {
        console.error('Error al registrar el envío de correo al dueño:', logErrorOwner);
      }
    }

    // 2. Email al cliente (siempre)
    if (clientEmail) {
      const clientEmailResult = await EmailService.sendClientPendingReservationEmail({
        clientEmail,
        clientName,
        restaurantName: ownerName,
        reservation
      });
      // Registrar en email_logs
      const { error: logErrorClient } = await supabase.from('email_logs').insert({
        reservation_id: reservation.id,
        restaurant_id: reservation.restaurant_id,
        customer_email: clientEmail,
        type: 'new_reservation',
        status: 'sent',
        sent_at: new Date().toISOString()
      });
      if (logErrorClient) {
        console.error('Error al registrar el envío de correo al cliente:', logErrorClient);
      }
    }

    // 3. Programar recordatorio 30 minutos antes de la reserva (cliente y restaurante)
    if (reservation.reservation_date && reservation.reservation_time) {
      const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
      const reminderDate = new Date(reservationDateTime.getTime() - 30 * 60 * 1000);
      // Cliente
      if (clientEmail) {
        await supabase.from('email_logs').insert({
          reservation_id: reservation.id,
          restaurant_id: reservation.restaurant_id,
          customer_email: clientEmail,
          type: 'reminder',
          status: 'scheduled',
          scheduled_for: reminderDate.toISOString()
        });
      }
      // Restaurante (si tiene email de contacto)
      if (ownerEmail) {
        await supabase.from('email_logs').insert({
          reservation_id: reservation.id,
          restaurant_id: reservation.restaurant_id,
          customer_email: ownerEmail,
          type: 'reminder',
          status: 'scheduled',
          scheduled_for: reminderDate.toISOString()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en /api/email/new-reservation:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
