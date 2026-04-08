import Link from "next/link";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section>
          <SectionLabel>Secure File Sharing System</SectionLabel>
          <div className="mt-16 flex min-h-[55vh] flex-col items-center justify-center gap-10 text-center">
            <h1 className="max-w-3xl font-serif text-5xl leading-tight text-foreground md:text-6xl">
              Cryptographic ABAC Archive
            </h1>
            <Link href="/login">
              <Button variant="primary" className="px-8">
                Login
              </Button>
            </Link>
          </div>
        </Section>
      </MainContainer>
    </main>
  );
}
