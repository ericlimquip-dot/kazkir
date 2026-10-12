import Features01 from "@/components/originkit/features-01";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function Home() {
  return (
    <>
      <div className="fixed right-4 top-4 z-20">
        <LocaleSwitcher />
      </div>
      <Features01 />
    </>
  );
}
