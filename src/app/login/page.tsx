
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth hook
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn } from 'lucide-react';

// Schema for login form validation
const loginSchema = z.object({
  username: z.string().min(1, { message: "Usuário é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true); // Set submitting to true
    setLoginError(null); // Clear previous errors
    try {
      // Attempt to login using the context function
      await login(data.username, data.password);
      router.push('/'); // Redirect to home page on successful login
    } catch (error: any) {
      setLoginError(error.message || "Ocorreu um erro inesperado.");
    } finally {
        setIsSubmitting(false); // Set submitting back to false
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6 text-primary" /> Login
          </CardTitle>
          <CardDescription>Entre com seu usuário e senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Login</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="seu.usuario"
                {...form.register('username')}
                className={form.formState.errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={isSubmitting}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                {...form.register('password')}
                className={form.formState.errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={isSubmitting}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
         {/* <CardFooter className="text-center text-sm text-muted-foreground">
           Esqueceu a senha? <Link href="#" className="underline ml-1">Recuperar</Link>
         </CardFooter> */}
      </Card>
    </div>
  );
}
