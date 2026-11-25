"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe2, HeartHandshake, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./LaunchExperience.module.css";

const ONBOARDING_KEY = "buyol_onboarding_completed";
const slides = [
  { eyebrow: "A world within reach", title: "Find pieces that feel made for you.", description: "Explore independent stores and discover products selected for a more personal way to shop.", icon: <Sparkles size={24} aria-hidden="true" /> },
  { eyebrow: "Independent by design", title: "Support stores with a story.", description: "Meet ambitious vendors, browse their collections and shop with confidence across borders.", icon: <HeartHandshake size={24} aria-hidden="true" /> },
  { eyebrow: "Connected commerce", title: "One marketplace. More possibility.", description: "BUYOL brings customers, vendors and global supply together in one trusted experience.", icon: <Globe2 size={24} aria-hidden="true" /> },
];

export function LaunchExperience() {
  const [ready, setReady] = useState(false);
  const [splash, setSplash] = useState(true);
  const [slide, setSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const completed = window.localStorage.getItem(ONBOARDING_KEY) === "true";
    const timer = window.setTimeout(() => { setReady(!completed); setSplash(false); }, completed ? 500 : 1800);
    return () => window.clearTimeout(timer);
  }, []);

  function finish() {
    window.localStorage.setItem(ONBOARDING_KEY, "true");
    router.push("/sign-up");
  }

  if (!ready && !splash) return <main className={styles.returning}><Image src="/brand/buyol-logo.png" alt="BUYOL" width={180} height={180} priority /><h1>Welcome back to BUYOL.</h1><p>Your marketplace is ready when you are.</p><div className={styles.actions}><Link className={styles.primary} href="/shop">Explore the marketplace <ArrowRight size={18} aria-hidden="true" /></Link><Link className={styles.secondary} href="/sign-in">Sign in</Link></div></main>;
  if (splash) return <main className={styles.splash}><div className={styles.logoWrap}><Image src="/brand/buyol-logo.png" alt="BUYOL shopping bag logo" width={220} height={220} priority /></div><p>BUYOL</p><span>Shop beyond boundaries.</span></main>;
  const current = slides[slide];
  return <main className={styles.onboarding}><div className={styles.topbar}><span className={styles.wordmark}>BUYOL</span><button className={styles.skip} type="button" onClick={finish}>Skip</button></div><div className={styles.content} key={slide}><div className={styles.icon}>{current.icon}</div><p className={styles.eyebrow}>{current.eyebrow}</p><h1>{current.title}</h1><p className={styles.description}>{current.description}</p></div><div className={styles.bottom}><div className={styles.dots} aria-label={`Onboarding step ${slide + 1} of ${slides.length}`}>{slides.map((item, index) => <span key={item.title} className={index === slide ? styles.activeDot : styles.dot} />)}</div><button className={styles.next} type="button" onClick={() => slide === slides.length - 1 ? finish() : setSlide((value) => value + 1)}>{slide === slides.length - 1 ? "Create your account" : "Next"}<ArrowRight size={18} aria-hidden="true" /></button></div></main>;
}
