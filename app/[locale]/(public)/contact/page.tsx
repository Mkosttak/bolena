'use client'

import { useParams } from 'next/navigation'
import { MapPin, PhoneCall, ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { PublicNavbar } from '@/components/shared/PublicNavbar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  workingHoursKeys,
  fetchWeeklyHours,
  fetchWorkingHoursExceptions,
} from '@/lib/queries/working-hours.queries'
import { INSTAGRAM_URL } from '@/lib/constants/social'
import React, { useState } from 'react'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
const MAP_LINK = 'https://maps.google.com/?q=Yaşamkent,+3058.+Sk+3/1,+06810+Çankaya/Ankara'
const MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d766.3!2d32.6827!3d39.9423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d3475e0c4c6b3d%3A0x1!2zWWHFn2Fta2VudCwgMzA1OC4gU2sgMy8xLCAwNjgxMCDDh2Fua2F5YS9BbmthcmE!5e0!3m2!1str!2str!4v1'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      aria-hidden="true"
    >
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.25" cy="6.75" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

type HoursEntry = {
  is_open: boolean | null
  open_time: string | null
  close_time: string | null
}

function formatTimeStripped(timeStr: string | null) {
  if (!timeStr) return null;
  return timeStr.slice(0, 5); // Removes seconds: "09:00:00" -> "09:00"
}

function formatHoursRange(entry: HoursEntry | undefined, closedLabel: string) {
  if (entry?.is_open && entry.open_time && entry.close_time) {
    return `${formatTimeStripped(entry.open_time)} - ${formatTimeStripped(entry.close_time)}`
  }
  return closedLabel
}

