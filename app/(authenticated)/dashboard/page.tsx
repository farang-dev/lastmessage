'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createSupabaseClient } from '@/utils/supabase';
import { decryptData } from '@/utils/encryption';
import Link from 'next/link';
import { Message, Passcode, User } from '@/types/database';
import TriggerAliveCheck from './TriggerAliveCheck';
import crypto from 'crypto';

export default function Dashboard() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [passcodes, setPasscodes] = useState<Passcode[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const supabase = createSupabaseClient();

        // Generate a UUID from the Clerk user ID using a hash function
        // This ensures consistent UUID generation for the same Clerk user ID
        const userUUID = crypto.createHash('md5').update(user.id).digest('hex');
        // Format as UUID (8-4-4-4-12)
        const formattedUUID = [
          userUUID.substring(0, 8),
          userUUID.substring(8, 12),
          userUUID.substring(12, 16),
          userUUID.substring(16, 20),
          userUUID.substring(20, 32)
        ].join('-');

        // Check if user exists in our database
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', formattedUUID)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          const { error: createError } = await supabase.from('users').insert({
            id: formattedUUID,
            email: user.primaryEmailAddress?.emailAddress,
            check_frequency_days: 7, // Default to weekly
            last_check_sent: new Date().toISOString(),
            last_check_confirmed: new Date().toISOString(),
            missed_checks_count: 0,
            is_deceased: false,
          });

          if (createError) throw createError;

          // Fetch the newly created user
          const { data: newUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', formattedUUID)
            .single();

          if (fetchError) throw fetchError;
          setUserInfo(newUser);
        } else {
          setUserInfo(existingUser);
        }

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', formattedUUID);

        if (messagesError) throw messagesError;

        // Decrypt message content
        const decryptedMessages = messagesData.map((message) => ({
          ...message,
          message_content: decryptData(message.message_content, user.id),
        }));

        setMessages(decryptedMessages);

        // Fetch passcodes
        const { data: passcodesData, error: passcodesError } = await supabase
          .from('passcodes')
          .select('*')
          .eq('user_id', formattedUUID);

        if (passcodesError) throw passcodesError;

        // Decrypt passcodes
        const decryptedPasscodes = passcodesData.map((passcode) => ({
          ...passcode,
          passcode: decryptData(passcode.passcode, user.id),
        }));

        setPasscodes(decryptedPasscodes);
        setIsLoading(false);
      } catch (err: any) {
        // Log the complete error object for debugging
        console.error('Error fetching data:', JSON.stringify(err, null, 2));
        
        // Handle different error object structures
        let errorMessage = 'An error occurred while fetching data';
        
        if (err) {
          if (err.message) {
            errorMessage = err.message;
          } else if (err.error && typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.details) {
            errorMessage = err.details;
          }
        }
        
        console.log('Using error message:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteMessage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from('messages').delete().eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to delete message');
      }

      // Update the messages state
      setMessages(messages.filter((message) => message.id !== id));
    } catch (err: any) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message: ' + err.message);
    }
  };

  const handleDeletePasscode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this passcode?')) return;

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from('passcodes').delete().eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to delete passcode');
      }

      // Update the passcodes state
      setPasscodes(passcodes.filter((passcode) => passcode.id !== id));
    } catch (err: any) {
      console.error('Error deleting passcode:', err);
      alert('Failed to delete passcode: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Alive Check Status</h2>
          <div className="mt-2 text-sm text-gray-500">
            <p>
              <span className="font-medium">Frequency:</span> Every {userInfo?.check_frequency_days || 7} days
            </p>
            <p>
              <span className="font-medium">Last check sent:</span>{' '}
              {userInfo?.last_check_sent
                ? new Date(userInfo.last_check_sent).toLocaleDateString()
                : 'Never'}
            </p>
            <p>
              <span className="font-medium">Last check confirmed:</span>{' '}
              {userInfo?.last_check_confirmed
                ? new Date(userInfo.last_check_confirmed).toLocaleDateString()
                : 'Never'}
            </p>
            <p>
              <span className="font-medium">Missed checks:</span> {userInfo?.missed_checks_count || 0} of 3
            </p>
            <p className="mt-2">
              <Link href="/settings" className="text-indigo-600 hover:text-indigo-500">
                Update frequency settings
              </Link>
            </p>
          </div>
        </div>

        <TriggerAliveCheck />

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Final Messages</h2>
            <Link
              href="/new-message"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add New Message
            </Link>
          </div>

          {messages.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              You haven't created any final messages yet. These messages will be sent to your
              designated recipients if you're marked as deceased.
            </p>
          ) : (
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <li key={message.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          To: {message.recipient_email}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <Link
                            href={`/edit-message/${message.id}`}
                            className="mr-2 px-2 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {message.message_content.length > 100
                              ? `${message.message_content.substring(0, 100)}...`
                              : message.message_content}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Created:{' '}
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Device Passcodes</h2>
            <Link
              href="/new-passcode"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add New Passcode
            </Link>
          </div>

          {passcodes.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              You haven't added any device passcodes yet. These passcodes will be sent to your
              designated recipients if you're marked as deceased.
            </p>
          ) : (
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {passcodes.map((passcode) => (
                  <li key={passcode.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {passcode.device_type}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <Link
                            href={`/edit-passcode/${passcode.id}`}
                            className="mr-2 px-2 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeletePasscode(passcode.id)}
                            className="px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <span className="font-medium mr-1">Passcode:</span> {passcode.passcode}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            <span className="font-medium mr-1">Recipient:</span> {passcode.recipient_email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}