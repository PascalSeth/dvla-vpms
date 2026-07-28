import React from 'react';

export type PlateCategory = 
  | "Private"
  | "Commercial"
  | "Government"
  | "Agricultural"
  | "Motorcycle"
  | "Trailer"
  | "Electric"
  | "Temporary"
  | string;

export interface DigitalPlateProps {
  plateNumber: string;
  category: PlateCategory;
  country?: string;
  region?: string;
  slogan?: string;
  vin?: string;
  make?: string;
  expiry?: string;
  className?: string;
}

const GhanaFlagIcon = () => (
  <div className="w-[20px] h-[13px] flex flex-col rounded-[1px] overflow-hidden border border-slate-400 shadow-xs">
    <div className="flex-1 bg-red-600" />
    <div className="flex-1 bg-yellow-400 relative flex items-center justify-center">
      <span className="absolute text-[5px] text-black font-black leading-none -top-[0.5px]">★</span>
    </div>
    <div className="flex-1 bg-green-600" />
  </div>
);

const RenewalStickerHole = () => (
  <div className="w-3.5 h-3.5 rounded-full border border-slate-400/80 bg-slate-100 shadow-inner flex items-center justify-center">
    <div className="w-2.5 h-2.5 rounded-full border border-slate-300/50 bg-slate-200/50" />
  </div>
);

const MapWatermark = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center opacity-[0.08] pointer-events-none overflow-hidden">
    <svg viewBox="0 0 100 100" className="w-[70%] h-full fill-slate-900">
      <path d="M43.7,11.2c-5.9,0.3-9.5,4.7-12.7,9.3c-3.1,4.5-5.5,10-8.9,14.2c-3.7,4.5-8.7,7.7-12.1,12.5c-3.2,4.5-4.2,11.3-1.6,16.2c2.1,4,7.2,6.5,11.5,8.1c6.5,2.4,13.6,3,20.4,4.2c6.5,1.2,13.2,2.7,19.3,5.6c4.5,2.1,9.2,3.9,14,4.3c5.6,0.5,11-2.9,14.6-7.1c3.5-4,7-9.3,7-14.7c0-6-3.8-11.3-7.5-16.1c-4.4-5.7-9.9-10.7-15.5-15.1c-5.5-4.4-11.5-8-17.5-11.8C51,18.4,48.2,13.9,43.7,11.2z" />
    </svg>
  </div>
);

