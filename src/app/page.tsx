import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-votr-dark via-votr-dark to-[#0D1225] -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-votr-gold/5 to-transparent rounded-full blur-3xl -z-10" />

      {/* Logo */}
      <div className="text-center mb-12 animate-slide-up">
        <Image
          src="/icons/logo-full.png"
          alt="VOTR — Voice of the Reveller"
          width={280}
          height={120}
          className="mx-auto"
          priority
        />
      </div>

      {/* Tagline */}
      <div className="text-center max-w-md mb-12 animate-slide-up stagger-2" style={{ animationFillMode: 'forwards', opacity: 0 }}>
        <h2 className="text-2xl font-bold mb-4">
          Your voice. Your <span className="text-votr-gold">Road March</span>.
        </h2>
        <p className="text-votr-text-muted leading-relaxed">
          One scan. One vote. The people&apos;s choice.
          Empowering masqueraders to choose the song that moves them.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs animate-slide-up stagger-4" style={{ animationFillMode: 'forwards', opacity: 0 }}>
        <Link
          href="/login"
          className="w-full py-4 rounded-2xl bg-votr-gold text-votr-dark font-bold text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base"
        >
          Band Leader Login
        </Link>
        <Link
          href="/admin"
          className="w-full py-3 rounded-2xl border border-votr-dark-border text-votr-text-muted font-medium text-center transition-all duration-200 hover:border-votr-gold/30 hover:text-white text-sm"
        >
          Platform Admin
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center">
        <p className="text-votr-text-muted text-xs">
          © 2027 VOTR · Carnival Engagement Analytics
        </p>
      </footer>
    </div>
  );
}
