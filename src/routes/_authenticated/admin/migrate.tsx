import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMigrationSql, checkMigrationStatus } from "@/lib/migrate";

const migrations = {
  otpsTable: { label: "Create OTPs Table", description: "Creates the otps table with indexes and RLS policies" },
  otpFunctions: { label: "Create OTP Functions", description: "Creates generate_otp and verify_otp functions" },
  modifyTransferFunctions: { label: "Modify Transfer Functions", description: "Updates bank_transfer and send_money to require OTP" },
} as const;

type MigrationName = keyof typeof migrations;

export const Route = createFileRoute("/_authenticated/admin/migrate")({
  component: MigrateRoute,
});

function MigrateRoute() {
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const [selectedMigration, setSelectedMigration] = useState<MigrationName | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ["migration-status"],
    queryFn: checkMigrationStatus,
  });

  const copyMutation = useMutation({
    mutationFn: async (sql: string): Promise<boolean> => {
      await navigator.clipboard.writeText(sql);
      return true;
    },
    onSuccess: () => {
      toast.success("SQL copied to clipboard");
      setTimeout(() => setCopiedSql(null), 2000);
    },
  });

  const handleCopySql = (migrationName: MigrationName, sql: string) => {
    setCopiedSql(migrationName);
    copyMutation.mutate(sql);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Database Migrations</h1>
        <p className="text-muted-foreground mb-8">
          Since we don't have direct SQL execution access, copy the SQL below and execute it manually in the Supabase SQL Editor.
        </p>

        {/* Instructions */}
        <Card className="p-6 mb-6 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">How to Apply Migrations</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Click "New Query"</li>
                <li>Copy the SQL from each migration below</li>
                <li>Paste and execute each migration in order</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Migration Status */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Status</h2>
          {statusData?.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {statusData.status.otpsTable ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-sm text-foreground">OTPs Table: {statusData.status.otpsTable ? "Created" : "Not created"}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-foreground">OTP Functions: Status unknown (check via SQL)</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-foreground">Transfer Functions: Status unknown (check via SQL)</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to check migration status</p>
          )}
        </Card>

        {/* Migration List */}
        <div className="space-y-4">
          {(Object.keys(migrations) as Array<MigrationName>).map((migrationName) => (
            <Card key={migrationName} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{migrations[migrationName].label}</h3>
                  <p className="text-sm text-muted-foreground">{migrations[migrationName].description}</p>
                </div>
                <Button
                  onClick={() => setSelectedMigration(selectedMigration === migrationName ? null : migrationName)}
                  variant="outline"
                  size="sm"
                >
                  {selectedMigration === migrationName ? "Hide SQL" : "Show SQL"}
                </Button>
              </div>

              {selectedMigration === migrationName && (
                <SqlDisplay
                  migrationName={migrationName}
                  onCopy={(sql) => handleCopySql(migrationName, sql)}
                  isCopied={copiedSql === migrationName}
                  isCopying={copyMutation.isPending}
                />
              )}
            </Card>
          ))}
        </div>

        {/* Warning */}
        <Card className="p-6 mt-6 border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Execute migrations in order: OTPs Table → OTP Functions → Transfer Functions</li>
                <li>• Each migration should only be executed once</li>
                <li>• After successful migration, you can remove this route</li>
                <li>• Test the OTP system after all migrations are complete</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SqlDisplay({ 
  migrationName, 
  onCopy, 
  isCopied, 
  isCopying 
}: { 
  migrationName: MigrationName;
  onCopy: (sql: string) => void;
  isCopied: boolean;
  isCopying: boolean;
}) {
  const { data: sqlData, isLoading } = useQuery({
    queryKey: ["migration-sql", migrationName],
    queryFn: () => getMigrationSql({ data: { migrationName } }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-surface-deep rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sqlData?.success) {
    return (
      <div className="p-4 bg-surface-deep rounded-lg text-sm text-muted-foreground">
        Failed to load SQL
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <pre className="bg-surface-deep p-4 rounded-lg text-xs text-foreground overflow-x-auto max-h-96 overflow-y-auto">
          <code>{sqlData.sql}</code>
        </pre>
        <Button
          onClick={() => onCopy(sqlData.sql)}
          disabled={isCopying}
          size="sm"
          className="absolute top-2 right-2"
          variant="secondary"
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
