"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe2, HeartHandshake, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./LaunchExperience.module.css";

const slides = [
  { eyebrow: "A world within reach", title: "Find pieces that feel made for you.", description: "Explore independent stores and discover products selected for a more personal way to shop.", icon: <Sparkles size={24} aria-hidden="true" /> },
  { eyebrow: "Independent by design", title: "Support stores with a story.", description: "Meet ambitious vendors, browse their collections and shop with confidence across borders.", icon: <HeartHandshake size={24} aria-hidden="true" /> },
  { eyebrow: "Connected commerce", title: "One marketplace. More possibility.", description: "BUYLO brings customers, vendors and global supply together in one trusted experience.", icon: <Globe2 size={24} aria-hidden="true" /> },
];

export function LaunchExperience() {
  const [splash, setSplash] = useState(true);
  const [slide, setSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  function finish() {
    router.push("/sign-up");
  }

  function skipOnboarding() {
    router.push("/sign-up");
  }

  if (splash) return <main className={styles.splash}><div className={styles.logoWrap}><Image src="/brand/buylo-logo.png" alt="BUYLO shopping bag logo" width={220} height={220} loading="eager" /></div><p>BUYLO</p><span>Shop beyond boundaries.</span></main>;
  const current = slides[slide];
  return <main className={styles.onboarding}><div className={styles.topbar}><Link className={styles.brand} href="/" aria-label="BUYLO home"><Image src="/brand/buylo-logo.png" alt="" width={44} height={44} /><span className={styles.wordmark}>BUYLO</span></Link><button className={styles.skip} type="button" onClick={skipOnboarding}>Skip</button></div><div className={styles.content} key={slide}><div className={styles.icon}>{current.icon}</div><p className={styles.eyebrow}>{current.eyebrow}</p><h1>{current.title}</h1><p className={styles.description}>{current.description}</p></div><div className={styles.bottom}><div className={styles.dots} role="group" aria-label="Choose an onboarding step">{slides.map((item, index) => <button key={item.title} type="button" className={index === slide ? styles.activeDot : styles.dot} aria-label={`Show step ${index + 1}: ${item.eyebrow}`} aria-current={index === slide ? "step" : undefined} onClick={() => setSlide(index)} />)}</div><button className={styles.next} type="button" onClick={() => slide === slides.length - 1 ? finish() : setSlide((value) => value + 1)}>{slide === slides.length - 1 ? "Create your account" : "Next"}<ArrowRight size={18} aria-hidden="true" /></button></div></main>;
}
