import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Bug,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/SupabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
  { label: 'Docs', href: '/docs', isRoute: true },
  { label: 'Status', href: '/status', isRoute: true },
];

interface Props { user?: { email?: string; avatar_url?: string } | null; onOpenLogin: () => void; }

const LandingHeader = ({ user, onOpenLogin }: Props) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user ?? null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user;
      setCurrentUser(sessionUser ? {
        email: sessionUser.email,
        avatar_url: sessionUser.user_metadata?.avatar_url,
      } : null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      setCurrentUser(sessionUser ? {
        email: sessionUser.email,
        avatar_url: sessionUser.user_metadata?.avatar_url,
      } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavClick = (href: string, isRoute?: boolean) => {
    setOpen(false);
    if (isRoute) return;
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenScanner = () => currentUser ? navigate('/dashboard') : onOpenLogin();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className={`fixed inset-x-8 top-4 z-50 rounded-xl transition-all duration-300 sm:inset-x-12 lg:inset-x-24 xl:left-1/2 xl:right-auto xl:w-full xl:max-w-4xl xl:-translate-x-1/2 ${
      scrolled
        ? 'border border-border bg-background/90 shadow-lg backdrop-blur-xl'
        : 'border border-transparent bg-background/60 backdrop-blur-md'
    }`}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <Bug className="h-6 w-6 text-primary transition-transform duration-200 group-hover:scale-110" />
          <span className="text-base font-bold tracking-tight text-foreground">ABSpider</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) =>
            item.isRoute ? (
              <Link key={item.label} to={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <button key={item.label} onClick={() => handleNavClick(item.href)}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
                {item.label}
              </button>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 cursor-pointer" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Open account menu">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/30 transition-all hover:ring-primary/60">
                    <AvatarImage src={currentUser.avatar_url} alt={currentUser.email || 'Account'} />
                    <AvatarFallback>{(currentUser.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{currentUser.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard />Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account-settings"><UserRound />Account settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings"><Settings />App settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive"><LogOut />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={onOpenLogin} className="cursor-pointer text-sm">Sign in</Button>
          )}
          <Button size="sm" onClick={handleOpenScanner} className="cursor-pointer bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
            Open scanner
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 cursor-pointer" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="h-8 w-8 cursor-pointer" aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/98 px-4 py-4 md:hidden">
          <div className="space-y-1">
            {NAV.map((item) =>
              item.isRoute ? (
                <Link key={item.label} to={item.href} onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <button key={item.label} onClick={() => handleNavClick(item.href)}
                  className="flex w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  {item.label}
                </button>
              )
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            {currentUser ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={currentUser.avatar_url} alt={currentUser.email || 'Account'} />
                    <AvatarFallback>{(currentUser.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                </Avatar>
                  <span className="truncate">{currentUser.email}</span>
                </div>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
                <Link to="/account-settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"><UserRound className="h-4 w-4" />Account settings</Link>
                <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"><Settings className="h-4 w-4" />App settings</Link>
                <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />Sign out</button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onOpenLogin(); }} className="cursor-pointer">Sign in</Button>
            )}
            <Button size="sm" onClick={() => { setOpen(false); handleOpenScanner(); }} className="cursor-pointer font-semibold">Open scanner</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
