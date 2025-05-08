import { VerifyAccount } from "../components/VerifyAccount";

interface VerifyAccountPageProps {
  initialUsername?: string | null;
}

export function VerifyAccountPage({ initialUsername }: VerifyAccountPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verifica il tuo Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inserisci il codice ricevuto via email per attivare il tuo account
          </p>
        </div>

        <VerifyAccount initialUsername={initialUsername} />
      </div>
    </div>
  );
}
