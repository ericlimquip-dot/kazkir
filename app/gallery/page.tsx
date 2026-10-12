import { notFound } from "next/navigation";
import { GalleryView } from "./gallery-view";

/** Developer page: available locally and on preview deployments, hidden on the live site. */
export default function GalleryPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <GalleryView />;
}
