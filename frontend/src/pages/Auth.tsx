import { SignupForm } from "../components/SignupForm";

interface AuthProps {
  onRegistrationSuccess: (username: string) => void;
}

export function Auth({ onRegistrationSuccess }: AuthProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Accesso alla piattaforma
          </h1>

          <div className="bg-white rounded-xl shadow-md p-8">
            <SignupForm onRegistrationSuccess={onRegistrationSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
