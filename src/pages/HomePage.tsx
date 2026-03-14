import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Flame,
  Share2,
  CalendarCheck
} from 'lucide-react';
import { format, addDays, isBefore, startOfToday, isSameDay, differenceInDays, getHours, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from '@/components/ui/sonner';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  calculateBookingDate,
  getBookingStatus,
  getCountdown,
  generateGoogleCalendarLink,
  getCurrentIST,
  toIST,
  BookingType
} from '@/lib/irctc-utils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
/**
 * CLIENT CONFIG: Toggle ads visibility for Day 1 launch
 */
const SHOW_ADS = false;
/**
 * Custom Logo: Modern train silhouette merging into a calendar icon.
 * Railway Blue (#21409A) for the train.
 * Safety Orange (#E8581B) for the "Opening Date" accents.
 */
const RailOpeningLogo = ({ className }: { className?: string }) => (
  <img
    src="/logo.png"
    alt="Train Ticket Dates Logo"
    className={cn("object-contain", className)}
    style={{ height: "37px", width: "69px" }}
  />
);
/**
 * Result Card Component for displaying booking details
 */
function ResultCard({
  journeyDate,
  type,
  targetHour,
  title,
  className,
  currentTime
}: {
  journeyDate: Date,
  type: BookingType,
  targetHour: number,
  title: string,
  className?: string,
  currentTime: Date
}) {
  const status = getBookingStatus(journeyDate, currentTime, type, targetHour);
  const countdown = getCountdown(journeyDate, currentTime, type, targetHour);
  const bookingDate = calculateBookingDate(journeyDate, type);
  const isTatkal = type === 'TATKAL';
  const isHurryState = useMemo(() => {
    const istNow = toIST(currentTime);
    if (!isSameDay(istNow, bookingDate)) return false;
    const currentHour = getHours(istNow);
    const currentMin = istNow.getMinutes();
    return currentHour === targetHour - 1 && currentMin >= 50;
  }, [currentTime, bookingDate, targetHour]);
  const handleReminderClick = () => {
    toast.success('Reminder link generated! Add it to your calendar.');
  };
  return (
    <div className={cn("retro-card overflow-hidden relative group", className)}>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
        <span className="text-9xl font-black italic">OPEN</span>
      </div>
      <div className={cn(
        " -mx-6 -mt-6 p-3 text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-between px-6 border-b-2 border-black relative z-10",
        isTatkal ? (targetHour === 10 ? "bg-[#E8581B]" : "bg-[#21409A]") : "bg-[#21409A]"
      )}>
        <span className="flex items-center gap-2">
          {isTatkal ? <Zap className="w-3 h-3 fill-white" /> : <Clock className="w-3 h-3" />}
          {title}
        </span>
        <span className="font-mono bg-black/20 px-2 py-0.5 rounded-sm">{targetHour}:00 AM IST</span>
      </div>
      <div className="py-6 text-center space-y-3 relative z-10">
        {status === 'FUTURE' && (
          <>
            <div className="text-gray-400 uppercase tracking-widest font-bold text-xs md:text-sm">Booking Opens On</div>
            <div className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter">
              {format(toIST(bookingDate), 'dd MMM yyyy')}
            </div>
            <div className="text-sm md:text-base font-mono text-orange-600 font-bold uppercase flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {format(toIST(bookingDate), 'EEEE')} at {targetHour}:00 AM
            </div>
            {countdown && (
              <motion.div
                animate={isHurryState ? { backgroundColor: ["#FFFFFF", "#FEF3C7", "#FFFFFF"] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={cn(
                  "mt-6 p-5 border-y-4 border-black border-dashed flex justify-center gap-6",
                  isHurryState ? "bg-[#FEF3C7]" : "bg-gray-50/50"
                )}
              >
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: String(countdown.hours).padStart(2, '0'), label: 'Hrs' },
                  { value: String(countdown.minutes).padStart(2, '0'), label: 'Mins' },
                  { value: String(countdown.seconds).padStart(2, '0'), label: 'Secs', color: isHurryState ? 'text-red-600' : 'text-orange-600' }
                ].map((item, idx) => (
                  <React.Fragment key={item.label}>
                    <div className="flex flex-col items-center">
                      <span className={cn("text-3xl md:text-4xl font-black tabular-nums", item.color)}>{item.value}</span>
                      <span className="text-xs uppercase font-bold text-gray-500 mt-1">{item.label}</span>
                    </div>
                    {idx < 3 && <div className="text-3xl md:text-4xl font-black pt-1 text-gray-300">:</div>}
                  </React.Fragment>
                ))}
              </motion.div>
            )}
          </>
        )}
        {status === 'TODAY_BEFORE_OPEN' && (
          <div className="py-6 space-y-5">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-red-600 text-5xl md:text-6xl font-black uppercase italic tracking-tighter"
            >
              Opens Today!
            </motion.div>
            <div className="bg-red-50 border-4 border-red-600 p-5 text-red-600 text-sm md:text-base font-bold flex flex-col items-center gap-3 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
              <div className="flex items-center gap-3">
                <BellRing className="w-6 h-6 animate-ring" />
                SYSTEM READY: Window opens at {targetHour}:00 AM sharp.
              </div>
            </div>
          </div>
        )}
        {status === 'TODAY_AFTER_OPEN' && (
          <div className="py-6 space-y-5">
            <div className="text-green-600 text-5xl md:text-6xl font-black uppercase italic tracking-tighter">Live Now</div>
            <div className="bg-green-50 border-4 border-green-600 p-5 text-green-600 text-sm md:text-base font-bold flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]">
              <ShieldCheck className="w-6 h-6" /> TICKET WINDOW IS OPEN
            </div>
          </div>
        )}
        {status === 'OPEN' && (
          <div className="py-6 space-y-5">
            <div className="text-[#21409A] text-5xl md:text-6xl font-black uppercase italic tracking-tighter">Booking Open</div>
            <p className="text-base md:text-lg font-bold text-gray-600">The 60-day reservation period is currently active.</p>
          </div>
        )}
        {SHOW_ADS && (
          <div id="ad-slot-result" className="mt-4 pt-4 border-t border-gray-100">
            <a href="https://www.makemytrip.com" target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-[#21409A] hover:underline flex items-center justify-center gap-2 group">
              💡 Pro Tip: Check Flight Prices if trains are waitlisted
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
        <Button
          asChild
          className={cn(
            "retro-button-secondary h-14 md:h-16 text-sm md:text-base uppercase tracking-tight font-black",
            isTatkal && targetHour === 11 && "bg-[#21409A]"
          )}
          onClick={handleReminderClick}
        >
          <a href={generateGoogleCalendarLink(journeyDate, type, targetHour)} target="_blank" rel="noopener noreferrer">
            <BellRing className="mr-2 w-5 h-5" /> Set Alarm
          </a>
        </Button>
        <Button asChild className="retro-button-primary h-14 md:h-16 text-sm md:text-base uppercase tracking-tight font-black">
          <a href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
            {isTatkal ? "Login Fast" : "Go to IRCTC"} <ExternalLink className="ml-2 w-5 h-5 shrink-0" />
          </a>
        </Button>
      </div>
    </div>
  );
}
export function HomePage() {
  const isMobile = useIsMobile();
  const [bookingType, setBookingType] = useState<BookingType>('GENERAL');
  const [tatkalClassType, setTatkalClassType] = useState<'AC' | 'NON_AC'>('AC');
  const [journeyDateStr, setJourneyDateStr] = useState<string>(format(addDays(getCurrentIST(), 61), 'yyyy-MM-dd'));
  const [currentTime, setCurrentTime] = useState(new Date());
  // Refs for auto-scroll logic
  const resultsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const journeyDate = useMemo(() => {
    if (!journeyDateStr) return startOfDay(getCurrentIST());
    try {
      const d = new Date(journeyDateStr);
      return isNaN(d.getTime()) ? startOfDay(getCurrentIST()) : d;
    } catch { return startOfDay(getCurrentIST()); }
  }, [journeyDateStr]);
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setJourneyDateStr(newVal);
    // Auto-scroll to results for better UX
    if (newVal) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };
  const handleShare = async () => {
    const shareData = {
      title: 'trainticketdates.in',
      text: 'Hey! I found this tool that tells you exactly when to book train tickets: trainticketdates.in. It even has a countdown for Tatkal!',
      url: 'https://trainticketdates.in'
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };
  const isPastDate = useMemo(() => isBefore(journeyDate, startOfDay(getCurrentIST())), [journeyDate]);
  const isTatkalInvalid = useMemo(() => {
    if (bookingType !== 'TATKAL') return false;
    return differenceInDays(journeyDate, startOfDay(getCurrentIST())) <= 1;
  }, [journeyDate, bookingType]);
  const isHighAlert = bookingType === 'TATKAL';
  return (
    <div className={cn(
      "min-h-screen grid-bg transition-colors duration-500 font-sans selection:text-white overflow-x-hidden relative pb-12",
      isHighAlert ? "bg-[#FFF9E6]" : "bg-[#F0F4F8]"
    )}>
      <div className="scanline" />
      <header className={cn(
        "transition-colors duration-500 text-white border-b-4 border-black py-4 md:py-6 px-4 relative overflow-hidden",
        isHighAlert ? "bg-[#E8581B]" : "bg-[#21409A]"
      )}>
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <motion.div
              animate={isHighAlert ? { scale: [1, 1.05, 1], rotate: [0, 2, 0, -2, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="bg-white p-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-shrink-0"
            >
              <RailOpeningLogo />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-tight whitespace-nowrap">
                trainticketdates<span className={isHighAlert ? "text-yellow-300" : "text-[#E8581B]"}>.in</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-end">
              <div className="text-[9px] uppercase font-bold text-white/70 tracking-widest hidden md:block">IST</div>
              <div className="text-base md:text-xl font-semibold tracking-wider text-white flex items-center gap-1 md:gap-2">
                <Clock className="w-3 md:w-3.5 h-3 md:h-3.5 opacity-70" />
                {format(toIST(currentTime), 'HH:mm:ss')}
              </div>
            </div>
            <Button
              onClick={handleShare}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-[10px] uppercase h-9 md:h-10 px-2 sm:px-3 md:px-4 font-bold tracking-widest min-w-[36px] flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 space-y-8">
        {SHOW_ADS && (
          <div id="ad-slot-top" className="w-full border-2 border-dashed border-gray-400 p-8 bg-white/50 flex flex-col items-center justify-center min-h-[120px] transition-all hover:bg-white shadow-sm">
            <span className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-[0.3em]">Sponsored Travel Insight</span>
            <a href="https://www.makemytrip.com" target="_blank" rel="noopener noreferrer" className="text-[#21409A] font-black hover:underline flex items-center gap-3 group text-base md:text-lg text-center px-4">
              {isHighAlert ? "🚨 Tatkal Full? Check Flight Prices Instantly on MakeMyTrip" : "🚖 Planning a trip? Book reliable station transfers on MakeMyTrip"}
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </a>
          </div>
        )}
        {/* Simplified, focused input section */}
        <div className="max-w-3xl mx-auto space-y-6 mb-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-800">
              When Can I Book My Ticket?
            </h2>
            <p className="text-sm md:text-base text-gray-600 font-semibold">
              Select your journey details below
            </p>
          </div>
          
          <div className="retro-card shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-white">
            <div className="space-y-8">
              {/* Booking Type - Bigger and more prominent */}
              <div>
                <Label className="text-base md:text-lg font-black uppercase mb-4 text-gray-700 tracking-wide flex items-center justify-center gap-2">
                  <span className="bg-[#21409A] text-white px-3 py-1 text-sm">STEP 1</span>
                  Select Booking Type
                </Label>
                <Tabs defaultValue="GENERAL" value={bookingType} onValueChange={(v) => setBookingType(v as BookingType)} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-16 md:h-20 bg-gray-200 p-2 border-4 border-black rounded-none">
                    <TabsTrigger
                      value="GENERAL"
                      className="rounded-none data-[state=inactive]:text-gray-500 data-[state=active]:bg-[#21409A] data-[state=active]:text-white font-black text-base md:text-xl uppercase transition-all data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      General
                    </TabsTrigger>
                    <TabsTrigger
                      value="TATKAL"
                      className="rounded-none data-[state=inactive]:text-gray-500 data-[state=active]:bg-[#E8581B] data-[state=active]:text-white font-black text-base md:text-xl uppercase flex items-center gap-2 justify-center transition-all data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Zap className="w-5 h-5 fill-current" /> Tatkal
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Date Input - Bigger and more prominent */}
              <div>
                <Label htmlFor="journey-date" className="text-base md:text-lg font-black uppercase mb-4 text-gray-700 tracking-wide flex items-center justify-center gap-2">
                  <span className="bg-[#E8581B] text-white px-3 py-1 text-sm">STEP 2</span>
                  <CalendarCheck className="w-5 h-5 text-[#21409A]" /> Enter Your Journey Date
                </Label>
                <Input
                  id="journey-date"
                  type="date"
                  className="retro-input w-full h-16 md:h-20 bg-white text-xl md:text-2xl font-black text-center border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]"
                  value={journeyDateStr}
                  onChange={handleDateChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-8">
          <section ref={resultsRef} className="max-w-5xl mx-auto scroll-mt-4">
            <AnimatePresence mode="wait">
              {isPastDate || isTatkalInvalid ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="retro-card border-red-600 bg-red-50/30 text-center py-16 md:py-20 space-y-6">
                  <div className="text-red-600 text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Invalid Date</div>
                  <p className="text-lg md:text-xl font-bold text-gray-800 max-w-lg mx-auto px-4">
                    {isPastDate ? "Journey dates cannot be in the past. Please select a future date." : "Tatkal booking for this date is already closed. Check General availability instead."}
                  </p>
                  {isTatkalInvalid && <Button onClick={() => setBookingType('GENERAL')} className="retro-button-primary mt-6 h-14 text-base font-black">Switch to General ARP</Button>}
                </motion.div>
              ) : (
                <motion.div key={bookingType + journeyDateStr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  {bookingType === 'GENERAL' ? (
                    <div className="max-w-2xl mx-auto">
                      <ResultCard
                        journeyDate={journeyDate}
                        type="GENERAL"
                        targetHour={8}
                        title="General Booking Window"
                        className="border-[#21409A] shadow-[12px_12px_0px_0px_rgba(33,64,154,0.1)]"
                        currentTime={currentTime}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-orange-100 border-4 border-[#E8581B] text-[#E8581B] font-black text-sm md:text-base uppercase tracking-wide italic rounded-none">
                          <Zap className="w-5 h-5 fill-current" /> Tatkal Booking Windows
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-800">Choose Your Class Category</h2>
                      </div>
                      <div className="relative">
                        {isMobile ? (
                          <Tabs value={tatkalClassType} onValueChange={(v) => setTatkalClassType(v as 'AC' | 'NON_AC')} className="w-full">
                            <TabsList className="grid grid-cols-2 w-full h-16 border-4 border-black rounded-none bg-white p-0">
                              <TabsTrigger value="AC" className="rounded-none data-[state=inactive]:text-gray-500 data-[state=inactive]:bg-gray-50 data-[state=active]:bg-[#E8581B] data-[state=active]:text-white font-black text-base">AC (10 AM)</TabsTrigger>
                              <TabsTrigger value="NON_AC" className="rounded-none data-[state=inactive]:text-gray-500 data-[state=inactive]:bg-gray-50 data-[state=active]:bg-[#21409A] data-[state=active]:text-white font-black text-base">NON-AC (11 AM)</TabsTrigger>
                            </TabsList>
                            <div className="mt-8">
                              <ResultCard
                                journeyDate={journeyDate}
                                type="TATKAL"
                                targetHour={tatkalClassType === 'AC' ? 10 : 11}
                                title={tatkalClassType === 'AC' ? "Tatkal: AC Classes" : "Tatkal: Sleeper/Non-AC"}
                                className={tatkalClassType === 'AC' ? "border-[#E8581B] shadow-[10px_10px_0px_0px_rgba(232,88,27,0.1)]" : "border-[#21409A] shadow-[10px_10px_0px_0px_rgba(33,64,154,0.1)]"}
                                currentTime={currentTime}
                              />
                            </div>
                          </Tabs>
                        ) : (
                          <div className="grid grid-cols-2 gap-6 items-stretch">
                            <ResultCard
                              journeyDate={journeyDate}
                              type="TATKAL"
                              targetHour={10}
                              title="Tatkal: AC Classes"
                              className="border-[#E8581B] shadow-[12px_12px_0px_0px_rgba(232,88,27,0.1)] flex flex-col h-full"
                              currentTime={currentTime}
                            />
                            <ResultCard
                              journeyDate={journeyDate}
                              type="TATKAL"
                              targetHour={11}
                              title="Tatkal: Non-AC / Sleeper"
                              className="border-[#21409A] shadow-[12px_12px_0px_0px_rgba(33,64,154,0.1)] flex flex-col h-full"
                              currentTime={currentTime}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Pro-Tip Section - Moved after results */}
          <motion.div
            animate={{ backgroundColor: isHighAlert ? "#FEF3C7" : "#E0F2FE" }}
            className="max-w-3xl mx-auto border-2 border-black p-5 md:p-6 flex gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-1 opacity-10">
              <Info className="w-12 h-12" />
            </div>
            {isHighAlert ? <Flame className="w-8 h-8 text-orange-600 shrink-0" /> : <Info className="w-8 h-8 text-blue-600 shrink-0" />}
            <div className="text-sm md:text-base">
              <h4 className="font-black uppercase mb-2 tracking-wider text-base md:text-lg">{isHighAlert ? "Tatkal Alert" : "Traveler Pro-Tip"}</h4>
              <p className="leading-relaxed text-gray-800 font-medium mb-4">
                {isHighAlert ? "Complete your IRCTC Master List 24h before. Every microsecond counts for Tatkal." : "Advance booking opens 60 days before travel. Set a reminder for 7:55 AM IST."}
              </p>
              <button onClick={handleShare} className="text-xs font-black text-[#21409A] flex items-center gap-2 hover:underline group">
                <Share2 className="w-4 h-4 group-hover:scale-125 transition-transform" /> SHARE WITH CO-TRAVELERS
              </button>
            </div>
          </motion.div>
        </div>

        <section className="retro-card bg-gray-900 text-white border-none shadow-[10px_10px_0px_0px_rgba(232,88,27,1)] p-8 max-w-6xl mx-auto">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-[#E8581B] uppercase italic">
            <Info className="w-6 h-6" /> Booking Protocol & Guidelines
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-[11px] md:text-xs font-mono opacity-90 leading-relaxed">
            <div className="space-y-3">
              <div className="text-[#E8581B] font-black border-b border-white/20 pb-1 mb-2">GENERAL ARP</div>
              <p>Tickets open 60 days before journey date (excluding journey day) at 08:00 IST.</p>
            </div>
            <div className="space-y-3">
              <div className="text-[#E8581B] font-black border-b border-white/20 pb-1 mb-2">TATKAL RULES</div>
              <p>Opens 1 day before journey from origin station. AC at 10:00 AM, Non-AC at 11:00 AM.</p>
            </div>
            <div className="space-y-3">
              <div className="text-[#E8581B] font-black border-b border-white/20 pb-1 mb-2">SYSTEM PREP</div>
              <p>Use the 'Master List' feature in your IRCTC profile to avoid manual data entry.</p>
            </div>
            <div className="space-y-3">
              <div className="text-[#E8581B] font-black border-b border-white/20 pb-1 mb-2">REFUND POLICY</div>
              <p>No refund is granted on cancellation of confirmed Tatkal tickets. Plan carefully.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-16 text-center border-t-4 border-black bg-white mt-20">
        <div className="flex justify-center gap-8 mb-8">
          <RailOpeningLogo className="w-10 h-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
        </div>
        <div className="space-y-4 px-6">
          <p className="font-black uppercase tracking-[0.3em] text-[11px] md:text-sm text-gray-800">trainticketdates.in</p>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            trainticketdates.in is an independent utility for travelers. Not affiliated with IRCTC or Indian Railways.
          </p>
        </div>

      </footer>
      <Toaster richColors position="top-center" theme="light" closeButton />
    </div>
  );
}
