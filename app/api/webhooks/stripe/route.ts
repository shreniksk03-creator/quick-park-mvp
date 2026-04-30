import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia', 
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { metadata } = session;
      const amountTotal = session.amount_total;

      if (metadata && metadata.driverId && metadata.ownerId && amountTotal) {
        const qrHash = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Insert transaction record for the owner
        const { error: txError } = await supabase.from('transactions').insert([{
          driver_id: metadata.driverId,
          owner_id: metadata.ownerId,
          amount: amountTotal / 100, // convert back from paise/cents to standard unit
          status: 'completed'
        }]);

        if (txError) {
          console.error("Failed to insert transaction into Supabase:", txError);
          return NextResponse.json({ error: 'Transaction insert failed' }, { status: 500 });
        }

        // Insert booking record if it wasn't already created proactively
        if (metadata.parkingSpaceId) {
          if (!metadata.bookingId) {
            const { error: bookingError } = await supabase.from('bookings').insert([{
              space_id: metadata.parkingSpaceId,
              driver_id: metadata.driverId,
              start_time: new Date().toISOString(),
              duration_hours: parseInt(metadata.hours || "1", 10),
              total_paid: amountTotal / 100,
              status: 'active',
              qr_code_hash: qrHash
            }]);

            if (bookingError) {
              console.error("Failed to insert booking into Supabase:", bookingError);
              return NextResponse.json({ error: 'Booking insert failed' }, { status: 500 });
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
