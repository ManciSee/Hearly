import { useState } from "react";
import { SignupForm } from "../components/SignupForm";
import { LoginForm } from "../components/LoginForm";

interface AuthProps {
  onRegistrationSuccess: (username: string) => void;
  onLoginSuccess: (tokens: any) => void;
}

export function Auth({ onRegistrationSuccess, onLoginSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Accesso alla piattaforma
          </h1>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 font-medium text-center ${
                  activeTab === "login"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("login")}
              >
                Accedi
              </button>
              <button
                className={`flex-1 py-4 font-medium text-center ${
                  activeTab === "register"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("register")}
              >
                Registrati
              </button>
            </div>

            <div className="p-8">
              {activeTab === "login" ? (
                <LoginForm onLoginSuccess={onLoginSuccess} />
              ) : (
                <SignupForm onRegistrationSuccess={onRegistrationSuccess} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
