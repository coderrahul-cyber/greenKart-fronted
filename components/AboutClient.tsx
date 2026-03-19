// components/AboutClient.tsx
'use client';

import Navbar from '@/sections/Navbar';
import { motion } from 'motion/react';
import Link from 'next/link';

const IMAGES = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e",
  "https://images.unsplash.com/photo-1518843875459-f738682238a6",
  "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

export default function AboutClient() {
  // console.log(process.env.NEXT_PUBLIC_CONTACT_PHONE)
  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #081a16 0%, #0a2420 60%, #0c2d28 100%)",
      }}
    >
        <Navbar />
     {/* HERO SECTION */}
<section className="relative h-[100vh] flex items-center justify-center overflow-hidden px-4">

  {/* Animated Gradient Blob Background */}
  <motion.div
    animate={{ scale: [1, 1.3, 1], rotate: [0, 30, 0] }}
    transition={{ duration: 12, repeat: Infinity }}
    className="absolute w-[700px] h-[700px] rounded-full opacity-20"
    style={{
      background: "radial-gradient(circle, #4ade80, transparent 70%)",
      filter: "blur(120px)",
    }}
  />

  {/* Floating Vegetables (Parallax feel)
  <motion.img
    src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400"
    className="absolute top-20 left-10 w-20 opacity-70"
    animate={{ y: [0, -20, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
  />

  <motion.img
    src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400"
    className="absolute top-90 left-10 w-20 opacity-70"
    animate={{ y: [0, -20, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
  />

  <motion.img
    src="https://images.unsplash.com/photo-1582515073490-39981397c445?q=80&w=400"
    className="absolute bottom-20 right-10 w-24 opacity-70"
    animate={{ y: [0, 20, 0] }}
    transition={{ duration: 5, repeat: Infinity }}
  />

  <motion.img
    src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=400"
    className="absolute top-1/3 right-20 w-16 opacity-60"
    animate={{ y: [0, -15, 0] }}
    transition={{ duration: 6, repeat: Infinity }}
  /> */}

  {/* Grid Overlay */}
  <div className="absolute inset-0 opacity-[0.04]"
    style={{
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }}
  />

  {/* Center Content */}
  <div className="relative z-10 text-center max-w-3xl">

    {/* Tagline */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 text-xs tracking-[0.3em] uppercase font-roboto"
      style={{ color: "rgba(255,255,255,0.3)" }}
    >
      Fresh • Local • Trusted
    </motion.div>

    {/* Main Heading */}
    <motion.h1
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-5xl md:text-7xl font-serif italic leading-tight"
      style={{
        background: "linear-gradient(135deg, #f0f7ee, #86efac)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      From Mandi <br /> to Your Door
    </motion.h1>

    {/* Subtext */}
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mt-6 text-sm md:text-lg font-roboto"
      style={{ color: "rgba(255,255,255,0.5)" }}
    >
      Handpicked vegetables. Same-day delivery. Zero compromise.
    </motion.p>

    {/* CTA Buttons */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 flex justify-center gap-4 flex-wrap"
    >
      <Link
        href="/"
        className="px-6 py-3 rounded-xl font-semibold"
        style={{
          background: "linear-gradient(135deg, #e8f5e0, #c8eabc)",
          color: "#082e28",
        }}
      >
        Explore Store
      </Link>

    </motion.div>
  </div>

  {/* Scroll Indicator */}
  <motion.div
    animate={{ y: [0, 10, 0] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-widest"
    style={{ color: "rgba(255,255,255,0.3)" }}
  >
    SCROLL ↓
  </motion.div>

</section>

      {/* IMAGE PARALLAX GRID */}
      <section className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-6">
        {IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: i * 0.2 }}
            className="rounded-3xl overflow-hidden"
          >
            <img
              src={`${img}?auto=format&fit=crop&w=800&q=80`}
              className="w-full h-[300px] object-cover"
            />
          </motion.div>
        ))}
      </section>

      {/* STORY SECTION */}
      <section className="max-w-5xl mx-auto px-4 py-20 flex flex-col gap-16">
        
        {[
          {
            title: "Direct From Mandi",
            text: "We source vegetables early morning from local mandi ensuring freshness and authenticity in every order.",
          },
          {
            title: "Quality First",
            text: "Every item is carefully inspected. Only premium quality produce reaches your kitchen.",
          },
          {
            title: "Fast Delivery",
            text: "From selection to delivery — everything happens within hours, not days.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="flex-1">
              <h2 className="text-4xl font-serif text-white/80">{item.title}</h2>
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/50">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* FOUNDER SECTION */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="p-10 rounded-3xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 className="text-2xl font-serif mb-4 text-white/80">
            Meet the Founder
          </h3>

          <p className="text-lg font-semibold text-green-400 mb-2">
            Mayank Joshi
          </p>

          <p className="text-sm text-white/50 max-w-md mx-auto">
            Built with a vision to simplify fresh grocery delivery in Khatima,
            ensuring quality, trust, and speed.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="text-center pb-24">
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="/store"
          className="px-8 py-4 rounded-2xl font-semibold"
          style={{
            background: "linear-gradient(135deg, #e8f5e0, #c8eabc)",
            color: "#082e28",
          }}
        >
          Explore Store
        </motion.a>
      </section>
    </main>
  );
}