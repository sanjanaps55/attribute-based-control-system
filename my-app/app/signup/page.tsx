"use client";

import Link from "next/link";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section>
          <SectionLabel>Authentication</SectionLabel>
          <div className="mx-auto mt-10 max-w-xl">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">Account creation is admin-only.</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Teacher and user accounts are provisioned by admin with assigned roles and attributes.
            </p>

            <Card variant="elevated" className="mt-10">
              <p className="text-muted-foreground">
                Please contact your system admin to receive login credentials.
              </p>
            </Card>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <Link href="/login">
                <Button variant="ghost" className="px-0 py-0">
                  Already have an account
                </Button>
              </Link>
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
