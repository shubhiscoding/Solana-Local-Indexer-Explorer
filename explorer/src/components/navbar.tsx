"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Search, Menu, Database } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function Navbar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  
  // Search state
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{type: string, value: string}[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.length >= 4) {
      const fetchSearch = async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.results || []);
          }
        } catch(e) {
          console.error(e);
        }
      }
      
      const timer = setTimeout(fetchSearch, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (type: string, value: string) => {
    setOpen(false);
    if (type === "transaction") {
      router.push(`/transactions/${value}`);
    } else if (type === "account") {
      router.push(`/accounts/${value}`);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Transactions", href: "/transactions" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 gap-4 md:gap-8">
          
          <div className="flex items-center gap-2 mr-4 md:mr-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-lg hidden sm:inline-block tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Solana<span className="text-primary italic pr-1">Local</span> Explorer
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-foreground/80 ${
                  pathname === link.href ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="w-full max-w-sm hidden md:flex items-center">
              <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-full"
                onClick={() => setOpen(true)}
              >
                <span className="hidden lg:inline-flex">Search transactions or accounts...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            
            <Button
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Nav Trigger (keep simple for now) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput 
            placeholder="Type a signature or account address..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.length > 0 && results.length === 0 && (
              <CommandEmpty>No results found for {query.length < 8 ? "short search..." : "this query."}</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((res, i) => (
                  <CommandItem
                    key={i}
                    value={res.value}
                    onSelect={() => handleSelect(res.type, res.value)}
                    className="flex items-center gap-2"
                  >
                    {res.type === "transaction" ? (
                      <div className="flex shrink-0 items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500">
                        Tx
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-500">
                        Acc
                      </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-mono text-xs truncate">{res.value}</span>
                      <span className="text-xs text-muted-foreground capitalize">{res.type}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
