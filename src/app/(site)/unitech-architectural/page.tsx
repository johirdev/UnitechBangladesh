import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Building2, Phone, Mail, MapPin, ShieldCheck, Trophy, Sparkles, CheckCircle2, Navigation, MessageCircle } from "lucide-react";
import { serverGet } from "@/lib/server-api";
import type { Architectural } from "@/lib/types";
import { OfferSlider, ProjectShowcase, ProjectMarquee, InfoTabs, CountUp, Reveal } from "@/components/site/architectural";

export const metadata: Metadata = {
  title: "UNITECH Architectural — Building Plan, RAJUK Drawing & 3D Design",
  description: "Architectural, structural, electrical and plumbing drawings, municipal seat plans, material estimation and 3D design by Unitech Architectural, Farmgate, Dhaka.",
};

function Head({ eyebrow, title, desc, center, dark }: { eyebrow?: string; title: string; desc?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <span className={dark ? "inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200 ring-1 ring-white/15" : "eyebrow"}>{eyebrow}</span>}
      <h2 className={`mt-4 text-3xl font-extrabold tracking-tight md:text-4xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      {desc && <p className={`mt-4 leading-relaxed ${dark ? "text-white/70" : "text-ink-muted"}`}>{desc}</p>}
    </div>
  );
}

const tel = (p?: string) => (p ? `tel:${p.replace(/[^\d+]/g, "")}` : "#");
const mapLink = (a: { address: string; mapUrl: string }) => a.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`;

export default async function ArchitecturalPage() {
  const a = await serverGet<Architectural>("/public/architectural", 60);
  if (!a) notFound();
  const phone = a.contact?.phone || a.contact?.phone2;
  const offer = a.offers?.[0];
  const whatsapp = a.contact?.whatsapp?.replace(/\D/g, "");

  return (
    <div className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.hero.background || "/images/architectural/offer.jpg"} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/95 to-brand-900/70" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -right-40 top-10 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-3xl" />

        <div className="container relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="motion-safe:animate-fadeUp">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-200 ring-1 ring-white/15">
              <Building2 className="h-4 w-4" /> {a.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{a.hero.title}</h1>
            {a.hero.subtitle && <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">{a.hero.subtitle}</p>}
            <div className="mt-9 flex flex-wrap gap-3">
              {phone && (
                <a href={tel(phone)} className="btn-primary rounded-full px-7 py-3.5 text-base shadow-lift">
                  <Phone className="h-4 w-4" /> {a.hero.ctaText || "Call now"}
                </a>
              )}
              <a href="#projects" className="btn rounded-full bg-white/10 px-7 py-3.5 text-base text-white ring-1 ring-white/20 hover:bg-white hover:text-ink">
                View our projects <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            {!!a.stats?.length && (
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
                {a.stats.slice(0, 3).map((s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-white/55">{s.label}</dt>
                    <dd className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                      <CountUp value={s.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2.5rem] border border-dashed border-white/15 motion-safe:animate-spinSlow [animation-duration:60s]" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.hero.image || a.latest?.image} alt={a.latest?.title || "Unitech Architectural project"} className="h-full w-full object-cover motion-safe:animate-kenburns" />
            </div>
            {offer && (
              <div className="absolute -left-4 bottom-10 rounded-2xl bg-white p-4 text-ink shadow-2xl motion-safe:animate-float sm:-left-10">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{offer.label}</p>
                <p className="text-2xl font-black text-brand-600">{offer.price}</p>
                <p className="text-xs font-semibold text-ink-soft">{offer.unit}</p>
              </div>
            )}
            {a.initiatives?.length > 0 && (
              <div className="absolute -right-3 top-8 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 text-ink shadow-2xl backdrop-blur motion-safe:animate-float [animation-delay:1.5s] sm:-right-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-extrabold leading-none">{a.initiatives[a.initiatives.length - 1].value}</p>
                  <p className="mt-1 text-xs text-ink-muted">{a.initiatives[a.initiatives.length - 1].label}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- About + Milestone ---------- */}
      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.about.image || "/images/architectural/banner.jpg"} alt="Unitech team" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-2 hidden rounded-2xl bg-ink px-6 py-5 text-white shadow-2xl sm:block">
              <p className="text-3xl font-black text-brand">{a.intro?.badge?.match(/\d+/)?.[0] || "5"}+</p>
              <p className="text-xs text-white/70">Years of trusted design</p>
            </div>
          </Reveal>
          <div className="space-y-10">
            <Reveal>
              <Head eyebrow="Who we are" title={a.about.title} />
              <p className="mt-4 leading-relaxed text-ink-soft">{a.about.text}</p>
            </Reveal>
            <Reveal delay={120} className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-7">
              <h3 className="flex items-center gap-2 text-xl font-bold text-ink">
                <Sparkles className="h-5 w-5 text-brand" /> {a.milestone.title}
              </h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{a.milestone.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Services ---------- */}
      {!!a.services?.length && (
        <section className="section bg-gray-50">
          <div className="container">
            <Reveal>
              <Head eyebrow="What we do" title={a.servicesTitle} desc="Everything you need to plan, approve and build, handled by one experienced engineering team." center />
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
              {a.services.map((s, k) => (
                <Reveal key={s.title + k} delay={(k % 4) * 80}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-card transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift">
                    <span className="absolute right-4 top-3 text-xs font-bold text-gray-200 transition group-hover:text-brand-200">{String(k + 1).padStart(2, "0")}</span>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 transition duration-300 group-hover:scale-110 group-hover:bg-brand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {s.icon ? <img src={s.icon} alt="" className="h-9 w-9 object-contain transition group-hover:brightness-0 group-hover:invert" /> : <Building2 className="h-8 w-8 text-brand group-hover:text-white" />}
                    </div>
                    <h3 className="mt-5 font-bold text-ink">{s.title}</h3>
                    {s.description && <p className="mt-2 text-sm text-ink-muted">{s.description}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Offer slider ---------- */}
      {!!a.offers?.length && (
        <section className="section pb-0">
          <div className="container">
            <Reveal>
              <OfferSlider offers={a.offers} phone={phone} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Last delivered project + Our last projects ---------- */}
      <section id="projects" className="section scroll-mt-24">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-start">
            <Reveal className="lg:sticky lg:top-28">
              <Head eyebrow="Portfolio" title={a.projectsTitle} desc={a.projectsSubtitle} />
              {a.latest?.title && (
                <div className="mt-8 overflow-hidden rounded-3xl bg-ink text-white shadow-2xl">
                  {a.latest.image && (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.latest.image} alt={a.latest.title} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {a.latestTitle || "Last Delivered Project"}
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold">{a.latest.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
                      {a.latest.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-brand" /> {a.latest.location}
                        </span>
                      )}
                      {a.latest.year && <span>Delivered {a.latest.year}</span>}
                    </div>
                    {a.latest.description && <p className="mt-3 text-sm leading-relaxed text-white/70">{a.latest.description}</p>}
                  </div>
                </div>
              )}
            </Reveal>
            <Reveal delay={100}>
              <ProjectShowcase projects={a.projects || []} />
            </Reveal>
          </div>
        </div>
        {(a.projects?.length || 0) >= 3 && (
          <div className="mt-16">
            <ProjectMarquee projects={a.projects} />
          </div>
        )}
      </section>

      {/* ---------- Intro + stats ---------- */}
      <section className="section relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="container relative grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Head eyebrow={a.intro.badge} title={a.intro.title} desc={a.intro.text} dark />
            {!!a.stats?.length && (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {a.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10">
                    <CountUp value={s.value} className="text-3xl font-black text-brand" />
                    <p className="mt-1 text-sm text-white/65">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
          {a.intro.image && (
            <Reveal delay={120}>
              <div className="overflow-hidden rounded-[2rem] ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.intro.image} alt={a.intro.title} loading="lazy" className="w-full object-cover" />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------- Certification ---------- */}
      {a.certification?.title && (
        <section className="section">
          <div className="container grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            {a.certification.image && (
              <Reveal className="relative mx-auto w-full max-w-sm">
                <div className="absolute inset-6 -rotate-6 rounded-3xl bg-brand-100" aria-hidden />
                <div className="relative overflow-hidden rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.certification.image} alt={a.certification.title} loading="lazy" className="w-full rounded-2xl" />
                </div>
              </Reveal>
            )}
            <Reveal delay={100}>
              <span className="eyebrow">
                <ShieldCheck className="h-3.5 w-3.5" /> Certified & trusted
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{a.certification.title}</h2>
              <p className="mt-5 leading-relaxed text-ink-soft">{a.certification.text}</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Tabs ---------- */}
      {!!a.tabs?.length && (
        <section className="section pt-0">
          <div className="container">
            <Reveal>
              <InfoTabs tabs={a.tabs} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Initiatives ---------- */}
      {!!a.initiatives?.length && (
        <section className="section bg-gradient-to-b from-brand-50/70 to-white">
          <div className="container">
            <Reveal>
              <Head eyebrow="Impact" title={a.initiativesTitle} center />
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {a.initiatives.map((s, k) => (
                <Reveal key={s.label + k} delay={(k % 4) * 80}>
                  <div className="h-full rounded-3xl border border-white bg-white/80 p-6 shadow-card backdrop-blur transition hover:-translate-y-1 hover:shadow-lift">
                    <CountUp value={s.value} className="text-3xl font-black text-ink md:text-4xl" />
                    <div className="mt-3 h-1 w-10 rounded-full bg-brand" />
                    <p className="mt-3 text-sm text-ink-soft">{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Address ---------- */}
      {!!a.addresses?.length && (
        <section className="section">
          <div className="container">
            <Reveal>
              <Head eyebrow="Visit us" title={a.addressTitle} center />
            </Reveal>
            <div className={`mx-auto mt-12 grid max-w-5xl gap-5 ${a.addresses.length > 1 ? "md:grid-cols-2" : ""}`}>
              {a.addresses.map((ad, k) => (
                <Reveal key={ad.label + k} delay={k * 100}>
                  <div className="group flex h-full gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-card transition hover:border-brand-200 hover:shadow-lift">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand group-hover:text-white">
                      <MapPin className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-ink">{ad.label}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{ad.address}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {ad.phone && (
                          <a href={tel(ad.phone)} className="btn-outline btn-sm rounded-full">
                            <Phone className="h-3.5 w-3.5" /> {ad.phone}
                          </a>
                        )}
                        {ad.address && (
                          <a href={mapLink(ad)} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm rounded-full">
                            <Navigation className="h-3.5 w-3.5" /> Get directions
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- CTA ---------- */}
      <section className="pb-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-brand-600 via-brand to-rose-500 p-8 text-white md:p-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Ready to plan your building?</h2>
                <p className="mt-3 text-white/85">Talk to our engineers today. Get a free consultation and an honest estimate for your project.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {phone && (
                  <a href={tel(phone)} className="btn rounded-full bg-white px-6 py-3.5 text-base text-ink hover:bg-ink hover:text-white">
                    <Phone className="h-4 w-4" /> {phone}
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp.startsWith("0") ? `88${whatsapp}` : whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn rounded-full bg-white/15 px-6 py-3.5 text-base text-white ring-1 ring-white/40 hover:bg-white hover:text-ink">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {a.contact?.email && (
                  <a href={`mailto:${a.contact.email}`} className="btn rounded-full bg-white/15 px-6 py-3.5 text-base text-white ring-1 ring-white/40 hover:bg-white hover:text-ink">
                    <Mail className="h-4 w-4" /> Email us
                  </a>
                )}
                <Link href="/courses" className="btn rounded-full bg-ink/20 px-6 py-3.5 text-base text-white ring-1 ring-white/30 hover:bg-ink">
                  Our courses <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
