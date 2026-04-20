import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "@/auth/AuthContext";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
interface SignupFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  requiredOjtHours: number;
}
export const SignupPage = () => {
  const form = useForm<SignupFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      requiredOjtHours: 500,
    },
  });
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (values: SignupFormValues) => {
    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!values.requiredOjtHours || values.requiredOjtHours <= 0) {
      setError("Required OJT hours must be greater than 0");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      await signup(values.firstName, values.lastName, values.email, values.password, Number(values.requiredOjtHours));
      setSuccess(true);
      setTimeout(() => {
        navigate("/verify-otp", { state: { email: values.email } });
      }, 1500);
    } catch (error: any) {
      setError(error.message || "Signup failed. Please try again.");
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#e9edf3] p-0 lg:p-4">
      <div className="h-full w-full">
        <div className="grid h-full w-full grid-cols-1 overflow-hidden border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-2 lg:rounded-[28px]">
          <div className="flex items-center justify-center p-8 sm:p-12 lg:p-14">
            <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-4xl tracking-tight text-slate-900">Create Account</CardTitle>
                <CardDescription className="text-base">Set up your account to start tracking attendance.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium text-slate-600">First Name</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="First name" className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base text-slate-900" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium text-slate-600">Last Name</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="Last name" className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base text-slate-900" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-slate-600">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base text-slate-900" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-slate-600">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base text-slate-900" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiredOjtHours"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-slate-600">Required OJT Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              placeholder="Enter required OJT hours"
                              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base text-slate-900"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-slate-600">Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm password" className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base text-slate-900" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {error && (
                      <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 text-red-700 [&>svg]:text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 [&>svg]:text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>OTP sent to your email. Redirecting to verification...</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl bg-indigo-600 text-base font-semibold text-white hover:bg-indigo-500"
                      disabled={isLoading || success}
                    >
                      {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="justify-center pt-2">
                <p className="text-center text-sm text-slate-500">
                  Already registered?{" "}
                  <Link to="/" className="font-semibold text-slate-900 hover:text-indigo-600">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>

          <div className="hidden h-full bg-gradient-to-br from-indigo-500 to-blue-600 p-10 lg:flex lg:flex-col lg:justify-between">
            <div />
            <div className="mx-auto w-full max-w-lg">
              <h2 className="text-6xl font-semibold leading-[1.1] text-white">
                Manage interns and reports in one place.
              </h2>
              <p className="mt-6 text-base leading-7 text-indigo-100">
                Build a focused workflow for attendance, logs, and progress monitoring with a structured dashboard.
              </p>
              <div className="mt-10 rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Progress Snapshot</p>
                  <span className="text-[10px] text-slate-500">Current month</span>
                </div>
                <div className="grid grid-cols-10 items-end gap-2">
                  {[42, 48, 64, 52, 70, 58, 76, 68, 62, 80].map((height, index) => (
                    <div key={index} className="h-20 rounded-md bg-slate-100">
                      <div className="w-full rounded-md bg-indigo-500" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mx-auto mt-8 h-1.5 w-10 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
};