export function DigitalPlate({
  plateNumber,
  category,
  country = "REPUBLIC OF GHANA",
  region = "GREATER ACCRA",
  slogan = "",
  vin = "1ZVBP9FF0C5272602",
  make = "BUGATI",
  expiry = "31/04/26",
  className = "",
}: DigitalPlateProps) {
  
  const normCat = category.toUpperCase();

  // 1. Temporary Sticker Design
  if (normCat === "TEMPORARY") {
    const cleanNum = plateNumber.replace('TMP ', '').replace('TMP', '');
    return (
      <div className={`relative w-full max-w-[340px] aspect-[100/35] rounded-md border-[2px] border-slate-900 overflow-hidden bg-[#f4f6f8] shadow-md select-none ${className}`}>
        {/* Blue Left Block */}
        <div className="absolute left-0 top-0 bottom-0 w-[22%] bg-[#3fbdf1] flex flex-col items-center justify-center border-r-2 border-white z-10">
           <div className="absolute top-2 left-2">
             <RenewalStickerHole />
           </div>
        </div>
        
        {/* Black Horizontal Strip */}
        <div className="absolute top-[50%] -translate-y-1/2 left-0 right-0 h-[36%] bg-[#1a1a1a] z-20 flex items-center justify-start pl-3 border-y-[1px] border-black shadow-xs">
          <span className="text-white font-sans font-black tracking-widest leading-none" style={{ fontSize: 'clamp(14px, 4.5vw, 22px)', fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            TMP
          </span>
          <span className="text-white font-sans font-black ml-4 tracking-widest leading-none" style={{ fontSize: 'clamp(18px, 6.5vw, 30px)', fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            {cleanNum}
          </span>
        </div>

        <MapWatermark />

        <div className="absolute top-1 left-[22%] right-0 text-center z-30">
          <span className="text-[9px] font-serif font-black text-black tracking-widest uppercase">{region}</span>
        </div>

        <div className="absolute top-[31%] left-[22%] right-0 text-center z-30">
          <span className="text-[5px] font-sans font-bold text-slate-800 uppercase tracking-widest">VIN {vin}</span>
        </div>

        <div className="absolute bottom-1 left-[22%] right-0 flex justify-center items-end px-3 z-30 h-5">
           <div className="w-4 h-4 bg-white border border-slate-300 flex items-center justify-center absolute left-[4%] bottom-0.5">
             <div className="w-[10px] h-[10px] bg-slate-800" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '3px 3px' }}></div>
           </div>
           <span className="text-[9px] font-sans font-bold text-black tracking-widest uppercase mb-0.5">{make}</span>
           <div className="absolute right-3 bottom-0.5 text-right leading-tight">
             <span className="block text-[4.5px] text-slate-600 font-bold mb-[-1px]">Expires</span>
             <span className="block text-[5.5px] font-bold text-slate-800">{expiry}</span>
           </div>
        </div>

        <div className="absolute top-1.5 right-2 z-30">
          <GhanaFlagIcon />
        </div>
      </div>
    );
  }

  // 2. Private Motorcycle
  if (normCat === "MOTORCYCLE") {
    const parts = plateNumber.split('-');
    let topRow = plateNumber;
    let bottomRow = "";
    if (parts.length > 1) {
      topRow = parts[0];
      bottomRow = parts.slice(1).join('-');
    } else if (plateNumber.length > 5) {
      topRow = plateNumber.slice(0, Math.ceil(plateNumber.length / 2));
      bottomRow = plateNumber.slice(Math.ceil(plateNumber.length / 2));
    }

    return (
      <div className={`relative w-full max-w-[210px] aspect-[4/3] rounded-lg border-[3px] border-slate-900 overflow-hidden bg-[#35baf6] shadow-md select-none ${className}`}>
        <div className="absolute top-2 left-2 z-30">
          <RenewalStickerHole />
        </div>
        <MapWatermark />
        
        <div className="absolute top-2 left-0 right-0 text-center z-30">
          <span className="text-[10px] font-serif font-black text-black tracking-widest uppercase">{region}</span>
        </div>

        <div className="absolute top-2 right-2 z-30">
          <GhanaFlagIcon />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 z-20">
          <span className="font-sans font-black text-black tracking-wider uppercase leading-none" 
                style={{ fontSize: 'clamp(22px, 9vw, 34px)', fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            {topRow}
          </span>
          <span className="font-sans font-black text-black tracking-wider uppercase leading-none mt-1" 
                style={{ fontSize: 'clamp(22px, 9vw, 34px)', fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            {bottomRow}
          </span>
        </div>
      </div>
    );
  }

  // 3. Standard Plates (Private, Commercial, Government, Electric, Trailer)
  let isSplitPlate = false;
  let leftColor = "";
  let leftText = "";
  let rightText = plateNumber;
  let bgGradient = "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)";
  let textColor = "#0f172a";
  let showRedGreenTriangles = false;

  if (normCat === "GOVERNMENT") {
    isSplitPlate = true;
    leftColor = "#fcc419"; // Yellow
    leftText = "GV";
    rightText = plateNumber.replace('GV ', '').replace('GV-', '').replace('GV', '');
    showRedGreenTriangles = true;
  } else if (normCat === "ELECTRIC") {
    isSplitPlate = true;
    leftColor = "#2b8a3e"; // Green
    leftText = "EV";
    rightText = plateNumber.replace('EV ', '').replace('EV-', '').replace('EV', '');
  } else if (normCat === "TRAILER") {
    isSplitPlate = true;
    leftColor = "#fcc419"; // Yellow
    leftText = "T";
    rightText = plateNumber.replace('T ', '').replace('T-', '').replace('T', '');
  } else if (normCat === "COMMERCIAL") {
    bgGradient = "linear-gradient(180deg, #ffe066 0%, #fcc419 100%)";
  }

  return (
    <div className={`relative w-full max-w-[340px] aspect-[100/38] rounded-md border-[2.5px] border-slate-900 overflow-hidden shadow-md select-none ${className}`}
         style={{ background: bgGradient }}>
      
      {/* Top Left renewal sticker hole */}
      <div className="absolute top-1.5 left-2.5 z-40">
        <RenewalStickerHole />
      </div>

      {/* Top Right National Flag */}
      <div className="absolute top-1.5 right-2.5 z-40">
        <GhanaFlagIcon />
      </div>

      {/* Split background block for Government / EV / Trailer */}
      {isSplitPlate && (
        <div className="absolute left-0 top-0 bottom-0 w-[20%] z-10 flex items-center justify-center border-r-[1.5px] border-slate-400" style={{ backgroundColor: leftColor }}>
          {showRedGreenTriangles && (
            <>
              <div className="absolute top-0 left-0 w-0 h-0 border-t-[28px] border-t-red-600 border-r-[28px] border-r-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-0 h-0 border-b-[28px] border-b-green-700 border-r-[28px] border-r-transparent pointer-events-none" />
            </>
          )}
          <span className="font-sans font-black text-black z-20 leading-none" 
                style={{ 
                  fontSize: 'clamp(20px, 7vw, 30px)', 
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  textShadow: '1px 1px 0px rgba(255,255,255,0.8)' 
                }}>
            {leftText}
          </span>
        </div>
      )}

      <MapWatermark />

      {/* Top Text: REPUBLIC OF GHANA */}
      <div className={`absolute top-1.5 left-0 right-0 text-center z-30 pointer-events-none ${isSplitPlate ? 'pl-[20%]' : ''}`}>
        <span className="text-[8.5px] font-serif font-black text-slate-800 tracking-wider uppercase">
          {country}
        </span>
      </div>

      {/* Center Registration Number - Centered vertically & horizontally */}
      <div className={`absolute inset-0 flex items-center justify-center z-20 ${isSplitPlate ? 'pl-[20%]' : ''}`}>
        <span className="font-sans font-black uppercase tracking-wider leading-none text-center" 
              style={{ 
                color: textColor, 
                fontSize: 'clamp(22px, 8vw, 38px)',
                fontFamily: "'Arial Black', 'Impact', 'Arial', sans-serif",
                textShadow: '1px 1.5px 0px rgba(255,255,255,0.9), -0.5px -0.5px 0px rgba(0,0,0,0.25)' 
              }}>
          {rightText}
        </span>
      </div>

      {/* Bottom Text: Region (e.g. GREATER ACCRA) or Slogan */}
      <div className={`absolute bottom-1.5 left-0 right-0 text-center z-30 pointer-events-none ${isSplitPlate ? 'pl-[20%]' : ''}`}>
        <span className="text-[8px] font-serif font-black text-slate-800 tracking-widest uppercase">
          {slogan || region}
        </span>
      </div>

      {/* Inner embossed metal rim effect */}
      <div className="absolute inset-[1.5px] rounded-sm border-[1px] border-slate-950/20 pointer-events-none z-40" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-white/25 z-30" />
    </div>
  );
}
