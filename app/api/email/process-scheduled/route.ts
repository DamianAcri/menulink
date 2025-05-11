import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

// Definir interfaces para tipar adecuadamente los datos de Supabase
interface Restaurant {
  name: string;
  slug: string;
  google_my_business_link: string | null;
}

interface ScheduledEmail {
  id: string;
  reservation_id: string;
  restaurant_id: string;
  customer_email: string;
  type: 'thank_you' | 'review_request' | 'reminder';
  scheduled_for: string;
  reservations: {
    customer_name: string;
    restaurants: Restaurant;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    // Verificar API key para proteger este endpoint
    const validApiKey = process.env.CRON_API_KEY;
    if (!validApiKey || apiKey !== validApiKey) {
      return NextResponse.json({ error: 'API Key no válida' }, { status: 401 });
    }

    const now = new Date();
    
    // Buscar emails programados que deban enviarse ahora
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('email_logs')
      .select(`
        id,
        reservation_id,
        restaurant_id,
        customer_email,
        type,
        scheduled_for,
        reservations(
          customer_name,
          restaurants(
            name,
            slug,
            google_my_business_link
          )
        )
      `)
      .eq('status', 'scheduled')
      .in('type', ['review_request', 'reminder'])
      .lte('scheduled_for', now.toISOString())
      .limit(50); // Procesar en lotes para evitar problemas de rendimiento

    if (fetchError) {
      console.error('Error al buscar correos programados:', fetchError);
      return NextResponse.json(
        { error: 'Error al buscar correos programados' },
        { status: 500 }
      );
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({ message: 'No hay correos programados para enviar' });
    }

    const results = {
      total: scheduledEmails.length,
      sent: 0,
      failed: 0,
      details: [] as unknown[]
    };

    // Procesar cada correo programado
    for (const email of scheduledEmails as unknown[] as ScheduledEmail[]) {
      try {
        // Verificar que tenemos toda la información necesaria
        if (!email.reservations || !email.reservations.restaurants) {
          console.error('Datos incompletos para el correo:', email.id);
          
          // Marcar como fallido
          await supabase
            .from('email_logs')
            .update({ 
              status: 'failed',
              error_message: 'Datos incompletos para enviar el correo'
            })
            .eq('id', email.id);
            
          results.failed++;
          results.details.push({
            id: email.id,
            status: 'failed',
            reason: 'Datos incompletos'
          });
          continue;
        }

        if (email.type === 'reminder') {
          // Email de recordatorio (cliente o restaurante)
          const { data: reservationData, error: resError } = await supabase
            .from('reservations')
            .select('*, restaurants(name)')
            .eq('id', email.reservation_id)
            .single();
          if (resError || !reservationData) throw new Error('No se pudo obtener la reserva');
          const restaurantName = reservationData.restaurants?.name || 'Restaurante';
          const reservationDate = reservationData.reservation_date;
          const reservationTime = reservationData.reservation_time;
          const toEmail = email.customer_email;
          // Enviar email de recordatorio
          await EmailService.sendReminderEmail({
            toEmail,
            restaurantName,
            reservationDate,
            reservationTime
          });
        } else {
          const restaurantName = email.reservations.restaurants.name;
          const restaurantSlug = email.reservations.restaurants.slug;
          const customerName = email.reservations.customer_name;
          const customerEmail = email.customer_email;
          const reviewLink = email.reservations.restaurants.google_my_business_link || null;

          // Enviar correo de solicitud de reseña usando nuestro servicio unificado
          const sendResult = await EmailService.sendReviewRequestEmail(
            customerName,
            customerEmail,
            restaurantName,
            restaurantSlug,
            reviewLink
          );

          if (!sendResult.success) {
            throw new Error((sendResult.error as { message?: string })?.message || 'Error al enviar el correo');
          }

          // Actualizar el estado en la base de datos
          await supabase
            .from('email_logs')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString() 
            })
            .eq('id', email.id);

          results.sent++;
          
          // Obtener el ID del mensaje de manera segura
          const messageId = sendResult.data?.id || 
                          sendResult.data?.messageId || 
                          'unknown';
                          
          results.details.push({
            id: email.id,
            status: 'sent',
            messageId
          });
        }

      } catch (emailError: unknown) {
        console.error('Error al procesar correo programado:', emailError);
        
        // Determinar el mensaje de error
        const errorMessage = (emailError as Error).message || 'Error desconocido';
        
        // Marcar como fallido pero no reintentar automáticamente
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', email.id);
          
        results.failed++;
        results.details.push({
          id: email.id,
          status: 'failed',
          reason: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results
    });

  } catch (error: unknown) {
    console.error('Error en el procesamiento de correos programados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}