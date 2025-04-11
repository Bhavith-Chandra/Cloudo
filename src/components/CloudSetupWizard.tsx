import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CloudConnectionService } from '@/lib/cloud-connection';

const cloudProviderSchema = z.object({
  provider: z.enum(['AWS', 'Azure', 'GCP']),
  accountName: z.string().min(1, 'Account name is required'),
});

const awsSchema = cloudProviderSchema.extend({
  accessKey: z.string().min(1, 'Access key is required'),
  secretKey: z.string().min(1, 'Secret key is required'),
});

const azureSchema = cloudProviderSchema.extend({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
});

const gcpSchema = cloudProviderSchema.extend({
  projectId: z.string().min(1, 'Project ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
});

type FormData = z.infer<typeof awsSchema> | z.infer<typeof azureSchema> | z.infer<typeof gcpSchema>;

export default function CloudSetupWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(cloudProviderSchema),
  });

  const selectedProvider = watch('provider');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const cloudService = CloudConnectionService.getInstance();
      const userId = 'current-user-id'; // Replace with actual user ID from auth

      switch (data.provider) {
        case 'AWS':
          await cloudService.connectAWS(
            data.accessKey,
            data.secretKey,
            data.accountName,
            userId
          );
          break;
        case 'Azure':
          await cloudService.connectAzure(
            data.tenantId,
            data.clientId,
            data.clientSecret,
            data.accountName,
            userId
          );
          break;
        case 'GCP':
          await cloudService.connectGCP(
            data.projectId,
            data.clientId,
            data.clientSecret,
            data.accountName,
            userId
          );
          break;
      }

      setStep(3); // Success step
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Connect Cloud Account</h2>
        <div className="flex items-center justify-between mb-8">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Select Provider</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Enter Credentials</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Complete</div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cloud Provider
              </label>
              <select
                {...register('provider')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a provider</option>
                <option value="AWS">Amazon Web Services</option>
                <option value="Azure">Microsoft Azure</option>
                <option value="GCP">Google Cloud Platform</option>
              </select>
              {errors.provider && (
                <p className="mt-1 text-sm text-red-600">{errors.provider.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                {...register('accountName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.accountName && (
                <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && selectedProvider === 'AWS' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Access Key
              </label>
              <input
                type="text"
                {...register('accessKey')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.accessKey && (
                <p className="mt-1 text-sm text-red-600">{errors.accessKey.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Secret Key
              </label>
              <input
                type="password"
                {...register('secretKey')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.secretKey && (
                <p className="mt-1 text-sm text-red-600">{errors.secretKey.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedProvider === 'Azure' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tenant ID
              </label>
              <input
                type="text"
                {...register('tenantId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Client ID
              </label>
              <input
                type="text"
                {...register('clientId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Client Secret
              </label>
              <input
                type="password"
                {...register('clientSecret')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 2 && selectedProvider === 'GCP' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project ID
              </label>
              <input
                type="text"
                {...register('projectId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Client ID
              </label>
              <input
                type="text"
                {...register('clientId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Client Secret
              </label>
              <input
                type="password"
                {...register('clientSecret')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Connecting...' : 'Connect Account'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Account Connected Successfully
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Your cloud account has been connected and we're now fetching your cost data.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 