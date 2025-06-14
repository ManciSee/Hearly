"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { config } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface SignupFormProps {
  onRegistrationSuccess?: (username: string) => void;
}

export default function SignupForm({
  onRegistrationSuccess,
}: SignupFormProps = {}) {
  const router = useRouter();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await axios.post(`${config.apiUrl}/api/v1/auth/signup`, {
        ...formData,
        phone_number: formattedPhoneNumber,
      });

      const username = response.data.username;
      localStorage.setItem("temp_username", username);

      if (onRegistrationSuccess) {
        onRegistrationSuccess(username);
      } else {
        // Redirect to verification page instead of login
        router.push("/verify");
      }
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
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Registrati a Hearly
        </CardTitle>
        <CardDescription className="text-center">
          Crea un account per iniziare a utilizzare la piattaforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Il tuo nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Cognome</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Il tuo cognome"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Scegli un username unico"
              required
              className={
                usernameError ? "border-red-500 focus:ring-red-500" : ""
              }
            />
            {usernameError && (
              <p className="text-sm text-red-500 mt-1">{usernameError}</p>
            )}
            <p className="text-xs text-gray-500">
              Scegli un username unico. Può contenere lettere, numeri e
              underscore.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="La tua email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">
              Numero di telefono (con prefisso internazionale)
            </Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Es. +39123456789"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthdate">Data di nascita</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              value={formData.birthdate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Crea una password sicura"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500">
              La password deve contenere almeno 8 caratteri, una lettera
              maiuscola, una lettera minuscola, un numero e un carattere
              speciale.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrazione in corso...
              </>
            ) : (
              "Registrati"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-gray-600 w-full">
          Hai già un account?{" "}
          <a
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            Accedi
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
