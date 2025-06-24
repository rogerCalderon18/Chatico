"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import React from "react";

const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGitHubLogin = async (): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await signIn("github", { 
        callbackUrl: "/" 
      });
    } catch (error) {
      console.error("GitHub login error:", error);
      setErrorMessage("Error al iniciar sesión con GitHub");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chatico
          </h1>
          <p className="text-gray-600">
            Tu segundo cerebro con IA
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-gray-700">
            Iniciar sesión
          </h2>

          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continuar con GitHub
              </>
            )}
          </button>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Al continuar, aceptas nuestros términos de servicio
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;