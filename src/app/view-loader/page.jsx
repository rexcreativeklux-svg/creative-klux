import PracticeLoader from "@/components/PracticeLoader";

// Public preview route (no auth) for the PracticeLoader component.
export const metadata = {
  title: "Loader preview",
};

export default function ViewLoaderPage() {
  return <PracticeLoader />;
}
