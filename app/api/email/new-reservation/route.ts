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

    // 1. Email al dueño
    if (ownerEmail) {
      await EmailService.sendOwnerNewReservationEmail({
        ownerEmail,
        ownerName,
        reservation,
        dashboardLink: `http://localhost:3000/dashboard/reservations?highlight=${reservationId}`
      });
    }

    // 2. Email al cliente
    if (clientEmail) {
      await EmailService.sendClientPendingReservationEmail({
        clientEmail,
        clientName,
        restaurantName: ownerName,
        reservation
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en /api/email/new-reservation:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
