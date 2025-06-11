import { SidebarProvider } from "@/components/ui/sidebar";
import HomeSidebar from "../components/home-sidebar";
// import ChatInputBox from "@/modules/chat/components/chat-input-box";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="w-full">
        <div className="min-h-screen flex w-full">
          <HomeSidebar />
          <div
            className="w-full bg-chat-background border-l border-border flex flex-col"
          >
            <main className="relative w-full mx-auto overflow-hidden">
              {children}
            </main>
            {/* <div className="w-full max-w-2xl mx-auto sticky bottom-0">
              <ChatInputBox />
            </div> */}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default HomeLayout;
