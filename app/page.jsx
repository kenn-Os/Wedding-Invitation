import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { Heart, MapPin, Calendar, Clock } from 'lucide-react';
import { WEDDING_DATA } from '@/lib/constants';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ivory">
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background image — replace src with actual couple photo */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&q=80"
            alt="Hero background"
            fill
            priority
            className="object-cover"
          />
        </div>
        
        {/* Simplified Overlay - ensures text is readable and interactive */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-deeprose/70 pointer-events-none" />

        {/* Decorative corner frames */}
        <div className="absolute top-24 left-8 w-16 h-16 border-t border-l border-white/30" />
        <div className="absolute top-24 right-8 w-16 h-16 border-t border-r border-white/30" />
        <div className="absolute bottom-16 left-8 w-16 h-16 border-b border-l border-white/30" />
        <div className="absolute bottom-16 right-8 w-16 h-16 border-b border-r border-white/30" />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6 animate-fade-in pointer-events-auto">
          <p className="font-sans text-xs tracking-[0.5em] uppercase text-blush/90 mb-10 font-light">
            Together with their families
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mb-8">
            <h1 className="font-script text-7xl md:text-9xl text-white drop-shadow-lg">
              {WEDDING_DATA.couple.person1}
            </h1>
            <div className="flex items-center gap-4 my-2 md:my-0">
              <div className="h-px w-10 md:w-16 bg-white/40" />
              <Heart size={20} className="text-blush fill-blush" />
              <div className="h-px w-10 md:w-16 bg-white/40" />
            </div>
            <h1 className="font-script text-7xl md:text-9xl text-white drop-shadow-lg">
              {WEDDING_DATA.couple.person2}
            </h1>
          </div>

          <p className="font-display text-lg md:text-xl italic font-light text-white/90 mb-8 max-w-2xl mx-auto">
            Request the pleasure of your company at their wedding celebration
          </p>

          {/* Date/Location placeholder pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2">
              <Calendar size={14} className="text-blush" />
              <span className="font-sans text-xs tracking-widest uppercase text-white/90">
                {WEDDING_DATA.date.month} {WEDDING_DATA.date.day}, {WEDDING_DATA.date.year}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2">
              <MapPin size={14} className="text-blush" />
              <span className="font-sans text-xs tracking-widest uppercase text-white/90">
                {WEDDING_DATA.venue.name}
              </span>
            </div>
          </div>

          {/* Scroll indicator */}
          {/* <div className="absolute left-1/2 -bottom-24 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <div className="w-px h-8 bg-white/50" />
            <div className="w-1 h-1 rounded-full bg-white/70" />
          </div> */}
        </div>
      </section>

      {/* ── OUR STORY SECTION ── */}
      <section id="story" className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-script text-5xl text-champagne mb-4">Our Story</p>
          <div className="ornament mb-10">
            <span className="font-sans text-xs tracking-widest text-warmgray uppercase">{WEDDING_DATA.story.established}</span>
          </div>
          <p className="font-display text-xl md:text-2xl text-charcoal font-light leading-relaxed italic">
            &quot;{WEDDING_DATA.story.quote}&quot;
          </p>
          <div className="gold-divider my-12" />
          <p className="font-sans text-sm text-warmgray leading-relaxed">
            {WEDDING_DATA.story.description}
          </p>
        </div>
      </section>

      {/* ── WEDDING DETAILS SECTION ── */}
      <section id="details" className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-script text-5xl text-champagne mb-2">Wedding Details</p>
            <div className="ornament mt-6">
              <span className="font-sans text-xs tracking-widest text-warmgray uppercase">Save the Date</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Date',
                main: WEDDING_DATA.date.full,
                sub: 'Mark your calendars',
              },
              {
                icon: Clock,
                title: 'Time',
                main: 'To Be Announced',
                sub: 'Reception to follow',
              },
              {
                icon: MapPin,
                title: 'Venue',
                main: WEDDING_DATA.venue.name,
                sub: WEDDING_DATA.venue.address,
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-8 text-center border border-blush/30">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center border border-champagne/50">
                    <item.icon size={18} className="text-champagne" />
                  </div>
                </div>
                <p className="font-sans text-xs tracking-widest uppercase text-champagne mb-3 font-medium">{item.title}</p>
                <p className="font-display text-xl text-deeprose font-light mb-1">{item.main}</p>
                <p className="font-sans text-xs text-warmgray">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY SECTION (Placeholder) ── */}
      {/* <section id="gallery" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-script text-5xl text-champagne mb-2">Gallery</p>
            <div className="ornament mt-6">
              <span className="font-sans text-xs tracking-widest text-warmgray uppercase">Moments</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'photo-1583939003579-730e3918a45a',
              'photo-1519741497674-611481863552',
              'photo-1511285560929-80b456503681',
              'photo-1537633552985-df8429e8048b',
              'photo-1537633552985-df8429e8048b',
              'photo-1537633552985-df8429e8048b',
            ].map((id, i) => (
              <div key={i} className={`relative overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`} style={{ minHeight: i === 0 ? '320px' : '160px' }}>
                <Image
                  src={`https://images.unsplash.com/${id}?w=600&q=80`}
                  alt="Wedding gallery"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
          <p className="text-center font-sans text-xs text-warmgray mt-6 tracking-wide">
            [Replace these images with your own couple photos]
          </p>
        </div>
      </section> */}

      {/* ── FOOTER ── */}
      <footer className="bg-deeprose py-12 px-6 text-center">
        <p className="font-script text-4xl text-champagne mb-4">
          {WEDDING_DATA.couple.person1} & {WEDDING_DATA.couple.person2}
        </p>
        <div className="gold-divider max-w-xs mx-auto mb-6" />
        <p className="font-display text-sm italic text-blush/80 font-light">
          &quot;Two souls, one heart, a lifetime of love.&quot;
        </p>
        <p className="font-sans text-xs text-white/30 mt-8 tracking-widest">
          © {new Date().getFullYear()} — Made with love
        </p>
      </footer>
    </main>
  );
}
