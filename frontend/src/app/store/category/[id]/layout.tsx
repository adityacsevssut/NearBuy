import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedItem = decodeURIComponent(resolvedParams.id);
  const formattedItem = decodedItem.replace(/-/g, " ");
  const titleText = formattedItem.charAt(0).toUpperCase() + formattedItem.slice(1);
  return {
    title: `${titleText} - ZyphCart`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
