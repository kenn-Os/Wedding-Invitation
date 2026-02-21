import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

// Create a new invitee (supports batch via comma-separated names)
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Split names by comma to support batch addition
    const names = name.split(',').map(n => n.trim()).filter(n => n !== '');
    
    if (names.length === 0) {
      return NextResponse.json({ error: 'Valid name(s) required' }, { status: 400 });
    }

    const inviteesToInsert = names.map(n => ({
      name: n,
      email: email?.trim() || null,
      token: uuidv4(),
    }));

    const { data, error } = await supabaseAdmin
      .from('invitees')
      .insert(inviteesToInsert)
      .select();

    if (error) {
      console.error('Insert invitees error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, invitees: data });
  } catch (err) {
    console.error('Invitees POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Delete an invitee (and their RSVP cascade)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get RSVP id first (for cascading additional_guests)
    const { data: rsvp } = await supabaseAdmin
      .from('rsvps')
      .select('id')
      .eq('invitee_id', id)
      .single();

    if (rsvp) {
      // Delete additional guests
      await supabaseAdmin
        .from('additional_guests')
        .delete()
        .eq('rsvp_id', rsvp.id);

      // Delete RSVP
      await supabaseAdmin
        .from('rsvps')
        .delete()
        .eq('id', rsvp.id);
    }

    // Delete invitee
    const { error } = await supabaseAdmin
      .from('invitees')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invitees DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
