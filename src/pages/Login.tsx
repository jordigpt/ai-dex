import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  // Determine redirect URL: Use the specific domain in production, or localhost in dev
  const redirectUrl = import.meta.env.PROD 
    ? "https://aidex.jordigpt.com" 
    : window.location.origin;

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
      if (event === "SIGNED_OUT") {
        setErrorMessage(""); // Clear errors on sign out
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            AI-DEX
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tu companion app para ejecución diaria
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Auth
          supabaseClient={supabase}
          redirectTo={redirectUrl}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#000000",
                  brandAccent: "#333333",
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "Correo electrónico",
                password_label: "Contraseña",
                email_input_placeholder: "Tu correo electrónico",
                password_input_placeholder: "Tu contraseña",
                button_label: "Iniciar sesión",
                loading_button_label: "Iniciando sesión...",
                social_provider_text: "Iniciar con {{provider}}",
                link_text: "¿Ya tienes cuenta? Inicia sesión",
              },
              sign_up: {
                email_label: "Correo electrónico",
                password_label: "Contraseña",
                email_input_placeholder: "Tu correo electrónico",
                password_input_placeholder: "Tu contraseña",
                button_label: "Registrarse",
                loading_button_label: "Registrando...",
                social_provider_text: "Registrarse con {{provider}}",
                link_text: "¿No tienes cuenta? Regístrate",
                confirmation_text: "Revisa tu correo para confirmar tu cuenta",
              },
              forgotten_password: {
                email_label: "Correo electrónico",
                password_label: "Contraseña",
                email_input_placeholder: "Tu correo electrónico",
                button_label: "Enviar instrucciones",
                loading_button_label: "Enviando instrucciones...",
                link_text: "¿Olvidaste tu contraseña?",
                confirmation_text: "Revisa tu correo para recuperar tu contraseña",
              },
            },
          }}
          providers={[]} // No social providers for MVP as per PRD
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;