import React from "react";
// The original logic for checking user session and rendering Login is commented out
// to disable the authentication feature while keeping the file.

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  // Login feature is disabled. Always render children.
  return <>{children}</>;
}