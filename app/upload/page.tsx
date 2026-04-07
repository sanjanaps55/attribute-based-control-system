import Link from "next/link";
import { MainContainer, Section } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { usePolicyAttributes } from "@/hooks/use-abac-data";

export default function UploadPage() {
  const policyAttributes = usePolicyAttributes();

  return (
    <main className="min-h-screen bg-background">
      <MainContainer>
        <Section className="border-b border-border">
          <SectionLabel>Upload Secure File</SectionLabel>
          <div className="mt-10 max-w-3xl">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">Compose sharing policy.</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Attach a file and craft attribute-based access conditions with clear logical groups.
            </p>
          </div>
        </Section>

        <Section>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            <Card variant="standard" className="space-y-4">
              <p className="small-caps-label">File Input</p>
              <Input placeholder="Report-Q2-encrypted.pdf" />
              <Input type="file" />
              <p className="text-sm text-muted-foreground">
                Encryption and upload handlers will be wired in the backend integration phase.
              </p>
              <Button variant="primary">Queue File</Button>
            </Card>

            <Card variant="featured">
              <p className="small-caps-label">Policy Builder</p>
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    {policyAttributes.roles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <select className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    {policyAttributes.departments.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="small-caps-label border border-border bg-muted px-3 py-1.5 text-foreground">
                    Role = Student
                  </span>
                  <span className="small-caps-label text-accent">AND</span>
                  <span className="small-caps-label border border-border bg-muted px-3 py-1.5 text-foreground">
                    Department = Computer Science
                  </span>
                  <span className="small-caps-label text-accent">OR</span>
                  <span className="small-caps-label border border-border bg-muted px-3 py-1.5 text-foreground">
                    Course = CS601 Applied Cryptography
                  </span>
                </div>

                <div className="h-px bg-border" />
                <p className="text-sm text-muted-foreground">
                  Current policy expression:
                  <span className="ml-2 font-mono text-foreground">
                    (Role == Student AND Department == Computer Science) OR Course == CS601
                  </span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary">Add Condition</Button>
                  <Button variant="primary">Save Policy Draft</Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-12">
            <Link href="/">
              <Button variant="ghost" className="px-0 py-0">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Section>
      </MainContainer>
    </main>
  );
}
