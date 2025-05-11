import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, status } = body;
    if (!reservationId || !['confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Faltan datos o status inválido' }, { status: 400 });
    }

    // Obtener la reserva y el restaurante
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`*, restaurants(name)`) // solo nombre del restaurante
      .eq('id', reservationId)
      .single();
    if (reservationError || !reservation) {
      return NextResponse.json({ error: 'No se pudo encontrar la reserva' }, { status: 404 });
    }
    const restaurantName = reservation.restaurants?.name || 'Restaurante';
    const clientEmail = reservation.customer_email;
    const clientName = reservation.customer_name;

    // Enviar correo de estado
    const emailResult = await EmailService.sendClientReservationStatusEmail({
      clientEmail,
      clientName,
      restaurantName,
      reservation,
      status
    });
    // Registrar en email_logs
    const { error: logErrorStatus } = await supabase.from('email_logs').insert({
      reservation_id: reservation.id,
      restaurant_id: reservation.restaurant_id,
      customer_email: clientEmail,
      type: 'reservation_status',
      status: 'sent',
      sent_at: new Date().toISOString()
    });
    if (logErrorStatus) {
      console.error('Error al registrar el envío de correo de estado de reserva:', logErrorStatus);
    }
    if (!emailResult || emailResult.rejected?.length > 0) {
      return NextResponse.json({ error: 'Error al enviar el correo', details: emailResult?.response || 'Failed to send email' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno', details: (error as Error).message }, { status: 500 });
  }
}
