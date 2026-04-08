"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/types/auth";

export default function LoginPage() {
  const { signIn, getSignedInRole, loading, error } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLocalError(null);

    const ok = await signIn({ email, password });

    if (ok) {
      const role = await getSignedInRole();

      if (!role) {
        setLocalError("Your account has no role assigned. Contact the admin.");
        return;
      }

      if (role !== selectedRole) {
        setLocalError(`This account is assigned as ${role}. Please select the correct role.`);
        return;
      }

      setMessage("Login successful.");
      router.push(`/${role}`);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section>
          <SectionLabel>Authentication</SectionLabel>
          <div className="mx-auto mt-10 max-w-xl">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">Sign in securely.</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Access the cryptographic ABAC workspace with your institutional credentials.
            </p>

            <Card variant="featured" className="mt-10">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <p className="small-caps-label">Role</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["user", "teacher", "admin"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`border px-3 py-2 text-xs uppercase tracking-[0.15em] ${
                          selectedRole === role
                            ? "border-accent bg-muted text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="small-caps-label">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@institution.edu"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="small-caps-label">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    required
                  />
                </div>

                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
                {message ? <p className="text-sm text-accent">{message}</p> : null}

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Card>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <Link href="/">
                <Button variant="ghost" className="px-0 py-0">
                  Return home
                </Button>
              </Link>
            </div>
          </div>
        </Section>
      </MainContainer>
    </main>
  );
}
