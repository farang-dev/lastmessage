import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase';
import { sendAliveCheckEmail } from '@/utils/sendgrid';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a Supabase client
    const supabase = await createServerSupabaseClient();

    // Generate a UUID from the Clerk user ID
    const userUUID = crypto.createHash('md5').update(userId).digest('hex');
    // Format as UUID (8-4-4-4-12)
    const formattedUUID = [
      userUUID.substring(0, 8),
      userUUID.substring(8, 12),
      userUUID.substring(12, 16),
      userUUID.substring(16, 20),
      userUUID.substring(20, 32)
    ].join('-');

    // Get the user from the database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', formattedUUID)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a token for the alive check
    const token = crypto.randomBytes(32).toString('hex');

    // Insert the alive check record
    const { error: insertError } = await supabase.from('alive_checks').insert({
      user_id: formattedUUID,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
      sent_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Error creating alive check:', insertError);
      return NextResponse.json({ error: 'Failed to create alive check' }, { status: 500 });
    }

    // Update the last_check_sent timestamp for the user
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_check_sent: new Date().toISOString() })
      .eq('id', formattedUUID);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Send the alive check email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const confirmUrl = `${appUrl}/api/alive-check/confirm?token=${token}`;
    
    await sendAliveCheckEmail(user.email, confirmUrl);

    return NextResponse.json({ success: true, message: 'Alive check sent successfully' });
  } catch (error: any) {
    console.error('Error in alive check trigger:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}