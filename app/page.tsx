import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();
  
  // If user is already logged in, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Last Message</h1>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="relative isolate overflow-hidden bg-white">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
              <div className="mt-24 sm:mt-32 lg:mt-16">
                <div className="inline-flex space-x-6">
                  <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
                    Digital Legacy Service
                  </span>
                </div>
              </div>
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Your final messages, delivered when needed
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Last Message securely stores your important messages and device passcodes, 
                sending them to your loved ones only when you're no longer able to respond.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/login"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Get started
                </Link>
                <Link href="#how-it-works" className="text-sm font-semibold leading-6 text-gray-900">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <div className="w-[36rem] rounded-md bg-white p-6 shadow-2xl ring-1 ring-gray-900/10">
                    <div className="flex flex-col space-y-4">
                      <div className="h-10 w-full rounded-md bg-gray-100 flex items-center px-4">
                        <span className="text-gray-500">Final Message</span>
                      </div>
                      <div className="h-32 w-full rounded-md bg-gray-100 p-4">
                        <p className="text-gray-500">Your important message to loved ones...</p>
                      </div>
                      <div className="h-10 w-full rounded-md bg-gray-100 flex items-center px-4">
                        <span className="text-gray-500">Device Passcode</span>
                      </div>
                      <div className="h-10 w-full rounded-md bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-medium">Save</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">How It Works</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simple, secure, and reliable
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Last Message provides peace of mind by ensuring your important information 
                reaches the right people at the right time.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    Create your messages
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Write your final messages and store device passcodes securely in our encrypted database.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Set check frequency
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Choose how often you want to receive alive check emails to confirm you're still active.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Respond to check emails
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Simply click the confirmation link in the periodic emails to let us know you're still around.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    Automatic delivery
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    If you miss three consecutive checks, your messages and passcodes will be automatically sent to your recipients.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} Last Message. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
