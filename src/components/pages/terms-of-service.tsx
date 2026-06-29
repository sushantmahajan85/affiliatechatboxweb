"use client";

import { LegalPageShell } from "./legal-page-shell";
import {
  TERMS_OF_SERVICE_META,
  TERMS_OF_SERVICE_SECTIONS,
} from "@/lib/terms-of-service-content";

export function TermsOfServicePage() {
  return (
    <LegalPageShell
      title={TERMS_OF_SERVICE_META.title}
      subtitle={TERMS_OF_SERVICE_META.subtitle}
      lastUpdated={TERMS_OF_SERVICE_META.lastUpdated}
      dateLabel={TERMS_OF_SERVICE_META.dateLabel}
      sections={TERMS_OF_SERVICE_SECTIONS}
    />
  );
}
