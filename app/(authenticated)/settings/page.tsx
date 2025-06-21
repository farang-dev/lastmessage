'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createSupabaseClient } from '@/utils/supabase';
import { User } from '@/types/database';
import crypto from 'crypto';

export default function Settings() {
  const { user } = useUser();
  const [aliveCheckFrequency, setAliveCheckFrequency] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchUserSettings = async () => {
      try {
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
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', formattedUUID)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setAliveCheckFrequency(data.check_frequency_days || 7);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching user settings:', err);
        setError(err.message || 'Failed to fetch user settings');
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to update settings');
      return;
    }

    if (aliveCheckFrequency < 1) {
      setError('Alive check frequency must be at least 1 day');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
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
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', formattedUUID)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let dbError;

      if (!existingUser) {
        // Create user if doesn't exist
        const { error: insertError } = await supabase.from('users').insert({
          id: formattedUUID,
          email: user.primaryEmailAddress?.emailAddress,
          check_frequency_days: aliveCheckFrequency,
          last_check_sent: new Date().toISOString(),
          last_check_confirmed: new Date().toISOString(),
          missed_checks_count: 0,
          is_deceased: false,
        });
        dbError = insertError;
      } else {
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            check_frequency_days: aliveCheckFrequency,
          })
          .eq('id', formattedUUID);
        dbError = updateError;
      }

      if (dbError) throw dbError;

      setSuccessMessage('Settings updated successfully');
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Failed to update settings');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure your alive check frequency and other settings.
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

        {successMessage && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div>
            <label htmlFor="alive-check-frequency" className="block text-sm font-medium text-gray-700">
              Alive Check Frequency (days)
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="alive-check-frequency"
                name="alive-check-frequency"
                min="1"
                max="90"
                value={aliveCheckFrequency}
                onChange={(e) => setAliveCheckFrequency(parseInt(e.target.value) || 7)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              How often you want to receive alive check emails. If you miss {3} consecutive checks, your final messages and passcodes will be sent.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        <div className="mt-8 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-xl font-medium text-gray-900">About Alive Checks</h2>
          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2">
              Alive checks are emails sent to you periodically to confirm you're still active. Each email contains a confirmation link that you must click to reset your missed checks counter.
            </p>
            <p className="mb-2">
              If you miss 3 consecutive alive checks, the system will assume you are deceased and automatically send your final messages and device passcodes to their designated recipients.
            </p>
            <p>
              You can adjust the frequency of these checks above. We recommend setting a frequency that works with your email checking habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}