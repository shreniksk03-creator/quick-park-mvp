import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia', 
});

export async function POST(req: Request) {
  try {
    const { parkingSpaceId, amount, driverId, ownerId, spotName, hours } = await req.json();

    if (!parkingSpaceId || !amount || !driverId || !ownerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrHash = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Insert booking record proactively so it's ready on success (webhook handles transaction and fallback)
    const { data: booking, error: bookingError } = await supabase.from('bookings').insert([{
      space_id: parkingSpaceId,
      driver_id: driverId,
      start_time: new Date().toISOString(),
      duration_hours: parseInt(hours?.toString() || "1", 10),
      total_paid: amount,
      status: 'active',
      qr_code_hash: qrHash
    }]).select('id').single();

    if (bookingError) {
      console.error("Proactive booking insert error", bookingError);
    }

    const bookingIdParam = booking?.id ? `&bookingId=${booking.id}` : '';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: spotName || 'Parking Spot Booking',
            },
            unit_amount: Math.round(amount * 100), // convert to paise
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/bookings?success=true${bookingIdParam}`,
      cancel_url: `${baseUrl}/map?canceled=true`,
      metadata: {
        parkingSpaceId,
        driverId,
        ownerId,
        hours: hours?.toString() || "1",
        bookingId: booking?.id || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
