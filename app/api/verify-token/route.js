import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' });
  }

  try {
    // Find the invitee by token
    const { data: invitee, error } = await supabaseAdmin
      .from('invitees')
      .select('id, name, email, token')
      .eq('token', token)
      .single();

    if (error || !invitee) {
      return NextResponse.json({ valid: false, error: 'Invalid token' });
    }

    // Check if they already RSVP'd
    const { data: rsvp } = await supabaseAdmin
      .from('rsvps')
      .select('id')
      .eq('invitee_id', invitee.id)
      .single();

    return NextResponse.json({
      valid: true,
      invitee,
      already_submitted: !!rsvp,
    });
  } catch (err) {
    return NextResponse.json({ valid: false, error: 'Server error' });
  }
}
