// src\components\ui\special\DividerWithText.tsx

import { Separator } from "@/components/ui/separator";

export function DividerWithText({ text }: { text: string }) {
  return (
    <div className="relative">
      <Separator className="my-4" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="bg-background px-2 text-xs uppercase text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}
