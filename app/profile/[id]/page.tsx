import ProfileView from "@/modules/profile/components/profile-view";

interface Props {
  params: Promise<{ id: string }>;
}

const Profile = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <div>
      <ProfileView profileId={id} />
    </div>
  );
};

export default Profile;
