import { Link } from "react-router-dom";
import { Frown } from "lucide-react";

export default function NotFound() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"> {/* Updated background */}
            <Frown className="h-24 w-24 text-muted-foreground mb-6 opacity-50" />
            <h1 className="text-7xl font-bold text-foreground mb-4">404</h1>
            <p className="mb-6 text-muted-foreground text-lg">
                Looks like this page never got generated...
                maybe the AI was on a coffee break ☕
            </p>
            <Link to="/" className="underline text-primary hover:text-primary/80 transition-colors text-lg">
                Go back to Dashboard →
            </Link>
        </div>
    );
}