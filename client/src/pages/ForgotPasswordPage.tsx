import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import {
  CardFooter,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { authService } from "@/services/auth/auth.service";

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordPage = () => {
  const form = useForm<ForgotPasswordFormValues>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.forgotPassword(values.email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md p-6 mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@gmail.com"
                      {...field}
                      disabled={success}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
                If an account with that email exists, a password reset link has been sent. Please check your email.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Sending..." : success ? "Email Sent" : "Send Reset Link"}
            </Button>
          </form>
        </Form>
        <CardFooter className="flex justify-center mt-4">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/"
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
