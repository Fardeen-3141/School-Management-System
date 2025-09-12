// src\components\ui\special\Logo.tsx

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Logo {
  showName: string;
}

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Link href={"/"}>
        <Image
          src={"/logo.jpg"}
          alt="logo"
          width={1000}
          height={1000}
          className="h-12 w-12 md:w-14 md:h-14 rounded-md"
        />
      </Link>

      <div>
        <h1 className="font-bold tracking-tight text-lg md:text-xl">
          <span className="hidden sm:inline">
            Anipur Adarsha Vidyaniketan HS
          </span>
          <span className="inline sm:hidden">A. A. Vidyaniketan HS</span>
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          Inspiring Young Minds Since 2000
        </p>
      </div>
    </div>
  );
}
