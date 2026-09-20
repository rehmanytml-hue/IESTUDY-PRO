import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, RotateCcw, Clock, ClipboardList, 
  Settings, CheckCircle, AlertTriangle, Download, 
  BarChart3, User, Scissors, Package, Shirt, Factory, Target,
  Moon, Sun, RefreshCw, Pause, Users, Calculator, DollarSign, Layers
} from 'lucide-react';

const formatTime = (timeInMs) => {
  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  const centiseconds = Math.floor((timeInMs % 1000) / 10);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
};

const MACHINE_ALLOWANCES = [
  { id: 'snls', name: 'SNLS', allowance: 19.5 },
  { id: 'dnls', name: 'DNLS', allowance: 24.5 },
  { id: 'flat_lock', name: 'Flat Lock', allowance: 19 },
  { id: '3th_ol', name: '3TH OVERLOCK', allowance: 15.5 },
  { id: '4th_ol', name: '4TH OVERLOCK', allowance: 15.5 },
  { id: '5th_ol', name: '5TH OVERLOCK (SAFETY)', allowance: 17 },
  { id: '6th_ol', name: '6TH OVERLOCK', allowance: 17 },
  { id: 'foa', name: 'FOA', allowance: 17 },
  { id: 'sncs', name: 'SNCS', allowance: 15.5 },
  { id: 'dncs', name: 'DNCS', allowance: 17 },
  { id: '3ncs', name: '3 Needle Chain Stitch (3NCS)', allowance: 17 },
  { id: '4ncs', name: '4 Needle Chain Stitch (4NCS)', allowance: 19 },
  { id: 'kansai', name: 'KANSAI', allowance: 20 },
  { id: 'auto_welt', name: 'Auto Pocket Welt Maker', allowance: 22 },
  { id: 'auto_jstitch', name: 'Auto J-Stitch Maker', allowance: 22 },
  { id: 'bh_lock', name: 'Buttonhole (Lockstitch)', allowance: 15.5 },
  { id: 'bh_chain', name: 'Buttonhole (Chainstitch)', allowance: 13.5 },
  { id: 'ba_lock', name: 'Button Attach (Lockstitch)', allowance: 17 },
  { id: 'ba_top', name: 'Button Attach (Top Thread Only)', allowance: 14.5 },
  { id: 'snap', name: 'SNAP BUTTON', allowance: 11.5 },
  { id: 'eyelet', name: 'EYELET KAJ', allowance: 14.5 },
  { id: 'bartack', name: 'Bartack', allowance: 15.5 },
  { id: 'other', name: 'Other / Manual', allowance: 10 }
];

