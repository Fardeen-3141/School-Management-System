// src\components\ui\special\Logo.tsx

import React from "react";
import Image from "next/image";

interface Logo {
  showName: string;
}

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={"/logo-png-light.png"}
        alt="logo"
        width={100}
        height={100}
        className="w-12 h-12 rounded-md"
      />

      <div>
        <h1 className="text-lg md:text-2xl font-bold tracking-tighter md:tracking-tight">Anipur Adarsha Vidyaniketan HS</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-medium tracking-tight">
          Inspiring Young Minds Since 2000
        </p>
      </div>
    </div>
  );
}
