// কোর্স পেজ লোড হওয়ার সময় ফাঁকা স্ক্রিনের বদলে কঙ্কাল (skeleton) দেখাবে
export default function Loading() {
  return (
    <div className="animate-pulse">
      <section className="bg-ink">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1fr_400px] lg:py-20">
          <div className="space-y-5">
            <div className="h-7 w-48 rounded-full bg-white/10" />
            <div className="h-12 w-4/5 rounded-xl bg-white/10" />
            <div className="h-5 w-3/5 rounded bg-white/10" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
          <div className="h-[420px] rounded-3xl bg-white/10" />
        </div>
      </section>
      <div className="container space-y-4 py-12">
        <div className="h-7 w-56 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:w-2/3">
          <div className="h-36 rounded-2xl bg-gray-100" />
          <div className="h-36 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
