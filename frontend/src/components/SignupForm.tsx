import { useState } from "react";
import axios from "axios";

interface SignupFormProps {
  onRegistrationSuccess: (username: string) => void;
}

export function SignupForm({ onRegistrationSuccess }: SignupFormProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    birthdate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "username") {
      setUsernameError(null);
    }
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
    return usernameRegex.test(username);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateUsername(formData.username)) {
      setUsernameError(
        "L'username deve contenere almeno 4 caratteri e può includere solo lettere, numeri e underscore"
      );
      return;
    }

    let formattedPhoneNumber = formData.phone_number;
    if (!formattedPhoneNumber.startsWith("+")) {
      formattedPhoneNumber = `+${formattedPhoneNumber}`;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/signup",
        {
          ...formData,
          phone_number: formattedPhoneNumber,
        }
      );

      const username = response.data.username;
      localStorage.setItem("temp_username", username);

      onRegistrationSuccess(username);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.detail ||
            "Si è verificato un errore durante la registrazione"
        );
      } else {
        setError("Errore nella richiesta di registrazione");
      }
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Registrati
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome
            </label>
            <input
              id="first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Cognome
            </label>
            <input
              id="last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

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
            className={`w-full px-3 py-2 border ${
              usernameError ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {usernameError && (
            <p className="mt-1 text-sm text-red-500">{usernameError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Scegli un username univoco. Può contenere lettere, numeri e
            underscore.
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="phone_number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Numero di telefono (con prefisso internazionale)
          </label>
          <input
            id="phone_number"
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="Es. +39123456789"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="birthdate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Data di nascita
          </label>
          <input
            id="birthdate"
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
          <p className="mt-1 text-sm text-gray-500">
            La password deve contenere almeno 8 caratteri, una lettera
            maiuscola, una lettera minuscola, un numero e un carattere speciale.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white font-medium rounded-md ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Registrazione in corso..." : "Registrati"}
        </button>
      </form>
    </div>
  );
}
