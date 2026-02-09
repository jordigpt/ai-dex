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
          providers={[]} // No social providers for MVP as per PRD
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;