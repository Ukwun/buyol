"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./HomeHero.module.css";

const slides = [
  { image: "/brand/hero/buylo-shopping.png", eyebrow: "Made for every kind of discovery", title: "Shop your world.\nFind your people.", description: "Discover independent stores, thoughtful products and the stories behind every order.", accent: "#ffad18" },
  { image: "/brand/hero/buylo-fashion.png", eyebrow: "Independent style, worldwide", title: "Your next\nstatement starts here.", description: "Explore expressive finds from vendors building something worth sharing.", accent: "#ff7b45" },
  { image: "/brand/hero/buylo-care.png", eyebrow: "A marketplace with a human touch", title: "Buy with\nmore meaning.", description: "Meet the people, stores and ideas that make every purchase feel personal.", accent: "#79c7ff" },
] as const;

export function HomeHero() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className={styles.hero} aria-label="BUYLO marketplace introduction" style={{ "--accent": slide.accent } as React.CSSProperties}>
      <div className={styles.copy} key={active}>
        <p className={styles.eyebrow}>{slide.eyebrow}</p>
        <h1>{slide.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
        <p className={styles.description}>{slide.description}</p>
        <div className={styles.actions}><Link className={styles.primary} href="#catalog">Explore the marketplace <ArrowRight size={18} aria-hidden="true" /></Link><Link className={styles.secondary} href="/vendor">Sell on BUYLO</Link></div>
      </div>
      <div className={styles.visual} key={`visual-${active}`}><div className={styles.glow} /><Image className={styles.person} src={slide.image} alt="" width={720} height={720} loading="eager" /><div className={styles.note}><span>BUYLO</span><strong>Something for everyone.</strong></div></div>
      <div className={styles.controls}><button type="button" className={styles.arrow} onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)} aria-label="Previous banner"><ChevronLeft size={18} aria-hidden="true" /></button><div className={styles.dots} aria-label={`Banner ${active + 1} of ${slides.length}`}>{slides.map((item, index) => <button type="button" key={item.image} className={index === active ? styles.activeDot : styles.dot} onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} aria-current={index === active ? "true" : undefined} />)}</div><button type="button" className={styles.arrow} onClick={() => setActive((current) => (current + 1) % slides.length)} aria-label="Next banner"><ChevronRight size={18} aria-hidden="true" /></button></div>
    </section>
  );
}
