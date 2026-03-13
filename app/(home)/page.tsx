import MainSection from "@/sections/MainSection";
import Navbar from "@/sections/Navbar";

export default function Home() {
  return (
   <main className=" relative max-w-screen overflow-hidden min-h-screen  bg-background text-text">
      <Navbar />
      {/* Task1 : Add Something that looks good in the empty space of the navbar */}
      
      <section className="w-full min-h-[80%] relative">
        <MainSection />
      </section>
   </main>
  );
}
