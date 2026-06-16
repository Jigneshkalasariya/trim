import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { CreateUrlForm } from '@/components/CreateUrlForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Layout() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleCreateSuccess() {
    setDialogOpen(false);
    setRefreshKey((key) => key + 1);
  }

  return (
    <TooltipProvider>
      <div className="relative min-h-screen overflow-hidden text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-1/2 top-[-11rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(15,118,110,0.24)_0%,_rgba(15,118,110,0.08)_35%,_transparent_72%)] blur-3xl" />
          <div className="absolute right-[-6rem] top-[8rem] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(245,158,11,0.18)_0%,_rgba(245,158,11,0.05)_40%,_transparent_72%)] blur-3xl" />
          <div className="absolute bottom-[-8rem] left-[-4rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.14)_0%,_rgba(59,130,246,0.04)_42%,_transparent_76%)] blur-3xl" />
        </div>

        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/"
                className="group flex flex-col gap-1"
                aria-label="Trim home"
              >
                <span className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Trim
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <NavigationMenu viewport={false}>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/" className={navigationMenuTriggerStyle()}>
                        All Links
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-[0_14px_40px_rgba(15,118,110,0.24)]">
                    Shorten URL
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <CreateUrlForm onSuccess={handleCreateSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
          <Outlet context={{ refreshKey }} />
        </main>
      </div>
    </TooltipProvider>
  );
}
