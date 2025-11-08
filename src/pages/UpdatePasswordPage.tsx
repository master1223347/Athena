import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; 
import { Session } from "@supabase/supabase-js";

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // path of error
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if the user is in a password recovery flow
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (event === "PASSWORD_RECOVERY") {
          setIsRecoveryFlow(true);
          // You might want to clear any existing toasts or messages here
          toast.info("Please enter your new password.");
        } else if (event === "SIGNED_IN" && isRecoveryFlow) {
          // This can happen if the user signs in normally while on this page
          // Or if the password update was successful and Supabase signs them in
          // We can navigate them away or let them update if they still want to
        } else if (event === "USER_UPDATED") {
            // This event fires after a successful password update
            toast.success("Password updated successfully! You can now log in.");
            setIsLoading(false);
            // It's good practice to sign the user out after password update for security
            // Or Supabase might handle this automatically depending on your setup.
            // await supabase.auth.signOut();
            navigate("/login");
        }
      }
    );

    // Check current session on mount as well, in case the event was missed
    // or the user navigates back to this page.
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        // A common way to detect password recovery is via a hash in the URL
        // Supabase handles this internally when onAuthStateChange is set up before the app mounts.
        // If you are not seeing the PASSWORD_RECOVERY event, ensure onAuthStateChange
        // is active when the app initializes.
        if (window.location.hash.includes("type=recovery")) {
            setIsRecoveryFlow(true);
        }
    });


    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate, isRecoveryFlow]);


  const onSubmit = async (data: UpdatePasswordFormValues) => {
    if (!isRecoveryFlow && !session) {
        setErrorState("Not in a password recovery flow or not signed in. Please request a password reset again.");
        toast.error("Invalid session for password update.");
        return;
    }

    try {
      setIsLoading(true);
      setErrorState(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw updateError;
      }
      // The USER_UPDATED event in onAuthStateChange will handle success message and navigation
    } catch (err: any) {
      console.error("Password update failed:", err);
      const errorMessage = err.message || "Failed to update password.";
      setErrorState(errorMessage);
      toast.error(errorMessage);
      setFormError("root", { message: errorMessage });
    } finally {
      // setIsLoading(false); //isLoading will be set to false in USER_UPDATED event
    }
  };

  if (!isRecoveryFlow && !session) {
    // If not in recovery flow and no active session that might allow password change (e.g. signed in user changing their own password)
    // This check might need adjustment based on whether you allow signed-in users to change passwords here too.
    // For a dedicated reset page, this is a good guard.
    return (
        <div className="min-h-screen flex items-center justify-center bg-journey-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Update Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">
                        Invalid password reset link or session. Please request a new password reset link.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button onClick={() => navigate("/login")} className="w-full">
                        Back to Login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-journey-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
             {errors.root && (
                <p className="text-sm text-red-500">{errors.root.message}</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;