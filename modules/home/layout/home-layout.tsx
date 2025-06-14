import { SidebarProvider } from "@/components/ui/sidebar";
import HomeSidebar from "../components/home-sidebar";
import { MobileSidebarSheet } from "../components/mobile-sidebar-sheet";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="w-full">
        <div className="min-h-screen flex w-full">
          <div className="md:hidden fixed top-[7px] left-4 z-50">
            <MobileSidebarSheet />
          </div>
          
          <div className="hidden md:block">
            <HomeSidebar />
          </div>
          
          <div className="w-full bg-chat-background border-l border-border flex flex-col">
            <main className="relative w-full mx-auto overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default HomeLayout;
