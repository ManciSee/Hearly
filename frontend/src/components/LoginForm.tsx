import { useState } from "react";
import axios from "axios";

interface LoginFormProps {
  onLoginSuccess: (tokens: any) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/signin",
        {
          username: identifier, // Può essere email o username
          password: password,
        }
      );

      localStorage.setItem("auth_tokens", JSON.stringify(response.data));

      onLoginSuccess(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.detail ||
            "Si è verificato un errore durante il login"
        );
      } else {
        setError("Errore nella richiesta di login");
      }
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Accedi
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="identifier"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email o Username
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white font-medium rounded-md ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>
    </div>
  );
}
