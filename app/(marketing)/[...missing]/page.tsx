import { notFound } from "next/navigation";

// Catch-all so unknown URLs render the 404 inside the public layout (nav,
// footer, fonts) instead of the bare root not-found.
export default function Missing() {
  notFound();
}
