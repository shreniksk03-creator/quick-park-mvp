import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
      success_url: `${baseUrl}/bookings?success=true`,
      cancel_url: `${baseUrl}/map?canceled=true`,
      metadata: {
        parkingSpaceId,
        driverId,
        ownerId,
        hours: hours?.toString() || "1",
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
