import { redirect } from "next/navigation";
import { getBrandSettings } from "@/lib/getBrandSettings";
import DashboardWelcome from "./DashboardWelcome";

export default async function HomePage() {
  const settings = await getBrandSettings();

  // If brandName exists → the user already completed onboarding
  if (settings && settings.brandName && settings.brandName.trim() !== "") {
    redirect("/dashboard");
  }

  return <DashboardWelcome />;
}