export default function ContactPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'tr'
  const t = useTranslations('contact')
  const tNav = useTranslations('nav')

  const [activePanel, setActivePanel] = useState<number>(0)

  const { data: weeklyHours = [], isLoading: hoursLoading } = useQuery({
    queryKey: workingHoursKeys.weekly(),
    queryFn: fetchWeeklyHours,
    staleTime: 5 * 60 * 1000,
  })

  const { data: exceptions = [] } = useQuery({
    queryKey: workingHoursKeys.exceptions(),
    queryFn: fetchWorkingHoursExceptions,
    staleTime: 5 * 60 * 1000,
  })

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const todayDow = now.getDay()
  const todayException = exceptions.find((e) => e.date === todayStr)

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-[#FAF8F2] text-[#1B3C2A] selection:bg-[#c4841a]/30">
      <PublicNavbar locale={locale} menuLabel={tNav('menu')} contactLabel={tNav('contact')} />

      <main className="flex-grow flex flex-col lg:flex-row w-full h-full pt-20 lg:pt-28 pb-4 lg:pb-8 px-4 lg:px-8 gap-2 lg:gap-4">
        
        {/* PANEL 0: CONTACT */}
        <div 
          className={`group relative overflow-hidden rounded-3xl lg:rounded-[40px] border border-[#1B3C2A]/10 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer ${
            activePanel === 0 ? 'flex-[6_6_0%] bg-[#FAF8F2]' : 'flex-[1_1_0%] bg-[#F2ECE0] hover:bg-[#EBE5D9]'
          }`}
          onClick={() => setActivePanel(0)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#c4841a]/5 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
          
          {/* Inactive Title Desktop */}
          <div className={`absolute inset-0 hidden lg:flex items-center justify-center transition-opacity duration-500 delay-150 ${activePanel === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[#1B3C2A]/40 group-hover:text-[#1B3C2A]/80 transition-colors font-heading text-3xl lg:text-4xl whitespace-nowrap [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest">
                {t('phone')}
             </h3>
          </div>
          {/* Inactive Title Mobile */}
          <div className={`absolute inset-0 flex lg:hidden items-center justify-center transition-opacity duration-500 delay-150 ${activePanel === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[#1B3C2A]/40 group-hover:text-[#1B3C2A]/80 transition-colors font-heading text-xl uppercase tracking-widest">
                {t('phone')}
             </h3>
          </div>

          {/* Active Content */}
          <div className={`absolute inset-0 overflow-y-auto p-6 lg:p-12 flex flex-col justify-center transition-all duration-700 ${activePanel === 0 ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1B3C2A] tracking-tight mb-3">{t('heroTitle')}</h2>
            <p className="text-[#1B3C2A]/60 max-w-md text-sm lg:text-base mb-10 lg:mb-12">{t('heroSubtitle')}</p>

            <div className="flex flex-col gap-8 lg:gap-10">
               <a href={`tel:${t('phoneValue').replace(/\s/g, '')}`} className="group/link flex items-center gap-4 lg:gap-5 w-fit">
                  <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full border border-[#1B3C2A]/15 bg-[#1B3C2A]/5 text-[#c4841a] group-hover/link:bg-[#c4841a] group-hover/link:text-white transition-colors duration-500 shrink-0">
                     <PhoneCall strokeWidth={2} className="h-5 w-5 lg:h-6 lg:w-6" />
                  </div>
                  <div>
                     <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B3C2A]/40">{t('phone')}</p>
                     <p className="text-xl lg:text-3xl font-light text-[#1B3C2A] mt-0.5 group-hover/link:text-[#c4841a] transition-colors duration-500">{t('phoneValue')}</p>
                     <div className="mt-1 lg:mt-1.5 flex items-center gap-1.5 text-[#1B3C2A]/30 group-hover/link:text-[#c4841a] transition-colors duration-500">
                       <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em]">{t('callUs')}</span>
                       <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                     </div>
                  </div>
               </a>

               <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="group/link flex items-center gap-4 lg:gap-5 w-fit">
                  <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full border border-[#1B3C2A]/15 bg-[#1B3C2A]/5 text-[#c4841a] group-hover/link:bg-[#c4841a] group-hover/link:text-white transition-colors duration-500 shrink-0">
                     <InstagramIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                  </div>
                  <div>
                     <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B3C2A]/40">{t('instagram')}</p>
                     <p className="text-xl lg:text-3xl font-light text-[#1B3C2A] mt-0.5 group-hover/link:text-[#c4841a] transition-colors duration-500">{t('instagramHandle')}</p>
                     <div className="mt-1 lg:mt-1.5 flex items-center gap-1.5 text-[#1B3C2A]/30 group-hover/link:text-[#c4841a] transition-colors duration-500">
                       <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em]">{t('followUs')}</span>
                       <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                     </div>
                  </div>
               </a>
            </div>
          </div>
        </div>

        {/* PANEL 1: HOURS */}
        <div 
          className={`group relative overflow-hidden rounded-3xl lg:rounded-[40px] border border-[#1B3C2A]/10 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer ${
            activePanel === 1 ? 'flex-[6_6_0%] bg-[#F3EFE6]' : 'flex-[1_1_0%] bg-[#F2ECE0] hover:bg-[#EBE5D9]'
          }`}
          onClick={() => setActivePanel(1)}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#c4841a]/5 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
          
          {/* Inactive Title Desktop */}
          <div className={`absolute inset-0 hidden lg:flex items-center justify-center transition-opacity duration-500 delay-150 ${activePanel === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[#1B3C2A]/40 group-hover:text-[#1B3C2A]/80 transition-colors font-heading text-3xl lg:text-4xl whitespace-nowrap [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest">
                {t('workingHours')}
             </h3>
          </div>
          {/* Inactive Title Mobile */}
          <div className={`absolute inset-0 flex lg:hidden items-center justify-center transition-opacity duration-500 delay-150 ${activePanel === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[#1B3C2A]/40 group-hover:text-[#1B3C2A]/80 transition-colors font-heading text-xl uppercase tracking-widest">
                {t('workingHours')}
             </h3>
          </div>

          {/* Active Content */}
          <div className={`absolute inset-0 overflow-y-auto p-6 lg:p-12 flex flex-col transition-all duration-700 ${activePanel === 1 ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1B3C2A] tracking-tight mb-6 lg:mb-8">{t('workingHours')}</h2>

            <div className="flex flex-col w-full max-w-xl">
               {hoursLoading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-end justify-between py-3 lg:py-4 border-b border-[#1B3C2A]/10">
                      <Skeleton className="h-4 lg:h-5 w-20 lg:w-24 bg-[#1B3C2A]/10" />
                      <Skeleton className="h-4 lg:h-5 w-16 bg-[#1B3C2A]/10" />
                    </div>
                  ))
               ) : (
                  DAY_ORDER.map((dayNum) => {
                    const dayHours = weeklyHours.find((hour) => hour.day_of_week === dayNum)
                    const isToday = todayDow === dayNum
                    const effectiveHours = isToday && todayException ? todayException : dayHours
                    const dayName = t(`days.${dayNum}` as `days.${number}`)

                    return (
                      <div key={dayNum} className={`flex items-end justify-between py-2.5 lg:py-4 border-b border-[#1B3C2A]/10 transition-colors ${isToday ? 'text-[#c4841a] font-medium' : 'text-[#1B3C2A]/80 hover:text-[#1B3C2A]'}`}>
                         <span className="text-xs lg:text-base font-light tracking-widest uppercase">{dayName}</span>
                         <span className="flex-grow border-b border-dotted border-[#1B3C2A]/20 mx-3 lg:mx-6 mb-1 lg:mb-1.5 opacity-30"></span>
                         <span className="text-xs lg:text-base tracking-wide">{formatHoursRange(effectiveHours, t('closed'))}</span>
                      </div>
                    )
                  })
               )}
            </div>
          </div>
        </div>

        {/* PANEL 2: LOCATION */}
        <div 
          className={`group relative overflow-hidden rounded-3xl lg:rounded-[40px] border border-[#1B3C2A]/10 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer ${
            activePanel === 2 ? 'flex-[6_6_0%]' : 'flex-[1_1_0%] bg-[#FAF8F2]'
          }`}
          onClick={() => setActivePanel(2)}
        >
          {/* Map Background */}
          <div className={`absolute inset-0 transition-all duration-1000 ${activePanel === 2 ? 'opacity-100 grayscale-[0%]' : 'opacity-40 grayscale-[100%] group-hover:opacity-70'}`}>
            <iframe src={MAP_EMBED} className="w-full h-full border-0 pointer-events-none" />
            <div className={`absolute inset-0 bg-gradient-to-t from-[#FAF8F2] via-[#FAF8F2]/60 to-transparent transition-opacity duration-1000 ${activePanel === 2 ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          
          {/* Inactive Title Desktop */}
          <div className={`absolute inset-0 hidden lg:flex items-center justify-center transition-opacity duration-500 delay-150 ${activePanel === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[#1B3C2A]/40 group-hover:text-[#1B3C2A]/80 transition-colors font-heading text-3xl lg:text-4xl whitespace-nowrap [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest relative z-10">
                {t('mapHeading')}
             </h3>
          </div>
          {/* Inactive Title Mobile */}
          <div className={`absolute inset-0 flex lg:hidden items-center justify-center transition-opacity duration-500 delay-150 ${activePanel === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[#1B3C2A]/40 group-hover:text-[#1B3C2A]/80 transition-colors font-heading text-xl uppercase tracking-widest relative z-10">
                {t('mapHeading')}
             </h3>
          </div>

          {/* Active Content */}
          <div className={`absolute inset-0 overflow-y-auto p-4 lg:p-12 flex flex-col justify-end transition-all duration-700 ${activePanel === 2 ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
             <div className="bg-[#FAF8F2]/90 backdrop-blur-xl border border-[#1B3C2A]/10 p-6 lg:p-8 rounded-3xl lg:rounded-[32px] max-w-md w-full shadow-2xl mx-auto lg:mx-0">
                <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.22em] text-[#c4841a] mb-1.5">{t('mapHeading')}</p>
                <h2 className="font-heading text-2xl lg:text-4xl text-[#1B3C2A] tracking-tight mb-2 lg:mb-3">{t('venueName')}</h2>
                <p className="text-[#1B3C2A]/60 mb-5 lg:mb-6 leading-relaxed font-light text-xs lg:text-sm">{t('addressValue')}</p>
                
                <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1B3C2A] px-5 py-3 lg:px-6 lg:py-3.5 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] text-[#FAF8F2] transition-all hover:scale-[1.02] hover:bg-[#132A1D]">
                   <MapPin className="h-3.5 w-3.5 lg:h-4 lg:w-4" strokeWidth={2.5} />
                   {t('getDirections')}
                </a>
             </div>
          </div>
        </div>

      </main>
    </div>
  )
}
