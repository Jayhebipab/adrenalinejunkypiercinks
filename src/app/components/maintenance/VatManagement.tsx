"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Edit3, RotateCcw, X, Loader2, Percent, Calculator, Plus 
} from "lucide-react"
import { Toaster, toast } from "sonner"

interface VatRecord {
  _id: string;
  percentage: number;
}

export default function VatManagement() {
  const [vatRecord, setVatRecord] = useState<VatRecord | null>(null);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPercentage, setNewPercentage] = useState<number>(1);

  const fetchVat = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/VAT");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setVatRecord(data[0]);
        setNewPercentage(data[0].percentage);
      } else {
        setVatRecord(null);
      }
    } catch (err) {
      toast.error("Error loading VAT.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchVat(); }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPercentage <= 0 || newPercentage >= 100) {
      return toast.error("Dapat 1% hanggang 99% lang!");
    }

    const method = vatRecord ? "PUT" : "POST";
    const body = vatRecord 
      ? { id: vatRecord._id, percentage: newPercentage }
      : { percentage: newPercentage };

    toast.promise(async () => {
      const res = await fetch(`/api/VAT`, {
        method: method,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      fetchVat();
    }, {
      loading: 'Saving Tax Rate...',
      success: vatRecord ? 'VAT Updated!' : 'VAT Added!',
      error: 'Action failed',
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-slate-900">
      <Toaster position="top-right" richColors />

      <div className="max-w-3xl mx-auto space-y-4 md:y-6">
        {/* HEADER */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="p-3 md:p-4 bg-emerald-600 rounded-xl md:rounded-2xl shadow-lg shadow-emerald-100">
              <Calculator className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 uppercase italic">VAT Setting</h1>
              <p className="text-slate-500 text-[10px] md:text-sm italic">System-wide tax rate.</p>
            </div>
          </div>
          <Button 
            onClick={() => fetchVat()} 
            variant="ghost" 
            className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 text-slate-400 hover:text-emerald-600"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        {/* MAIN DISPLAY CARD */}
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 text-center space-y-4 md:space-y-6">
          {fetching ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin w-8 h-8 text-emerald-600 opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
            </div>
          ) : vatRecord ? (
            /* MAY LAMAN: SHOW UPDATE UI */
            <>
              <div className="space-y-1">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">Current Tax Rate</p>
                <div className="flex items-center justify-center gap-1 md:gap-2">
                  <span className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter">
                    {vatRecord.percentage}
                  </span>
                  <Percent size={32} className="text-emerald-600 mt-2 md:mt-4 md:size-[48px]" strokeWidth={3} />
                </div>
              </div>

              <div className="pt-2 md:pt-4">
                <Button 
                  onClick={() => {
                    setNewPercentage(vatRecord.percentage);
                    setIsModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-emerald-600 text-white rounded-xl md:rounded-2xl h-12 md:h-16 px-6 md:px-10 shadow-xl transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] md:text-xs w-full md:w-auto"
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Adjust Rate
                </Button>
              </div>
            </>
          ) : (
            /* WALANG LAMAN: SHOW ADD UI */
            <div className="py-6 md:py-10 space-y-4">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                  <Percent className="text-slate-300 w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h3 className="font-black uppercase text-slate-800 text-lg">No VAT Found</h3>
                  <p className="text-slate-400 text-xs italic">Set up your initial tax percentage.</p>
               </div>
               <Button 
                onClick={() => {
                  setNewPercentage(1);
                  setIsModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl md:rounded-2xl h-12 md:h-16 px-8 md:px-12 shadow-xl shadow-emerald-100 transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] md:text-xs"
              >
                <Plus className="w-4 h-4 mr-2" /> Initialize VAT
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL (Responsive Size) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-[320px] md:max-w-sm p-6 md:p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">
                {vatRecord ? "Adjust Tax" : "Setup Tax"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAction} className="space-y-4 md:space-y-6">
              <div className="space-y-2 text-center">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Percentage (%)
                </label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  max="99"
                  autoFocus
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl md:rounded-3xl px-4 py-6 md:py-8 outline-none transition-all text-4xl md:text-5xl font-black text-center" 
                  value={newPercentage} 
                  onChange={(e) => setNewPercentage(parseInt(e.target.value) || 0)} 
                />
                <p className="text-[8px] md:text-[9px] text-emerald-500 font-bold uppercase mt-2">Dapat 1% - 99% lang</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 md:h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95 text-[10px] md:text-xs"
              >
                {vatRecord ? "Confirm Update" : "Save Initial VAT"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}