import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Find the alive check with the given token
    const { data: aliveCheck, error: findError } = await supabase
      .from('alive_checks')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !aliveCheck) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if the alive check has already been confirmed
    if (aliveCheck.confirmed_at) {
      return NextResponse.redirect(new URL('/alive-check-already-confirmed', request.url));
    }

    // Check if the alive check has expired
    if (new Date(aliveCheck.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Mark the alive check as confirmed
    const now = new Date().toISOString();
    const { error: updateCheckError } = await supabase
      .from('alive_checks')
      .update({ confirmed_at: now })
      .eq('id', aliveCheck.id);

    if (updateCheckError) {
      return NextResponse.json(
        { error: 'Failed to confirm alive check' },
        { status: 500 }
      );
    }

    // Update the user's last_check_confirmed timestamp and reset missed_checks_count
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        last_check_confirmed: now,
        missed_checks_count: 0,
      })
      .eq('id', aliveCheck.user_id);

    if (updateUserError) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Redirect to a confirmation page
    return NextResponse.redirect(new URL('/alive-check-confirmed', request.url));
  } catch (error) {
    console.error('Error confirming alive check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}