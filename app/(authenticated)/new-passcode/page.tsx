'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createSupabaseClient } from '@/utils/supabase';
import { encryptData } from '@/utils/encryption';
import crypto from 'crypto';

export default function NewPasscode() {
  const router = useRouter();
  const { user } = useUser();
  const [deviceType, setDeviceType] = useState('');
  const [passcode, setPasscode] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a passcode');
      return;
    }

    if (!deviceType || !passcode || !recipientEmail) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Encrypt the passcode
      const encryptedPasscode = encryptData(passcode, user.id);
      
      const supabase = createSupabaseClient();
      
      // Generate a UUID from the Clerk user ID
      const userUUID = crypto.createHash('md5').update(user.id).digest('hex');
      // Format as UUID (8-4-4-4-12)
      const formattedUUID = [
        userUUID.substring(0, 8),
        userUUID.substring(8, 12),
        userUUID.substring(12, 16),
        userUUID.substring(16, 20),
        userUUID.substring(20, 32)
      ].join('-');
      
      // Insert the passcode into the database
      const { error } = await supabase.from('passcodes').insert({
        user_id: formattedUUID,
        device_type: deviceType,
        passcode: encryptedPasscode,
        recipient_email: recipientEmail,
      });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to create passcode');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error creating passcode:', err);
      setError(err.message || 'Failed to create passcode');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Add New Device Passcode</h1>
        <p className="mt-2 text-sm text-gray-600">
          This passcode will be sent to the recipient if you're marked as deceased after missing multiple alive checks.
        </p>

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

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div>
            <label htmlFor="device-type" className="block text-sm font-medium text-gray-700">
              Device Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="device-type"
                name="device-type"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="iPhone, MacBook, Windows PC, etc."
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Describe the device this passcode is for.
            </p>
          </div>

          <div>
            <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">
              Passcode
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="passcode"
                name="passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="123456 or pattern description"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              The passcode or unlock pattern for this device. This will be encrypted and stored securely.
            </p>
          </div>

          <div>
            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700">
              Recipient Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                id="recipient-email"
                name="recipient-email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="email@example.com"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              The email address of the person who should receive this passcode.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Passcode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}