export default function IETimeStudyApp() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mainModule, setMainModule] = useState('study'); // 'study' or 'strength_cpp'
  const [activeTab, setActiveTab] = useState('setup'); // setup, study, results for study module
  const [calcSubTab, setCalcSubTab] = useState('strength'); // 'strength', 'output', 'cpp'

  const [config, setConfig] = useState({
    machineType: '',
    ratingFactor: 100,
    allowance: 15,
  });

  const [strengthConfig, setStrengthConfig] = useState({
    targetOutput: 1000,
    lineEfficiency: 85,
    workingHours: 8,
    customSmv: 0.50,
    operatorCount: 25,
    dailyWagePerOperator: 1600, // Predefined 1600 PKR
  });

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cycles, setCycles] = useState([]);
  
  const handleMachineChange = (e) => {
    const selectedName = e.target.value;
    const machine = MACHINE_ALLOWANCES.find(m => m.name === selectedName);
    setConfig({
      ...config,
      machineType: selectedName,
      allowance: machine ? machine.allowance : config.allowance
    });
  };

  const timerRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      lastUpdateRef.current = performance.now();
      timerRef.current = requestAnimationFrame(updateTimer);
    }
  };

  const updateTimer = (timestamp) => {
    const deltaTime = timestamp - lastUpdateRef.current;
    setElapsedTime((prev) => prev + deltaTime);
    lastUpdateRef.current = timestamp;
    timerRef.current = requestAnimationFrame(updateTimer);
  };

  const stopTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      cancelAnimationFrame(timerRef.current);
    }
  };

  const recordCycle = () => {
    if (elapsedTime === 0) return;
    
    setCycles(prev => [...prev, {
      id: Date.now(),
      time: elapsedTime,
      isExcluded: false,
      reason: ''
    }]);
    
    setElapsedTime(0);
    lastUpdateRef.current = performance.now();
  };

  const resetStudy = () => {
    stopTimer();
    setElapsedTime(0);
    setCycles([]);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(timerRef.current);
  }, []);

  const calculateResults = () => {
    const validCycles = cycles.filter(c => !c.isExcluded);
    const totalValidTime = validCycles.reduce((sum, c) => sum + c.time, 0);
    const avgCycleTimeMs = validCycles.length > 0 ? totalValidTime / validCycles.length : 0;
    
    const avgCycleTimeSec = avgCycleTimeMs / 1000;
    
    const basicTime = avgCycleTimeSec * (config.ratingFactor / 100);
    const smv = basicTime * (1 + (config.allowance / 100));
    
    const smvInMinutes = smv / 60;
    const basicTimeInMinutes = basicTime / 60;
    const targetPerHour = smvInMinutes > 0 ? Math.floor(60 / smvInMinutes) : 0;
    const targetPerShift = targetPerHour * 8;

    return {
      validCyclesCount: validCycles.length,
      excludedCyclesCount: cycles.length - validCycles.length,
      avgCycleTimeSec,
      basicTimeInMinutes,
      smvInMinutes,
      targetPerHour,
      targetPerShift
    };
  };

  const toggleCycleExclusion = (id) => {
    setCycles(prev => prev.map(c => 
      c.id === id ? { ...c, isExcluded: !c.isExcluded, reason: !c.isExcluded ? 'Foreign Element / Fumble' : '' } : c
    ));
  };

  const renderSetupView = () => (
    <div className="animate-fade-in p-6 md:p-8 max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
          <Settings className="text-emerald-600 dark:text-emerald-400" size={32} /> Stitching Study Setup
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Configure standard machine parameters for the stitching operation.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Machine Type</label>
            <select
              value={config.machineType}
              onChange={handleMachineChange}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white appearance-none cursor-pointer font-medium"
            >
              <option value="" disabled>Select Machine...</option>
              {MACHINE_ALLOWANCES.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Rating Factor
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="60" max="140" step="5"
                value={config.ratingFactor}
                onChange={(e) => setConfig({...config, ratingFactor: parseInt(e.target.value)})}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <span className="font-black text-emerald-700 dark:text-emerald-400 w-12 text-lg">{config.ratingFactor}%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Standard pace = 100%</p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Total Allowances
            </label>
            <div className="flex items-center gap-3 relative">
              <input 
                type="number" 
                value={config.allowance}
                onChange={(e) => setConfig({...config, allowance: parseFloat(e.target.value) || 0})}
                className="w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold transition-all"
                placeholder="0"
              />
              <span className="absolute right-4 font-bold text-slate-400 dark:text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Auto-filled by machine selection</p>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('study')}
          disabled={!config.machineType}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 dark:from-emerald-500 dark:to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg"
        >
          <Clock className="stroke-[2.5]" /> Continue to Timer
        </button>
      </div>
    </div>
  );

  const renderStudyView = () => (
    <div className="animate-fade-in flex flex-col md:flex-row gap-6 max-w-5xl mx-auto">
      <div className="flex-1 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center transition-colors duration-300">
        
        <div className="w-full flex justify-between items-center mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors">
           <div className="truncate flex items-center gap-4">
             <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
               <Shirt size={24} />
             </div>
             <div>
               <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Stitching Machine</div>
               <div className="font-bold text-slate-800 dark:text-white truncate text-lg">
                 {config.machineType ? config.machineType : 'Standard Operation'}
               </div>
             </div>
           </div>
        </div>

        <div className="font-mono text-[5rem] md:text-9xl font-black text-slate-800 dark:text-white tracking-tighter my-4 flex items-baseline drop-shadow-sm transition-colors">
          {formatTime(elapsedTime)}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mt-8">
          {!isRunning ? (
            elapsedTime === 0 && cycles.length === 0 ? (
              <button 
                onClick={startTimer}
                className="col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white p-6 rounded-2xl font-black text-2xl shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 transition-all active:scale-95 flex justify-center items-center gap-3"
              >
                <Play size={32} fill="currentColor" /> Start Study
              </button>
            ) : (
              <>
                <button 
                  onClick={resetStudy}
                  className="bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white p-6 rounded-2xl font-bold text-xl shadow-lg shadow-slate-500/30 dark:shadow-slate-900/40 transition-all active:scale-95 flex flex-col justify-center items-center gap-1"
                >
                  <RefreshCw size={28} />
                  <span>Reset Study</span>
                </button>
                <button 
                  onClick={startTimer}
                  className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white p-6 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 transition-all active:scale-95 flex flex-col justify-center items-center gap-1"
                >
                  <Play size={28} fill="currentColor" />
                  <span>Resume</span>
                </button>
              </>
            )
          ) : (
            <>
              <button 
                onClick={recordCycle}
                className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white p-6 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 transition-all active:scale-95 flex flex-col justify-center items-center gap-1"
              >
                <RotateCcw size={28} className="stroke-[2.5]" />
                <span>Lap / Flyback</span>
              </button>
              <button 
                onClick={stopTimer}
                className="bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white p-6 rounded-2xl font-bold text-xl shadow-lg shadow-rose-500/30 dark:shadow-rose-900/40 transition-all active:scale-95 flex flex-col justify-center items-center gap-1"
              >
                <Pause size={28} fill="currentColor" />
                <span>Pause</span>
              </button>
            </>
          )}
        </div>
        
        <div className="mt-8 w-full flex justify-center">
           <button 
              onClick={() => setActiveTab('results')}
              disabled={cycles.length === 0}
              className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white p-4 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <BarChart3 size={18} /> View Report & Targets ({cycles.length})
            </button>
        </div>
      </div>

      <div className="w-full md:w-96 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 max-h-[600px] flex flex-col transition-colors duration-300">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <ClipboardList className="text-emerald-600 dark:text-emerald-400" /> Recorded Cycles
        </h3>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {cycles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center p-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                <Clock size={32} className="opacity-50" />
              </div>
              <p className="font-medium">No cycles yet</p>
              <p className="text-xs mt-1">Press Start, then Lap to record times.</p>
            </div>
          ) : (
            [...cycles].reverse().map((cycle, index) => (
              <div 
                key={cycle.id} 
                className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                  cycle.isExcluded 
                    ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50' 
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                    CYCLE {cycles.length - index}
                  </div>
                  <div className={`font-mono text-xl font-bold ${cycle.isExcluded ? 'text-rose-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                    {formatTime(cycle.time)}
                  </div>
                </div>
                
                <button
                  onClick={() => toggleCycleExclusion(cycle.id)}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    cycle.isExcluded 
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50 hover:bg-rose-200 dark:hover:bg-rose-900/50' 
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-rose-500 dark:hover:text-rose-400'
                  }`}
                  title={cycle.isExcluded ? "Include cycle" : "Exclude (Fumble/Delay)"}
                >
                  <AlertTriangle size={18} className={cycle.isExcluded ? "fill-current" : ""} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderResultsView = () => {
    const results = calculateResults();
    
    return (
      <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-between items-center gap-4 transition-colors">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Time Study Report & Targets</h2>
            <div className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 text-sm font-medium">
              <span className="flex items-center gap-1"><Shirt size={14}/> Stitching</span> 
              {config.machineType && <><span className="opacity-50">•</span> <span className="text-emerald-600 dark:text-emerald-400">{config.machineType}</span></>}
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setActiveTab('study')} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
               Back to Timer
             </button>
             <button onClick={() => window.print()} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2">
               <Download size={18} /> Export
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Factory size={100} /></div>
            <div className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Standard Minute Value</div>
            <div className="text-6xl font-black mb-1 tracking-tighter relative z-10">{results.smvInMinutes.toFixed(3)}</div>
            <div className="text-sm text-emerald-200 font-medium relative z-10">Total SMV for Operation</div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Hourly Target</div>
            <div className="text-5xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{results.targetPerHour} <span className="text-xl font-medium text-slate-400">pcs</span></div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
               <CheckCircle size={14} /> 100% Efficiency Target
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Shift Target (8H)</div>
            <div className="text-5xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{results.targetPerShift} <span className="text-xl font-medium text-slate-400">pcs</span></div>
            <div className="text-sm text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
              <Package size={14} /> Daily Production Goal
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Efficiency Targets Breakdown</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[60, 70, 80, 90, 100].map((eff) => {
              const hourly = Math.floor(results.targetPerHour * (eff / 100));
              const shift = Math.floor(results.targetPerShift * (eff / 100));
              const isHundred = eff === 100;
              return (
                <div key={eff} className={`relative p-5 rounded-2xl border-2 transition-all ${
                  isHundred 
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 dark:border-emerald-500' 
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                  {isHundred && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Base</div>}
                  <div className={`text-center font-black text-3xl ${isHundred ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} mb-2`}>{eff}%</div>
                  <div className="flex flex-col items-center gap-1.5 border-t border-slate-200 dark:border-slate-700/50 pt-3 mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xl">{hourly}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/hr</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-slate-600 dark:text-slate-400 text-lg">{shift}</span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/8h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-colors">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-700/50 font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
             Calculation Summary
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 w-1/2">Valid Cycles Analyzed</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">{results.validCyclesCount}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors bg-emerald-50/30 dark:bg-emerald-900/10">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">Average Observed Time</td>
                  <td className="p-4 text-slate-800 dark:text-slate-200 font-mono font-bold">{(results.avgCycleTimeSec).toFixed(2)} sec</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">Rating Factor Applied</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{config.ratingFactor}%</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors bg-emerald-50/30 dark:bg-emerald-900/10">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">Basic Time</td>
                  <td className="p-4 text-slate-800 dark:text-slate-200 font-mono font-bold">
                    {(results.basicTimeInMinutes).toFixed(3)} min <span className="text-xs text-slate-400 dark:text-slate-500 font-sans ml-1">({(results.basicTimeInMinutes * 60).toFixed(2)} sec)</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">Total Allowances</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{config.allowance}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  const renderStrengthAndCppView = () => {
    const smv = strengthConfig.customSmv;
    const totalMinutesAvailablePerOperator = strengthConfig.workingHours * 60 * (strengthConfig.lineEfficiency / 100);
    const totalMinutesRequired = strengthConfig.targetOutput * smv;
    const exactOperatorsNeeded = totalMinutesAvailablePerOperator > 0 ? totalMinutesRequired / totalMinutesAvailablePerOperator : 0;
    const roundedOperatorsNeeded = Math.ceil(exactOperatorsNeeded);

    // Shift Target calculation for Output calculator sub-tab
    const shiftTotalMinutes = strengthConfig.workingHours * 60;
    const calcOutputPerShift = smv > 0 ? Math.floor((strengthConfig.operatorCount * shiftTotalMinutes * (strengthConfig.lineEfficiency / 100)) / smv) : 0;

    // Cost Per Piece (CPP) = (Total Daily Manpower Cost) / (Target Output)
    const totalDailyCost = strengthConfig.operatorCount * strengthConfig.dailyWagePerOperator;
    const cpp = strengthConfig.targetOutput > 0 ? totalDailyCost / strengthConfig.targetOutput : 0;

    const handleSubTabChange = (tab) => {
      setCalcSubTab(tab);
      if (tab === 'cpp') {
        // Auto-sync operator count to calculated line strength when switching to CPP
        setStrengthConfig(prev => ({ ...prev, operatorCount: roundedOperatorsNeeded }));
      }
    };

    return (
      <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-between items-center gap-4 transition-colors">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Line Strength, Targets & Cost Per Piece (CPP)</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select tool module to compute manpower strength, outputs, or financial cost per piece.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleSubTabChange('strength')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${calcSubTab === 'strength' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Line Strength Calc
            </button>
            <button
              onClick={() => handleSubTabChange('output')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${calcSubTab === 'output' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Output Calc
            </button>
            <button
              onClick={() => handleSubTabChange('cpp')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${calcSubTab === 'cpp' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              CPP Calculator
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calculator size={18} className="text-emerald-600" /> Parameters Input
            </h3>

            <div className="space-y-4">
              {calcSubTab !== 'cpp' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Line SAM / SMV (Mins)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={strengthConfig.customSmv}
                    onChange={(e) => setStrengthConfig({...strengthConfig, customSmv: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-emerald-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold font-mono"
                  />
                </div>
              )}

              {(calcSubTab === 'strength' || calcSubTab === 'cpp') && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Daily Output (Pcs)</label>
                  <input 
                    type="number" 
                    value={strengthConfig.targetOutput}
                    onChange={(e) => setStrengthConfig({...strengthConfig, targetOutput: parseInt(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-emerald-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                  />
                </div>
              )}

              {calcSubTab !== 'cpp' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Line Efficiency (%)</label>
                  <input 
                    type="number" 
                    value={strengthConfig.lineEfficiency}
                    onChange={(e) => setStrengthConfig({...strengthConfig, lineEfficiency: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-emerald-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                  />
                </div>
              )}

              {calcSubTab === 'output' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Active Line Operators</label>
                  <input 
                    type="number" 
                    value={strengthConfig.operatorCount}
                    onChange={(e) => setStrengthConfig({...strengthConfig, operatorCount: parseInt(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:border-emerald-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                  />
                </div>
              )}

              {calcSubTab === 'cpp' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Active Line Operators</label>
                    <button 
                      onClick={() => setStrengthConfig(prev => ({ ...prev, operatorCount: roundedOperatorsNeeded }))}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Sync Calculated ({roundedOperatorsNeeded})
                    </button>
                  </div>
                  <input 
                    type="number" 
                    value={strengthConfig.operatorCount}
                    onChange={(e) => setStrengthConfig({...strengthConfig, operatorCount: parseInt(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-emerald-300 dark:border-emerald-600 outline-none focus:border-emerald-600 bg-emerald-50/50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Pre-linked from strength calc or manually editable.</p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {calcSubTab === 'strength' && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-2xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={120} /></div>
                <div>
                  <div className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Required Line Strength</div>
                  <div className="text-6xl font-black mb-3 tracking-tighter relative z-10">
                    {roundedOperatorsNeeded} <span className="text-xl font-normal text-emerald-200">Operators</span>
                  </div>
                  <p className="text-emerald-100 text-sm font-medium relative z-10">
                    Exact Calculated Headcount: <strong className="underline">{exactOperatorsNeeded.toFixed(2)}</strong> workers required for target output.
                  </p>
                </div>
              </div>
            )}

            {calcSubTab === 'output' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Package size={100} /></div>
                  <div>
                    <div className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Line Output / Hour</div>
                    <div className="text-5xl font-black mb-2 tracking-tighter relative z-10">
                      {Math.floor((strengthConfig.operatorCount * 60 * (strengthConfig.lineEfficiency / 100)) / (smv > 0 ? smv : 1))} <span className="text-xl font-normal text-emerald-200">pcs</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 rounded-2xl text-white shadow-xl shadow-teal-500/20 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Factory size={100} /></div>
                  <div>
                    <div className="text-teal-200 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Line Output / 8H Shift</div>
                    <div className="text-5xl font-black mb-2 tracking-tighter relative z-10">
                      {calcOutputPerShift} <span className="text-xl font-normal text-teal-200">pcs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {calcSubTab === 'cpp' && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-2xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={120} /></div>
                <div>
                  <div className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Cost Per Piece (CPP)</div>
                  <div className="text-6xl font-black mb-3 tracking-tighter relative z-10">
                    Rs. {cpp.toFixed(2)}
                  </div>
                  <p className="text-emerald-100 text-sm font-medium relative z-10">
                    Total Manpower Cost: <strong className="underline">Rs. {(strengthConfig.operatorCount * strengthConfig.dailyWagePerOperator).toLocaleString()}</strong> ({strengthConfig.operatorCount} operators) for {strengthConfig.targetOutput} pcs target.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 font-sans pb-20 md:pb-0 print:bg-white transition-colors duration-300">
        
        <header className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 print:hidden transition-colors">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xl tracking-tight">
              <Clock className="stroke-[2.5]" />
              <span>IE<span className="text-slate-800 dark:text-white">StudyPro</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setMainModule('study')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mainModule === 'study' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Time Study & Target Estimation
              </button>
              <button 
                onClick={() => setMainModule('strength_cpp')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mainModule === 'strength_cpp' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Line Strength & CPP Calculator
              </button>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} className="fill-current" /> : <Moon size={20} className="fill-current" />}
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8 min-h-[calc(100vh-4rem)]">
          {mainModule === 'study' && (
            <>
              {activeTab === 'setup' && renderSetupView()}
              {activeTab === 'study' && renderStudyView()}
              {activeTab === 'results' && renderResultsView()}
            </>
          )}

          {mainModule === 'strength_cpp' && renderStrengthAndCppView()}
        </main>

        <nav className="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700/50 flex justify-around p-2 pb-safe print:hidden z-50 transition-colors">
          <button 
            onClick={() => setMainModule('study')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mainModule === 'study' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Clock size={20} className={mainModule === 'study' ? "stroke-[2.5]" : ""} />
            <span className="text-[10px] font-bold mt-1">Time Study</span>
          </button>
          <button 
            onClick={() => setMainModule('strength_cpp')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mainModule === 'strength_cpp' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Users size={20} className={mainModule === 'strength_cpp' ? "stroke-[2.5]" : ""} />
            <span className="text-[10px] font-bold mt-1">Strength & CPP</span>
          </button>
        </nav>
        
        <style dangerouslySetInnerHTML={{__html: `
          .pb-safe { padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem); }
          @media print {
            body { background: white; }
            .print\\:hidden { display: none !important; }
            .dark { color-scheme: light; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(71, 85, 105, 0.5);
          }
        `}} />
      </div>
    </div>
  );
}