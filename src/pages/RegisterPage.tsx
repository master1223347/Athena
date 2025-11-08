import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
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
import { Loader2, UserPlus } from "lucide-react";
import { trackSignUp } from "@/utils/eventTracker";
import { toast } from "@/components/ui/use-toast";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setGeneralError(null);

      const result = await registerUser(
        data.email,
        data.password,
        data.firstName,
        data.lastName
      );

      // Track signup with enhanced user properties (now async)
      await trackSignUp({
        email: data.email,
        userId: result?.id,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Referral removed

      // Show confirmation popup for email verification
      toast({
        title: "Check your email to confirm your account",
        description: "We've sent a confirmation link to your email. Please click the link to activate your account and log in.",
        duration: 10000,
      });

      // Optionally, you may want to NOT redirect immediately, but if you do:
      // navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.message.includes("Email already in use")) {
        setError("email", { message: "This email is already registered" });
      } else {
        setGeneralError(error.message || "Failed to register account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <Card className="w-full max-w-xl border border-white/10 shadow-lg rounded-2xl bg-slate-900/60 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl md:text-4xl font-normal tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {generalError && (
              <div className="bg-red-950/50 p-3 rounded-md border border-red-800">
                <p className="text-sm text-red-400">{generalError}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@school.edu"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
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
            
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 mt-4">
            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
    

            <div className="text-center text-muted-foreground font-normal">
              <p className="text-xs">
                By creating an account, you agree to our{" "}
                <a href="/terms.pdf" target="_blank" rel="noopener noreferrer" className="text-journey-primary hover:underline inline-block mb-2">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-journey-primary hover:underline">
                  Privacy Policy
                </a>.
              </p>
              <p className="text-sm mt-2">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-journey-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
