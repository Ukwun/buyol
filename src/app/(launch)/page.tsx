import type { Metadata } from "next";
import { LaunchExperience } from "@/features/onboarding/components/LaunchExperience";

export const metadata: Metadata = { title: "Welcome to BUYLO" };

export default function EntryPage() {
  return <LaunchExperience />;
}
