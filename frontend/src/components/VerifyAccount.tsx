import { useState, useEffect } from "react";
import axios from "axios";

interface VerifyAccountProps {
  initialUsername?: string | null;
}

export function VerifyAccount({ initialUsername = null }: VerifyAccountProps) {
  const [formData, setFormData] = useState({
    username: initialUsername || "",
    confirmation_code: "",
  });

  useEffect(() => {
    // Se non c'è un username passato come prop, prova a prenderlo dal localStorage
    if (!initialUsername) {
      const savedUsername = localStorage.getItem("temp_username");
      if (savedUsername) {
        setFormData((prev) => ({
          ...prev,
          username: savedUsername,
        }));
      }
    }
  }, [initialUsername]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/verify",
        formData
      );

      setSuccess("Account verificato con successo! Ora puoi accedere.");
      console.log("Success:", response.data);

      // Pulisci l'username temporaneo dal localStorage dopo la verifica
      localStorage.removeItem("temp_username");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.detail ||
            "Si è verificato un errore durante la verifica"
        );
      } else {
        setError("Errore nella richiesta di verifica");
      }
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Verifica Account
      </h2>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Inserisci l'username (formato: user_xxxxxxxx) che hai ricevuto dopo
            la registrazione
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="confirmation_code"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Codice di verifica
          </label>
          <input
            id="confirmation_code"
            type="text"
            name="confirmation_code"
            value={formData.confirmation_code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Inserisci il codice di verifica ricevuto via email
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white font-medium rounded-md ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Verifica in corso..." : "Verifica Account"}
        </button>
      </form>
    </div>
  );
}
