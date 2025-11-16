# ABSpider Recon Dashboard - AI Development Rules

This document outlines the core technologies used in the ABSpider Recon Dashboard and provides clear guidelines for library usage to ensure consistency, maintainability, and adherence to best practices.

## Tech Stack Overview

The ABSpider Recon Dashboard is built with a modern and efficient web development stack:

*   **React**: The primary JavaScript library for building the user interface.
*   **TypeScript**: Used for type safety across the entire codebase, enhancing code quality and developer experience.
*   **Vite**: A fast and lightweight build tool that provides an excellent development experience with hot module replacement.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly styling components directly in markup, ensuring responsive and consistent designs.
*   **shadcn/ui**: A collection of beautifully designed, accessible, and customizable UI components built with Radix UI and Tailwind CSS.
*   **Radix UI**: A low-level UI component library that provides unstyled, accessible primitives, which shadcn/ui builds upon.
*   **React Router DOM**: The standard library for client-side routing, managing navigation within the single-page application.
*   **Supabase**: Utilized for robust user authentication, providing a secure and passwordless login experience via magic links.
*   **@tanstack/react-query**: A powerful library for managing, caching, and synchronizing server state in React applications.
*   **Lucide React**: A comprehensive icon library, providing a wide range of customizable SVG icons.
*   **jsPDF & jspdf-autotable**: Libraries for generating dynamic, professional PDF reports directly in the browser.
*   **React Hook Form & Zod**: Used together for efficient form management and schema-based validation.
*   **Sonner**: A modern, accessible, and highly customizable toast notification library for user feedback.

## Library Usage Rules

To maintain a consistent and high-quality codebase, please adhere to the following rules when developing or modifying features:

*   **UI Components**:
    *   **Always prioritize `shadcn/ui` components.** Check `src/components/ui/` first.
    *   If a required component is not available in `shadcn/ui` or needs significant customization, create a **new component file** in `src/components/` (e.g., `src/components/MyCustomComponent.tsx`).
    *   **DO NOT modify existing `shadcn/ui` files** in `src/components/ui/`. If a `shadcn/ui` component needs a slight variation, wrap it in a new component or extend its styling using Tailwind CSS.
*   **Styling**:
    *   **Exclusively use Tailwind CSS** for all styling. Avoid inline styles or custom CSS files unless absolutely necessary for very specific, non-Tailwind-compatible scenarios (which should be rare).
    *   Ensure designs are **responsive** by utilizing Tailwind's responsive utility classes (e.g., `md:`, `lg:`).
*   **Routing**:
    *   Use `react-router-dom` for all navigation.
    *   **Keep all primary route definitions within `src/App.tsx`**.
    *   Page components should reside in `src/pages/`.
*   **State Management & Data Fetching**:
    *   For server-side data fetching, caching, and synchronization, use **`@tanstack/react-query`**.
    *   For simple, local component state, `useState` and `useReducer` are appropriate.
*   **Authentication**:
    *   All user authentication must be handled via **Supabase**. Refer to `src/SupabaseClient.ts` and `src/components/RequireAuth.tsx` for existing implementations.
*   **Icons**:
    *   Use icons from the **`lucide-react`** library.
*   **Form Handling**:
    *   For forms, use **`react-hook-form`** for form state management and **`zod`** for schema validation.
*   **PDF Generation**:
    *   Use **`jspdf`** and **`jspdf-autotable`** for creating and exporting PDF reports.
*   **Toast Notifications**:
    *   Use **`sonner`** for displaying transient, non-blocking notifications to the user.
*   **Date Manipulation**:
    *   For any date formatting, parsing, or manipulation, use **`date-fns`**.
*   **Utility Functions**:
    *   For conditionally applying Tailwind classes, use `clsx` and `tailwind-merge` via the `cn` utility function in `src/lib/utils.ts`.
*   **File Structure**:
    *   New components should be placed in `src/components/`.
    *   New pages should be placed in `src/pages/`.
    *   New services/API interactions should be placed in `src/services/`.
    *   Directory names must be all lower-case.

By following these rules, we ensure a consistent, maintainable, and high-performing application.