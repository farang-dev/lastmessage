// Supabase Edge Function to process alive checks
// This function should be scheduled to run daily

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!;
const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Process users who need alive checks
    await sendAliveChecks();
    
    // Process users who are presumed deceased
    await processDeceasedUsers();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing alive checks:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function sendAliveChecks() {
  // Get users who need an alive check
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .filter('is_deceased', 'eq', false)
    .filter('messages_sent', 'eq', false);
  
  if (error) throw error;
  
  for (const user of users) {
    const lastCheckSent = user.last_check_sent ? new Date(user.last_check_sent) : null;
    const now = new Date();
    
    // Check if it's time to send a new alive check
    if (
      !lastCheckSent ||
      (now.getTime() - lastCheckSent.getTime()) / (1000 * 60 * 60 * 24) >= user.check_frequency_days
    ) {
      // Generate a unique token for the alive check
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + user.check_frequency_days);
      
      // Create an alive check record
      const { error: insertError } = await supabase
        .from('alive_checks')
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });
      
      if (insertError) throw insertError;
      
      // Generate confirmation link
      const confirmationLink = `${appUrl}/api/alive-check/confirm?token=${token}`;
      
      // Send alive check email
      await sendEmail(
        user.email,
        'Last Message - Alive Check',
        `Please confirm you're still with us by clicking this link: ${confirmationLink}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Last Message - Alive Check</h2>
            <p>This is your scheduled alive check from Last Message.</p>
            <p>Please confirm you're still with us by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${confirmationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">I'm Still Here</a>
            </p>
            <p>If you can't click the button, copy and paste this link into your browser:</p>
            <p>${confirmationLink}</p>
            <p>If we don't hear from you after multiple attempts, your pre-configured messages will be sent to your designated recipients.</p>
          </div>
        `
      );
      
      // Update the user's last_check_sent timestamp
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_check_sent: now.toISOString() })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
    }
  }
}

async function processDeceasedUsers() {
  // Get users with expired alive checks
  const { data: expiredChecks, error } = await supabase
    .from('alive_checks')
    .select('*, users!inner(*)')
    .is('confirmed_at', null)
    .lt('expires_at', new Date().toISOString())
    .filter('users.is_deceased', 'eq', false)
    .filter('users.messages_sent', 'eq', false);
  
  if (error) throw error;
  
  // Group expired checks by user
  const userChecks = {};
  for (const check of expiredChecks) {
    if (!userChecks[check.user_id]) {
      userChecks[check.user_id] = [];
    }
    userChecks[check.user_id].push(check);
  }
  
  // Process each user with expired checks
  for (const userId in userChecks) {
    const checks = userChecks[userId];
    const user = checks[0].users;
    
    // Increment missed checks count
    const newMissedChecksCount = user.missed_checks_count + 1;
    
    // Update user's missed checks count
    const { error: updateError } = await supabase
      .from('users')
      .update({ missed_checks_count: newMissedChecksCount })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    // If user has missed 3 or more checks, mark as deceased and send messages
    if (newMissedChecksCount >= 3) {
      await markUserAsDeceased(userId);
    }
  }
}

async function markUserAsDeceased(userId) {
  // Mark user as deceased
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_deceased: true })
    .eq('id', userId);
  
  if (updateError) throw updateError;
  
  // Get user's messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId);
  
  if (messagesError) throw messagesError;
  
  // Get user's passcodes
  const { data: passcodes, error: passcodesError } = await supabase
    .from('passcodes')
    .select('*')
    .eq('user_id', userId);
  
  if (passcodesError) throw passcodesError;
  
  // Get user's email for the sender name
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
  
  if (userError) throw userError;
  
  // Extract username from email for sender name
  const senderName = user.email.split('@')[0];
  
  // Send messages
  for (const message of messages) {
    await sendEmail(
      message.recipient_email,
      `A Final Message from ${senderName}`,
      message.message_content,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>A Final Message from ${senderName}</h2>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            ${message.message_content.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px;">This message was sent via Last Message service.</p>
        </div>
      `
    );
  }
  
  // Send passcodes
  for (const passcode of passcodes) {
    await sendEmail(
      passcode.recipient_email,
      `Device Access Information from ${senderName}`,
      `${senderName} has shared access information for their ${passcode.device_type}. Passcode: ${passcode.passcode}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Device Access Information from ${senderName}</h2>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <p><strong>Device Type:</strong> ${passcode.device_type}</p>
            <p><strong>Passcode:</strong> ${passcode.passcode}</p>
          </div>
          <p style="color: #666; font-size: 12px;">This information was sent via Last Message service.</p>
        </div>
      `
    );
  }
  
  // Mark messages as sent
  const { error: messagesSentError } = await supabase
    .from('users')
    .update({ messages_sent: true })
    .eq('id', userId);
  
  if (messagesSentError) throw messagesSentError;
}

async function sendEmail(to, subject, text, html) {
  // In a real implementation, this would use SendGrid or another email service
  // For this example, we'll use a simple SMTP client
  try {
    const client = new SmtpClient();
    
    await client.connectTLS({
      hostname: 'smtp.sendgrid.net',
      port: 587,
      username: 'apikey',
      password: sendgridApiKey,
    });
    
    await client.send({
      from: 'noreply@lastmessage.app',
      to,
      subject,
      content: html,
      html,
    });
    
    await client.close();
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}