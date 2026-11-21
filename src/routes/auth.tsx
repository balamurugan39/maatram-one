import { createFileRoute, redirect } from "@tanstack/react-router";

// Signed-out visitors hitting a protected page land here; send them to the portal chooser.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
