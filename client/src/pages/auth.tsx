import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  console.log("Auth page render:", { 
    hasUser: !!user,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending
  });

  useEffect(() => {
    console.log("Auth page mounted");
    return () => console.log("Auth page unmounted");
  }, []);

  // Redirect if already logged in
  if (user) {
    console.log("User already logged in, redirecting to /");
    return <Redirect to="/" />;
  }

  const loginForm = useForm<Pick<InsertUser, "username" | "password">>({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: ""
    }
  });

  console.log("Form states:", {
    loginErrors: loginForm.formState.errors,
    registerErrors: registerForm.formState.errors
  });

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          🌱 Plant Care Management
        </div>
        <div className="relative z-20 mt-auto">
          <h1 className="text-4xl font-semibold tracking-tight">
            Manage your plants with intelligence
          </h1>
          <p className="mt-4 text-lg">
            Join our community of plant enthusiasts and get personalized care recommendations, track growth, and connect with other plant lovers.
          </p>
        </div>
      </div>
      <div className="p-8">
        <Tabs defaultValue="login" className="w-full max-w-md mx-auto" onValueChange={(value) => {
          console.log("Tab changed to:", value);
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card className="p-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(data => {
                  console.log("Login form submitted:", data);
                  loginMutation.mutate(data);
                })}>
                  <div className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card className="p-6">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(data => {
                  console.log("Register form submitted:", data);
                  registerMutation.mutate(data);
                })}>
                  <div className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}