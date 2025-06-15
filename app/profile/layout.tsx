const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex-1 w-full min-h-screen bg-gradient-to-br from-background to-chat-background">
      {children}
    </main>
  );
};

export default ProfileLayout;
