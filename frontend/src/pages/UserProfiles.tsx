import UserInfoCard from "../components/UserProfile/UserInfoCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="Profile Dashboard"
        description="AI Trading"
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UserInfoCard />
      </div>
    </>
  );
}