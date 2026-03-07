import "@/App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Search, 
  Filter, 
  Flame, 
  X, 
  ChevronDown, 
  Activity, 
  Droplets, 
  Send,
  Menu,
  Mail,
  Phone,
  Building2,
  FileCheck,
  Package,
  MapPin,
  ShieldCheck,
  Upload,
  FileText,
  Check,
  Settings,
  Image,
  Trash2,
  Edit3,
  Save,
  ArrowLeft,
  Lock,
  LogOut,
  User,
  Globe,
  UserPlus,
  Leaf,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
  DollarSign,
  Edit2,
  Download,
  RefreshCw,
  ZoomIn,
  Plus,
  Users,
  MessageCircle,
  Share2,
  Copy,
  CheckCircle2,
  Bot,
  Minimize2,
  Instagram,
  BookmarkPlus,
  Bookmark,
  BarChart3
} from "lucide-react";

// Prevent right-click on images
const preventImageActions = (e) => {
  e.preventDefault();
  return false;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const FIREGOLD_LOGO = "https://customer-assets.emergentagent.com/job_reload-engine/artifacts/sx02pppj_ChatGPT%20Image%20Nov%2011%2C%202025%20at%2009_53_40%20AM.png";
const FIREGOLD_MARKETPLACE_LOGO = "https://customer-assets.emergentagent.com/job_ecd636ef-7568-464f-aeda-90fbfc69ca12/artifacts/0f25xj2d_firegold%20Marketplace.png";

// Canonical list of cannabis effects (alphabetical)
const ALL_EFFECTS = [
  "Active Body Feeling",
  "Alertness",
  "Anti-inflammatory Relief",
  "Anxiety Reduction",
  "Blissful",
  "Body High",
  "Body Relaxation",
  "Bonding",
  "Calm",
  "Cerebral",
  "Cheerful",
  "Confidence Boost",
  "Couch-Lock",
  "Creative",
  "Deep Relax",
  "Dreaminess",
  "Emotional Balance",
  "Energetic",
  "Enhanced Creativity in Art/Music",
  "Enhanced Sensory Awareness",
  "Enhanced Visual Perception",
  "Euphoria",
  "Floating Feeling",
  "Focus",
  "Food Craving",
  "Happiness",
  "Increased Appetite",
  "Inspiration",
  "Introspection",
  "Mental Stimulation",
  "Mood Enhance",
  "Motivation",
  "Muscle Relaxation",
  "Nausea Reduction",
  "Pain Relief",
  "Reduce Social Inhibition",
  "Relax",
  "Sedating",
  "Sleepy",
  "Stimulating",
  "Stress Relief",
  "Thought Acceleration",
  "Uplifted"
];

// Multi-select effects dropdown component
const EffectsMultiSelect = ({ selected = [], onChange, maxItems = 8, testId = "effects-select" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleEffect = (effect) => {
    if (selected.includes(effect)) {
      onChange(selected.filter(e => e !== effect));
    } else if (selected.length < maxItems) {
      onChange([...selected, effect]);
    }
  };

  const visibleEffects = search
    ? ALL_EFFECTS.filter(e => e.toLowerCase().includes(search.toLowerCase()))
    : ALL_EFFECTS;

  return (
    <div ref={dropRef} className="relative" data-testid={testId}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 text-left flex items-center justify-between outline-none"
      >
        <span className={selected.length ? 'text-white text-sm' : 'text-zinc-500 text-sm'}>
          {selected.length ? `${selected.length} effect${selected.length > 1 ? 's' : ''} selected` : 'Select effects (max 8)...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(e => (
            <span key={e} className="bg-gold-500/15 border border-gold-500/30 text-gold-500 text-xs px-2 py-1 flex items-center gap-1">
              {e}
              <button type="button" onClick={() => toggleEffect(e)} className="hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 max-h-72 overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-zinc-900 p-2 border-b border-zinc-800">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search effects..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm h-8 px-3 outline-none focus:border-gold-500"
            />
          </div>
          <div className="p-1">
            {visibleEffects.map(effect => (
              <button
                key={effect}
                type="button"
                onClick={() => toggleEffect(effect)}
                disabled={!selected.includes(effect) && selected.length >= maxItems}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                  selected.includes(effect)
                    ? 'bg-gold-500/10 text-gold-500'
                    : selected.length >= maxItems
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {effect}
                {selected.includes(effect) && <Check className="w-3 h-3" />}
              </button>
            ))}
            {visibleEffects.length === 0 && (
              <p className="text-zinc-600 text-xs px-3 py-2">No effects match your search</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics tracking helper
const trackEvent = async (eventType, data = {}) => {
  const token = localStorage.getItem('userToken');
  if (!token) return;
  
  try {
    await axios.post(`${API}/analytics/track`, {
      event_type: eventType,
      ...data
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    // Silently fail - don't interrupt user experience
    console.debug('Analytics tracking failed:', err);
  }
};

// Session tracking - time on page
let sessionStartTime = Date.now();
let sessionId = null;
let pagesVisited = [];
let strainsViewed = [];

const initSession = (sId) => {
  sessionId = sId || localStorage.getItem('sessionId');
  sessionStartTime = Date.now();
  pagesVisited = [];
  strainsViewed = [];
};

const updateSession = async () => {
  const token = localStorage.getItem('userToken');
  if (!token || !sessionId) return;
  
  const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
  
  try {
    await axios.post(`${API}/analytics/session/update?session_id=${sessionId}&duration=${duration}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.debug('Session update failed:', err);
  }
};

// Update session every 30 seconds and on page unload
if (typeof window !== 'undefined') {
  setInterval(updateSession, 30000);
  window.addEventListener('beforeunload', updateSession);
}

// Strain Card Component
const StrainCard = ({ strain, onSelect, isSelected, onViewDetails }) => {
  const getTypeColor = (type) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('indica')) return 'text-purple-400';
    if (lowerType.includes('sativa')) return 'text-green-400';
    return 'text-gold-500';
  };

  return (
    <div 
      data-testid={`strain-card-${strain.id}`}
      className={`bg-charcoal border ${isSelected ? 'border-gold-500' : 'border-white/5'} hover:border-gold-500/50 transition-all duration-500 group relative overflow-hidden cursor-pointer`}
      onClick={() => onViewDetails(strain)}
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={strain.image_url || 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'; }}
          alt={strain.strain_name}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 select-none pointer-events-none"
          onContextMenu={preventImageActions}
          onDragStart={preventImageActions}
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Growing Method Badge */}
        {strain.growing_method && (
          <div className="absolute top-4 right-4 w-20 bg-black/80 backdrop-blur-sm px-2 py-1 border border-white/20 text-center">
            <span className="text-zinc-300 font-mono text-[10px] font-bold uppercase">{strain.growing_method}</span>
          </div>
        )}

        {/* Price Tier Badge */}
        <div className={`absolute ${strain.growing_method ? 'top-12' : 'top-4'} right-4 w-20 bg-black/80 backdrop-blur-sm px-2 py-1 border border-gold-500/30 text-center`}>
          <span className="text-gold-500 font-mono text-sm">{strain.price_tier}</span>
        </div>

        {/* Category Badge */}
        {strain.category && (
          <div className={`absolute ${strain.growing_method ? 'top-[84px]' : 'top-14'} right-4 w-20 bg-gold-500/20 backdrop-blur-sm px-2 py-0.5 border border-gold-500/40 text-center`}>
            <span className="text-gold-500 font-mono text-[9px] font-bold uppercase leading-tight">{strain.category}</span>
          </div>
        )}
        
        {/* COA Badge */}
        {strain.coa_url && (
          <div className={`absolute ${strain.category && strain.growing_method ? 'top-[116px]' : strain.growing_method || strain.category ? 'top-[84px]' : 'top-14'} right-4 w-20 bg-cannabis-green/90 backdrop-blur-sm px-2 py-0.5 border border-cannabis-green text-center`}>
            <span className="text-white font-mono text-xs font-bold">COA</span>
          </div>
        )}

        {/* BC DD Badge */}
        {strain.bc_dd_compliant && (
          <div className="absolute top-4 left-12 bg-blue-600/90 backdrop-blur-sm px-2 py-0.5 border border-blue-400 text-center">
            <span className="text-white font-mono text-[9px] font-bold">BC DD</span>
          </div>
        )}
        
        {/* Selection checkbox */}
        <div 
          className="absolute top-4 left-4"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(strain.id);
          }}
        >
          <div className={`w-6 h-6 border-2 ${isSelected ? 'bg-gold-500 border-gold-500' : 'border-white/30 hover:border-gold-500'} transition-all flex items-center justify-center`}>
            {isSelected && <span className="text-black text-sm">✓</span>}
          </div>
        </div>
      </div>
      
      <div className="p-6 absolute bottom-0 w-full">
        <div className={`font-manrope text-xs uppercase tracking-widest ${getTypeColor(strain.type)} mb-2`}>
          {strain.type}
        </div>
        <h3 className="font-cinzel font-bold text-xl text-white mb-2 flex items-center gap-2">
          {strain.strain_name}
          {strain.bc_dd_compliant && (
            <span className="bg-blue-600/20 border border-blue-400/40 text-blue-300 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest">BC DD</span>
          )}
        </h3>
        <div className="flex items-center gap-4 text-zinc-400 text-sm">
          <span className="flex items-center gap-1">
            <Activity className="w-4 h-4 text-gold-500" />
            THC {strain.thc_percentage}
          </span>
          <span className="font-mono text-xs text-zinc-500">{strain.lot_size}</span>
        </div>
        {(strain.grade_a_kg || strain.grade_b_kg || strain.grade_c_kg) && (
          <div className="flex gap-1.5 mt-2">
            {strain.grade_a_kg > 0 && <span className="bg-cannabis-green/20 text-cannabis-green text-[10px] font-bold px-1.5 py-0.5">A: {strain.grade_a_kg}kg</span>}
            {strain.grade_b_kg > 0 && <span className="bg-gold-500/20 text-gold-500 text-[10px] font-bold px-1.5 py-0.5">B: {strain.grade_b_kg}kg</span>}
            {strain.grade_c_kg > 0 && <span className="bg-zinc-600/30 text-zinc-400 text-[10px] font-bold px-1.5 py-0.5">C: {strain.grade_c_kg}kg</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Strain Detail Modal
const StrainDetailModal = ({ strain, onClose, onAddToInquiry, isInInquiry, onRequestSample }) => {
  const [showCoa, setShowCoa] = useState(false);
  const [coaLoading, setCoaLoading] = useState(false);
  const [coaBlobUrl, setCoaBlobUrl] = useState(null);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  if (!strain) return null;

  const handleViewCoa = async () => {
    setCoaLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      trackEvent('coa_view', { strain_name: strain.strain_name }, null, strain.id, strain.strain_name);
      const response = await axios.get(`${API}/strains/${strain.id}/coa`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(response.data);
      setCoaBlobUrl(blobUrl);
      setShowCoa(true);
    } catch {
      // Fallback: try to open COA URL directly
      if (strain.coa_url) {
        window.open(strain.coa_url, '_blank');
      } else {
        toast.error('Unable to load COA');
      }
    } finally {
      setCoaLoading(false);
    }
  };

  const closeCoa = () => {
    setShowCoa(false);
    if (coaBlobUrl) {
      URL.revokeObjectURL(coaBlobUrl);
      setCoaBlobUrl(null);
    }
  };

  return (
    <div 
      data-testid="strain-detail-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-charcoal border border-white/10 max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky back/close bar - always visible on mobile */}
        <div className="sticky top-0 z-10 bg-charcoal/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between md:hidden">
          <button
            data-testid="mobile-back-btn"
            onClick={onClose}
            className="flex items-center gap-2 text-black bg-gold-500 px-3 py-1.5 active:bg-gold-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-manrope uppercase tracking-widest font-bold">Back</span>
          </button>
          <span className="text-gold-500 font-cinzel font-bold text-sm truncate max-w-[50%]">{strain.strain_name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image with Zoom + Logo */}
          <div className="flex flex-col">
            <div 
              className="aspect-square relative overflow-hidden cursor-zoom-in group"
              data-testid="strain-image-zoom"
              onClick={() => setImageZoomed(true)}
            >
              <img 
                src={strain.image_url || 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'; }}
                alt={strain.strain_name}
                className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                onContextMenu={preventImageActions}
                onDragStart={preventImageActions}
                draggable="false"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
              </div>
              <button 
                data-testid="close-modal-btn"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-4 right-4 w-10 h-10 bg-gold-500 text-black hidden md:flex items-center justify-center hover:bg-gold-400 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Firegold Marketplace Logo */}
            <div className="bg-zinc-950 py-6 flex items-center justify-center border-t border-white/5">
              <img 
                src={FIREGOLD_MARKETPLACE_LOGO} 
                alt="Firegold Marketplace" 
                data-testid="strain-detail-marketplace-logo"
                className="w-[50%] h-auto" 
                style={{ mixBlendMode: 'lighten' }} 
              />
            </div>
          </div>
          
          {/* Details */}
          <div className="p-8 flex flex-col">
            <div className="text-gold-500 font-manrope text-xs uppercase tracking-widest mb-2 flex items-center gap-3">
              <span>{strain.type}</span>
              {strain.growing_method && (
                <span className="bg-white/10 border border-white/20 text-zinc-300 px-2 py-0.5 text-[10px] font-bold tracking-widest">{strain.growing_method}</span>
              )}
              {strain.bc_dd_compliant && (
                <span className="bg-blue-600/20 border border-blue-400/40 text-blue-300 px-2 py-0.5 text-[10px] font-bold tracking-widest">BC DD</span>
              )}
            </div>
            <h2 className="font-cinzel font-bold text-3xl text-white mb-4">{strain.strain_name}</h2>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-900/50 p-4 border border-white/5">
                <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-1">THC</div>
                <div className="text-white font-mono text-lg">{strain.thc_percentage}</div>
              </div>
              <div className="bg-zinc-900/50 p-4 border border-white/5">
                <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-1">Price Tier</div>
                <div className="text-gold-500 font-mono text-lg">{strain.price_tier}</div>
              </div>
            </div>
            
            {/* Lineage */}
            <div className="mb-6">
              <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-2">Lineage</div>
              <div className="text-zinc-300 font-light">{strain.lineage}</div>
            </div>
            
            {/* Terpenes */}
            <div className="mb-6">
              <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Terpene Profile
              </div>
              <div className="flex flex-wrap gap-2">
                {strain.terpene_profile.map((terp, idx) => (
                  <span key={idx} className="px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-sm">
                    {terp}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Effects */}
            <div className="mb-6">
              <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-2">Effects</div>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(strain.effects) ? strain.effects : (typeof strain.effects === 'string' && strain.effects ? strain.effects.split(',').map(e => e.trim()) : [])).map((effect, i) => (
                  <span key={i} className="bg-gold-500/10 border border-gold-500/30 text-gold-500 text-xs px-2 py-1">{effect}</span>
                ))}
              </div>
            </div>
            
            {/* Lot Size */}
            <div className="mb-6">
              <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-2">Available Quantity</div>
              <div className="text-white font-mono">{strain.lot_size}</div>
            </div>

            {/* Harvest Date */}
            {strain.harvest_date && (
              <div className="mb-6">
                <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-2">Harvest Date</div>
                <div className="text-white font-mono">{new Date(strain.harvest_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            )}

            {/* Grade Breakdown */}
            {(strain.grade_a_kg || strain.grade_b_kg || strain.grade_c_kg) && (
              <div className="mb-6">
                <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-3">Grade Breakdown</div>
                <div className="grid grid-cols-3 gap-2">
                  {strain.grade_a_kg > 0 && (
                    <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-3 text-center">
                      <div className="text-cannabis-green font-bold text-lg font-mono">{strain.grade_a_kg}</div>
                      <div className="text-cannabis-green/70 text-[10px] uppercase tracking-widest">Grade A (Bigs) (kg)</div>
                    </div>
                  )}
                  {strain.grade_b_kg > 0 && (
                    <div className="bg-gold-500/10 border border-gold-500/30 p-3 text-center">
                      <div className="text-gold-500 font-bold text-lg font-mono">{strain.grade_b_kg}</div>
                      <div className="text-gold-500/70 text-[10px] uppercase tracking-widest">Grade B (Mids) (kg)</div>
                    </div>
                  )}
                  {strain.grade_c_kg > 0 && (
                    <div className="bg-zinc-700/30 border border-zinc-600/30 p-3 text-center">
                      <div className="text-zinc-400 font-bold text-lg font-mono">{strain.grade_c_kg}</div>
                      <div className="text-zinc-500 text-[10px] uppercase tracking-widest">Grade C (Smalls) (kg)</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COA Link */}
            {strain.coa_url && (
              <div className="mb-6">
                <button
                  data-testid="view-coa-btn"
                  onClick={handleViewCoa}
                  disabled={coaLoading}
                  className="w-full flex items-center justify-center gap-3 bg-cannabis-green text-black hover:bg-cannabis-green/90 px-6 py-3 transition-all"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-widest text-sm">
                    {coaLoading ? 'Loading COA...' : 'View Certificate of Analysis'}
                  </span>
                </button>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <button 
                data-testid="request-sample-btn"
                onClick={() => onRequestSample(strain)}
                className="w-full border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Request Sample
              </button>
              <button 
                data-testid="add-to-inquiry-btn"
                onClick={() => onAddToInquiry(strain.id)}
                className={`w-full ${isInInquiry ? 'bg-cannabis-green' : 'bg-gold-500 hover:bg-gold-400'} text-black font-bold uppercase tracking-widest px-8 py-4 transition-all`}
              >
                {isInInquiry ? 'Added to Inquiry' : 'Add to Inquiry'}
              </button>
            </div>
          </div>
        </div>

        {/* Full-screen Image Zoom Overlay */}
        {imageZoomed && (
          <div 
            data-testid="image-zoom-overlay"
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col cursor-zoom-out"
            onClick={() => setImageZoomed(false)}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-charcoal/80">
              <span className="font-cinzel font-bold text-white text-sm">{strain.strain_name}</span>
              <button
                data-testid="close-zoom-btn"
                onClick={() => setImageZoomed(false)}
                className="w-10 h-10 bg-gold-500 text-black hover:bg-gold-400 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div 
              className="flex-1 flex items-center justify-center p-4 overflow-hidden"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
              }}
            >
              <img 
                src={strain.image_url || 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'; }}
                alt={strain.strain_name}
                className="max-w-full max-h-full object-contain select-none pointer-events-none"
                style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(1.8)' }}
                onContextMenu={preventImageActions}
                onDragStart={preventImageActions}
                draggable="false"
              />
            </div>
          </div>
        )}

        {/* COA PDF Viewer Overlay */}
        {showCoa && coaBlobUrl && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col" data-testid="coa-viewer">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-charcoal">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-cannabis-green" />
                <h3 className="font-cinzel font-bold text-lg text-white">Certificate of Analysis</h3>
                <span className="text-zinc-500 text-sm">— {strain.strain_name}</span>
              </div>
              <button
                data-testid="close-coa-btn"
                onClick={closeCoa}
                className="w-10 h-10 bg-gold-500 text-black hover:bg-gold-400 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={coaBlobUrl}
                title={`COA - ${strain.strain_name}`}
                className="w-full h-full border border-white/10"
                style={{ minHeight: 'calc(100vh - 80px)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Filter Sidebar Component
const FilterSidebar = ({ filters, setFilters, strains }) => {
  const types = useMemo(() => {
    const allTypes = strains.map(s => s.type);
    return [...new Set(allTypes)];
  }, [strains]);

  const terpenes = useMemo(() => {
    const allTerps = strains.flatMap(s => s.terpene_profile).filter(t => t !== 'N/A');
    return [...new Set(allTerps)];
  }, [strains]);

  return (
    <div data-testid="filter-sidebar" className="space-y-8">
      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">Category</h3>
        <div className="space-y-2">
          {['Dried Flower', 'Fresh Frozen', 'Trim', 'Concentrates'].map((cat) => (
            <button
              key={cat}
              data-testid={`filter-category-${cat.toLowerCase().replace(' ', '-')}`}
              onClick={() => setFilters(prev => ({ ...prev, category: prev.category === cat ? '' : cat }))}
              className={`block w-full text-left px-4 py-2 border ${
                filters.category === cat
                  ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                  : 'border-zinc-800 text-zinc-400 hover:border-gold-500/50'
              } transition-all`}
            >
              {cat}
            </button>
          ))}
          <button
            data-testid="filter-bc-dd"
            onClick={() => setFilters(prev => ({ ...prev, bcDd: !prev.bcDd }))}
            className={`block w-full text-left px-4 py-2 border ${
              filters.bcDd
                ? 'border-blue-400 text-blue-300 bg-blue-600/10'
                : 'border-zinc-800 text-zinc-400 hover:border-blue-400/50'
            } transition-all`}
          >
            <span className="font-bold text-xs">BC DD</span>
            <span className="text-zinc-500 text-xs ml-2">Direct Delivery</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">Growing Method</h3>
        <div className="space-y-2">
          {['Indoor', 'Greenhouse', 'Outdoor'].map((method) => (
            <button
              key={method}
              data-testid={`filter-method-${method.toLowerCase()}`}
              onClick={() => setFilters(prev => ({ ...prev, growingMethod: prev.growingMethod === method ? '' : method }))}
              className={`block w-full text-left px-4 py-2 border ${
                filters.growingMethod === method
                  ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                  : 'border-zinc-800 text-zinc-400 hover:border-gold-500/50'
              } transition-all`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">Effects</h3>
        <div className="space-y-1">
          {(filters.selectedEffects || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {filters.selectedEffects.map(e => (
                <span key={e} className="bg-gold-500/15 border border-gold-500/30 text-gold-500 text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                  {e}
                  <button onClick={() => setFilters(prev => ({...prev, selectedEffects: prev.selectedEffects.filter(x => x !== e)}))}><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
          <select
            data-testid="filter-effects"
            value=""
            onChange={(e) => {
              if (e.target.value && !(filters.selectedEffects || []).includes(e.target.value)) {
                setFilters(prev => ({...prev, selectedEffects: [...(prev.selectedEffects || []), e.target.value]}));
              }
              e.target.value = '';
            }}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-xs h-10 px-3 outline-none focus:border-gold-500"
          >
            <option value="">Add effect filter...</option>
            {ALL_EFFECTS.filter(e => !(filters.selectedEffects || []).includes(e)).map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">Strain Type</h3>
        <div className="space-y-2">
          {['All', 'Indica', 'Sativa', 'Hybrid'].map((type) => (
            <button
              key={type}
              data-testid={`filter-type-${type.toLowerCase()}`}
              onClick={() => setFilters(prev => ({ ...prev, type: type === 'All' ? '' : type }))}
              className={`block w-full text-left px-4 py-2 border ${
                filters.type === type || (type === 'All' && !filters.type)
                  ? 'border-gold-500 text-gold-500'
                  : 'border-zinc-800 text-zinc-400 hover:border-gold-500/50 hover:text-zinc-300'
              } transition-all`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">THC Range</h3>
        <div className="space-y-2">
          {[
            { label: '25%+', value: 25 },
            { label: '30%+', value: 30 },
            { label: '35%+', value: 35 }
          ].map((range) => (
            <button
              key={range.value}
              data-testid={`filter-thc-${range.value}`}
              onClick={() => setFilters(prev => ({ ...prev, minThc: prev.minThc === range.value ? null : range.value }))}
              className={`block w-full text-left px-4 py-2 border ${
                filters.minThc === range.value
                  ? 'border-gold-500 text-gold-500'
                  : 'border-zinc-800 text-zinc-400 hover:border-gold-500/50'
              } transition-all`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">Price Tier</h3>
        <div className="flex gap-2">
          {['$', '$$', '$$$'].map((tier) => (
            <button
              key={tier}
              data-testid={`filter-price-${tier.length}`}
              onClick={() => setFilters(prev => ({ ...prev, priceTier: prev.priceTier === tier ? '' : tier }))}
              className={`flex-1 px-4 py-2 border ${
                filters.priceTier === tier
                  ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                  : 'border-zinc-800 text-zinc-400 hover:border-gold-500/50'
              } transition-all font-mono`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">Flower Grade</h3>
        <div className="space-y-2">
          {['A', 'B', 'C'].map((grade) => (
            <button
              key={grade}
              data-testid={`filter-grade-${grade.toLowerCase()}`}
              onClick={() => setFilters(prev => ({ ...prev, grade: prev.grade === grade ? '' : grade }))}
              className={`block w-full text-left px-4 py-2 border ${
                filters.grade === grade
                  ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                  : 'border-zinc-800 text-zinc-400 hover:border-gold-500/50'
              } transition-all`}
            >
              Grade {grade === 'A' ? 'A (Bigs)' : grade === 'B' ? 'B (Mids)' : 'C (Smalls)'}
            </button>
          ))}
        </div>
      </div>

      {filters.type || filters.priceTier || filters.minThc || filters.search || filters.grade || filters.growingMethod || filters.category || filters.bcDd ? (
        <button
          data-testid="clear-filters-btn"
          onClick={() => setFilters({ type: '', priceTier: '', minThc: null, search: '', grade: '', growingMethod: '', category: '', bcDd: false })}
          className="w-full px-4 py-2 border border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400 transition-all uppercase tracking-widest text-xs"
        >
          Clear All Filters
        </button>
      ) : null}
    </div>
  );
};

// Sample Request Modal Component
const SampleRequestModal = ({ isOpen, onClose, strain, userData, userToken }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    shipping_address: '',
    message: ''
  });
  const [healthCanadaFile, setHealthCanadaFile] = useState(null);
  const [craFile, setCraFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill form with logged-in user data when modal opens
  useEffect(() => {
    if (isOpen && userData) {
      setFormData(prev => ({
        ...prev,
        company_name: prev.company_name || userData.company || '',
        contact_name: prev.contact_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        email: prev.email || userData.email || ''
      }));
    }
  }, [isOpen, userData]);

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!healthCanadaFile || !craFile) {
      toast.error('Please upload both Health Canada License and CRA License PDFs');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('company_name', formData.company_name);
      submitData.append('contact_name', formData.contact_name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone || '');
      submitData.append('strain_id', strain.id);
      submitData.append('shipping_address', formData.shipping_address);
      submitData.append('message', formData.message || '');
      submitData.append('health_canada_license', healthCanadaFile);
      submitData.append('cra_license', craFile);

      await axios.post(`${API}/sample-requests/upload`, submitData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userToken}`
        }
      });
      
      toast.success('Sample request submitted! We will verify your licenses and contact you.');
      onClose();
      setFormData({ 
        company_name: '', contact_name: '', email: '', phone: '',
        shipping_address: '', message: '' 
      });
      setHealthCanadaFile(null);
      setCraFile(null);
    } catch (error) {
      toast.error('Failed to submit sample request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !strain) return null;

  return (
    <div 
      data-testid="sample-request-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-charcoal border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-gold-500" />
                <h2 className="font-cinzel font-bold text-2xl text-white">Request Sample</h2>
              </div>
              <p className="text-zinc-400 text-sm">Sample request for <span className="text-gold-500">{strain.strain_name}</span></p>
            </div>
            <button 
              data-testid="close-sample-request-btn"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* License Requirements Notice */}
          <div className="bg-gold-500/10 border border-gold-500/30 p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-gold-500 font-semibold text-sm mb-1">License Verification Required</h4>
                <p className="text-zinc-400 text-xs">
                  Sample requests require valid Health Canada and CRA license documents (PDF). Your licenses will be verified before samples are shipped.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />Company Name *
                </label>
                <input
                  data-testid="sample-company-input"
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="Licensed cannabis retailer"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Contact Name *</label>
                <input
                  data-testid="sample-contact-input"
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />Email *
                </label>
                <input
                  data-testid="sample-email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />Phone
                </label>
                <input
                  data-testid="sample-phone-input"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* License Upload Section */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="font-manrope text-sm uppercase tracking-widest text-gold-500 mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> License Documents (PDF)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health Canada License Upload */}
                <div>
                  <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                    Health Canada License *
                  </label>
                  <div className="relative">
                    <input
                      data-testid="sample-hc-license-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, setHealthCanadaFile)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full border-2 border-dashed ${healthCanadaFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors`}>
                      {healthCanadaFile ? (
                        <div className="flex items-center gap-3 text-cannabis-green">
                          <Check className="w-5 h-5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{healthCanadaFile.name}</p>
                            <p className="text-xs text-zinc-500">{(healthCanadaFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <Upload className="w-6 h-6" />
                          <span className="text-xs">Click to upload PDF</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-600 text-xs mt-1">Cannabis license issued by Health Canada</p>
                </div>

                {/* CRA License Upload */}
                <div>
                  <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                    CRA Excise License *
                  </label>
                  <div className="relative">
                    <input
                      data-testid="sample-cra-license-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, setCraFile)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full border-2 border-dashed ${craFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors`}>
                      {craFile ? (
                        <div className="flex items-center gap-3 text-cannabis-green">
                          <Check className="w-5 h-5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{craFile.name}</p>
                            <p className="text-xs text-zinc-500">{(craFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <Upload className="w-6 h-6" />
                          <span className="text-xs">Click to upload PDF</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-600 text-xs mt-1">Cannabis excise license from CRA</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />Shipping Address *
              </label>
              <textarea
                data-testid="sample-address-input"
                required
                value={formData.shipping_address}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                rows={2}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 px-4 py-3 transition-colors outline-none resize-none"
                placeholder="Full shipping address for licensed facility"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Additional Notes</label>
              <textarea
                data-testid="sample-message-input"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={2}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 px-4 py-3 transition-colors outline-none resize-none"
                placeholder="Any specific requirements or questions..."
              />
            </div>

            <button
              data-testid="submit-sample-request-btn"
              type="submit"
              disabled={isSubmitting || !healthCanadaFile || !craFile}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Sample Request'}
            </button>

            <p className="text-zinc-600 text-xs text-center">
              By submitting, you confirm that the license documents provided are accurate and valid.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

// Inquiry Form Modal
const InquiryModal = ({ isOpen, onClose, selectedStrains, strains, userData, userToken }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    market_of_interest: '',
    message: '',
    open_permit: '',
    permit_jurisdiction: ''
  });
  const [strainVolumes, setStrainVolumes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill form with logged-in user data when modal opens
  useEffect(() => {
    if (isOpen && userData) {
      setFormData(prev => ({
        ...prev,
        company_name: prev.company_name || userData.company || '',
        contact_name: prev.contact_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        email: prev.email || userData.email || ''
      }));
    }
  }, [isOpen, userData]);

  const selectedStrainDetails = strains.filter(s => selectedStrains.includes(s.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/inquiries`, {
        ...formData,
        strain_ids: selectedStrains,
        strain_volumes: strainVolumes
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      toast.success('Inquiry submitted successfully! We will contact you soon.');
      onClose();
      setFormData({ company_name: '', contact_name: '', email: '', phone: '', market_of_interest: '', message: '', open_permit: '', permit_jurisdiction: '' });
      setStrainVolumes({});
    } catch (error) {
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      data-testid="inquiry-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-charcoal border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Submit Inquiry</h2>
              <p className="text-zinc-400 text-sm">Complete the form below to request more information</p>
            </div>
            <button 
              data-testid="close-inquiry-btn"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Selected Strains with Volume Input */}
          {selectedStrainDetails.length > 0 && (
            <div className="mb-8">
              <h3 className="font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-4">Selected Strains & Volume Required ({selectedStrainDetails.length})</h3>
              <div className="space-y-3">
                {selectedStrainDetails.map(strain => (
                  <div key={strain.id} className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 p-3">
                    <span className="text-gold-500 font-bold text-sm flex-1 min-w-0 truncate">{strain.strain_name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        data-testid={`inquiry-volume-${strain.id}`}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="kg"
                        value={strainVolumes[strain.id] || ''}
                        onChange={(e) => setStrainVolumes(prev => ({ ...prev, [strain.id]: e.target.value }))}
                        className="w-24 bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white text-sm h-9 px-3 outline-none text-right"
                      />
                      <span className="text-zinc-500 text-xs font-mono">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />Company Name
                </label>
                <input
                  data-testid="inquiry-company-input"
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="Your company"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Contact Name</label>
                <input
                  data-testid="inquiry-contact-input"
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />Email
                </label>
                <input
                  data-testid="inquiry-email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />Phone (Optional)
                </label>
                <input
                  data-testid="inquiry-phone-input"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />Market of Interest
              </label>
              <input
                data-testid="inquiry-market-input"
                type="text"
                value={formData.market_of_interest}
                onChange={(e) => setFormData(prev => ({ ...prev, market_of_interest: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="e.g., Canada, Germany, Australia, Israel"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Do you have an Open Permit?</label>
                <select
                  data-testid="inquiry-open-permit"
                  value={formData.open_permit}
                  onChange={(e) => setFormData(prev => ({ ...prev, open_permit: e.target.value, permit_jurisdiction: e.target.value !== 'Yes' ? '' : prev.permit_jurisdiction }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Permit Jurisdiction</label>
                <select
                  data-testid="inquiry-jurisdiction"
                  value={formData.permit_jurisdiction}
                  onChange={(e) => setFormData(prev => ({ ...prev, permit_jurisdiction: e.target.value }))}
                  className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none ${formData.open_permit !== 'Yes' ? 'opacity-50' : ''}`}
                  disabled={formData.open_permit !== 'Yes'}
                >
                  <option value="">Select jurisdiction...</option>
                  <option value="Domestic (Canada)">Domestic (Canada)</option>
                  <option value="Australia">Australia</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Germany">Germany</option>
                  <option value="Israel">Israel</option>
                  <option value="Portugal">Portugal</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Message</label>
              <textarea
                data-testid="inquiry-message-input"
                required
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 px-4 py-3 transition-colors outline-none resize-none"
                placeholder="Tell us about your requirements, quantities needed, or any questions..."
              />
            </div>

            <button
              data-testid="submit-inquiry-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Grower Submission Page (Public)
const GrowerSubmitPage = () => {
  const [formData, setFormData] = useState({
    grower_name: '',
    company_name: '',
    email: '',
    phone: '',
    license_number: '',
    strain_name: '',
    strain_type: 'Balanced Hybrid',
    category: 'Dried Flower',
    extract_type: '',
    extraction_method: '',
    thc_percentage: '',
    cbd_percentage: '',
    terpene_profile: '',
    lineage: '',
    lot_size_kg: '',
    effects: [],
    growing_method: 'Indoor',
    /* export_country removed */
    open_permit: '',
    is_irradiated: '',
    willing_to_irradiate: '',
    gacp_compliant: '',
    gmp_compliant: '',
    bc_dd_compliant: false,
    terpene_percentage: '',
    grade_a_kg: '',
    grade_b_kg: '',
    grade_c_kg: '',
    harvest_date: '',
    additional_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [lotError, setLotError] = useState('');
  const [strainImage, setStrainImage] = useState(null);
  const [coaFile, setCoaFile] = useState(null);
  const [hcLicenseFile, setHcLicenseFile] = useState(null);
  const [craLicenseFile, setCraLicenseFile] = useState(null);
  const [ddcFile, setDdcFile] = useState(null);
  const [licensesOnFile, setLicensesOnFile] = useState(null);
  const [checkingLicenses, setCheckingLicenses] = useState(false);

  // Debounced license check when company name changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      const name = formData.company_name.trim();
      if (name.length >= 2) {
        setCheckingLicenses(true);
        try {
          const res = await axios.get(`${API}/grower/check-licenses?company_name=${encodeURIComponent(name)}`);
          if (res.data.recognized) {
            setLicensesOnFile(res.data);
          } else {
            setLicensesOnFile(null);
          }
        } catch { setLicensesOnFile(null); }
        setCheckingLicenses(false);
      } else {
        setLicensesOnFile(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.company_name]);

  const handleLotSizeChange = (val) => {
    setFormData(prev => ({ ...prev, lot_size_kg: val }));
    const num = parseFloat(val);
    if (val && isNaN(num)) {
      setLotError('Please enter a valid number');
    } else {
      setLotError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lotKg = parseFloat(formData.lot_size_kg);
    if (isNaN(lotKg) || lotKg <= 0) {
      setLotError('Please enter a valid lot size');
      return;
    }
    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('grower_name', formData.grower_name);
      submitData.append('company_name', formData.company_name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('license_number', formData.license_number || '');
      submitData.append('strain_name', formData.strain_name);
      submitData.append('strain_type', formData.strain_type);
      submitData.append('category', formData.category);
      if (formData.category === 'Concentrates') {
        submitData.append('extract_type', formData.extract_type || '');
        submitData.append('extraction_method', formData.extraction_method || '');
      }
      submitData.append('thc_percentage', formData.thc_percentage);
      submitData.append('cbd_percentage', formData.cbd_percentage || '');
      submitData.append('terpene_profile', formData.terpene_profile);
      submitData.append('lineage', formData.lineage);
      submitData.append('lot_size_kg', lotKg);
      submitData.append('effects', Array.isArray(formData.effects) ? formData.effects.join(', ') : formData.effects);
      submitData.append('growing_method', formData.growing_method || '');
      submitData.append('open_permit', formData.open_permit || '');
      submitData.append('is_irradiated', formData.is_irradiated || '');
      submitData.append('willing_to_irradiate', formData.willing_to_irradiate || '');
      submitData.append('gacp_compliant', formData.gacp_compliant || '');
      submitData.append('gmp_compliant', formData.gmp_compliant || '');
      submitData.append('bc_dd_compliant', formData.bc_dd_compliant ? 'Yes' : 'No');
      submitData.append('terpene_percentage', formData.terpene_percentage || '');
      submitData.append('additional_notes', formData.additional_notes || '');
      submitData.append('grade_a_kg', parseFloat(formData.grade_a_kg) || 0);
      submitData.append('grade_b_kg', parseFloat(formData.grade_b_kg) || 0);
      submitData.append('grade_c_kg', parseFloat(formData.grade_c_kg) || 0);
      submitData.append('harvest_date', formData.harvest_date || '');
      if (strainImage) {
        submitData.append('strain_image', strainImage);
      }
      if (coaFile) {
        submitData.append('coa_file', coaFile);
      }
      if (hcLicenseFile) {
        submitData.append('health_canada_license', hcLicenseFile);
      }
      if (craLicenseFile) {
        submitData.append('cra_license', craLicenseFile);
      }
      if (ddcFile) {
        submitData.append('ddc_file', ddcFile);
      }

      const response = await axios.post(`${API}/grower/submit`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmissionId(response.data.submission_id);
      setSubmitted(true);
      toast.success('Strain submitted for review!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
        <div className="bg-charcoal border border-white/10 p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-cannabis-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-cannabis-green" />
          </div>
          <h2 className="font-cinzel font-bold text-2xl text-white mb-4">Submission Received!</h2>
          <p className="text-zinc-400 mb-4">
            Thank you for submitting <span className="text-gold-500">{formData.strain_name}</span>
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            Our team will review your submission and contact you at {formData.email}
          </p>
          <div className="bg-zinc-900 border border-white/5 p-3 mb-6">
            <p className="text-zinc-500 text-xs">Reference ID</p>
            <p className="text-gold-500 font-mono">{submissionId}</p>
          </div>
          <div className="bg-gold-500/10 border border-gold-500/30 p-3 mb-6">
            <p className="text-gold-500 text-xs uppercase tracking-widest mb-1">Status</p>
            <p className="text-gold-500 font-bold">Pending Admin Authorization</p>
          </div>

          {/* License Download Section */}
          <div className="bg-zinc-900 border border-gold-500/30 p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-gold-500" />
              <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500">Complete Your Onboarding</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Download our Health Canada and CRA licenses to complete the mutual LP verification process.
            </p>
            <div className="space-y-2">
              <a 
                href="/firegold_hc_license.pdf" 
                download="Firegold_Health_Canada_License.pdf"
                data-testid="download-hc-license"
                className="flex items-center justify-between w-full bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-500 px-4 py-3 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-bold">
                  <FileText className="w-4 h-4" />
                  Firegold — Health Canada License
                </span>
                <Download className="w-4 h-4" />
              </a>
              <a 
                href="/firegold_cra_license.pdf" 
                download="Firegold_CRA_License.pdf"
                data-testid="download-cra-license"
                className="flex items-center justify-between w-full bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-500 px-4 py-3 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-bold">
                  <FileText className="w-4 h-4" />
                  Firegold — CRA License
                </span>
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          <a href="/" className="block w-full bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all text-center mb-3">
            Back to Catalog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12">
        <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Catalog</span>
        </a>
        <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-28 w-auto" />
        <div></div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-cannabis-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-8 h-8 text-cannabis-green" />
          </div>
          <h1 className="font-cinzel font-bold text-3xl text-white mb-4">Submit Your Product</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Are you a licensed grower with premium cannabis products? Submit your product for consideration in our B2B catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-charcoal border border-white/10 p-8 space-y-8" data-testid="grower-submit-form">
          {/* Grower Information */}
          <div>
            <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Grower Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Contact Name *</label>
                <input
                  data-testid="grower-name-input"
                  type="text"
                  required
                  value={formData.grower_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, grower_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Company / LP Name *</label>
                <input
                  data-testid="grower-company-input"
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="Licensed Producer name"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Email *</label>
                <input
                  data-testid="grower-email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Phone *</label>
                <input
                  data-testid="grower-phone-input"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Health Canada License # (optional)</label>
                <div className="flex gap-2">
                  <input
                    data-testid="grower-license-input"
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    className="flex-1 bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                    placeholder="LIC-XXXXX"
                  />
                  {formData.license_number && (
                    <button
                      type="button"
                      data-testid="verify-license-btn"
                      onClick={async () => {
                        try {
                          const res = await axios.get(`${API}/grower/verify-license/${formData.license_number}`);
                          if (res.data.verified) {
                            toast.success(`License verified — ${res.data.company}`);
                          } else {
                            toast.info(res.data.message);
                          }
                        } catch { toast.error('Could not verify license'); }
                      }}
                      className="bg-gold-500/20 border border-gold-500/40 text-gold-500 px-4 h-12 font-bold uppercase tracking-widest text-xs hover:bg-gold-500/30 transition-colors whitespace-nowrap"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Strain Information */}
          <div>
            <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5" /> Strain Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Strain Name *</label>
                <input
                  data-testid="grower-strain-name-input"
                  type="text"
                  required
                  value={formData.strain_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, strain_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., Blue Dream"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Type *</label>
                <select
                  data-testid="grower-strain-type-select"
                  value={formData.strain_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, strain_type: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="Balanced Hybrid">Balanced Hybrid</option>
                  <option value="Hybrid, Indica Leaning">Hybrid, Indica Leaning</option>
                  <option value="Hybrid, Sativa Leaning">Hybrid, Sativa Leaning</option>
                  <option value="Indica Dominant">Indica Dominant</option>
                  <option value="Sativa Dominant">Sativa Dominant</option>
                </select>
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Category *</label>
                <select
                  data-testid="grower-category-select"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="Dried Flower">Dried Flower</option>
                  <option value="Fresh Frozen">Fresh Frozen</option>
                  <option value="Trim">Trim</option>
                  <option value="Concentrates">Concentrates</option>
                </select>
              </div>

              {/* Concentrates-specific fields */}
              {formData.category === 'Concentrates' && (
                <>
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Extracts *</label>
                    <select
                      data-testid="grower-extract-type"
                      value={formData.extract_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, extract_type: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                    >
                      <option value="">Select extract type...</option>
                      <option value="Live Resin">Live Resin</option>
                      <option value="Cured Resin">Cured Resin</option>
                      <option value="Liquid Diamonds">Liquid Diamonds</option>
                      <option value="Distillate">Distillate</option>
                      <option value="Dry Diamonds">Dry Diamonds</option>
                      <option value="Diamonds and Sauce">Diamonds and Sauce</option>
                      <option value="THCa Micro Powder">THCa Micro Powder</option>
                      <option value="Vape Ready Resin">Vape Ready Resin</option>
                      <option value="CBD Distillate">CBD Distillate</option>
                      <option value="CBD Resin">CBD Resin</option>
                      <option value="CBG Isolate">CBG Isolate</option>
                      <option value="THC Isolate">THC Isolate</option>
                      <option value="CBC Isolate">CBC Isolate</option>
                      <option value="Rosin">Rosin</option>
                      <option value="Hash">Hash</option>
                      <option value="Bubble Hash">Bubble Hash</option>
                      <option value="Kief">Kief</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Extraction Method *</label>
                    <select
                      data-testid="grower-extraction-method"
                      value={formData.extraction_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, extraction_method: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                    >
                      <option value="">Select method...</option>
                      <option value="BHO">BHO</option>
                      <option value="CO2">CO2</option>
                      <option value="Ethanol">Ethanol</option>
                      <option value="Water">Water</option>
                      <option value="Solventless">Solventless</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">THC % *</label>
                <input
                  data-testid="grower-thc-input"
                  type="text"
                  required
                  value={formData.thc_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, thc_percentage: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., 28.5%"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">CBD % (optional)</label>
                <input
                  data-testid="grower-cbd-input"
                  type="text"
                  value={formData.cbd_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, cbd_percentage: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., 0.5%"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Terpene % (optional)</label>
                <input
                  data-testid="grower-terpene-pct-input"
                  type="text"
                  value={formData.terpene_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, terpene_percentage: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., 3.2%"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Lineage / Genetics *</label>
                <input
                  data-testid="grower-lineage-input"
                  type="text"
                  required
                  value={formData.lineage}
                  onChange={(e) => setFormData(prev => ({ ...prev, lineage: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., OG Kush x Durban Poison"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Terpene Profile *</label>
                <input
                  data-testid="grower-terpene-input"
                  type="text"
                  required
                  value={formData.terpene_profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, terpene_profile: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., Limonene, Caryophyllene, Myrcene"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Effects * (select up to 8)</label>
                <EffectsMultiSelect
                  selected={formData.effects}
                  onChange={(effects) => setFormData(prev => ({ ...prev, effects }))}
                  testId="grower-effects-select"
                />
              </div>
            </div>
          </div>

          {/* Availability & Export */}
          <div>
            <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Availability & Export
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Total Lot Size (kg) *</label>
                <input
                  data-testid="grower-lot-size-input"
                  type="number"
                  required
                  min="1"
                  step="0.1"
                  value={formData.lot_size_kg}
                  onChange={(e) => handleLotSizeChange(e.target.value)}
                  className={`w-full bg-zinc-900/50 border ${lotError ? 'border-red-500' : 'border-zinc-800'} focus:border-gold-500 text-white h-12 px-4 outline-none`}
                  placeholder="e.g., 50"
                />
                {lotError && <p className="text-red-500 text-xs mt-1">{lotError}</p>}
              </div>

              {/* Flower Grade Breakdown */}
              <div className="md:col-span-2">
                <label className="block font-manrope text-xs uppercase tracking-widest text-gold-500 mb-3 font-bold">Flower Grade Breakdown (kg per grade)</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Grade A (Bigs) (kg)</label>
                    <input
                      data-testid="grower-grade-a-input"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.grade_a_kg}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade_a_kg: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Grade B (Mids) (kg)</label>
                    <input
                      data-testid="grower-grade-b-input"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.grade_b_kg}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade_b_kg: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Grade C (Smalls) (kg)</label>
                    <input
                      data-testid="grower-grade-c-input"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.grade_c_kg}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade_c_kg: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Harvest Date */}
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Harvest Date *</label>
                <input
                  data-testid="grower-harvest-date-input"
                  type="date"
                  required
                  value={formData.harvest_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, harvest_date: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                />
              </div>

              {/* Export country field removed */}
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Growing Method</label>
                <select
                  data-testid="grower-method-select"
                  value={formData.growing_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, growing_method: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Greenhouse">Greenhouse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Irradiation */}
          <div>
            <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Has the flower been irradiated? *</label>
                <select
                  data-testid="grower-irradiated-select"
                  required
                  value={formData.is_irradiated}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_irradiated: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Willing to irradiate if required? *</label>
                <select
                  data-testid="grower-willing-irradiate-select"
                  required
                  value={formData.willing_to_irradiate}
                  onChange={(e) => setFormData(prev => ({ ...prev, willing_to_irradiate: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Is your product GACP compliant? *</label>
                <select
                  data-testid="grower-gacp-select"
                  required
                  value={formData.gacp_compliant}
                  onChange={(e) => setFormData(prev => ({ ...prev, gacp_compliant: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Is your product GMP compliant? *</label>
                <select
                  data-testid="grower-gmp-select"
                  required
                  value={formData.gmp_compliant}
                  onChange={(e) => setFormData(prev => ({ ...prev, gmp_compliant: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            {/* BC DD Compliance */}
            <div className="mt-4 bg-zinc-900/30 border border-white/5 p-4">
              <label className="flex items-center gap-3 cursor-pointer" data-testid="bc-dd-checkbox">
                <input
                  type="checkbox"
                  checked={formData.bc_dd_compliant}
                  onChange={(e) => setFormData(prev => ({ ...prev, bc_dd_compliant: e.target.checked }))}
                  className="w-5 h-5 accent-gold-500"
                />
                <div>
                  <span className="text-white font-bold text-sm">BC Direct Delivery (DD) Compliant</span>
                  <p className="text-zinc-500 text-xs mt-0.5">Check this if your product meets BC Direct Delivery compliance requirements.</p>
                </div>
              </label>
              {formData.bc_dd_compliant && !ddcFile && (
                <p className="text-gold-500 text-xs mt-2 ml-8">Please upload your Direct Delivery Compliance document in the Documents section below.</p>
              )}
            </div>
          </div>

          {/* Strain Image Upload */}
          <div>
            <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" /> Strain Image
            </h3>
            <div className="relative">
              <input
                data-testid="grower-image-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setStrainImage(e.target.files[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full border-2 border-dashed ${strainImage ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-6 transition-colors text-center`}>
                {strainImage ? (
                  <div className="flex items-center justify-center gap-3 text-cannabis-green">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">{strainImage.name}</span>
                    <span className="text-zinc-500 text-sm">({(strainImage.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Upload className="w-8 h-8" />
                    <span>Upload a photo of your flower (JPG, PNG, WebP)</span>
                    <span className="text-xs text-zinc-600">Black background recommended</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div>
            <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Documents
            </h3>

            {/* License Recognition Banner */}
            {licensesOnFile && (
              <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-4 mb-4" data-testid="licenses-on-file-banner">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-cannabis-green" />
                  <span className="text-cannabis-green font-bold text-sm uppercase tracking-widest">
                    {licensesOnFile.company_name} — Recognized
                  </span>
                </div>
                <p className="text-zinc-400 text-sm mb-3">We have records from {licensesOnFile.previous_submissions} previous submission{licensesOnFile.previous_submissions > 1 ? 's' : ''} for your LP.</p>
                <div className="flex flex-wrap gap-3">
                  {licensesOnFile.licenses_on_file.health_canada_license && (
                    <span className="flex items-center gap-1 bg-cannabis-green/20 text-cannabis-green text-xs px-3 py-1 font-bold">
                      <Check className="w-3 h-3" /> Health Canada License on file
                    </span>
                  )}
                  {licensesOnFile.licenses_on_file.cra_license && (
                    <span className="flex items-center gap-1 bg-cannabis-green/20 text-cannabis-green text-xs px-3 py-1 font-bold">
                      <Check className="w-3 h-3" /> CRA License on file
                    </span>
                  )}
                  {licensesOnFile.licenses_on_file.coa && (
                    <span className="flex items-center gap-1 bg-cannabis-green/20 text-cannabis-green text-xs px-3 py-1 font-bold">
                      <Check className="w-3 h-3" /> COA on file
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs mt-2">You can still upload new documents below to update your records.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COA Upload */}
              <div className="flex flex-col">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2 min-h-[2rem] flex items-end">
                  Certificate of Analysis (COA)
                  {licensesOnFile?.licenses_on_file?.coa && <span className="text-cannabis-green ml-1">- on file</span>}
                </label>
                <div className="relative flex-1">
                  <input
                    data-testid="grower-coa-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCoaFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full h-full min-h-[80px] border-2 border-dashed ${coaFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors flex items-center justify-center`}>
                    {coaFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{coaFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-500">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Upload PDF</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Canada License Upload */}
              <div className="flex flex-col">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2 min-h-[2rem] flex items-end">
                  Health Canada License
                  {licensesOnFile?.licenses_on_file?.health_canada_license && <span className="text-cannabis-green ml-1">- on file</span>}
                </label>
                <div className="relative flex-1">
                  <input
                    data-testid="grower-hc-license-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setHcLicenseFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full h-full min-h-[80px] border-2 border-dashed ${hcLicenseFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors flex items-center justify-center`}>
                    {hcLicenseFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{hcLicenseFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-500">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Upload PDF</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CRA License Upload */}
              <div className="flex flex-col">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2 min-h-[2rem] flex items-end">
                  CRA Excise License
                  {licensesOnFile?.licenses_on_file?.cra_license && <span className="text-cannabis-green ml-1">- on file</span>}
                </label>
                <div className="relative flex-1">
                  <input
                    data-testid="grower-cra-license-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCraLicenseFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full h-full min-h-[80px] border-2 border-dashed ${craLicenseFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors flex items-center justify-center`}>
                    {craLicenseFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{craLicenseFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-500">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Upload PDF</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Delivery Compliance Document Upload */}
              <div className="flex flex-col">
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2 min-h-[2rem] flex items-end">
                  Direct Delivery Compliance
                </label>
                <div className="relative flex-1">
                  <input
                    data-testid="grower-ddc-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setDdcFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full h-full min-h-[80px] border-2 border-dashed ${ddcFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors flex items-center justify-center`}>
                    {ddcFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{ddcFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-500">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Upload PDF</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-zinc-600 text-xs mt-2">Upload PDFs of your COA, Health Canada License, CRA Excise License, and Direct Delivery Compliance document if available.</p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Additional Notes (optional)</label>
            <textarea
              data-testid="grower-notes-input"
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
              rows={3}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white px-4 py-3 outline-none resize-none"
              placeholder="Any additional information about your flower, COA availability, etc."
            />
          </div>

          <button
            data-testid="grower-submit-btn"
            type="submit"
            disabled={submitting || !!lotError}
            className="w-full bg-cannabis-green hover:bg-green-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>

          <p className="text-zinc-600 text-xs text-center">
            Submissions are reviewed within 2-3 business days. Admin will set pricing and authorize your strain for the catalog.
          </p>
        </form>
      </main>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }
        }}
      />
    </div>
  );
};

// Auth Page Component (Register/Login)
const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = useState('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralName, setReferralName] = useState('');
  const [showAuthInstallBanner, setShowAuthInstallBanner] = useState(false);
  const [authIsIOS, setAuthIsIOS] = useState(false);
  const [authDeferredPrompt, setAuthDeferredPrompt] = useState(null);

  // PWA Install prompt for auth page — always show on mobile
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone || localStorage.getItem('pwa_install_dismissed')) return;
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    setAuthIsIOS(ios);
    // Always show on mobile devices
    if (isMobile) {
      setShowAuthInstallBanner(true);
    }
    // Also listen for the browser prompt on non-iOS
    if (!ios) {
      const handler = (e) => {
        e.preventDefault();
        setAuthDeferredPrompt(e);
        setShowAuthInstallBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);
  const [registerData, setRegisterData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    country: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    open_permit: '',
    permit_jurisdiction: '',
    user_type: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error('Please enter your email'); return; }
    setForgotSending(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      setForgotSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err) {
      toast.error('Failed to send reset link');
    } finally {
      setForgotSending(false);
    }
  };
  const [showContactFromAuth, setShowContactFromAuth] = useState(false);
  const [authContactForm, setAuthContactForm] = useState({ name: '', email: '', company: '', message: '' });
  const [authContactSending, setAuthContactSending] = useState(false);

  const handleAuthContactSubmit = async (e) => {
    e.preventDefault();
    if (!authContactForm.name || !authContactForm.email || !authContactForm.message) {
      toast.error('Please fill in name, email, and message');
      return;
    }
    setAuthContactSending(true);
    try {
      await axios.post(`${API}/contact`, authContactForm);
      toast.success('Message sent! We\'ll be in touch soon.');
      setAuthContactForm({ name: '', email: '', company: '', message: '' });
      setShowContactFromAuth(false);
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setAuthContactSending(false);
    }
  };

  // Capture referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      axios.get(`${API}/affiliate/resolve/${ref}`).then(res => {
        if (res.data.valid) {
          setReferralName(res.data.affiliate_name);
        }
      }).catch(() => {});
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (registerData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/register`, { ...registerData, referral_code: referralCode || undefined });
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      localStorage.setItem('sessionId', response.data.session_id);
      initSession(response.data.session_id);
      onAuth(response.data.token, response.data.user);
      toast.success('Registration successful! Welcome to Firegold.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      onAuth(response.data.token, response.data.user);
      toast.success('Welcome back!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col relative">
      {/* PWA Install Banner - Top of page */}
      {showAuthInstallBanner && (
        <div data-testid="auth-pwa-install-banner" className="bg-gold-500/15 border-b border-gold-500/30 py-3 px-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/firegold_icon_192.png" alt="Firegold" className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-manrope text-sm font-bold">Install Firegold</p>
                {authIsIOS ? (
                  <p className="text-zinc-300 text-xs">
                    Tap <span className="inline-flex items-center text-gold-500 font-bold">
                      <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      Share
                    </span> then <span className="text-gold-500 font-bold">"Add to Home Screen"</span>
                  </p>
                ) : (
                  <p className="text-zinc-400 text-xs">Add to home screen for quick access</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!authIsIOS && authDeferredPrompt && (
                <button
                  onClick={async () => {
                    authDeferredPrompt.prompt();
                    await authDeferredPrompt.userChoice;
                    setAuthDeferredPrompt(null);
                    setShowAuthInstallBanner(false);
                  }}
                  className="bg-gold-500 text-black font-bold text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-gold-400 transition-all"
                >
                  Install
                </button>
              )}
              <button
                onClick={() => { setShowAuthInstallBanner(false); localStorage.setItem('pwa_install_dismissed', 'true'); }}
                className="w-7 h-7 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
              >
                <X className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
      {/* Contact Us floating button - positioned below install banner on mobile */}
      <button
        onClick={() => setShowContactFromAuth(true)}
        data-testid="auth-contact-btn"
        className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 hover:border-gold-500 text-zinc-300 hover:text-gold-500 px-4 py-2 transition-all backdrop-blur-sm"
        style={{ top: showAuthInstallBanner ? '60px' : '24px' }}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs uppercase tracking-widest font-manrope">Contact Us</span>
      </button>

      {/* Contact Us Modal */}
      {showContactFromAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowContactFromAuth(false)} />
          <div data-testid="auth-contact-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-lg p-8">
            <button 
              onClick={() => setShowContactFromAuth(false)} 
              data-testid="auth-contact-modal-close"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-gold-500" />
              <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest">Contact Us</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-6">Leave a message and our team will get back to you shortly.</p>
            <form onSubmit={handleAuthContactSubmit} className="space-y-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Name *</label>
                <input
                  data-testid="auth-contact-name"
                  type="text"
                  value={authContactForm.name}
                  onChange={(e) => setAuthContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Email *</label>
                <input
                  data-testid="auth-contact-email"
                  type="email"
                  value={authContactForm.email}
                  onChange={(e) => setAuthContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Company</label>
                <input
                  data-testid="auth-contact-company"
                  type="text"
                  value={authContactForm.company}
                  onChange={(e) => setAuthContactForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                  placeholder="Company name (optional)"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Message *</label>
                <textarea
                  data-testid="auth-contact-message"
                  value={authContactForm.message}
                  onChange={(e) => setAuthContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white px-4 py-3 outline-none text-sm min-h-[120px] resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                data-testid="auth-contact-submit"
                disabled={authContactSending}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold uppercase tracking-widest py-3 text-sm transition-all"
              >
                {authContactSending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-charcoal border border-white/10 p-8 max-w-lg w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-32 w-auto" />
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-3 font-bold uppercase tracking-widest text-sm transition-all ${
              mode === 'register' 
                ? 'bg-gold-500 text-black' 
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Register
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-3 font-bold uppercase tracking-widest text-sm transition-all ${
              mode === 'login' 
                ? 'bg-gold-500 text-black' 
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Login
          </button>
        </div>

        {mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {referralName && (
              <div className="bg-gold-500/10 border border-gold-500/30 p-3 text-center mb-2" data-testid="referral-banner">
                <p className="text-gold-500 text-sm font-bold">Referred by {referralName}</p>
              </div>
            )}
            <p className="text-zinc-400 text-sm text-center mb-6">
              Register to access our premium cultivar catalog
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  First Name *
                </label>
                <input
                  data-testid="register-firstname"
                  type="text"
                  required
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  Last Name *
                </label>
                <input
                  data-testid="register-lastname"
                  type="text"
                  required
                  value={registerData.last_name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" /> LP / Company Name *
              </label>
              <input
                data-testid="register-company"
                type="text"
                required
                value={registerData.company}
                onChange={(e) => setRegisterData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="Licensed Producer or Company"
              />
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Globe className="w-4 h-4 inline mr-1" /> Country *
              </label>
              <select
                data-testid="register-country"
                required
                value={registerData.country}
                onChange={(e) => setRegisterData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
              >
                <option value="">Select country...</option>
                <option value="Domestic (Canada)">Domestic (Canada)</option>
                <option value="Australia">Australia</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Germany">Germany</option>
                <option value="Israel">Israel</option>
                <option value="Portugal">Portugal</option>
                <option value="South Africa">South Africa</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> Email *
              </label>
              <input
                data-testid="register-email"
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="email@company.com"
              />
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Phone className="w-4 h-4 inline mr-1" /> Phone *
              </label>
              <input
                data-testid="register-phone"
                type="tel"
                required
                value={registerData.phone}
                onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <FileText className="w-4 h-4 inline mr-1" /> Health Canada License # (optional)
              </label>
              <input
                data-testid="register-license"
                type="text"
                value={registerData.license_number || ''}
                onChange={(e) => setRegisterData(prev => ({ ...prev, license_number: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="e.g. LIC-123456"
              />
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                I am a... *
              </label>
              <select
                data-testid="register-user-type"
                required
                value={registerData.user_type}
                onChange={(e) => setRegisterData(prev => ({ ...prev, user_type: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
              >
                <option value="">Select your role...</option>
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
                <option value="Both">Buyer & Seller</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  Do you have an Open Permit?
                </label>
                <select
                  data-testid="register-open-permit"
                  value={registerData.open_permit}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, open_permit: e.target.value, permit_jurisdiction: e.target.value !== 'Yes' ? '' : prev.permit_jurisdiction }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  Permit Jurisdiction
                </label>
                <select
                  data-testid="register-jurisdiction"
                  value={registerData.permit_jurisdiction}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, permit_jurisdiction: e.target.value }))}
                  className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none ${registerData.open_permit !== 'Yes' ? 'opacity-50' : ''}`}
                  disabled={registerData.open_permit !== 'Yes'}
                >
                  <option value="">Select jurisdiction...</option>
                  <option value="Domestic (Canada)">Domestic (Canada)</option>
                  <option value="Australia">Australia</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Germany">Germany</option>
                  <option value="Israel">Israel</option>
                  <option value="Portugal">Portugal</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Lock className="w-4 h-4 inline mr-1" /> Password *
              </label>
              <input
                data-testid="register-password"
                type="password"
                required
                minLength={6}
                value={registerData.password}
                onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="Choose a password (min 6 characters)"
              />
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Lock className="w-4 h-4 inline mr-1" /> Confirm Password *
              </label>
              <input
                data-testid="register-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-zinc-900/50 border ${confirmPassword && confirmPassword !== registerData.password ? 'border-red-500' : 'border-zinc-800'} focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none`}
                placeholder="Confirm your password"
              />
              {confirmPassword && confirmPassword !== registerData.password && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              data-testid="register-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-zinc-400 text-sm text-center mb-6">
              Welcome back! Enter your credentials to continue.
            </p>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Mail className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input
                data-testid="login-email"
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="email@company.com"
              />
            </div>

            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                <Lock className="w-4 h-4 inline mr-1" /> Password
              </label>
              <input
                data-testid="login-password"
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="Your password"
              />
            </div>

            {error && (
              <div data-testid="login-error" className={`text-sm text-center p-3 ${error.includes('warren@firegold.ca') ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'text-red-500'}`}>
                {error.includes('warren@firegold.ca') ? (
                  <div>
                    <p className="font-bold mb-1">{error.split('Please')[0]}</p>
                    <p>Please contact <a href="mailto:warren@firegold.ca" className="text-gold-500 underline hover:text-gold-400">warren@firegold.ca</a> to request new access.</p>
                  </div>
                ) : error}
              </div>
            )}

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all mt-6"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              data-testid="forgot-password-link"
              className="w-full text-center text-gold-500 hover:text-gold-400 text-xs uppercase tracking-widest mt-3 transition-colors"
            >
              Forgot Password?
            </button>
          </form>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowForgotPassword(false); setForgotSent(false); }} />
            <div data-testid="forgot-password-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-md p-8">
              <button onClick={() => { setShowForgotPassword(false); setForgotSent(false); }} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"><X className="w-5 h-5 text-black" /></button>
              <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest mb-4">Reset Password</h2>
              {forgotSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-cannabis-green mx-auto mb-4" />
                  <p className="text-white mb-2">Reset link sent!</p>
                  <p className="text-zinc-400 text-sm">Check your email for a link to reset your password. It expires in 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-zinc-400 text-sm mb-4">Enter your email and we'll send you a link to reset your password.</p>
                  <input
                    data-testid="forgot-email-input"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                    placeholder="Your email address"
                  />
                  <button
                    type="submit"
                    disabled={forgotSending}
                    data-testid="forgot-submit-btn"
                    className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold uppercase tracking-widest py-3 text-sm transition-all"
                  >
                    {forgotSending ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <p className="text-zinc-600 text-xs text-center mt-6">
          By registering, you agree to our terms of service.
        </p>
      </div>
      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }
        }}
      />
    </div>
  );
};

// Submission Status Tracker (Public)
const SubmissionTracker = () => {
  const [searchType, setSearchType] = useState('company'); // 'company' or 'id'
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setSearching(true);
    setError('');
    setResults(null);

    try {
      const param = searchType === 'company' 
        ? `company_name=${encodeURIComponent(searchValue.trim())}`
        : `submission_id=${encodeURIComponent(searchValue.trim())}`;
      const res = await axios.get(`${API}/grower/track?${param}`);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'No submissions found');
    } finally {
      setSearching(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'approved') return 'bg-cannabis-green/20 text-cannabis-green';
    if (status === 'rejected') return 'bg-red-500/20 text-red-500';
    return 'bg-gold-500/20 text-gold-500';
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <header className="bg-black/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12">
        <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Catalog</span>
        </a>
        <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-28 w-auto" />
        <div></div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="font-cinzel font-bold text-3xl text-white mb-4">Track Your Submission</h1>
          <p className="text-zinc-400">Check the status of your strain submission by LP name or reference ID.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-charcoal border border-white/10 p-6 mb-8" data-testid="tracker-form">
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setSearchType('company')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${searchType === 'company' ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
              LP / Company Name
            </button>
            <button type="button" onClick={() => setSearchType('id')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${searchType === 'id' ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
              Reference ID
            </button>
          </div>
          <div className="flex gap-2">
            <input
              data-testid="tracker-search-input"
              type="text"
              required
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
              placeholder={searchType === 'company' ? 'Enter LP or company name...' : 'Enter reference ID...'}
            />
            <button data-testid="tracker-search-btn" type="submit" disabled={searching}
              className="bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-6 h-12 transition-all">
              {searching ? '...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-charcoal border border-red-500/30 p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-6" data-testid="tracker-results">
            {/* Licenses on File */}
            {(results.licenses_on_file.health_canada_license || results.licenses_on_file.cra_license || results.licenses_on_file.coa) && (
              <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-5">
                <h3 className="text-cannabis-green font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Licenses on File
                </h3>
                <div className="flex flex-wrap gap-3">
                  {results.licenses_on_file.health_canada_license && (
                    <span className="flex items-center gap-1 bg-cannabis-green/20 text-cannabis-green text-xs px-3 py-1.5 font-bold">
                      <Check className="w-3 h-3" /> Health Canada License
                    </span>
                  )}
                  {results.licenses_on_file.cra_license && (
                    <span className="flex items-center gap-1 bg-cannabis-green/20 text-cannabis-green text-xs px-3 py-1.5 font-bold">
                      <Check className="w-3 h-3" /> CRA Excise License
                    </span>
                  )}
                  {results.licenses_on_file.coa && (
                    <span className="flex items-center gap-1 bg-cannabis-green/20 text-cannabis-green text-xs px-3 py-1.5 font-bold">
                      <Check className="w-3 h-3" /> COA
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submissions List */}
            <div>
              <h3 className="text-zinc-400 text-sm uppercase tracking-widest mb-3">{results.submissions.length} Submission{results.submissions.length !== 1 ? 's' : ''}</h3>
              <div className="space-y-3">
                {results.submissions.map(sub => (
                  <div key={sub.id} data-testid={`tracker-result-${sub.id}`} className="bg-charcoal border border-white/10 p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-cinzel font-bold text-lg text-white">{sub.strain_name}</h4>
                        <p className="text-zinc-500 text-sm">{sub.company_name}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest ${statusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex gap-6 text-xs text-zinc-500">
                      <span>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                      {sub.price_per_gram && <span className="text-gold-500">Price: ${sub.price_per_gram}/g</span>}
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-600 font-mono text-xs">Ref: {sub.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a href="/submit-strain" className="block w-full bg-cannabis-green hover:bg-green-600 text-white text-center font-bold uppercase tracking-widest px-8 py-4 transition-all">
              Submit Another Product
            </a>
          </div>
        )}
      </main>
    </div>
  );
};

// Admin Login Component
const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem('adminToken', response.data.token);
      onLogin(response.data.token);
      toast.success('Admin access granted');
    } catch (err) {
      setError('Invalid admin password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      <div className="bg-charcoal border border-white/10 p-8 max-w-md w-full">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Lock className="w-8 h-8 text-gold-500" />
          <h1 className="font-cinzel font-bold text-2xl text-white">Admin Access</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Admin Password
            </label>
            <input
              data-testid="admin-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            data-testid="admin-login-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all"
          >
            {loading ? 'Verifying...' : 'Access Admin Panel'}
          </button>
        </form>

        <a 
          href="/"
          className="block text-center mt-6 text-zinc-500 hover:text-gold-500 text-sm transition-colors"
        >
          ← Back to Catalog
        </a>
      </div>
    </div>
  );
};

// Admin Page Component
const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [stats, setStats] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsView, setAnalyticsView] = useState('overview'); // overview, users, user-detail, engagement
  const [userActivityReport, setUserActivityReport] = useState([]);
  const [userActivitySort, setUserActivitySort] = useState('login_count');
  const [columnSort, setColumnSort] = useState({ key: 'login_count', dir: 'desc' });

  const handleColumnSort = (key) => {
    setColumnSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedActivityReport = useMemo(() => {
    if (!userActivityReport.length) return [];
    const { key, dir } = columnSort;
    return [...userActivityReport].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      if (key === 'name') { aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); }
      if (key === 'company') { aVal = (a.company || '').toLowerCase(); bVal = (b.company || '').toLowerCase(); }
      if (key === 'last_active') { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [userActivityReport, columnSort]);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [editingStrain, setEditingStrain] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditStrain = (strain) => {
    setEditingStrain(strain.id);
    setEditForm({
      strain_name: strain.strain_name || '',
      type: strain.type || '',
      thc_percentage: strain.thc_percentage || '',
      cbd_percentage: strain.cbd_percentage || '',
      price_tier: strain.price_tier || '$$',
      terpene_profile: Array.isArray(strain.terpene_profile) ? strain.terpene_profile.join(', ') : (strain.terpene_profile || ''),
      lineage: strain.lineage || '',
      lot_size: strain.lot_size || '',
      effects: Array.isArray(strain.effects) ? strain.effects : (typeof strain.effects === 'string' && strain.effects ? strain.effects.split(',').map(e => e.trim()).filter(Boolean) : []),
      grade_a_kg: strain.grade_a_kg || '',
      grade_b_kg: strain.grade_b_kg || '',
      grade_c_kg: strain.grade_c_kg || '',
      harvest_date: strain.harvest_date || '',
      growing_method: strain.growing_method || 'Indoor',
      category: strain.category || 'Dried Flower',
      bc_dd_compliant: strain.bc_dd_compliant || false,
      terpene_percentage: strain.terpene_percentage || '',
      grower_company: strain.grower_company || '',
      grower_name: strain.grower_name || '',
      grower_email: strain.grower_email || ''
    });
  };

  const saveEditStrain = async () => {
    setSavingEdit(true);
    try {
      const payload = {
        ...editForm,
        effects: Array.isArray(editForm.effects) ? editForm.effects : [],
        terpene_profile: editForm.terpene_profile.split(',').map(t => t.trim()).filter(Boolean),
        grade_a_kg: parseFloat(editForm.grade_a_kg) || null,
        grade_b_kg: parseFloat(editForm.grade_b_kg) || null,
        grade_c_kg: parseFloat(editForm.grade_c_kg) || null,
        harvest_date: editForm.harvest_date || null,
        growing_method: editForm.growing_method || null,
        category: editForm.category || null,
        bc_dd_compliant: editForm.bc_dd_compliant || false,
        terpene_percentage: parseFloat(editForm.terpene_percentage) || null,
        grower_company: editForm.grower_company || null,
        grower_name: editForm.grower_name || null,
        grower_email: editForm.grower_email || null
      };
      await axios.put(`${API}/strains/${editingStrain}`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Strain updated');
      setEditingStrain(null);
      fetchStrains(adminToken);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
    setSavingEdit(false);
  };
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('images'); // 'images', 'analytics', 'users', 'flags', 'submissions', 'directory'
  const [flags, setFlags] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [pricePerGram, setPricePerGram] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingSubmission, setProcessingSubmission] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [inventory, setInventory] = useState(null);
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [inquiryFilter, setInquiryFilter] = useState('all');
  const [inquirySearch, setInquirySearch] = useState('');
  const [processingInquiry, setProcessingInquiry] = useState(null);
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [expandedInquiry, setExpandedInquiry] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [editingDirectoryLicense, setEditingDirectoryLicense] = useState(null);
  const [directoryLicenseForm, setDirectoryLicenseForm] = useState({});
  const [affiliates, setAffiliates] = useState([]);
  const [showAddAffiliate, setShowAddAffiliate] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState({ name: '', email: '', phone: '', company: '', referral_code: '' });
  const [editingAffiliate, setEditingAffiliate] = useState(null);
  const [convertingInquiry, setConvertingInquiry] = useState(null);
  const [conversionData, setConversionData] = useState({ sale_amount: '', total_grams: '', commission_type: '', commission_value: '' });

  // Auto-generate referral code from name
  const autoGenerateCode = (name) => {
    if (!name) return '';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) return parts[0] + parts[parts.length - 1].charAt(0);
    return parts[0].slice(0, 8);
  };
  const [selectedAffiliateDetail, setSelectedAffiliateDetail] = useState(null);
  const [conversionForm, setConversionForm] = useState({ inquiry_id: '', sale_amount: '' });

  // Messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [messagesFilter, setMessagesFilter] = useState('all');

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const prevCountsRef = useRef({ messages: 0, inquiries: 0 });

  // Bot Training state
  const [botTraining, setBotTraining] = useState([]);
  const [newTraining, setNewTraining] = useState({ question: '', answer: '', category: 'general' });
  const [editingTraining, setEditingTraining] = useState(null);
  const [adminLists, setAdminLists] = useState([]);
  const [adminListsAnalytics, setAdminListsAnalytics] = useState(null);
  const [loadingAdminLists, setLoadingAdminLists] = useState(false);

  // Settings state
  const [emailsEnabled, setEmailsEnabled] = useState(false);

  // Request notification permission and set up polling
  useEffect(() => {
    if (!isAuthenticated || !adminToken) return;
    
    // Request permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotificationsEnabled(p === 'granted'));
    } else if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Poll for new messages/inquiries every 30 seconds
    const interval = setInterval(async () => {
      try {
        const [msgResp, inqResp] = await Promise.all([
          axios.get(`${API}/admin/contact-messages`, { headers: { Authorization: `Bearer ${adminToken}` } }),
          axios.get(`${API}/admin/inquiries`, { headers: { Authorization: `Bearer ${adminToken}` } })
        ]);
        
        const newMsgCount = msgResp.data.filter(m => m.status === 'unread').length;
        const newInqCount = inqResp.data.filter(i => i.status === 'pending' || i.status === 'new').length;
        const prev = prevCountsRef.current;
        
        if (newMsgCount > prev.messages && prev.messages > 0) {
          playNotificationSound();
          if (notificationsEnabled) {
            new Notification('Firegold - New Message', {
              body: `You have ${newMsgCount} unread message${newMsgCount > 1 ? 's' : ''}`,
              icon: '/firegold_logo_only.png'
            });
          }
          toast.info(`${newMsgCount - prev.messages} new message(s) received`);
        }
        
        if (newInqCount > prev.inquiries && prev.inquiries > 0) {
          playNotificationSound();
          if (notificationsEnabled) {
            new Notification('Firegold - New Inquiry', {
              body: `You have ${newInqCount} pending inquir${newInqCount > 1 ? 'ies' : 'y'}`,
              icon: '/firegold_logo_only.png'
            });
          }
          toast.info(`${newInqCount - prev.inquiries} new inquiry(ies) received`);
        }
        
        prevCountsRef.current = { messages: newMsgCount, inquiries: newInqCount };
        setContactMessages(msgResp.data);
      } catch (err) {
        // Silently fail on polling
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, adminToken, notificationsEnabled]);

  // Sort state for all admin tabs
  const [usersSort, setUsersSort] = useState({ key: 'created_at', dir: 'desc' });
  const [submissionsSort, setSubmissionsSort] = useState({ key: 'created_at', dir: 'desc' });
  const [inquiriesSort, setInquiriesSort] = useState({ key: 'created_at', dir: 'desc' });
  const [directorySort, setDirectorySort] = useState({ key: 'strain_name', dir: 'asc' });
  const [affiliatesSort, setAffiliatesSort] = useState({ key: 'total_referrals', dir: 'desc' });
  const [messagesSort, setMessagesSort] = useState({ key: 'created_at', dir: 'desc' });

  const makeSortHandler = (setter) => (key) => {
    setter(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  };

  const sortData = (data, sortState) => {
    if (!data.length) return [];
    const { key, dir } = sortState;
    return [...data].sort((a, b) => {
      let aVal = a[key]; let bVal = b[key];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase(); }
      if (key.includes('created_at') || key.includes('date') || key === 'last_active') { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
      if (aVal == null) aVal = ''; if (bVal == null) bVal = '';
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortableHeader = ({ columns, sortState, onSort, testPrefix }) => (
    <thead className="bg-zinc-900">
      <tr>
        {columns.map(col => (
          <th
            key={col.key}
            data-testid={`${testPrefix}-sort-${col.key}`}
            onClick={() => onSort(col.key)}
            className={`text-${col.align || 'left'} text-xs uppercase tracking-widest p-4 cursor-pointer select-none transition-colors hover:text-gold-500 ${
              sortState.key === col.key ? 'text-gold-500' : 'text-zinc-500'
            } ${col.className || ''}`}
          >
            {col.label}
            {sortState.key === col.key && (
              <span className="ml-1">{sortState.dir === 'desc' ? '\u25BC' : '\u25B2'}</span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );

  const SortButtons = ({ options, sortState, onSort, testPrefix }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-zinc-500 text-xs uppercase tracking-widest">Sort:</span>
      {options.map(opt => (
        <button
          key={opt.key}
          data-testid={`${testPrefix}-sort-${opt.key}`}
          onClick={() => onSort(opt.key)}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-widest transition-all ${
            sortState.key === opt.key ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          {opt.label}{sortState.key === opt.key ? (sortState.dir === 'desc' ? ' \u25BC' : ' \u25B2') : ''}
        </button>
      ))}
    </div>
  );

  const fetchDirectory = async (token) => {
    try {
      const response = await axios.get(`${API}/admin/strain-directory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDirectory(response.data);
    } catch (error) {
      console.error('Failed to load directory');
    }
  };

  const fetchInventory = async (token) => {
    try {
      const response = await axios.get(`${API}/admin/inventory-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to load inventory');
    }
  };

  const fetchAdminInquiries = async (token) => {
    try {
      const response = await axios.get(`${API}/admin/inquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminInquiries(response.data);
    } catch (error) {
      console.error('Failed to load inquiries');
    }
  };

  const updateInquiryStatus = async (inquiryId, status, notes) => {
    setProcessingInquiry(inquiryId);
    try {
      await axios.put(`${API}/admin/inquiries/${inquiryId}/status`, {
        status,
        admin_notes: notes || null
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`Inquiry marked as ${status}`);
      fetchAdminInquiries(adminToken);
      setInquiryNotes('');
      setExpandedInquiry(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update inquiry');
    }
    setProcessingInquiry(null);
  };

  const fetchUserProfile = async (userId) => {
    setUserProfileLoading(true);
    try {
      const response = await axios.get(`${API}/admin/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSelectedUserProfile(response.data);
    } catch (err) {
      toast.error('Failed to load user profile');
    }
    setUserProfileLoading(false);
  };

  const updateDirectoryLicense = async (strainId) => {
    try {
      await axios.put(`${API}/admin/strain-directory/${strainId}/license`, directoryLicenseForm, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('License info updated');
      setEditingDirectoryLicense(null);
      setDirectoryLicenseForm({});
      fetchDirectory(adminToken);
    } catch (err) {
      toast.error('Failed to update license');
    }
  };

  const fetchAffiliates = async () => {
    try {
      const response = await axios.get(`${API}/admin/affiliates`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setAffiliates(response.data);
    } catch (err) {
      console.error('Failed to load affiliates');
    }
  };

  const fetchContactMessages = async (token) => {
    try {
      const response = await axios.get(`${API}/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${token || adminToken}` }
      });
      setContactMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages');
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await axios.put(`${API}/admin/contact-messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setContactMessages(prev => prev.map(m => m.id === messageId ? {...m, status: 'read'} : m));
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await axios.delete(`${API}/admin/contact-messages/${messageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setContactMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleReplyMessage = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await axios.post(`${API}/admin/contact-messages/${replyingMessage.id}/reply`, 
        { reply_text: replyText },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setContactMessages(prev => prev.map(m => m.id === replyingMessage.id ? {...m, status: 'replied'} : m));
      toast.success('Reply sent to ' + replyingMessage.email);
      setReplyingMessage(null);
      setReplyText('');
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Bot Training CRUD
  const fetchBotTraining = async () => {
    try {
      const resp = await axios.get(`${API}/admin/bot-training`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setBotTraining(resp.data);
    } catch (err) {
      console.error('Failed to load training data');
    }
  };

  const addTrainingEntry = async () => {
    if (!newTraining.question.trim() || !newTraining.answer.trim()) return;
    try {
      const resp = await axios.post(`${API}/admin/bot-training`, newTraining, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setBotTraining(prev => [...prev, resp.data]);
      setNewTraining({ question: '', answer: '', category: 'general' });
      toast.success('Training entry added');
    } catch (err) {
      toast.error('Failed to add entry');
    }
  };

  const updateTrainingEntry = async (entry) => {
    try {
      await axios.put(`${API}/admin/bot-training/${entry.id}`, {
        question: entry.question,
        answer: entry.answer,
        category: entry.category
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      setBotTraining(prev => prev.map(e => e.id === entry.id ? entry : e));
      setEditingTraining(null);
      toast.success('Training entry updated');
    } catch (err) {
      toast.error('Failed to update entry');
    }
  };

  const deleteTrainingEntry = async (entryId) => {
    if (!window.confirm('Delete this training entry?')) return;
    try {
      await axios.delete(`${API}/admin/bot-training/${entryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setBotTraining(prev => prev.filter(e => e.id !== entryId));
      toast.success('Entry deleted');
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  // Settings
  const fetchSettings = async (token) => {
    try {
      const resp = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token || adminToken}` }
      });
      setEmailsEnabled(resp.data.emails_enabled || false);
    } catch (err) {
      console.error('Failed to load settings');
    }
  };

  // Saved Lists (Admin)
  const fetchAdminLists = async () => {
    setLoadingAdminLists(true);
    try {
      const [listsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/admin/lists`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        axios.get(`${API}/admin/lists/analytics`, { headers: { Authorization: `Bearer ${adminToken}` } })
      ]);
      setAdminLists(listsRes.data);
      setAdminListsAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load admin lists:', err);
    }
    setLoadingAdminLists(false);
  };

  const toggleEmails = async () => {
    const newValue = !emailsEnabled;
    try {
      await axios.put(`${API}/admin/settings`, 
        { emails_enabled: newValue },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setEmailsEnabled(newValue);
      toast.success(newValue ? 'Emails ENABLED — notifications will be sent' : 'Emails DISABLED — no notifications will be sent');
    } catch (err) {
      toast.error('Failed to update setting');
    }
  };

  const createAffiliate = async () => {
    try {
      await axios.post(`${API}/admin/affiliates`, affiliateForm, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`Affiliate ${affiliateForm.referral_code.toUpperCase()} created`);
      setShowAddAffiliate(false);
      setAffiliateForm({ name: '', email: '', phone: '', company: '', referral_code: '' });
      fetchAffiliates();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create affiliate');
    }
  };

  const fetchAffiliateDetail = async (affiliateId) => {
    try {
      const response = await axios.get(`${API}/admin/affiliates/${affiliateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSelectedAffiliateDetail(response.data);
    } catch (err) {
      toast.error('Failed to load affiliate details');
    }
  };

  const saveAffiliateEdit = async () => {
    if (!editingAffiliate) return;
    try {
      await axios.put(`${API}/admin/affiliates/${editingAffiliate.id}`, editingAffiliate, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Affiliate updated');
      setEditingAffiliate(null);
      fetchAffiliates();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const recordConversion = async () => {
    if (!convertingInquiry) return;
    try {
      const res = await axios.post(`${API}/admin/inquiries/${convertingInquiry.id}/convert`, {
        sale_amount: parseFloat(conversionData.sale_amount),
        total_grams: parseFloat(conversionData.total_grams) || 0,
        commission_type: conversionData.commission_type || null,
        commission_value: conversionData.commission_value ? parseFloat(conversionData.commission_value) : null
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(res.data.message);
      setConvertingInquiry(null);
      setConversionData({ sale_amount: '', total_grams: '', commission_type: '', commission_value: '' });
      fetchAffiliates();
      fetchAdminInquiries(adminToken);
      if (selectedAffiliateDetail) fetchAffiliateDetail(selectedAffiliateDetail.affiliate.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record conversion');
    }
  };

  const markCommissionPaid = async (eventId) => {
    try {
      await axios.put(`${API}/admin/referrals/${eventId}/paid`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Commission marked as paid');
      if (selectedAffiliateDetail) fetchAffiliateDetail(selectedAffiliateDetail.affiliate.id);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleCoaUpload = async (strainId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('coa', file);
    try {
      await axios.put(`${API}/strains/${strainId}/coa`, formData, {
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('COA uploaded — now live for users');
      fetchStrains(adminToken);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload COA');
    }
  };

  const handleRemoveCoa = async (strainId) => {
    try {
      await axios.delete(`${API}/strains/${strainId}/coa`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('COA removed');
      fetchStrains(adminToken);
    } catch (err) {
      toast.error('Failed to remove COA');
    }
  };
  const [showAddStrain, setShowAddStrain] = useState(false);
  const [newStrain, setNewStrain] = useState({
    strain_name: '',
    type: 'Balanced Hybrid',
    thc_percentage: '',
    price_tier: '$$',
    terpene_profile: '',
    lineage: '',
    lot_size: '',
    effects: [],
    bc_dd_compliant: false,
    terpene_percentage: '',
    category: 'Dried Flower'
  });
  const [newStrainImage, setNewStrainImage] = useState(null);
  const [addingStrain, setAddingStrain] = useState(false);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('adminToken');
    if (token) {
      verifyToken(token);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminToken(token);
      setIsAuthenticated(true);
      fetchStrains(token);
      fetchStats(token);
    } catch (err) {
      localStorage.removeItem('adminToken');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = (token) => {
    setAdminToken(token);
    setIsAuthenticated(true);
    fetchStrains(token);
    fetchStats(token);
    fetchAnalytics(token);
    fetchUsers(token);
    fetchFlags(token);
    fetchSubmissions(token);
    fetchInventory(token);
    fetchAdminInquiries(token);
    fetchContactMessages(token);
    fetchSettings(token);
    
    // Set baseline counts for notifications
    Promise.all([
      axios.get(`${API}/admin/contact-messages`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/admin/inquiries`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([msgResp, inqResp]) => {
      prevCountsRef.current = {
        messages: msgResp.data.filter(m => m.status === 'unread').length,
        inquiries: inqResp.data.filter(i => i.status === 'pending' || i.status === 'new').length
      };
    }).catch(() => {});
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/admin/logout`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (err) {
      // Ignore errors
    }
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setIsAuthenticated(false);
    toast.success('Logged out');
  };

  const fetchStrains = async (token) => {
    try {
      // Admin fetches strains without user token (public endpoint still works for admin)
      const response = await axios.get(`${API}/strains/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStrains(response.data);
    } catch (error) {
      toast.error('Failed to load strains');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token) => {
    try {
      const response = await axios.get(`${API}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const fetchAnalytics = async (token) => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics');
    }
  };

  const fetchUserActivityReport = async (sortBy) => {
    setLoadingReport(true);
    try {
      const response = await axios.get(`${API}/analytics/users-report?sort_by=${sortBy}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setUserActivityReport(response.data);
    } catch (error) {
      console.error('Failed to load user activity');
    }
    setLoadingReport(false);
  };

  const fetchUserDetail = async (userId) => {
    setLoadingReport(true);
    try {
      const response = await axios.get(`${API}/analytics/user/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSelectedUserDetail(response.data);
      setAnalyticsView('user-detail');
    } catch (error) {
      toast.error('Failed to load user details');
    }
    setLoadingReport(false);
  };

  const fetchEngagement = async () => {
    setLoadingReport(true);
    try {
      const response = await axios.get(`${API}/analytics/engagement?days=30`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setEngagementData(response.data);
    } catch (error) {
      console.error('Failed to load engagement data');
    }
    setLoadingReport(false);
  };

  const fetchGlobalInsights = async () => {
    setLoadingReport(true);
    try {
      const response = await axios.get(`${API}/analytics/global`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setGlobalData(response.data);
    } catch (error) {
      console.error('Failed to load global insights');
    }
    setLoadingReport(false);
  };

  const exportUserActivityCSV = async () => {
    try {
      const response = await axios.get(`${API}/analytics/users-export/csv`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'firegold_user_activity.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('User activity report exported');
    } catch { toast.error('Export failed'); }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const fetchUsers = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const fetchFlags = async (token) => {
    try {
      const response = await axios.get(`${API}/analytics/flags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlags(response.data);
    } catch (error) {
      console.error('Failed to load flags');
    }
  };

  const fetchSubmissions = async (token) => {
    try {
      const response = await axios.get(`${API}/grower/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to load submissions');
    }
  };

  const handleSubmissionAction = async (submissionId, status) => {
    setProcessingSubmission(true);
    try {
      const body = {
        status,
        admin_notes: adminNotes || null,
        admin_price_per_gram: pricePerGram || null
      };
      await axios.put(`${API}/grower/submissions/${submissionId}/status`, body, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`Submission ${status}${status === 'approved' ? ' — strain added to catalog' : ''}`);
      setReviewingSubmission(null);
      setPricePerGram('');
      setAdminNotes('');
      fetchSubmissions(adminToken);
      if (status === 'approved') {
        fetchStrains(adminToken);
        fetchStats(adminToken);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${status} submission`);
    } finally {
      setProcessingSubmission(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    submissionFilter === 'all' ? true : s.status === submissionFilter
  );
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const exportCSV = async (type) => {
    const endpoint = type === 'analytics' ? '/analytics/export/csv?days=30' : '/users/export/csv';
    try {
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'analytics' ? 'firegold_analytics.csv' : 'firegold_users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type === 'analytics' ? 'Analytics' : 'Users'} exported to CSV`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleAddStrain = async (e) => {
    e.preventDefault();
    if (!newStrainImage) {
      toast.error('Please upload a strain image');
      return;
    }
    
    setAddingStrain(true);
    
    try {
      // First create the strain
      const strainData = {
        ...newStrain,
        terpene_profile: newStrain.terpene_profile.split(',').map(t => t.trim()).filter(t => t)
      };
      
      const createResponse = await axios.post(`${API}/strains/admin/create`, strainData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const strainId = createResponse.data.id;
      
      // Then upload the image
      const formData = new FormData();
      formData.append('image', newStrainImage);
      
      await axios.put(`${API}/strains/${strainId}/image`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      toast.success(`${newStrain.strain_name} added successfully!`);
      
      // Reset form
      setNewStrain({
        strain_name: '',
        type: 'Balanced Hybrid',
        thc_percentage: '',
        price_tier: '$$',
        terpene_profile: '',
        lineage: '',
        lot_size: '',
        effects: []
      });
      setNewStrainImage(null);
      setShowAddStrain(false);
      setActiveTab('images');
      fetchStrains(adminToken);
      fetchStats(adminToken);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add strain');
    } finally {
      setAddingStrain(false);
    }
  };

  const confirmDeleteStrain = async (strainId, strainName) => {
    if (!window.confirm(`Are you sure you want to remove "${strainName}" from the catalog?\n\nThis action cannot be undone.`)) return;
    
    try {
      await axios.delete(`${API}/strains/${strainId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`${strainName} removed from catalog`);
      fetchStrains(adminToken);
      fetchStats(adminToken);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
      } else {
        toast.error('Failed to remove strain');
      }
    }
  };

  const handleImageUpload = async (strainId, file) => {
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    setUploadingId(strainId);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await axios.put(`${API}/strains/${strainId}/image`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      toast.success('Image updated successfully');
      fetchStrains(adminToken);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
      } else {
        toast.error('Failed to update image');
      }
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteStrain = async (strainId, strainName) => {
    if (!window.confirm(`Are you sure you want to delete "${strainName}"?`)) return;
    
    try {
      await axios.delete(`${API}/strains/${strainId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Strain deleted');
      fetchStrains(adminToken);
      fetchStats(adminToken);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
      } else {
        toast.error('Failed to delete strain');
      }
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-gold-500">Verifying access...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div data-testid="admin-page" className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Catalog</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-cannabis-green" />
          <Settings className="w-6 h-6 text-gold-500" />
          <span className="font-cinzel font-bold text-xl text-white">Admin Panel</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleEmails}
            data-testid="email-toggle-btn"
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border ${
              emailsEnabled 
                ? 'bg-cannabis-green/20 border-cannabis-green/40 text-cannabis-green' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title={emailsEnabled ? 'Click to disable all outbound emails' : 'Click to enable outbound emails'}
          >
            <Mail className="w-4 h-4" />
            Emails: {emailsEnabled ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={handleLogout}
          data-testid="admin-logout-btn"
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-charcoal border border-white/5 p-6">
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total Strains</div>
              <div className="text-4xl font-bold text-white font-mono">{stats.total_strains}</div>
            </div>
            <div className="bg-charcoal border border-white/5 p-6">
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Inquiries</div>
              <div className="text-4xl font-bold text-gold-500 font-mono">{stats.total_inquiries}</div>
            </div>
            <div className="bg-charcoal border border-white/5 p-6">
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Sample Requests</div>
              <div className="text-4xl font-bold text-cannabis-green font-mono">{stats.total_sample_requests}</div>
            </div>
            <div className="bg-charcoal border border-white/5 p-6">
              <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Registered Users</div>
              <div className="text-4xl font-bold text-purple-400 font-mono">{users.length}</div>
            </div>
          </div>
        )}

        {/* Total Inventory Summary */}
        {inventory && inventory.total_inventory_kg > 0 && (
          <div data-testid="inventory-summary" className="mb-12 bg-charcoal border border-gold-500/20 p-6">
            <div className="flex items-center gap-3 mb-5">
              <Package className="w-5 h-5 text-gold-500" />
              <h2 className="font-cinzel font-bold text-lg text-white">Total Inventory</h2>
              <span className="ml-auto bg-gold-500/10 text-gold-500 text-xs font-bold px-3 py-1 font-mono">
                {inventory.total_inventory_kg.toFixed(1)} kg total
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-4 text-center">
                <div className="text-cannabis-green font-bold text-3xl font-mono">{inventory.total_grade_a.toFixed(1)}</div>
                <div className="text-cannabis-green/70 text-xs uppercase tracking-widest mt-1">Grade A (Bigs) (kg)</div>
              </div>
              <div className="bg-gold-500/10 border border-gold-500/30 p-4 text-center">
                <div className="text-gold-500 font-bold text-3xl font-mono">{inventory.total_grade_b.toFixed(1)}</div>
                <div className="text-gold-500/70 text-xs uppercase tracking-widest mt-1">Grade B (Mids) (kg)</div>
              </div>
              <div className="bg-zinc-700/20 border border-zinc-600/30 p-4 text-center">
                <div className="text-zinc-400 font-bold text-3xl font-mono">{inventory.total_grade_c.toFixed(1)}</div>
                <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Grade C (Smalls) (kg)</div>
              </div>
            </div>
            <p className="text-zinc-600 text-xs mt-3">{inventory.strains_with_grades} of {inventory.total_strains} strains have grade data</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'images' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4 inline mr-2" />Images
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'analytics' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            data-testid="admin-tab-users"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'users' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />Users
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all relative ${
              activeTab === 'flags' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 inline mr-2" />Flags
            {flags.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {flags.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('submissions'); fetchSubmissions(adminToken); }}
            data-testid="admin-tab-submissions"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all relative ${
              activeTab === 'submissions' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />Submissions
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cannabis-green text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('directory'); fetchDirectory(adminToken); }}
            data-testid="admin-tab-directory"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'directory' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />Directory
          </button>
          <button
            onClick={() => { setActiveTab('inquiries'); fetchAdminInquiries(adminToken); }}
            data-testid="admin-tab-inquiries"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all relative ${
              activeTab === 'inquiries' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />Inquiries
            {adminInquiries.filter(i => i.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {adminInquiries.filter(i => i.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('affiliates'); fetchAffiliates(); }}
            data-testid="admin-tab-affiliates"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'affiliates' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />Affiliates
          </button>
          <button
            onClick={() => { setActiveTab('messages'); fetchContactMessages(); }}
            data-testid="admin-tab-messages"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all relative ${
              activeTab === 'messages' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />Messages
            {contactMessages.filter(m => m.status === 'unread').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {contactMessages.filter(m => m.status === 'unread').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('bot-training'); fetchBotTraining(); }}
            data-testid="admin-tab-bot-training"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'bot-training' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 inline mr-2" />Bot Training
          </button>
          <button
            onClick={() => { setActiveTab('saved-lists'); fetchAdminLists(); }}
            data-testid="admin-tab-saved-lists"
            className={`px-6 py-2 font-bold uppercase tracking-widest text-sm transition-all ${
              activeTab === 'saved-lists' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 inline mr-2" />User Lists
          </button>
        </div>
        {/* Affiliates Tab */}
        {activeTab === 'affiliates' && (
          <>
            {/* Affiliate Detail Modal */}
            {selectedAffiliateDetail && (
              <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedAffiliateDetail(null)}>
                <div className="bg-charcoal border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="sticky top-0 bg-charcoal border-b border-white/5 p-6 flex justify-between items-start z-10">
                    <div>
                      <h2 className="font-cinzel font-bold text-2xl text-white">{selectedAffiliateDetail.affiliate.name}</h2>
                      <p className="text-gold-500 font-mono text-sm">Code: {selectedAffiliateDetail.affiliate.referral_code} &middot; {selectedAffiliateDetail.affiliate.commission_rate}% commission</p>
                    </div>
                    <button onClick={() => setSelectedAffiliateDetail(null)} className="w-10 h-10 bg-gold-500 text-black hover:bg-gold-400 flex items-center justify-center transition-all">
                      <X className="w-5 h-5 text-black" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Referrals', value: selectedAffiliateDetail.stats.total_referrals },
                        { label: 'Conversions', value: selectedAffiliateDetail.stats.total_conversions },
                        { label: 'Revenue', value: `$${selectedAffiliateDetail.stats.total_revenue.toLocaleString()}` },
                        { label: 'Commission', value: `$${selectedAffiliateDetail.stats.total_commission.toLocaleString()}` },
                      ].map(s => (
                        <div key={s.label} className="bg-zinc-900 border border-white/5 p-4 text-center">
                          <p className="text-2xl font-bold text-white">{s.value}</p>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gold-500/10 border border-gold-500/30 p-4 text-center">
                        <p className="text-xl font-bold text-gold-500">${selectedAffiliateDetail.stats.pending_commission.toLocaleString()}</p>
                        <p className="text-gold-500/60 text-xs uppercase">Pending Payout</p>
                      </div>
                      <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-4 text-center">
                        <p className="text-xl font-bold text-cannabis-green">${selectedAffiliateDetail.stats.paid_commission.toLocaleString()}</p>
                        <p className="text-cannabis-green/60 text-xs uppercase">Paid Out</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Referral Events</h3>
                      {selectedAffiliateDetail.events.length === 0 ? (
                        <p className="text-zinc-600 text-sm">No events yet</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedAffiliateDetail.events.map((evt, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${evt.event_type === 'conversion' ? 'bg-cannabis-green/20 text-cannabis-green' : 'bg-gold-500/20 text-gold-500'}`}>{evt.event_type}</span>
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${evt.status === 'paid' ? 'bg-cannabis-green/20 text-cannabis-green' : 'bg-zinc-700/30 text-zinc-400'}`}>{evt.status}</span>
                                </div>
                                <p className="text-zinc-300 text-sm">{evt.referred_user ? `${evt.referred_user.first_name} ${evt.referred_user.last_name} (${evt.referred_user.company})` : evt.referred_email || 'Unknown'}</p>
                                {evt.sale_amount > 0 && <p className="text-zinc-500 text-xs">Sale: ${evt.sale_amount.toLocaleString()} &middot; Commission: ${evt.commission_amount?.toLocaleString()}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-600 text-xs">{evt.created_at ? new Date(evt.created_at).toLocaleDateString() : ''}</span>
                                {evt.event_type === 'conversion' && evt.status === 'pending' && (
                                  <button onClick={() => markCommissionPaid(evt.id)} className="bg-cannabis-green/20 hover:bg-cannabis-green/30 text-cannabis-green text-xs font-bold uppercase px-3 py-1.5 transition-colors">Mark Paid</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span>Shareable link:</span>
                      <code className="bg-zinc-900 border border-white/10 px-3 py-1 text-gold-500 font-mono text-xs">{window.location.origin}?ref={selectedAffiliateDetail.affiliate.referral_code}</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Affiliate Program</h2>
                <p className="text-zinc-500 text-sm">{affiliates.length} affiliates</p>
              </div>
              <button data-testid="add-affiliate-btn" onClick={() => setShowAddAffiliate(true)} className="bg-gold-500 hover:bg-gold-400 text-black px-5 py-2 font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Affiliate
              </button>
            </div>
            {showAddAffiliate && (
              <div className="bg-charcoal border border-gold-500/30 p-6 mb-8">
                <h3 className="font-manrope font-bold text-sm uppercase tracking-widest text-gold-500 mb-4">New Affiliate</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <input data-testid="affiliate-name" type="text" value={affiliateForm.name} onChange={e => { const name = e.target.value; setAffiliateForm(p => ({...p, name, referral_code: p.referral_code || autoGenerateCode(name)})); }} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="Full Name *" />
                  <input data-testid="affiliate-email" type="email" value={affiliateForm.email} onChange={e => setAffiliateForm(p => ({...p, email: e.target.value}))} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="Email *" />
                  <input data-testid="affiliate-phone" type="text" value={affiliateForm.phone} onChange={e => setAffiliateForm(p => ({...p, phone: e.target.value}))} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="Phone" />
                  <input data-testid="affiliate-company" type="text" value={affiliateForm.company} onChange={e => setAffiliateForm(p => ({...p, company: e.target.value}))} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="Company" />
                  <div className="relative">
                    <input data-testid="affiliate-code" type="text" value={affiliateForm.referral_code} onChange={e => setAffiliateForm(p => ({...p, referral_code: e.target.value.toUpperCase()}))} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-12 px-4 outline-none font-mono uppercase w-full" placeholder="Code (auto-generated)" />
                    {affiliateForm.name && !affiliateForm.referral_code && (
                      <button onClick={() => setAffiliateForm(p => ({...p, referral_code: autoGenerateCode(p.name)}))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gold-500 text-xs hover:underline">Generate</button>
                    )}
                  </div>
                </div>
                <p className="text-zinc-500 text-xs mt-1">Commission will be set per-deal when converting inquiries to sales.</p>
                <div className="flex gap-3 mt-3">
                  <button data-testid="save-affiliate-btn" onClick={createAffiliate} className="bg-gold-500 hover:bg-gold-400 text-black px-6 py-2 font-bold uppercase tracking-widest text-xs transition-colors">Create</button>
                  <button onClick={() => setShowAddAffiliate(false)} className="bg-zinc-700 text-white px-6 py-2 text-xs uppercase tracking-widest">Cancel</button>
                </div>
              </div>
            )}
            {affiliates.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400">No affiliates yet</p>
                <p className="text-zinc-600 text-sm mt-1">Click "Add Affiliate" to start the referral program</p>
              </div>
            ) : (
              <>
              <SortButtons
                testPrefix="affiliates"
                sortState={affiliatesSort}
                onSort={makeSortHandler(setAffiliatesSort)}
                options={[
                  { key: 'name', label: 'Name' },
                  { key: 'total_referrals', label: 'Referrals' },
                  { key: 'total_conversions', label: 'Sales' },
                  { key: 'total_commission', label: 'Commission' },
                  { key: 'created_at', label: 'Date Added' },
                ]}
              />
              <div className="space-y-4 mt-4">
                {sortData(affiliates, affiliatesSort).map(aff => (
                  <div key={aff.id} className="bg-charcoal border border-white/5 hover:border-gold-500/30 transition-colors p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <button onClick={() => fetchAffiliateDetail(aff.id)} className="text-gold-500 hover:text-gold-400 hover:underline font-bold text-base transition-colors">{aff.name}</button>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${aff.is_active ? 'bg-cannabis-green/20 text-cannabis-green' : 'bg-red-500/20 text-red-500'}`}>{aff.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-zinc-400 text-sm flex-wrap">
                          <span className="font-mono text-gold-500/70">?ref={aff.referral_code}</span>
                          <span>{aff.email}</span>
                          {aff.phone && <span>{aff.phone}</span>}
                          {aff.company && <span className="text-zinc-300">{aff.company}</span>}
                          <span className="bg-zinc-800 px-2 py-0.5 text-xs font-mono">
                            {(aff.commission_type || 'per_gram') === 'per_gram' ? `$${aff.commission_value ?? 0.03}/gram` : (aff.commission_type || 'per_gram') === 'percentage' ? `${aff.commission_value ?? 5}%` : `$${aff.commission_value ?? 500} flat`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center"><p className="text-white font-bold text-lg">{aff.total_referrals}</p><p className="text-zinc-600 text-[10px] uppercase">Referrals</p></div>
                        <div className="text-center"><p className="text-cannabis-green font-bold text-lg">{aff.total_conversions}</p><p className="text-zinc-600 text-[10px] uppercase">Sales</p></div>
                        <div className="text-center"><p className="text-gold-500 font-bold text-lg">${aff.total_commission.toLocaleString()}</p><p className="text-zinc-600 text-[10px] uppercase">Commission</p></div>
                        <button onClick={async () => { await axios.put(`${API}/admin/affiliates/${aff.id}/toggle`, {}, { headers: { Authorization: `Bearer ${adminToken}` } }); fetchAffiliates(); }}
                          className={`text-xs font-bold uppercase px-3 py-1.5 transition-colors ${aff.is_active ? 'bg-yellow-500/20 text-yellow-500' : 'bg-cannabis-green/20 text-cannabis-green'}`}>
                          {aff.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setEditingAffiliate({...aff})} data-testid={`edit-affiliate-${aff.id}`}
                          className="text-xs font-bold uppercase px-3 py-1.5 bg-gold-500/20 text-gold-500 transition-colors hover:bg-gold-500/30">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </>
        )}

        {activeTab === 'images' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Strain Management</h2>
                <p className="text-zinc-500 text-sm">Add new strains, update images, or remove discontinued products</p>
              </div>
              <button
                onClick={() => setShowAddStrain(true)}
                className="bg-cannabis-green hover:bg-green-600 text-white px-6 py-3 font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-colors"
              >
                <span className="text-xl">+</span> Add New Strain
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-square bg-charcoal animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {strains.map((strain) => (
                  <div 
                    key={strain.id} 
                    className="bg-charcoal border border-white/5 hover:border-gold-500/50 transition-all group relative"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={strain.image_url}
                        alt={strain.strain_name}
                        className="w-full h-full object-cover"
                      />
                      
                      <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => handleImageUpload(strain.id, e.target.files[0])}
                          disabled={uploadingId === strain.id}
                        />
                        {uploadingId === strain.id ? (
                          <div className="text-gold-500">Uploading...</div>
                        ) : (
                          <>
                            <Image className="w-8 h-8 text-gold-500" />
                            <span className="text-white text-xs">Change Image</span>
                          </>
                        )}
                      </label>
                    </div>
                    
                    <div className="p-3">
                      <div className="font-semibold text-white text-sm truncate">{strain.strain_name}</div>
                      <div className="text-zinc-500 text-xs truncate">{strain.type}</div>
                      {strain.grower_company && (
                        <div className="text-gold-500/70 text-[10px] truncate mt-0.5">Grower: {strain.grower_company}</div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gold-500 font-mono text-xs">{strain.price_tier}</span>
                        <span className="text-zinc-600 text-xs">{strain.thc_percentage}</span>
                      </div>
                      {/* COA Management */}
                      <div className="mt-2 pt-2 border-t border-white/5">
                        {strain.coa_url ? (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-cannabis-green text-xs font-bold">
                              <FileText className="w-3 h-3" /> COA Live
                            </span>
                            <button
                              onClick={() => handleRemoveCoa(strain.id)}
                              data-testid={`remove-coa-${strain.id}`}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1 cursor-pointer text-zinc-500 hover:text-gold-500 text-xs transition-colors">
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              data-testid={`upload-coa-${strain.id}`}
                              onChange={(e) => handleCoaUpload(strain.id, e.target.files[0])}
                            />
                            <Upload className="w-3 h-3" />
                            Upload COA
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Action buttons - visible on hover */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openEditStrain(strain)}
                        data-testid={`edit-strain-${strain.id}`}
                        className="w-8 h-8 bg-gold-500/90 hover:bg-gold-500 rounded flex items-center justify-center"
                        title="Edit strain details"
                      >
                        <Edit2 className="w-4 h-4 text-black" />
                      </button>
                      <button
                        onClick={() => confirmDeleteStrain(strain.id, strain.strain_name)}
                        className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded flex items-center justify-center"
                        title="Remove strain"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Edit Strain Modal */}
        {editingStrain && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-charcoal border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="font-cinzel font-bold text-2xl text-white">Edit Strain</h2>
                  <button onClick={() => setEditingStrain(null)} className="w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all">
                    <X className="w-6 h-6 text-black" />
                  </button>
                </div>

                <div className="space-y-4" data-testid="edit-strain-form">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Strain Name *</label>
                      <input data-testid="edit-strain-name" type="text" value={editForm.strain_name}
                        onChange={e => setEditForm(p => ({...p, strain_name: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Type *</label>
                      <select data-testid="edit-strain-type" value={editForm.type}
                        onChange={e => setEditForm(p => ({...p, type: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none">
                        <option value="Balanced Hybrid">Balanced Hybrid</option>
                        <option value="Hybrid, Indica Leaning">Hybrid, Indica Leaning</option>
                        <option value="Hybrid, Sativa Leaning">Hybrid, Sativa Leaning</option>
                        <option value="Indica Dominant">Indica Dominant</option>
                        <option value="Sativa Dominant">Sativa Dominant</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">THC % *</label>
                      <input data-testid="edit-strain-thc" type="text" value={editForm.thc_percentage}
                        onChange={e => setEditForm(p => ({...p, thc_percentage: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">CBD %</label>
                      <input data-testid="edit-strain-cbd" type="text" value={editForm.cbd_percentage}
                        onChange={e => setEditForm(p => ({...p, cbd_percentage: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Terpene %</label>
                      <input data-testid="edit-strain-terpene-pct" type="number" step="0.1" min="0" value={editForm.terpene_percentage}
                        onChange={e => setEditForm(p => ({...p, terpene_percentage: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="e.g., 3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Price Tier *</label>
                      <select data-testid="edit-strain-tier" value={editForm.price_tier}
                        onChange={e => setEditForm(p => ({...p, price_tier: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none">
                        <option value="$">$</option>
                        <option value="$$">$$</option>
                        <option value="$$$">$$$</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Category</label>
                      <select data-testid="edit-strain-category" value={editForm.category}
                        onChange={e => setEditForm(p => ({...p, category: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none">
                        <option value="Dried Flower">Dried Flower</option>
                        <option value="Fresh Frozen">Fresh Frozen</option>
                        <option value="Trim">Trim</option>
                        <option value="Concentrates">Concentrates</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-3 cursor-pointer" data-testid="edit-strain-bc-dd">
                        <input type="checkbox" checked={editForm.bc_dd_compliant}
                          onChange={e => setEditForm(p => ({...p, bc_dd_compliant: e.target.checked}))}
                          className="w-5 h-5 accent-gold-500" />
                        <span className="text-white font-bold text-xs uppercase tracking-widest">BC DD Compliant</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Terpene Profile (comma-separated) *</label>
                    <input data-testid="edit-strain-terpenes" type="text" value={editForm.terpene_profile}
                      onChange={e => setEditForm(p => ({...p, terpene_profile: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                      placeholder="Limonene, Caryophyllene, Myrcene" />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Lineage / Genetics *</label>
                    <input data-testid="edit-strain-lineage" type="text" value={editForm.lineage}
                      onChange={e => setEditForm(p => ({...p, lineage: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Lot Size *</label>
                      <input data-testid="edit-strain-lot" type="text" value={editForm.lot_size}
                        onChange={e => setEditForm(p => ({...p, lot_size: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                        placeholder="e.g., 50 kg" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Effects</label>
                      <EffectsMultiSelect
                        selected={Array.isArray(editForm.effects) ? editForm.effects : (editForm.effects ? editForm.effects.split(',').map(e => e.trim()).filter(Boolean) : [])}
                        onChange={(effects) => setEditForm(p => ({...p, effects}))}
                        testId="edit-strain-effects"
                      />
                    </div>
                  </div>

                  {/* Grade Breakdown */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gold-500 mb-2 font-bold">Grade Breakdown (kg)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Grade A (Bigs)</label>
                        <input data-testid="edit-strain-grade-a" type="number" min="0" step="0.1" value={editForm.grade_a_kg}
                          onChange={e => setEditForm(p => ({...p, grade_a_kg: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Grade B (Mids)</label>
                        <input data-testid="edit-strain-grade-b" type="number" min="0" step="0.1" value={editForm.grade_b_kg}
                          onChange={e => setEditForm(p => ({...p, grade_b_kg: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Grade C (Smalls)</label>
                        <input data-testid="edit-strain-grade-c" type="number" min="0" step="0.1" value={editForm.grade_c_kg}
                          onChange={e => setEditForm(p => ({...p, grade_c_kg: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="0" />
                      </div>
                    </div>
                  </div>

                  {/* Harvest Date */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Harvest Date</label>
                    <input data-testid="edit-strain-harvest-date" type="date" value={editForm.harvest_date}
                      onChange={e => setEditForm(p => ({...p, harvest_date: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" />
                  </div>

                  {/* Growing Method */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Growing Method</label>
                    <select data-testid="edit-strain-growing-method" value={editForm.growing_method}
                      onChange={e => setEditForm(p => ({...p, growing_method: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none">
                      <option value="Indoor">Indoor</option>
                      <option value="Greenhouse">Greenhouse</option>
                      <option value="Outdoor">Outdoor</option>
                    </select>
                  </div>

                  {/* Grower Info (Admin Only) */}
                  <div className="col-span-2 border-t border-white/10 pt-4 mt-2">
                    <label className="block text-xs uppercase tracking-widest text-gold-500 mb-3 font-bold">Grower Information</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Company</label>
                        <input data-testid="edit-strain-grower-company" type="text" value={editForm.grower_company}
                          onChange={e => setEditForm(p => ({...p, grower_company: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-10 px-3 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Contact Name</label>
                        <input data-testid="edit-strain-grower-name" type="text" value={editForm.grower_name}
                          onChange={e => setEditForm(p => ({...p, grower_name: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-10 px-3 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Email</label>
                        <input data-testid="edit-strain-grower-email" type="email" value={editForm.grower_email}
                          onChange={e => setEditForm(p => ({...p, grower_email: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-10 px-3 text-sm outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      data-testid="save-edit-strain-btn"
                      onClick={saveEditStrain}
                      disabled={savingEdit || !editForm.strain_name}
                      className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditingStrain(null)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase tracking-widest px-8 py-4 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Strain Modal */}
        {showAddStrain && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-charcoal border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Add New Strain</h2>
                    <p className="text-zinc-400 text-sm">Fill in all details for the new cultivar</p>
                  </div>
                  <button 
                    onClick={() => setShowAddStrain(false)}
                    className="w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>

                <form onSubmit={handleAddStrain} className="space-y-6">
                  {/* Strain Name */}
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                      Strain Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStrain.strain_name}
                      onChange={(e) => setNewStrain(prev => ({ ...prev, strain_name: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                      placeholder="e.g., Blue Dream"
                    />
                  </div>

                  {/* Type and THC */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Type *
                      </label>
                      <select
                        value={newStrain.type}
                        onChange={(e) => setNewStrain(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 transition-colors outline-none"
                      >
                        <option value="Balanced Hybrid">Balanced Hybrid</option>
                        <option value="Hybrid, Indica Leaning">Hybrid, Indica Leaning</option>
                        <option value="Hybrid, Sativa Leaning">Hybrid, Sativa Leaning</option>
                        <option value="Indica Dominant">Indica Dominant</option>
                        <option value="Sativa Dominant">Sativa Dominant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        THC % *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStrain.thc_percentage}
                        onChange={(e) => setNewStrain(prev => ({ ...prev, thc_percentage: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                        placeholder="e.g., 28.5%"
                      />
                    </div>
                  </div>

                  {/* Price Tier and Lot Size */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Price Tier *
                      </label>
                      <select
                        value={newStrain.price_tier}
                        onChange={(e) => setNewStrain(prev => ({ ...prev, price_tier: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 transition-colors outline-none"
                      >
                        <option value="$">$ - Value</option>
                        <option value="$$">$$ - Standard</option>
                        <option value="$$$">$$$ - Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Lot Size / Availability *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStrain.lot_size}
                        onChange={(e) => setNewStrain(prev => ({ ...prev, lot_size: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                        placeholder="e.g., 35 kg or In Harvest"
                      />
                    </div>
                  </div>

                  {/* Lineage */}
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                      Lineage *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStrain.lineage}
                      onChange={(e) => setNewStrain(prev => ({ ...prev, lineage: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                      placeholder="e.g., Blueberry x Haze"
                    />
                  </div>

                  {/* Terpenes */}
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                      Terpene Profile (comma separated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStrain.terpene_profile}
                      onChange={(e) => setNewStrain(prev => ({ ...prev, terpene_profile: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                      placeholder="e.g., Limonene, Caryophyllene, Myrcene"
                    />
                  </div>

                  {/* Effects */}
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                      Effects *
                    </label>
                    <EffectsMultiSelect
                      selected={Array.isArray(newStrain.effects) ? newStrain.effects : []}
                      onChange={(effects) => setNewStrain(prev => ({ ...prev, effects }))}
                      testId="add-strain-effects"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                      Strain Image * (Black background recommended)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={(e) => setNewStrainImage(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full border-2 border-dashed ${newStrainImage ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-6 transition-colors text-center`}>
                        {newStrainImage ? (
                          <div className="flex items-center justify-center gap-3 text-cannabis-green">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">{newStrainImage.name}</span>
                            <span className="text-zinc-500 text-sm">({(newStrainImage.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-zinc-500">
                            <Upload className="w-8 h-8" />
                            <span>Click to upload image (JPG, PNG, WebP)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddStrain(false)}
                      className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 font-bold uppercase tracking-widest px-8 py-4 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingStrain}
                      className="flex-1 bg-cannabis-green hover:bg-green-600 disabled:bg-zinc-700 text-white font-bold uppercase tracking-widest px-8 py-4 transition-all"
                    >
                      {addingStrain ? 'Adding...' : 'Add Strain'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {/* Analytics Sub-Navigation */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'users', label: 'User Activity' },
                  { key: 'engagement', label: 'Engagement' },
                  { key: 'global', label: 'Global Insights' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    data-testid={`analytics-sub-${tab.key}`}
                    onClick={() => {
                      setAnalyticsView(tab.key);
                      if (tab.key === 'users' && userActivityReport.length === 0) fetchUserActivityReport('login_count');
                      if (tab.key === 'engagement' && !engagementData) fetchEngagement();
                      if (tab.key === 'global' && !globalData) fetchGlobalInsights();
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                      analyticsView === tab.key ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {analyticsView === 'user-detail' && (
                  <button
                    onClick={() => setAnalyticsView('users')}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gold-500 text-black"
                  >
                    <ArrowLeft className="w-3 h-3 inline mr-1" /> User Detail
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportCSV('analytics')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-sm flex items-center gap-2 transition-colors">
                  <FileText className="w-4 h-4" /> Export Events CSV
                </button>
                <button onClick={exportUserActivityCSV} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-sm flex items-center gap-2 transition-colors">
                  <FileText className="w-4 h-4" /> Export Users CSV
                </button>
              </div>
            </div>

            {/* OVERVIEW */}
            {analyticsView === 'overview' && analytics && (
              <>
                <div className="mb-6">
                  <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Analytics Overview</h2>
                  <p className="text-zinc-500 text-sm">Last 30 days · {analytics.summary.total_events} events from {analytics.summary.unique_users} users</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Top Viewed Strains */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Top Viewed Strains</h3>
                    <div className="space-y-3">
                      {analytics.top_strains.map((s, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-gold-500 font-mono text-xs w-5">{i+1}.</span>
                            <span className="text-white text-sm">{s.strain_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-zinc-800 overflow-hidden">
                              <div className="h-full bg-gold-500" style={{width: `${Math.min(100, (s.views / (analytics.top_strains[0]?.views || 1)) * 100)}%`}} />
                            </div>
                            <span className="text-zinc-500 font-mono text-xs w-12 text-right">{s.views}</span>
                          </div>
                        </div>
                      ))}
                      {analytics.top_strains.length === 0 && <p className="text-zinc-600 text-sm">No strain views yet</p>}
                    </div>
                  </div>

                  {/* THC Interest */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">THC Potency Interest</h3>
                    <div className="space-y-3">
                      {analytics.thc_interest.map((t, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm">{t.thc}</span>
                          <span className="text-zinc-500 font-mono text-sm">{t.count}</span>
                        </div>
                      ))}
                      {analytics.thc_interest.length === 0 && <p className="text-zinc-600 text-sm">No THC data yet</p>}
                    </div>
                  </div>

                  {/* Strain Type Interest */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Strain Type Preference</h3>
                    <div className="space-y-3">
                      {analytics.strain_type_interest.slice(0, 5).map((t, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm truncate max-w-[180px]">{t.type}</span>
                          <span className="text-zinc-500 font-mono text-sm">{t.count}</span>
                        </div>
                      ))}
                      {analytics.strain_type_interest.length === 0 && <p className="text-zinc-600 text-sm">No type data yet</p>}
                    </div>
                  </div>

                  {/* Price Tier Interest */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Price Tier Interest</h3>
                    <div className="space-y-3">
                      {analytics.price_tier_interest.map((p, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm font-mono">{p.tier}</span>
                          <span className="text-zinc-500 font-mono text-sm">{p.count}</span>
                        </div>
                      ))}
                      {analytics.price_tier_interest.length === 0 && <p className="text-zinc-600 text-sm">No price data yet</p>}
                    </div>
                  </div>

                  {/* Top Searches */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Top Search Queries</h3>
                    <div className="space-y-3">
                      {analytics.top_searches.map((s, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm">"{s.query}"</span>
                          <span className="text-zinc-500 font-mono text-sm">{s.count}x</span>
                        </div>
                      ))}
                      {analytics.top_searches.length === 0 && <p className="text-zinc-600 text-sm">No searches yet</p>}
                    </div>
                  </div>

                  {/* Company Engagement */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Most Active Companies</h3>
                    <div className="space-y-3">
                      {analytics.company_engagement.map((c, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm truncate max-w-[140px]">{c.company}</span>
                          <span className="text-zinc-500 font-mono text-xs">{c.events} events · {c.unique_strains} strains</span>
                        </div>
                      ))}
                      {analytics.company_engagement.length === 0 && <p className="text-zinc-600 text-sm">No company data yet</p>}
                    </div>
                  </div>

                  {/* Event Breakdown */}
                  <div className="bg-charcoal border border-white/5 p-6 md:col-span-2 lg:col-span-3">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Event Breakdown</h3>
                    <div className="flex flex-wrap gap-4">
                      {analytics.event_breakdown.map((e, i) => (
                        <div key={i} className="bg-zinc-900 px-4 py-2 border border-white/5">
                          <span className="text-white text-sm">{e._id}</span>
                          <span className="text-gold-500 font-mono ml-2">{e.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* USER ACTIVITY REPORT */}
            {analyticsView === 'users' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-cinzel font-bold text-2xl text-white mb-2">User Activity Report</h2>
                    <p className="text-zinc-500 text-sm">{userActivityReport.length} users · Click any user for detailed drill-down</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs uppercase tracking-widest">Sort by:</span>
                    {['login_count', 'total_events', 'last_active', 'strains_viewed'].map(s => (
                      <button
                        key={s}
                        data-testid={`sort-${s}`}
                        onClick={() => { setUserActivitySort(s); fetchUserActivityReport(s); }}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-widest transition-all ${
                          userActivitySort === s ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingReport ? (
                  <div className="bg-charcoal border border-white/5 p-12 text-center"><p className="text-zinc-500">Loading report...</p></div>
                ) : (
                  <div className="bg-charcoal border border-white/5 overflow-x-auto">
                    <table className="w-full" data-testid="user-activity-table">
                      <thead className="bg-zinc-900">
                        <tr>
                          {[
                            { key: 'name', label: 'User', align: 'left' },
                            { key: 'company', label: 'Company', align: 'left' },
                            { key: 'login_count', label: 'Logins', align: 'center' },
                            { key: 'total_events', label: 'Events', align: 'center' },
                            { key: 'strains_viewed', label: 'Strains', align: 'center' },
                            { key: 'searches', label: 'Searches', align: 'center' },
                            { key: 'coa_views', label: 'COA Views', align: 'center' },
                            { key: 'sample_requests', label: 'Samples', align: 'center' },
                            { key: 'total_duration_seconds', label: 'Time Spent', align: 'center' },
                            { key: 'last_active', label: 'Last Active', align: 'left' },
                            { key: 'actions', label: '', align: 'center' },
                          ].map(col => (
                            <th
                              key={col.key}
                              data-testid={`sort-col-${col.key}`}
                              onClick={() => handleColumnSort(col.key)}
                              className={`text-${col.align} text-xs uppercase tracking-widest p-4 cursor-pointer select-none transition-colors hover:text-gold-500 ${
                                columnSort.key === col.key ? 'text-gold-500' : 'text-zinc-500'
                              }`}
                            >
                              {col.label}
                              {columnSort.key === col.key && (
                                <span className="ml-1">{columnSort.dir === 'desc' ? '\u25BC' : '\u25B2'}</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedActivityReport.map((u, i) => (
                          <tr
                            key={u.user_id}
                            data-testid={`user-row-${u.user_id}`}
                            onClick={() => fetchUserDetail(u.user_id)}
                            className={`cursor-pointer hover:bg-zinc-800/50 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/30'}`}
                          >
                            <td className="p-4">
                              <div className="text-white text-sm font-medium">{u.name || 'Unknown'}</div>
                              <div className="text-zinc-600 text-xs">{u.email}</div>
                            </td>
                            <td className="p-4 text-zinc-400 text-sm">{u.company}</td>
                            <td className="p-4 text-center">
                              <span className={`font-mono text-sm ${u.login_count > 5 ? 'text-cannabis-green font-bold' : u.login_count > 1 ? 'text-gold-500' : 'text-zinc-500'}`}>
                                {u.login_count}
                              </span>
                            </td>
                            <td className="p-4 text-center text-zinc-300 font-mono text-sm">{u.total_events}</td>
                            <td className="p-4 text-center text-zinc-300 font-mono text-sm">{u.strains_viewed}</td>
                            <td className="p-4 text-center text-zinc-300 font-mono text-sm">{u.searches}</td>
                            <td className="p-4 text-center text-zinc-300 font-mono text-sm">{u.coa_views}</td>
                            <td className="p-4 text-center">
                              <span className={`font-mono text-sm ${u.sample_requests > 0 ? 'text-cannabis-green font-bold' : 'text-zinc-600'}`}>
                                {u.sample_requests}
                              </span>
                            </td>
                            <td className="p-4 text-center text-zinc-400 font-mono text-xs">{formatDuration(u.total_duration_seconds)}</td>
                            <td className="p-4 text-zinc-500 text-xs">{u.last_active ? new Date(u.last_active).toLocaleString() : 'Never'}</td>
                            <td className="p-4 text-center">
                              <button
                                data-testid={`delete-user-${u.user_id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete user "${u.name || u.email}"? This cannot be undone.`)) {
                                    axios.delete(`${API}/admin/users/${u.user_id}`, { headers: { Authorization: `Bearer ${adminToken}` } })
                                      .then(() => {
                                        toast.success('User deleted');
                                        setUserActivityReport(prev => prev.filter(r => r.user_id !== u.user_id));
                                      })
                                      .catch(() => toast.error('Failed to delete user'));
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* USER DETAIL DRILL-DOWN */}
            {analyticsView === 'user-detail' && selectedUserDetail && (
              <>
                <div className="mb-6">
                  <button onClick={() => setAnalyticsView('users')} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to User Activity
                  </button>
                  <h2 className="font-cinzel font-bold text-2xl text-white mb-2">
                    {selectedUserDetail.user_info?.first_name} {selectedUserDetail.user_info?.last_name}
                  </h2>
                  <p className="text-zinc-500 text-sm">
                    {selectedUserDetail.user_info?.company} · {selectedUserDetail.user_info?.email}
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                  {[
                    { label: 'Total Sessions', value: selectedUserDetail.total_sessions, color: 'text-gold-500' },
                    { label: 'Total Events', value: selectedUserDetail.total_events, color: 'text-white' },
                    { label: 'Strains Viewed', value: selectedUserDetail.strains_viewed?.length || 0, color: 'text-cannabis-green' },
                    { label: 'Searches', value: selectedUserDetail.search_queries?.length || 0, color: 'text-blue-400' },
                    { label: 'Avg Session', value: formatDuration(selectedUserDetail.avg_session_seconds), color: 'text-gold-500' },
                    { label: 'Total Time', value: formatDuration(selectedUserDetail.total_duration_seconds), color: 'text-white' }
                  ].map((card, i) => (
                    <div key={i} className="bg-charcoal border border-white/5 p-4 text-center">
                      <div className={`font-mono font-bold text-xl ${card.color}`}>{card.value}</div>
                      <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">{card.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Top Strains for this User */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Most Viewed Strains</h3>
                    <div className="space-y-3">
                      {selectedUserDetail.top_strains?.map((s, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm">{s.strain_name}</span>
                          <span className="text-zinc-500 font-mono text-sm">{s.views}x</span>
                        </div>
                      ))}
                      {(!selectedUserDetail.top_strains || selectedUserDetail.top_strains.length === 0) && (
                        <p className="text-zinc-600 text-sm">No strain views</p>
                      )}
                    </div>
                  </div>

                  {/* Event Breakdown */}
                  <div className="bg-charcoal border border-white/5 p-6">
                    <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Activity Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedUserDetail.event_breakdown || {}).sort((a,b) => b[1]-a[1]).map(([type, count], i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white text-sm">{type.replace(/_/g, ' ')}</span>
                          <span className="text-zinc-500 font-mono text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-charcoal border border-white/5 p-6">
                  <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">
                    Recent Activity Timeline
                    <span className="text-zinc-600 font-normal ml-2">({selectedUserDetail.recent_activity?.length || 0} events)</span>
                  </h3>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {selectedUserDetail.recent_activity?.map((event, i) => (
                      <div key={i} className="flex items-start gap-4 py-2 border-b border-white/5">
                        <span className="text-zinc-600 font-mono text-xs w-36 shrink-0">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest shrink-0 ${
                          event.event_type === 'strain_view' ? 'bg-cannabis-green/20 text-cannabis-green' :
                          event.event_type === 'search' ? 'bg-blue-500/20 text-blue-400' :
                          event.event_type === 'filter_apply' ? 'bg-purple-500/20 text-purple-400' :
                          event.event_type === 'coa_view' ? 'bg-gold-500/20 text-gold-500' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {event.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-zinc-400 text-sm">
                          {event.strain_name && <span className="text-white">{event.strain_name}</span>}
                          {event.search_query && <span>Searched: "<span className="text-white">{event.search_query}</span>"</span>}
                          {event.page && !event.strain_name && !event.search_query && <span>{event.page}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ENGAGEMENT METRICS */}
            {analyticsView === 'engagement' && (
              <>
                <div className="mb-6">
                  <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Engagement Metrics</h2>
                  <p className="text-zinc-500 text-sm">Session data, peak usage, conversion funnel, and navigation flows</p>
                </div>

                {!engagementData ? (
                  <div className="bg-charcoal border border-white/5 p-12 text-center"><p className="text-zinc-500">Loading...</p></div>
                ) : (
                  <>
                    {/* Summary Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                      <div className="bg-charcoal border border-white/5 p-5 text-center">
                        <div className="text-gold-500 font-mono font-bold text-2xl">{engagementData.sessions.total}</div>
                        <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Total Sessions</div>
                      </div>
                      <div className="bg-charcoal border border-white/5 p-5 text-center">
                        <div className="text-white font-mono font-bold text-2xl">{formatDuration(engagementData.sessions.avg_duration_seconds)}</div>
                        <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Avg Session</div>
                      </div>
                      <div className="bg-charcoal border border-white/5 p-5 text-center">
                        <div className="text-white font-mono font-bold text-2xl">{formatDuration(engagementData.sessions.max_duration_seconds)}</div>
                        <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Longest Session</div>
                      </div>
                      <div className="bg-charcoal border border-white/5 p-5 text-center">
                        <div className="text-cannabis-green font-mono font-bold text-2xl">{engagementData.conversion.conversion_rate}%</div>
                        <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Sample Request Rate</div>
                      </div>
                      <div className="bg-charcoal border border-white/5 p-5 text-center">
                        <div className="text-gold-500 font-mono font-bold text-2xl">{engagementData.user_base.active_this_period}</div>
                        <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Active Users (30d)</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Peak Hours */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Peak Usage Hours (UTC)</h3>
                        <div className="space-y-3">
                          {engagementData.peak_hours.map((h, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-zinc-400 font-mono text-sm w-12">{h.hour}:00</span>
                              <div className="flex-1 h-4 bg-zinc-800 overflow-hidden">
                                <div
                                  className={`h-full ${i === 0 ? 'bg-gold-500' : 'bg-gold-500/50'}`}
                                  style={{width: `${Math.min(100, (h.events / (engagementData.peak_hours[0]?.events || 1)) * 100)}%`}}
                                />
                              </div>
                              <span className="text-zinc-500 font-mono text-xs w-12 text-right">{h.events}</span>
                            </div>
                          ))}
                          {engagementData.peak_hours.length === 0 && <p className="text-zinc-600 text-sm">No data yet</p>}
                        </div>
                      </div>

                      {/* Conversion Funnel */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Conversion Funnel</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-zinc-400">Strain Viewers</span>
                              <span className="text-white font-mono">{engagementData.conversion.total_viewers}</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-800"><div className="h-full bg-gold-500" style={{width: '100%'}} /></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-zinc-400">Sample Requesters</span>
                              <span className="text-cannabis-green font-mono">{engagementData.conversion.sample_requesters}</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-800">
                              <div className="h-full bg-cannabis-green" style={{width: `${engagementData.conversion.conversion_rate}%`}} />
                            </div>
                          </div>
                          <p className="text-zinc-500 text-xs text-center">
                            {engagementData.conversion.conversion_rate}% of viewers requested a sample
                          </p>
                        </div>
                      </div>

                      {/* Navigation Flows */}
                      <div className="bg-charcoal border border-white/5 p-6 lg:col-span-2">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Top Navigation Flows</h3>
                        <p className="text-zinc-600 text-xs mb-4">Most common user journeys (first 3 actions per session)</p>
                        <div className="space-y-3">
                          {engagementData.top_navigation_flows.map((f, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <div className="flex items-center gap-1 text-sm flex-wrap">
                                {f.flow.split(' → ').map((step, j) => (
                                  <span key={j} className="flex items-center gap-1">
                                    {j > 0 && <span className="text-zinc-600 mx-1">→</span>}
                                    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${
                                      step === 'strain_view' ? 'bg-cannabis-green/20 text-cannabis-green' :
                                      step === 'search' ? 'bg-blue-500/20 text-blue-400' :
                                      step === 'page_view' ? 'bg-zinc-800 text-zinc-400' :
                                      'bg-gold-500/20 text-gold-500'
                                    }`}>
                                      {step.replace(/_/g, ' ')}
                                    </span>
                                  </span>
                                ))}
                              </div>
                              <span className="text-zinc-500 font-mono text-sm shrink-0 ml-4">{f.count} users</span>
                            </div>
                          ))}
                          {engagementData.top_navigation_flows.length === 0 && <p className="text-zinc-600 text-sm">No flow data yet</p>}
                        </div>
                      </div>

                      {/* Daily Activity */}
                      <div className="bg-charcoal border border-white/5 p-6 lg:col-span-2">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Daily Activity (Last 30 Days)</h3>
                        <div className="flex items-end gap-1 h-24">
                          {engagementData.daily_activity.map((d, i) => {
                            const maxCount = Math.max(...engagementData.daily_activity.map(x => x.count), 1);
                            const height = Math.max(4, (d.count / maxCount) * 96);
                            return (
                              <div key={i} className="flex-1 group relative" title={`${d._id}: ${d.count} events`}>
                                <div className="w-full bg-gold-500/60 hover:bg-gold-500 transition-colors" style={{height: `${height}px`}} />
                              </div>
                            );
                          })}
                          {engagementData.daily_activity.length === 0 && (
                            <p className="text-zinc-600 text-sm w-full text-center">No daily data yet</p>
                          )}
                        </div>
                        {engagementData.daily_activity.length > 0 && (
                          <div className="flex justify-between text-zinc-600 text-xs mt-2">
                            <span>{engagementData.daily_activity[0]?._id}</span>
                            <span>{engagementData.daily_activity[engagementData.daily_activity.length - 1]?._id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* GLOBAL INSIGHTS */}
            {analyticsView === 'global' && (
              <>
                <div className="mb-6">
                  <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Global Insights</h2>
                  <p className="text-zinc-500 text-sm">Geographic breakdown, demand signals, supply analysis, and market intelligence</p>
                </div>

                {!globalData ? (
                  <div className="bg-charcoal border border-white/5 p-12 text-center"><p className="text-zinc-500">Loading...</p></div>
                ) : (
                  <>
                    {/* Platform Totals */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                      {[
                        { label: 'Users', value: globalData.totals.users, color: 'text-gold-500' },
                        { label: 'Strains', value: globalData.totals.strains, color: 'text-cannabis-green' },
                        { label: 'With COA', value: globalData.totals.strains_with_coa, color: 'text-blue-400' },
                        { label: 'Submissions', value: globalData.totals.submissions, color: 'text-white' },
                        { label: 'Sample Req', value: globalData.totals.sample_requests, color: 'text-gold-500' },
                        { label: 'Events', value: globalData.totals.total_events, color: 'text-zinc-300' }
                      ].map((t, i) => (
                        <div key={i} className="bg-charcoal border border-white/5 p-4 text-center">
                          <div className={`font-mono font-bold text-xl ${t.color}`}>{t.value}</div>
                          <div className="text-zinc-600 text-xs uppercase tracking-widest mt-1">{t.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Users by Country */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Users by Country</h3>
                        <div className="space-y-3">
                          {globalData.geographic.users_by_country.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-white text-sm flex-1">{c.country}</span>
                              <div className="w-24 h-2 bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-gold-500" style={{width: `${(c.count / (globalData.geographic.users_by_country[0]?.count || 1)) * 100}%`}} />
                              </div>
                              <span className="text-zinc-500 font-mono text-xs w-8 text-right">{c.count}</span>
                            </div>
                          ))}
                          {globalData.geographic.users_by_country.length === 0 && <p className="text-zinc-600 text-sm">No data</p>}
                        </div>
                      </div>

                      {/* Export Countries (from Grower Submissions) */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Export Destinations (Grower Submissions)</h3>
                        <div className="space-y-3">
                          {globalData.geographic.exports_by_country.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-white text-sm flex-1">{c.country}</span>
                              <div className="w-24 h-2 bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-cannabis-green" style={{width: `${(c.count / (globalData.geographic.exports_by_country[0]?.count || 1)) * 100}%`}} />
                              </div>
                              <span className="text-zinc-500 font-mono text-xs w-8 text-right">{c.count}</span>
                            </div>
                          ))}
                          {globalData.geographic.exports_by_country.length === 0 && <p className="text-zinc-600 text-sm">No export data yet</p>}
                        </div>
                      </div>

                      {/* Top Company Activity by Country */}
                      <div className="bg-charcoal border border-white/5 p-6 lg:col-span-2">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Company Activity by Region</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="text-left text-zinc-500 text-xs uppercase tracking-widest py-2 pr-4">Country</th>
                                <th className="text-left text-zinc-500 text-xs uppercase tracking-widest py-2 pr-4">Company</th>
                                <th className="text-center text-zinc-500 text-xs uppercase tracking-widest py-2 pr-4">Events</th>
                                <th className="text-center text-zinc-500 text-xs uppercase tracking-widest py-2">Strains Viewed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {globalData.geographic.company_activity_by_country.slice(0, 15).map((r, i) => (
                                <tr key={i} className="border-b border-white/5">
                                  <td className="py-2 pr-4 text-zinc-400 text-sm">{r.country || 'N/A'}</td>
                                  <td className="py-2 pr-4 text-white text-sm">{r.company || 'N/A'}</td>
                                  <td className="py-2 pr-4 text-center text-gold-500 font-mono text-sm">{r.events}</td>
                                  <td className="py-2 text-center text-cannabis-green font-mono text-sm">{r.strains_viewed}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Demand Signals */}
                    <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 mt-8">Demand Signals</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Most Requested Samples */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Most Requested Samples</h3>
                        <div className="space-y-3">
                          {globalData.demand.top_sample_requests.map((s, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className="text-white text-sm">{s.strain_name}</span>
                              <span className="text-zinc-500 text-xs">{s.requests} req · {s.unique_companies} companies</span>
                            </div>
                          ))}
                          {globalData.demand.top_sample_requests.length === 0 && <p className="text-zinc-600 text-sm">No sample requests yet</p>}
                        </div>
                      </div>

                      {/* Terpene Interest */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Terpene Interest</h3>
                        <div className="flex flex-wrap gap-2">
                          {globalData.demand.terpene_interest.map((t, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 px-3 py-1.5">
                              <span className="text-white text-sm">{t.terpene}</span>
                              <span className="text-gold-500 font-mono ml-2 text-xs">{t.views}</span>
                            </div>
                          ))}
                          {globalData.demand.terpene_interest.length === 0 && <p className="text-zinc-600 text-sm">No data</p>}
                        </div>
                      </div>

                      {/* Type Demand */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Strain Type Demand</h3>
                        <div className="space-y-3">
                          {globalData.demand.type_demand.map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-white text-sm flex-1 truncate">{t.type}</span>
                              <div className="w-20 h-2 bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-cannabis-green" style={{width: `${(t.views / (globalData.demand.type_demand[0]?.views || 1)) * 100}%`}} />
                              </div>
                              <span className="text-zinc-500 text-xs">{t.views} views · {t.unique_users} users</span>
                            </div>
                          ))}
                          {globalData.demand.type_demand.length === 0 && <p className="text-zinc-600 text-sm">No data</p>}
                        </div>
                      </div>

                      {/* Price Tier Demand */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Price Tier Demand</h3>
                        <div className="space-y-3">
                          {globalData.demand.tier_demand.map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-gold-500 font-mono text-lg w-12">{t.tier}</span>
                              <div className="flex-1 h-6 bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-gold-500/60" style={{width: `${(t.views / (globalData.demand.tier_demand[0]?.views || 1)) * 100}%`}} />
                              </div>
                              <span className="text-zinc-500 text-xs w-28 text-right">{t.views} views · {t.unique_users} users</span>
                            </div>
                          ))}
                          {globalData.demand.tier_demand.length === 0 && <p className="text-zinc-600 text-sm">No data</p>}
                        </div>
                      </div>
                    </div>

                    {/* Supply-Side */}
                    <h3 className="font-cinzel font-bold text-lg text-gold-500 mb-4 mt-8">Supply Side (Grower Submissions)</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      {/* Submission Status */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Submission Pipeline</h3>
                        <div className="space-y-3">
                          {Object.entries(globalData.supply.submission_status).map(([status, count], i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                                status === 'pending' ? 'bg-gold-500/20 text-gold-500' :
                                status === 'approved' ? 'bg-cannabis-green/20 text-cannabis-green' :
                                'bg-red-500/20 text-red-500'
                              }`}>{status}</span>
                              <span className="text-white font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lot Size Stats */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Lot Size Analysis</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Average Lot</span><span className="text-white font-mono">{Math.round(globalData.supply.lot_stats.avg_lot || 0)} kg</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Smallest Lot</span><span className="text-white font-mono">{globalData.supply.lot_stats.min_lot || 0} kg</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Largest Lot</span><span className="text-white font-mono">{globalData.supply.lot_stats.max_lot || 0} kg</span></div>
                          <div className="flex justify-between border-t border-white/5 pt-2"><span className="text-zinc-400 text-sm">Total Available</span><span className="text-gold-500 font-mono font-bold">{Math.round(globalData.supply.lot_stats.total_kg || 0)} kg</span></div>
                        </div>
                      </div>

                      {/* Irradiation Stats */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Irradiation Status</h3>
                        <div className="space-y-3">
                          {Object.entries(globalData.supply.irradiation).map(([status, count], i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className={`text-sm ${status === 'Yes' ? 'text-cannabis-green' : status === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{status}</span>
                              <span className="text-white font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Grower Types & Growth & Grade Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Grade Distribution */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Grade Distribution</h3>
                        {globalData.supply.grade_distribution ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Submissions</p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-cannabis-green text-sm">Grade A (Bigs)</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.submissions?.total_grade_a || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gold-500 text-sm">Grade B (Mids)</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.submissions?.total_grade_b || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-400 text-sm">Grade C (Smalls)</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.submissions?.total_grade_c || 0} kg</span>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-white/5 pt-3">
                              <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Catalog (Approved)</p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-cannabis-green text-sm">Grade A (Bigs)</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.catalog?.total_grade_a || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gold-500 text-sm">Grade B (Mids)</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.catalog?.total_grade_b || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-400 text-sm">Grade C (Smalls)</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.catalog?.total_grade_c || 0} kg</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : <p className="text-zinc-600 text-sm">No grade data</p>}
                      </div>

                      {/* Grower Submission Types */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Submitted Strain Types</h3>
                        <div className="space-y-3">
                          {globalData.supply.grower_types.map((g, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-white text-sm flex-1 truncate">{g.type}</span>
                              <div className="w-20 h-2 bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-cannabis-green/60" style={{width: `${(g.count / (globalData.supply.grower_types[0]?.count || 1)) * 100}%`}} />
                              </div>
                              <span className="text-zinc-500 font-mono text-xs">{g.count}</span>
                            </div>
                          ))}
                          {globalData.supply.grower_types.length === 0 && <p className="text-zinc-600 text-sm">No submissions</p>}
                        </div>
                      </div>

                      {/* Registration Growth */}
                      <div className="bg-charcoal border border-white/5 p-6">
                        <h3 className="text-gold-500 font-bold uppercase tracking-widest text-sm mb-4">Registration Growth</h3>
                        <div className="flex items-end gap-1 h-24">
                          {globalData.growth.registration_timeline.map((d, i) => {
                            const maxCount = Math.max(...globalData.growth.registration_timeline.map(x => x.count), 1);
                            const height = Math.max(4, (d.count / maxCount) * 96);
                            return (
                              <div key={i} className="flex-1 group relative" title={`${d._id}: ${d.count} registrations`}>
                                <div className="w-full bg-cannabis-green/60 hover:bg-cannabis-green transition-colors" style={{height: `${height}px`}} />
                              </div>
                            );
                          })}
                          {globalData.growth.registration_timeline.length === 0 && (
                            <p className="text-zinc-600 text-sm w-full text-center">No data</p>
                          )}
                        </div>
                        {globalData.growth.registration_timeline.length > 0 && (
                          <div className="flex justify-between text-zinc-600 text-xs mt-2">
                            <span>{globalData.growth.registration_timeline[0]?._id}</span>
                            <span>{globalData.growth.registration_timeline[globalData.growth.registration_timeline.length - 1]?._id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* User Detail Modal */}
            {selectedUserProfile && (
              <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedUserProfile(null)}>
                <div className="bg-charcoal border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="sticky top-0 bg-charcoal border-b border-white/5 p-6 flex justify-between items-start z-10">
                    <div>
                      <h2 className="font-cinzel font-bold text-2xl text-white">{selectedUserProfile.user.first_name} {selectedUserProfile.user.last_name}</h2>
                      <p className="text-zinc-400 text-sm">{selectedUserProfile.user.company} · {selectedUserProfile.user.email}</p>
                    </div>
                    <button onClick={() => setSelectedUserProfile(null)} className="w-10 h-10 bg-gold-500 text-black hover:bg-gold-400 flex items-center justify-center transition-all">
                      <X className="w-5 h-5 text-black" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* User Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-900/50 border border-white/5 p-4">
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">Phone</p>
                        <p className="text-zinc-200 text-sm">{selectedUserProfile.user.phone || 'N/A'}</p>
                      </div>
                      <div className="bg-zinc-900/50 border border-white/5 p-4">
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">Country</p>
                        <p className="text-zinc-200 text-sm">{selectedUserProfile.user.country || 'N/A'}</p>
                      </div>
                      <div className="bg-zinc-900/50 border border-white/5 p-4">
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">License #</p>
                        <p className="text-zinc-200 text-sm font-mono">{selectedUserProfile.user.license_number || 'N/A'}</p>
                      </div>
                      <div className="bg-zinc-900/50 border border-white/5 p-4">
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">Registered</p>
                        <p className="text-zinc-200 text-sm">{selectedUserProfile.user.created_at ? new Date(selectedUserProfile.user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Activity Summary */}
                    <div>
                      <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Activity Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: 'Logins', value: selectedUserProfile.activity_summary.login_count },
                          { label: 'Page Views', value: selectedUserProfile.activity_summary.total_page_views },
                          { label: 'Strains Viewed', value: selectedUserProfile.activity_summary.total_strain_views },
                          { label: 'Inquiries', value: selectedUserProfile.activity_summary.total_inquiries },
                          { label: 'Sample Requests', value: selectedUserProfile.activity_summary.total_sample_requests },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-zinc-900 border border-white/5 p-3 text-center">
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      {selectedUserProfile.activity_summary.last_login && (
                        <p className="text-zinc-500 text-xs mt-2">Last login: {new Date(selectedUserProfile.activity_summary.last_login).toLocaleString()}</p>
                      )}
                    </div>

                    {/* Top Strains Viewed */}
                    {selectedUserProfile.top_strains_viewed.length > 0 && (
                      <div>
                        <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Top Strains Viewed</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedUserProfile.top_strains_viewed.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-900/50 border border-white/5 px-4 py-2">
                              <span className="text-zinc-200 text-sm">{s.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gold-500 font-mono text-sm font-bold">{s.count}x</span>
                                {s.last_viewed && <span className="text-zinc-600 text-xs">{new Date(s.last_viewed).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Login History */}
                    {selectedUserProfile.activity_summary.login_history.length > 0 && (
                      <div>
                        <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Login History</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedUserProfile.activity_summary.login_history.map((ts, idx) => (
                            <span key={idx} className="bg-zinc-900 border border-white/5 text-zinc-400 text-xs px-3 py-1.5 font-mono">
                              {new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inquiries */}
                    {selectedUserProfile.inquiries.length > 0 && (
                      <div>
                        <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Inquiries ({selectedUserProfile.inquiries.length})</h3>
                        <div className="space-y-2">
                          {selectedUserProfile.inquiries.map((inq, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex flex-wrap gap-1">
                                  {(inq.strain_names || []).map((name, i) => (
                                    <span key={i} className="bg-gold-500/10 border border-gold-500/20 text-gold-500 text-[10px] font-bold px-2 py-0.5">{name}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${inq.status === 'pending' ? 'bg-gold-500/20 text-gold-500' : inq.status === 'responded' ? 'bg-cannabis-green/20 text-cannabis-green' : 'bg-zinc-700/30 text-zinc-500'}`}>{inq.status}</span>
                                  <span className="text-zinc-600 text-xs">{inq.created_at ? new Date(inq.created_at).toLocaleDateString() : ''}</span>
                                </div>
                              </div>
                              <p className="text-zinc-400 text-sm">{inq.message}</p>
                              {inq.strain_volumes && Object.keys(inq.strain_volumes).length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {(inq.strain_names || []).map((name, i) => {
                                    const vol = inq.strain_volumes[(inq.strain_ids || [])[i]];
                                    return vol ? <span key={i} className="text-zinc-500 text-xs">{name}: {vol}kg</span> : null;
                                  })}
                                </div>
                              )}
                              {inq.market_of_interest && <p className="text-gold-500/70 text-xs mt-1">Market: {inq.market_of_interest}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample Requests */}
                    {selectedUserProfile.sample_requests.length > 0 && (
                      <div>
                        <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Sample Requests ({selectedUserProfile.sample_requests.length})</h3>
                        <div className="space-y-2">
                          {selectedUserProfile.sample_requests.map((sr, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4 flex justify-between items-center">
                              <div>
                                <p className="text-zinc-200 text-sm">{sr.strain_name || 'Unknown strain'}</p>
                                <p className="text-zinc-500 text-xs">{sr.message}</p>
                              </div>
                              <span className="text-zinc-600 text-xs">{sr.created_at ? new Date(sr.created_at).toLocaleDateString() : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filter Usage */}
                    {Object.keys(selectedUserProfile.filter_usage).length > 0 && (
                      <div>
                        <h3 className="font-manrope font-bold text-xs uppercase tracking-widest text-gold-500 mb-3">Filter Usage</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedUserProfile.filter_usage).sort((a, b) => b[1] - a[1]).map(([filter, count]) => (
                            <span key={filter} className="bg-zinc-900 border border-white/5 text-zinc-400 text-xs px-3 py-1.5">
                              {filter}: <span className="text-gold-500 font-bold">{count}x</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Registered Users</h2>
                <p className="text-zinc-500 text-sm">{users.length} total users · Click any name for detailed profile</p>
              </div>
              <button
                onClick={() => exportCSV('users')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Marketing CSV
              </button>
            </div>

            <div className="bg-charcoal border border-white/5 overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <SortableHeader
                  testPrefix="users"
                  sortState={usersSort}
                  onSort={makeSortHandler(setUsersSort)}
                  columns={[
                    { key: 'first_name', label: 'Name' },
                    { key: 'company', label: 'Company' },
                    { key: 'country', label: 'Country' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'license_number', label: 'License #' },
                    { key: 'referred_by', label: 'Referred By' },
                    { key: 'status', label: 'Status' },
                    { key: 'created_at', label: 'Registered' },
                    { key: '_actions', label: 'Actions', align: 'right' },
                  ]}
                />
                <tbody>
                  {sortData(users, usersSort).map((user, i) => (
                    <tr key={user.id || i} className={`border-t border-white/5 hover:bg-zinc-900/50 ${user.status === 'suspended' ? 'opacity-60' : ''} ${user.status === 'removed' ? 'opacity-30' : ''}`}>
                      <td className="p-4">
                        <button
                          data-testid={`user-profile-${user.id}`}
                          onClick={() => fetchUserProfile(user.id)}
                          className="text-gold-500 hover:text-gold-400 hover:underline font-bold text-left transition-colors"
                        >
                          {user.first_name} {user.last_name}
                        </button>
                      </td>
                      <td className="p-4 text-zinc-400">{user.company}</td>
                      <td className="p-4 text-zinc-400">{user.country}</td>
                      <td className="p-4 text-zinc-400">{user.email}</td>
                      <td className="p-4 text-zinc-400 text-sm">{user.phone || '—'}</td>
                      <td className="p-4 text-zinc-400 font-mono text-xs">{user.license_number || '—'}</td>
                      <td className="p-4 text-sm">
                        {(user.referred_by || user.referred_by_code) ? (
                          <span className="text-gold-500 font-mono text-xs">{(() => {
                            const code = user.referred_by || user.referred_by_code;
                            const aff = affiliates.find(a => a.referral_code === code);
                            return aff ? aff.name : code;
                          })()}</span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="p-4">
                        {user.status === 'suspended' ? (
                          <span data-testid={`user-status-${user.id}`} className="bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest px-2 py-1">Paused</span>
                        ) : user.status === 'removed' ? (
                          <span data-testid={`user-status-${user.id}`} className="bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest px-2 py-1">Removed</span>
                        ) : (
                          <span data-testid={`user-status-${user.id}`} className="bg-cannabis-green/20 text-cannabis-green text-xs font-bold uppercase tracking-widest px-2 py-1">Active</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {user.status !== 'removed' && (
                          <div className="flex gap-2 justify-end">
                            {user.status === 'suspended' ? (
                              <button
                                data-testid={`user-activate-${user.id}`}
                                onClick={async () => {
                                  try {
                                    await axios.put(`${API}/admin/users/${user.id}/status`, { status: 'active' }, { headers: { Authorization: `Bearer ${adminToken}` } });
                                    toast.success('User access restored');
                                    fetchUsers(adminToken);
                                  } catch { toast.error('Failed to restore access'); }
                                }}
                                className="bg-cannabis-green/20 hover:bg-cannabis-green/30 text-cannabis-green text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                data-testid={`user-pause-${user.id}`}
                                onClick={async () => {
                                  try {
                                    await axios.put(`${API}/admin/users/${user.id}/status`, { status: 'suspended' }, { headers: { Authorization: `Bearer ${adminToken}` } });
                                    toast.success('User access paused');
                                    fetchUsers(adminToken);
                                  } catch { toast.error('Failed to pause access'); }
                                }}
                                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors"
                              >
                                Pause Access
                              </button>
                            )}
                            <button
                              data-testid={`user-remove-${user.id}`}
                              onClick={async () => {
                                if (!window.confirm(`Remove ${user.first_name} ${user.last_name} (${user.email})? This will revoke their access permanently.`)) return;
                                try {
                                  await axios.delete(`${API}/admin/users/${user.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
                                  toast.success('User removed');
                                  fetchUsers(adminToken);
                                } catch { toast.error('Failed to remove user'); }
                              }}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-zinc-600">No users registered yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Flags Tab */}
        {activeTab === 'flags' && (
          <>
            <div className="mb-8">
              <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Registration Flags</h2>
              <p className="text-zinc-500 text-sm">Duplicate company names, phone numbers, and email domains are flagged</p>
            </div>

            {flags.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-cannabis-green mx-auto mb-4" />
                <p className="text-zinc-400">No flags detected. All registrations look clean.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flags.map((flag, i) => (
                  <div key={flag.id || i} className="bg-charcoal border border-yellow-500/30 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-2 ${
                          flag.flag_type === 'duplicate_company' ? 'bg-yellow-500/20 text-yellow-500' :
                          flag.flag_type === 'duplicate_phone' ? 'bg-red-500/20 text-red-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {flag.flag_type.replace(/_/g, ' ')}
                        </span>
                        <p className="text-white">{flag.flag_reason}</p>
                        <p className="text-zinc-500 text-sm mt-2">
                          User ID: {flag.user_id}
                        </p>
                        {flag.matched_user_ids && flag.matched_user_ids.length > 0 && (
                          <p className="text-zinc-500 text-sm">
                            Matches with: {flag.matched_user_ids.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-zinc-600 text-xs">
                        {new Date(flag.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Grower Submissions Tab */}
        {activeTab === 'submissions' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Grower Submissions</h2>
                <p className="text-zinc-500 text-sm">{submissions.length} total · {pendingCount} pending authorization</p>
              </div>
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                  <button
                    key={f}
                    data-testid={`submission-filter-${f}`}
                    onClick={() => setSubmissionFilter(f)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                      submissionFilter === f ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <SortButtons
              testPrefix="submissions"
              sortState={submissionsSort}
              onSort={makeSortHandler(setSubmissionsSort)}
              options={[
                { key: 'created_at', label: 'Date' },
                { key: 'strain_name', label: 'Strain' },
                { key: 'company_name', label: 'Company' },
                { key: 'status', label: 'Status' },
                { key: 'lot_size_kg', label: 'Lot Size' },
              ]}
            />

            {filteredSubmissions.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400">No {submissionFilter === 'all' ? '' : submissionFilter} submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortData(filteredSubmissions, submissionsSort).map((sub) => (
                  <div key={sub.id} data-testid={`submission-card-${sub.id}`} className={`bg-charcoal border p-6 ${
                    sub.status === 'pending' ? 'border-gold-500/30' : sub.status === 'approved' ? 'border-cannabis-green/30' : 'border-red-500/30'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-cinzel font-bold text-xl text-white">{sub.strain_name}</h3>
                          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                            sub.status === 'pending' ? 'bg-gold-500/20 text-gold-500' :
                            sub.status === 'approved' ? 'bg-cannabis-green/20 text-cannabis-green' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-sm">{sub.strain_type} · THC {sub.thc_percentage}{sub.cbd_percentage ? ` · CBD ${sub.cbd_percentage}` : ''}</p>
                      </div>
                      <span className="text-zinc-600 text-xs">{new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Strain Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Lineage</p>
                        <p className="text-zinc-300 text-sm">{sub.lineage}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Terpenes</p>
                        <p className="text-zinc-300 text-sm">{sub.terpene_profile}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Lot Size</p>
                        <p className="text-zinc-300 text-sm">{sub.lot_size_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Method</p>
                        <p className="text-zinc-300 text-sm">{sub.growing_method || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Export Country</p>
                        <p className="text-zinc-300 text-sm">{sub.export_country || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Open Permit</p>
                        <p className={`text-sm font-medium ${sub.open_permit === 'Yes' ? 'text-cannabis-green' : sub.open_permit === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{sub.open_permit || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Irradiated</p>
                        <p className={`text-sm font-medium ${sub.is_irradiated === 'Yes' ? 'text-cannabis-green' : sub.is_irradiated === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{sub.is_irradiated || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Willing to Irradiate</p>
                        <p className={`text-sm font-medium ${sub.willing_to_irradiate === 'Yes' ? 'text-cannabis-green' : sub.willing_to_irradiate === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{sub.willing_to_irradiate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">GACP Compliant</p>
                        <p className={`text-sm font-medium ${sub.gacp_compliant === 'Yes' ? 'text-cannabis-green' : sub.gacp_compliant === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{sub.gacp_compliant || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">License #</p>
                        <p className="text-zinc-300 text-sm font-mono">{sub.license_number || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Grade Breakdown */}
                    {(sub.grade_a_kg || sub.grade_b_kg || sub.grade_c_kg) && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-3 text-center">
                          <p className="text-cannabis-green font-bold font-mono text-lg">{sub.grade_a_kg || 0}</p>
                          <p className="text-cannabis-green/70 text-[10px] uppercase tracking-widest">Grade A (Bigs) (kg)</p>
                        </div>
                        <div className="bg-gold-500/10 border border-gold-500/30 p-3 text-center">
                          <p className="text-gold-500 font-bold font-mono text-lg">{sub.grade_b_kg || 0}</p>
                          <p className="text-gold-500/70 text-[10px] uppercase tracking-widest">Grade B (Mids) (kg)</p>
                        </div>
                        <div className="bg-zinc-700/30 border border-zinc-600/30 p-3 text-center">
                          <p className="text-zinc-400 font-bold font-mono text-lg">{sub.grade_c_kg || 0}</p>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Grade C (Smalls) (kg)</p>
                        </div>
                      </div>
                    )}

                    {/* Submitted Image */}
                    {sub.image_path && (
                      <div className="mb-4">
                        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Submitted Image</p>
                        <img src={sub.image_path} alt={sub.strain_name} className="w-32 h-32 object-cover border border-white/10" />
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-zinc-600 text-xs uppercase tracking-widest">Effects</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(typeof sub.effects === 'string' ? sub.effects.split(',').map(e => e.trim()).filter(Boolean) : (Array.isArray(sub.effects) ? sub.effects : [])).map((effect, i) => (
                          <span key={i} className="bg-gold-500/10 border border-gold-500/30 text-gold-500 text-xs px-2 py-0.5">{effect}</span>
                        ))}
                      </div>
                    </div>

                    {/* Grower Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-zinc-900/50 p-4 border border-white/5">
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Grower</p>
                        <p className="text-zinc-300 text-sm">{sub.grower_name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Company</p>
                        <p className="text-zinc-300 text-sm">{sub.company_name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Email</p>
                        <p className="text-zinc-300 text-sm">{sub.email}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Phone</p>
                        <p className="text-zinc-300 text-sm">{sub.phone}</p>
                      </div>
                    </div>

                    {sub.additional_notes && (
                      <div className="mb-4">
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Notes from Grower</p>
                        <p className="text-zinc-400 text-sm italic">{sub.additional_notes}</p>
                      </div>
                    )}

                    {/* Uploaded Documents & COA Redaction */}
                    {(sub.coa_path || sub.health_canada_license_path || sub.cra_license_path) && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-3 mb-3">
                          {sub.coa_path && (
                            <a href={`${API}/files/${sub.coa_path.replace('/uploads/', '')}`} target="_blank" rel="noopener noreferrer" data-testid={`doc-coa-${sub.id}`}
                              className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-gold-500/50 transition-colors"
                              onClick={(e) => { e.preventDefault(); window.open(`${API}/files/${sub.coa_path.replace('/uploads/', '')}?token=${adminToken}`, '_blank'); }}>
                              <FileText className="w-4 h-4 text-gold-500" />
                              {sub.coa_redacted ? 'COA (Redacted)' : 'COA (Original)'}
                            </a>
                          )}
                          {sub.health_canada_license_path && (
                            <a href="#" data-testid={`doc-hc-${sub.id}`}
                              className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-gold-500/50 transition-colors"
                              onClick={(e) => { e.preventDefault(); window.open(`${API}/files/${sub.health_canada_license_path.replace('/uploads/', '')}?token=${adminToken}`, '_blank'); }}>
                              <FileText className="w-4 h-4 text-cannabis-green" />
                              HC License
                            </a>
                          )}
                          {sub.cra_license_path && (
                            <a href="#" data-testid={`doc-cra-${sub.id}`}
                              className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-gold-500/50 transition-colors"
                              onClick={(e) => { e.preventDefault(); window.open(`${API}/files/${sub.cra_license_path.replace('/uploads/', '')}?token=${adminToken}`, '_blank'); }}>
                              <FileText className="w-4 h-4 text-blue-400" />
                              CRA License
                            </a>
                          )}
                        </div>

                        {/* COA Redaction Upload */}
                        {sub.coa_path && sub.status === 'pending' && (
                          <div data-testid={`coa-redaction-${sub.id}`} className={`p-3 border ${sub.coa_redacted ? 'border-cannabis-green/30 bg-cannabis-green/5' : 'border-gold-500/30 bg-gold-500/5'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {sub.coa_redacted ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-cannabis-green" />
                                    <span className="text-cannabis-green text-xs font-bold uppercase tracking-widest">Redacted COA uploaded</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 text-gold-500" />
                                    <span className="text-gold-500 text-xs font-bold uppercase tracking-widest">Upload redacted COA before approving</span>
                                  </>
                                )}
                              </div>
                              <label
                                data-testid={`upload-redacted-coa-${sub.id}`}
                                className="cursor-pointer flex items-center gap-2 bg-zinc-900 border border-white/10 hover:border-gold-500/50 px-3 py-2 text-xs text-zinc-300 transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {sub.coa_redacted ? 'Replace' : 'Upload Redacted'}
                                <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const formData = new FormData();
                                  formData.append('coa', file);
                                  try {
                                    await axios.put(`${API}/admin/submissions/${sub.id}/redacted-coa`, formData, {
                                      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'multipart/form-data' }
                                    });
                                    toast.success('Redacted COA uploaded');
                                    fetchSubmissions(adminToken);
                                  } catch { toast.error('Failed to upload redacted COA'); }
                                  e.target.value = '';
                                }} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {sub.admin_price_per_gram && (
                      <div className="mb-4 bg-gold-500/10 border border-gold-500/30 p-3 inline-block">
                        <p className="text-gold-500 text-xs uppercase tracking-widest">Admin Price/Gram</p>
                        <p className="text-gold-500 font-mono font-bold">${sub.admin_price_per_gram}/g</p>
                      </div>
                    )}

                    {sub.admin_notes && (
                      <div className="mb-4">
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Admin Notes</p>
                        <p className="text-zinc-400 text-sm">{sub.admin_notes}</p>
                      </div>
                    )}

                    {/* Action Buttons for Pending */}
                    {sub.status === 'pending' && (
                      <>
                        {reviewingSubmission === sub.id ? (
                          <div className="border-t border-white/5 pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block font-manrope text-xs uppercase tracking-widest text-gold-500 mb-2">
                                  <DollarSign className="w-4 h-4 inline mr-1" /> Price per Gram (Admin Evaluation) *
                                </label>
                                <input
                                  data-testid={`price-per-gram-${sub.id}`}
                                  type="text"
                                  value={pricePerGram}
                                  onChange={(e) => setPricePerGram(e.target.value)}
                                  className="w-full bg-zinc-900/50 border border-gold-500/50 focus:border-gold-500 text-white h-12 px-4 outline-none"
                                  placeholder="e.g., 6.50"
                                />
                                <p className="text-zinc-600 text-xs mt-1">Sets price tier: &lt;$5 = $, $5-$8 = $$, $8+ = $$$</p>
                              </div>
                              <div>
                                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Admin Notes (optional)</label>
                                <input
                                  data-testid={`admin-notes-${sub.id}`}
                                  type="text"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                                  placeholder="Internal notes..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                data-testid={`approve-submission-${sub.id}`}
                                onClick={() => handleSubmissionAction(sub.id, 'approved')}
                                disabled={processingSubmission}
                                className="flex-1 bg-cannabis-green hover:bg-green-600 disabled:bg-zinc-700 text-white font-bold uppercase tracking-widest px-6 py-3 transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {processingSubmission ? 'Processing...' : 'Approve & Add to Catalog'}
                              </button>
                              <button
                                data-testid={`reject-submission-${sub.id}`}
                                onClick={() => handleSubmissionAction(sub.id, 'rejected')}
                                disabled={processingSubmission}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold uppercase tracking-widest px-6 py-3 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => { setReviewingSubmission(null); setPricePerGram(''); setAdminNotes(''); }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold uppercase tracking-widest px-6 py-3 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            data-testid={`review-submission-${sub.id}`}
                            onClick={() => setReviewingSubmission(sub.id)}
                            className="border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold uppercase tracking-widest px-6 py-3 transition-all flex items-center gap-2"
                          >
                            <ClipboardList className="w-4 h-4" />
                            Review & Authorize
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Directory Tab */}
        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Inquiry Hub</h2>
                <p className="text-zinc-500 text-sm">
                  {adminInquiries.length} total · {adminInquiries.filter(i => i.status === 'pending').length} pending response
                </p>
              </div>
              <div className="flex gap-3 items-center w-full md:w-auto">
                <input
                  data-testid="inquiry-hub-search"
                  type="text"
                  placeholder="Search by name, company, strain..."
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  className="bg-zinc-900 border border-white/10 focus:border-gold-500 text-white px-4 py-2 text-sm outline-none flex-1 md:w-64"
                />
                <select
                  data-testid="inquiry-hub-filter"
                  value={inquiryFilter}
                  onChange={(e) => setInquiryFilter(e.target.value)}
                  className="bg-zinc-900 border border-white/10 text-white px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="responded">Responded</option>
                  <option value="converted">Converted</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <SortButtons
              testPrefix="inquiries"
              sortState={inquiriesSort}
              onSort={makeSortHandler(setInquiriesSort)}
              options={[
                { key: 'created_at', label: 'Date' },
                { key: 'contact_name', label: 'Name' },
                { key: 'company_name', label: 'Company' },
                { key: 'status', label: 'Status' },
              ]}
            />

            {adminInquiries.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <Mail className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400">No inquiries yet</p>
                <p className="text-zinc-600 text-sm mt-1">Inquiries from users will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortData(adminInquiries
                  .filter(inq => {
                    if (inquiryFilter !== 'all' && inq.status !== inquiryFilter) return false;
                    if (inquirySearch) {
                      const q = inquirySearch.toLowerCase();
                      return (
                        (inq.contact_name || '').toLowerCase().includes(q) ||
                        (inq.company_name || '').toLowerCase().includes(q) ||
                        (inq.email || '').toLowerCase().includes(q) ||
                        (inq.strain_names || []).some(s => s.toLowerCase().includes(q)) ||
                        (inq.message || '').toLowerCase().includes(q)
                      );
                    }
                    return true;
                  }), inquiriesSort)
                  .map((inq) => (
                  <div 
                    key={inq.id} 
                    data-testid={`inquiry-card-${inq.id}`}
                    className={`bg-charcoal border ${inq.status === 'pending' ? 'border-gold-500/30' : 'border-white/5'} hover:border-white/15 transition-colors`}
                  >
                    {/* Inquiry Header */}
                    <div 
                      className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 cursor-pointer"
                      onClick={() => setExpandedInquiry(expandedInquiry === inq.id ? null : inq.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-white text-base truncate">{inq.contact_name}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                            inq.status === 'pending' ? 'bg-gold-500/20 text-gold-500' :
                            inq.status === 'responded' ? 'bg-cannabis-green/20 text-cannabis-green' :
                            inq.status === 'converted' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-zinc-700/30 text-zinc-500'
                          }`}>
                            {inq.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />{inq.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />{inq.email}
                          </span>
                          {inq.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />{inq.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-zinc-600 text-xs">
                          {inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(inq.strain_names || []).map((name, idx) => {
                            const strainId = (inq.strain_ids || [])[idx];
                            const volume = strainId && inq.strain_volumes ? inq.strain_volumes[strainId] : null;
                            return (
                              <span key={idx} className="bg-gold-500/10 border border-gold-500/20 text-gold-500 text-[10px] font-bold px-2 py-0.5">
                                {name}{volume ? ` · ${volume}kg` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {expandedInquiry === inq.id && (
                      <div className="border-t border-white/5 p-5 bg-zinc-900/30">
                        {/* Message */}
                        <div className="mb-5">
                          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2 font-bold">Message</p>
                          <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-900/50 border border-white/5 p-4">{inq.message}</p>
                        </div>

                        {/* Market of Interest */}
                        {inq.market_of_interest && (
                          <div className="mb-5">
                            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2 font-bold">Market of Interest</p>
                            <p className="text-gold-500 text-sm font-bold bg-gold-500/5 border border-gold-500/20 px-4 py-2">{inq.market_of_interest}</p>
                          </div>
                        )}

                        {/* User Account Details */}
                        {inq.user_id && (
                          <div className="mb-5">
                            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2 font-bold">Registered Account</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-zinc-600 text-[10px] uppercase">Name</p>
                                <p className="text-zinc-200">{inq.user_first_name || ''} {inq.user_last_name || ''}</p>
                              </div>
                              <div>
                                <p className="text-zinc-600 text-[10px] uppercase">Company</p>
                                <p className="text-zinc-200">{inq.user_company || inq.company_name}</p>
                              </div>
                              <div>
                                <p className="text-zinc-600 text-[10px] uppercase">Email</p>
                                <a href={`mailto:${inq.user_email || inq.email}`} className="text-gold-500 hover:underline">{inq.user_email || inq.email}</a>
                              </div>
                              <div>
                                <p className="text-zinc-600 text-[10px] uppercase">Phone</p>
                                <a href={`tel:${inq.user_phone || inq.phone}`} className="text-gold-500 hover:underline">{inq.user_phone || inq.phone || 'N/A'}</a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Strains Inquired About */}
                        <div className="mb-5">
                          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2 font-bold">Strains Requested ({(inq.strain_names || []).length})</p>
                          <div className="space-y-2">
                            {(inq.strain_names || []).map((name, idx) => {
                              const strainId = (inq.strain_ids || [])[idx];
                              const volume = strainId && inq.strain_volumes ? inq.strain_volumes[strainId] : null;
                              return (
                                <div key={idx} className="flex items-center justify-between bg-gold-500/5 border border-gold-500/20 px-4 py-2">
                                  <span className="text-gold-500 font-bold text-sm">{name}</span>
                                  {volume ? (
                                    <span className="text-white font-mono text-sm bg-gold-500/20 px-3 py-0.5">{volume} kg</span>
                                  ) : (
                                    <span className="text-zinc-600 text-xs italic">No volume specified</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Admin Notes */}
                        {inq.admin_notes && (
                          <div className="mb-5">
                            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2 font-bold">Admin Notes</p>
                            <p className="text-zinc-400 text-sm bg-zinc-900/50 border border-white/5 p-3">{inq.admin_notes}</p>
                          </div>
                        )}

                        {/* Action Area */}
                        <div className="border-t border-white/5 pt-4 mt-4">
                          <div className="flex flex-col md:flex-row gap-3">
                            <textarea
                              data-testid={`inquiry-notes-${inq.id}`}
                              value={expandedInquiry === inq.id ? inquiryNotes : ''}
                              onChange={(e) => setInquiryNotes(e.target.value)}
                              rows={2}
                              placeholder="Add a note (optional)..."
                              className="flex-1 bg-zinc-900 border border-white/10 focus:border-gold-500 text-white text-sm px-4 py-2 outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              {inq.status !== 'responded' && (
                                <button
                                  data-testid={`inquiry-respond-${inq.id}`}
                                  onClick={() => updateInquiryStatus(inq.id, 'responded', inquiryNotes)}
                                  disabled={processingInquiry === inq.id}
                                  className="bg-cannabis-green hover:bg-green-600 text-white px-5 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Responded
                                </button>
                              )}
                              {inq.status !== 'archived' && (
                                <button
                                  data-testid={`inquiry-archive-${inq.id}`}
                                  onClick={() => updateInquiryStatus(inq.id, 'archived', inquiryNotes)}
                                  disabled={processingInquiry === inq.id}
                                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-50"
                                >
                                  Archive
                                </button>
                              )}
                              {inq.status !== 'pending' && (
                                <button
                                  data-testid={`inquiry-reopen-${inq.id}`}
                                  onClick={() => updateInquiryStatus(inq.id, 'pending', inquiryNotes)}
                                  disabled={processingInquiry === inq.id}
                                  className="border border-gold-500/50 text-gold-500 hover:bg-gold-500/10 px-5 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-50"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Reopen
                                </button>
                              )}
                              {inq.status !== 'converted' && (
                                <button
                                  data-testid={`inquiry-convert-${inq.id}`}
                                  onClick={() => { setConvertingInquiry(inq); setConversionData({ sale_amount: '', total_grams: '', commission_type: '', commission_value: '' }); }}
                                  className="bg-gold-500 hover:bg-gold-400 text-black px-5 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
                                >
                                  Convert to Sale
                                </button>
                              )}
                              {inq.status === 'converted' && (
                                <span className="bg-gold-500/20 text-gold-500 px-4 py-2 text-xs font-bold uppercase tracking-widest">
                                  Converted — ${inq.sale_amount?.toLocaleString() || '0'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'directory' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Strain Directory</h2>
                <p className="text-zinc-500 text-sm">{directory.length} strains · Quick access to all documents & grower contacts</p>
              </div>
              <div className="flex gap-3 items-center w-full md:w-auto">
                <input
                  data-testid="directory-search"
                  type="text"
                  placeholder="Search strains..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="bg-zinc-900 border border-white/10 focus:border-gold-500 text-white px-4 py-2 text-sm outline-none flex-1 md:w-64"
                />
                <button
                  data-testid="directory-csv-export"
                  onClick={async () => {
                    try {
                      const response = await axios.get(`${API}/admin/strain-directory/csv`, {
                        headers: { Authorization: `Bearer ${adminToken}` },
                        responseType: 'blob'
                      });
                      const url = URL.createObjectURL(response.data);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `firegold_strain_directory_${new Date().toISOString().slice(0,10)}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('CSV downloaded');
                    } catch { toast.error('Failed to export CSV'); }
                  }}
                  className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
            <SortButtons
              testPrefix="directory"
              sortState={directorySort}
              onSort={makeSortHandler(setDirectorySort)}
              options={[
                { key: 'strain_name', label: 'Name' },
                { key: 'type', label: 'Type' },
                { key: 'thc_percentage', label: 'THC' },
                { key: 'lot_size', label: 'Lot Size' },
              ]}
            />

            {directory.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400">Loading directory...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortData(directory
                  .filter(s => !directorySearch || s.strain_name.toLowerCase().includes(directorySearch.toLowerCase())), directorySort)
                  .map((entry) => (
                  <div key={entry.id} data-testid={`directory-entry-${entry.id}`} className="bg-charcoal border border-white/5 hover:border-white/10 transition-colors">
                    {/* Strain Header */}
                    <div className="flex items-center gap-4 p-4 border-b border-white/5">
                      {entry.image_url && (
                        <img src={entry.image_url} alt={entry.strain_name} className="w-12 h-12 object-cover border border-white/10 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-cinzel font-bold text-lg text-white truncate">{entry.strain_name}</h3>
                        <p className="text-zinc-500 text-xs">{entry.type} · THC {entry.thc_percentage} · {entry.lot_size}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                      {/* Documents Column */}
                      <div className="p-4 border-b md:border-b-0 md:border-r border-white/5">
                        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3 font-bold">Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.coa_url ? (
                            <button
                              data-testid={`dir-coa-${entry.id}`}
                              onClick={() => {
                                const token = localStorage.getItem('userToken') || adminToken;
                                axios.get(`${API}/strains/${entry.id}/coa`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                  responseType: 'blob'
                                }).then(res => {
                                  const url = URL.createObjectURL(res.data);
                                  window.open(url, '_blank');
                                }).catch(() => toast.error('Unable to load COA'));
                              }}
                              className="flex items-center gap-2 bg-cannabis-green/15 border border-cannabis-green/40 hover:bg-cannabis-green/30 px-3 py-2 text-xs text-cannabis-green transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              COA
                            </button>
                          ) : (
                            <span className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-3 py-2 text-xs text-zinc-600">
                              <FileText className="w-3.5 h-3.5" />
                              No COA
                            </span>
                          )}
                          {entry.health_canada_license_path ? (
                            <button
                              data-testid={`dir-hc-${entry.id}`}
                              onClick={() => window.open(`${API}/files/${entry.health_canada_license_path.replace('/uploads/', '')}?token=${adminToken}`, '_blank')}
                              className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/40 hover:bg-blue-500/30 px-3 py-2 text-xs text-blue-400 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              HC License
                            </button>
                          ) : (
                            <span className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-3 py-2 text-xs text-zinc-600">
                              <FileText className="w-3.5 h-3.5" />
                              No HC License
                            </span>
                          )}
                          {entry.cra_license_path ? (
                            <button
                              data-testid={`dir-cra-${entry.id}`}
                              onClick={() => window.open(`${API}/files/${entry.cra_license_path.replace('/uploads/', '')}?token=${adminToken}`, '_blank')}
                              className="flex items-center gap-2 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/30 px-3 py-2 text-xs text-purple-400 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              CRA License
                            </button>
                          ) : (
                            <span className="flex items-center gap-2 bg-zinc-900 border border-white/5 px-3 py-2 text-xs text-zinc-600">
                              <FileText className="w-3.5 h-3.5" />
                              No CRA License
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grower/LP Contact Column */}
                      <div className="p-4">
                        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3 font-bold">Grower / LP Contact</p>
                        {entry.grower_name || entry.company_name ? (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Name</p>
                              <p className="text-zinc-200 text-sm">{entry.grower_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Company</p>
                              <p className="text-zinc-200 text-sm">{entry.company_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Email</p>
                              <a href={`mailto:${entry.grower_email}`} className="text-gold-500 text-sm hover:underline">{entry.grower_email || 'N/A'}</a>
                            </div>
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Phone</p>
                              <a href={`tel:${entry.grower_phone}`} className="text-gold-500 text-sm hover:underline">{entry.grower_phone || 'N/A'}</a>
                            </div>
                            <div className="col-span-2">
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">License #</p>
                              {entry.license_number ? (
                                <p className="text-zinc-200 text-sm font-mono">{entry.license_number}</p>
                              ) : editingDirectoryLicense === entry.id ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    data-testid={`dir-license-input-${entry.id}`}
                                    type="text"
                                    value={directoryLicenseForm.license_number || ''}
                                    onChange={(e) => setDirectoryLicenseForm(prev => ({ ...prev, license_number: e.target.value }))}
                                    className="flex-1 bg-zinc-900 border border-gold-500/50 text-white text-sm h-8 px-3 outline-none"
                                    placeholder="Enter license #"
                                    autoFocus
                                  />
                                  <button
                                    data-testid={`dir-license-save-${entry.id}`}
                                    onClick={() => updateDirectoryLicense(entry.id)}
                                    className="bg-gold-500 text-black px-3 h-8 text-xs font-bold uppercase"
                                  >Save</button>
                                  <button
                                    onClick={() => { setEditingDirectoryLicense(null); setDirectoryLicenseForm({}); }}
                                    className="bg-zinc-700 text-white px-3 h-8 text-xs"
                                  >Cancel</button>
                                </div>
                              ) : (
                                <button
                                  data-testid={`dir-add-license-${entry.id}`}
                                  onClick={() => {
                                    setEditingDirectoryLicense(entry.id);
                                    setDirectoryLicenseForm({ license_number: '', grower_company: entry.company_name || '', grower_name: entry.grower_name || '', grower_email: entry.grower_email || '' });
                                  }}
                                  className="text-gold-500 text-xs hover:underline cursor-pointer mt-1 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add License #
                                </button>
                              )}
                            </div>
                            {entry.gacp_compliant && (
                              <div>
                                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">GACP</p>
                                <p className={`text-sm font-medium ${entry.gacp_compliant === 'Yes' ? 'text-cannabis-green' : 'text-red-400'}`}>{entry.gacp_compliant}</p>
                              </div>
                            )}
                          </div>
                        ) : editingDirectoryLicense === entry.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={directoryLicenseForm.grower_company || ''} onChange={(e) => setDirectoryLicenseForm(prev => ({ ...prev, grower_company: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-700 text-white text-sm h-8 px-3 outline-none" placeholder="Company" />
                              <input type="text" value={directoryLicenseForm.grower_name || ''} onChange={(e) => setDirectoryLicenseForm(prev => ({ ...prev, grower_name: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-700 text-white text-sm h-8 px-3 outline-none" placeholder="Contact name" />
                              <input type="email" value={directoryLicenseForm.grower_email || ''} onChange={(e) => setDirectoryLicenseForm(prev => ({ ...prev, grower_email: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-700 text-white text-sm h-8 px-3 outline-none" placeholder="Email" />
                              <input type="text" value={directoryLicenseForm.license_number || ''} onChange={(e) => setDirectoryLicenseForm(prev => ({ ...prev, license_number: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-700 text-white text-sm h-8 px-3 outline-none" placeholder="License #" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => updateDirectoryLicense(entry.id)} className="bg-gold-500 text-black px-3 py-1.5 text-xs font-bold uppercase">Save</button>
                              <button onClick={() => { setEditingDirectoryLicense(null); setDirectoryLicenseForm({}); }} className="bg-zinc-700 text-white px-3 py-1.5 text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-zinc-600 text-sm italic">No grower info linked</p>
                            <button
                              data-testid={`dir-add-grower-${entry.id}`}
                              onClick={() => {
                                setEditingDirectoryLicense(entry.id);
                                setDirectoryLicenseForm({});
                              }}
                              className="text-gold-500 text-xs hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Info
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'messages' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Messages</h2>
                <p className="text-zinc-500 text-sm">{contactMessages.length} messages · {contactMessages.filter(m => m.status === 'unread').length} unread</p>
              </div>
              <div className="flex gap-2">
                {['all', 'unread', 'read', 'replied'].map(f => (
                  <button key={f} onClick={() => setMessagesFilter(f)}
                    data-testid={`messages-filter-${f}`}
                    className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all ${messagesFilter === f ? 'bg-gold-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Modal */}
            {replyingMessage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setReplyingMessage(null); setReplyText(''); }} />
                <div data-testid="reply-message-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-lg p-8">
                  <button onClick={() => { setReplyingMessage(null); setReplyText(''); }} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"><X className="w-5 h-5 text-black" /></button>
                  <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest mb-2">Reply</h2>
                  <p className="text-zinc-500 text-sm mb-4">To: {replyingMessage.name} ({replyingMessage.email})</p>
                  <div className="bg-zinc-900 border border-white/5 p-4 mb-4">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Original Message</p>
                    <p className="text-zinc-300 text-sm">{replyingMessage.message}</p>
                  </div>
                  <textarea
                    data-testid="reply-text-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={5}
                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white px-4 py-3 outline-none text-sm resize-none mb-4"
                  />
                  <button
                    data-testid="send-reply-btn"
                    onClick={handleReplyMessage}
                    disabled={sendingReply || !replyText.trim()}
                    className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-6 py-3 transition-all"
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            )}

            {sortData(
              contactMessages.filter(m => messagesFilter === 'all' || m.status === messagesFilter),
              messagesSort
            ).length === 0 ? (
              <div className="bg-zinc-900/30 border border-white/5 p-12 text-center">
                <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No messages found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Sort headers */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs uppercase tracking-widest text-zinc-600 border-b border-white/5">
                  <div className="col-span-2 cursor-pointer hover:text-gold-500" onClick={() => makeSortHandler(setMessagesSort)('name')}>
                    Name {messagesSort.key === 'name' && (messagesSort.dir === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-span-2 cursor-pointer hover:text-gold-500" onClick={() => makeSortHandler(setMessagesSort)('email')}>
                    Email {messagesSort.key === 'email' && (messagesSort.dir === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-span-1 cursor-pointer hover:text-gold-500" onClick={() => makeSortHandler(setMessagesSort)('company')}>
                    Company {messagesSort.key === 'company' && (messagesSort.dir === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-span-3">Message</div>
                  <div className="col-span-1 cursor-pointer hover:text-gold-500" onClick={() => makeSortHandler(setMessagesSort)('status')}>
                    Status {messagesSort.key === 'status' && (messagesSort.dir === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-span-1 cursor-pointer hover:text-gold-500" onClick={() => makeSortHandler(setMessagesSort)('created_at')}>
                    Date {messagesSort.key === 'created_at' && (messagesSort.dir === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {sortData(
                  contactMessages.filter(m => messagesFilter === 'all' || m.status === messagesFilter),
                  messagesSort
                ).map(msg => (
                  <div key={msg.id} data-testid={`message-row-${msg.id}`}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 border border-white/5 items-center transition-all hover:border-gold-500/30 ${msg.status === 'unread' ? 'bg-zinc-900/60 border-l-2 border-l-gold-500' : 'bg-zinc-900/20'}`}>
                    <div className="col-span-2">
                      <p className={`text-sm font-bold ${msg.status === 'unread' ? 'text-white' : 'text-zinc-400'}`}>{msg.name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-zinc-400 text-sm truncate">{msg.email}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-zinc-500 text-sm truncate">{msg.company || '—'}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-zinc-300 text-sm line-clamp-2">{msg.message}</p>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                        msg.status === 'unread' ? 'bg-gold-500/20 text-gold-500' : 
                        msg.status === 'replied' ? 'bg-cannabis-green/20 text-cannabis-green' : 
                        'bg-zinc-700/50 text-zinc-500'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <p className="text-zinc-600 text-xs">{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '—'}</p>
                    </div>
                    <div className="col-span-2 flex gap-2 justify-end">
                      {msg.status === 'unread' && (
                        <button data-testid={`mark-read-${msg.id}`} onClick={() => handleMarkRead(msg.id)}
                          className="text-zinc-400 hover:text-gold-500 transition-colors" title="Mark as read">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button data-testid={`reply-msg-${msg.id}`} onClick={() => { setReplyingMessage(msg); setReplyText(''); }}
                        className="text-zinc-400 hover:text-cannabis-green transition-colors" title="Reply">
                        <Send className="w-4 h-4" />
                      </button>
                      <button data-testid={`delete-msg-${msg.id}`} onClick={() => handleDeleteMessage(msg.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'bot-training' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Bot Training</h2>
                <p className="text-zinc-500 text-sm">{botTraining.length} custom Q&A entries — The chatbot uses these to answer visitor questions.</p>
              </div>
            </div>

            {/* Add New Entry Form */}
            <div className="bg-charcoal border border-white/10 p-6 mb-8" data-testid="add-training-form">
              <h3 className="font-cinzel font-bold text-sm text-gold-500 uppercase tracking-widest mb-4">Add Training Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  data-testid="training-category-select"
                  value={newTraining.category}
                  onChange={(e) => setNewTraining(prev => ({...prev, category: e.target.value}))}
                  className="bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                >
                  <option value="general">General</option>
                  <option value="pricing">Pricing</option>
                  <option value="products">Products</option>
                  <option value="compliance">Compliance</option>
                  <option value="shipping">Shipping & Logistics</option>
                  <option value="process">Process & How It Works</option>
                  <option value="custom">Custom Response</option>
                </select>
              </div>
              <div className="space-y-3 mb-4">
                <input
                  data-testid="training-question-input"
                  type="text"
                  placeholder="Question or topic (e.g., 'What are your payment terms?')"
                  value={newTraining.question}
                  onChange={(e) => setNewTraining(prev => ({...prev, question: e.target.value}))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none text-sm"
                />
                <textarea
                  data-testid="training-answer-input"
                  placeholder="How the bot should respond..."
                  value={newTraining.answer}
                  onChange={(e) => setNewTraining(prev => ({...prev, answer: e.target.value}))}
                  rows={3}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white px-4 py-3 outline-none text-sm resize-none"
                />
              </div>
              <button
                data-testid="add-training-btn"
                onClick={addTrainingEntry}
                disabled={!newTraining.question.trim() || !newTraining.answer.trim()}
                className="bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black font-bold uppercase tracking-widest px-6 py-3 text-sm transition-all"
              >
                <Plus className="w-4 h-4 inline mr-2" />Add Entry
              </button>
            </div>

            {/* Training Entries List */}
            {botTraining.length === 0 ? (
              <div className="bg-zinc-900/30 border border-white/5 p-12 text-center">
                <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No custom training data yet</p>
                <p className="text-zinc-600 text-sm">The chatbot uses built-in Firegold knowledge. Add custom Q&A pairs above to teach it your specific responses.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {botTraining.map(entry => (
                  <div key={entry.id} data-testid={`training-entry-${entry.id}`}
                    className="bg-charcoal border border-white/5 p-5 hover:border-gold-500/30 transition-all">
                    {editingTraining === entry.id ? (
                      <div className="space-y-3">
                        <select
                          value={entry.category || 'general'}
                          onChange={(e) => setBotTraining(prev => prev.map(t => t.id === entry.id ? {...t, category: e.target.value} : t))}
                          className="bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-10 px-3 outline-none text-sm"
                        >
                          <option value="general">General</option>
                          <option value="pricing">Pricing</option>
                          <option value="products">Products</option>
                          <option value="compliance">Compliance</option>
                          <option value="shipping">Shipping & Logistics</option>
                          <option value="process">Process & How It Works</option>
                          <option value="custom">Custom Response</option>
                        </select>
                        <input
                          type="text"
                          value={entry.question}
                          onChange={(e) => setBotTraining(prev => prev.map(t => t.id === entry.id ? {...t, question: e.target.value} : t))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-10 px-3 outline-none text-sm"
                        />
                        <textarea
                          value={entry.answer}
                          onChange={(e) => setBotTraining(prev => prev.map(t => t.id === entry.id ? {...t, answer: e.target.value} : t))}
                          rows={3}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white px-3 py-2 outline-none text-sm resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => updateTrainingEntry(entry)}
                            className="bg-cannabis-green/20 text-cannabis-green hover:bg-cannabis-green/30 px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all">
                            <Save className="w-3 h-3 inline mr-1" />Save
                          </button>
                          <button onClick={() => setEditingTraining(null)}
                            className="bg-zinc-800 text-zinc-400 hover:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gold-500/10 text-gold-500 border border-gold-500/20">
                              {entry.category || 'general'}
                            </span>
                          </div>
                          <p className="text-white font-bold text-sm mb-1">Q: {entry.question}</p>
                          <p className="text-zinc-400 text-sm">A: {entry.answer}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button data-testid={`edit-training-${entry.id}`} onClick={() => setEditingTraining(entry.id)}
                            className="text-zinc-500 hover:text-gold-500 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button data-testid={`delete-training-${entry.id}`} onClick={() => deleteTrainingEntry(entry.id)}
                            className="text-zinc-500 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Saved Lists Tab */}
        {activeTab === 'saved-lists' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">User Saved Lists</h2>
                <p className="text-zinc-500 text-sm">View all lists saved by users and analytics on common trends.</p>
              </div>
            </div>

            {loadingAdminLists ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 text-gold-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Analytics Summary */}
                {adminListsAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-charcoal border border-white/10 p-6">
                      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Lists</p>
                      <p className="text-white font-mono text-3xl font-bold">{adminListsAnalytics.total_lists}</p>
                    </div>
                    <div className="bg-charcoal border border-white/10 p-6">
                      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Saves</p>
                      <p className="text-white font-mono text-3xl font-bold">{adminListsAnalytics.total_saves}</p>
                    </div>
                    <div className="bg-charcoal border border-white/10 p-6">
                      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Unique Users</p>
                      <p className="text-white font-mono text-3xl font-bold">{adminListsAnalytics.unique_users}</p>
                    </div>
                  </div>
                )}

                {/* Top Strains & Effects */}
                {adminListsAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Top Saved Strains */}
                    <div className="bg-charcoal border border-white/10 p-6">
                      <h3 className="font-cinzel font-bold text-sm text-gold-500 uppercase tracking-widest mb-4">
                        <BarChart3 className="w-4 h-4 inline mr-2" />Most Saved Strains
                      </h3>
                      {adminListsAnalytics.top_strains?.length > 0 ? (
                        <div className="space-y-2">
                          {adminListsAnalytics.top_strains.map((s, i) => (
                            <div key={s.strain_id} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gold-500 font-mono text-xs w-5">{i + 1}.</span>
                                <span className="text-white text-sm">{s.strain_name}</span>
                                <span className="text-zinc-600 text-xs">({s.category})</span>
                              </div>
                              <span className="text-gold-500 font-mono text-sm font-bold">{s.save_count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-600 text-sm">No data yet</p>
                      )}
                    </div>

                    {/* Top Effects */}
                    <div className="bg-charcoal border border-white/10 p-6">
                      <h3 className="font-cinzel font-bold text-sm text-gold-500 uppercase tracking-widest mb-4">
                        <Activity className="w-4 h-4 inline mr-2" />Most Common Effects
                      </h3>
                      {adminListsAnalytics.top_effects?.length > 0 ? (
                        <div className="space-y-2">
                          {adminListsAnalytics.top_effects.map((e, i) => (
                            <div key={e.effect} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gold-500 font-mono text-xs w-5">{i + 1}.</span>
                                <span className="text-white text-sm">{e.effect}</span>
                              </div>
                              <span className="text-gold-500 font-mono text-sm font-bold">{e.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-600 text-sm">No data yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Category Breakdown */}
                {adminListsAnalytics?.category_breakdown?.length > 0 && (
                  <div className="bg-charcoal border border-white/10 p-6 mb-8">
                    <h3 className="font-cinzel font-bold text-sm text-gold-500 uppercase tracking-widest mb-4">Category Breakdown</h3>
                    <div className="flex flex-wrap gap-3">
                      {adminListsAnalytics.category_breakdown.map(c => (
                        <div key={c.category} className="bg-zinc-900/50 border border-zinc-700 px-4 py-2">
                          <p className="text-white text-sm font-bold">{c.category || 'Unknown'}</p>
                          <p className="text-gold-500 font-mono text-xs">{c.count} saves</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Lists */}
                <div className="bg-charcoal border border-white/10 p-6">
                  <h3 className="font-cinzel font-bold text-sm text-gold-500 uppercase tracking-widest mb-4">All User Lists ({adminLists.length})</h3>
                  {adminLists.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-8">No lists saved yet by users.</p>
                  ) : (
                    <div className="space-y-3">
                      {adminLists.map(list => (
                        <div key={list.id} data-testid={`admin-list-${list.id}`} className="bg-zinc-900/50 border border-zinc-800 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-manrope font-bold text-sm">{list.list_name}</h4>
                              <p className="text-zinc-500 text-xs mt-0.5">
                                {list.user_email} · {list.user_company} · {list.strain_count} strains · {new Date(list.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {list.strain_names && list.strain_names.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {list.strain_names.slice(0, 8).map((name, i) => (
                                <span key={i} className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5">{name}</span>
                              ))}
                              {list.strain_names.length > 8 && (
                                <span className="text-zinc-600 text-[10px] px-1.5 py-0.5">+{list.strain_names.length - 8} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
      {editingAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingAffiliate(null)} />
          <div data-testid="edit-affiliate-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-lg p-8">
            <button onClick={() => setEditingAffiliate(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"><X className="w-5 h-5 text-black" /></button>
            <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest mb-6">Edit Affiliate</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Name</label>
                  <input type="text" value={editingAffiliate.name} onChange={e => setEditingAffiliate(p => ({...p, name: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Email</label>
                  <input type="email" value={editingAffiliate.email} onChange={e => setEditingAffiliate(p => ({...p, email: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Phone</label>
                  <input type="text" value={editingAffiliate.phone || ''} onChange={e => setEditingAffiliate(p => ({...p, phone: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Company</label>
                  <input type="text" value={editingAffiliate.company || ''} onChange={e => setEditingAffiliate(p => ({...p, company: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Referral Code</label>
                <input type="text" value={editingAffiliate.referral_code} onChange={e => setEditingAffiliate(p => ({...p, referral_code: e.target.value.toUpperCase()}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm font-mono uppercase" />
              </div>
              <p className="text-zinc-500 text-xs">Commission is set per-deal when converting inquiries to sales.</p>
              <button onClick={saveAffiliateEdit} data-testid="save-affiliate-btn" className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest py-3 text-sm transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Inquiry Modal */}
      {convertingInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConvertingInquiry(null)} />
          <div data-testid="convert-inquiry-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-lg p-8">
            <button onClick={() => setConvertingInquiry(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"><X className="w-5 h-5 text-black" /></button>
            <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest mb-2">Convert to Sale</h2>
            <p className="text-zinc-400 text-sm mb-6">Inquiry from <span className="text-white">{convertingInquiry.contact_name}</span> — {convertingInquiry.company_name}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Sale Amount ($) *</label>
                  <input data-testid="convert-sale-amount" type="number" step="0.01" value={conversionData.sale_amount} onChange={e => setConversionData(p => ({...p, sale_amount: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm font-mono" placeholder="Total sale value" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Total Grams</label>
                  <input data-testid="convert-total-grams" type="number" step="0.01" value={conversionData.total_grams} onChange={e => setConversionData(p => ({...p, total_grams: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm font-mono" placeholder="Grams sold" />
                </div>
              </div>
              <div className="border border-gold-500/30 bg-gold-500/5 p-4">
                <label className="block text-xs uppercase tracking-widest text-gold-500 mb-3 font-bold">Affiliate Commission for this Deal *</label>
                <div className="grid grid-cols-2 gap-4">
                  <select data-testid="convert-commission-type" value={conversionData.commission_type} onChange={e => setConversionData(p => ({...p, commission_type: e.target.value}))} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm">
                    <option value="">Select type...</option>
                    <option value="per_gram">Per Gram ($)</option>
                    <option value="percentage">% of Deal</option>
                    <option value="flat_fee">Flat Fee ($)</option>
                  </select>
                  <input data-testid="convert-commission-value" type="number" step="0.01" value={conversionData.commission_value} onChange={e => setConversionData(p => ({...p, commission_value: e.target.value}))} className="bg-zinc-900 border border-zinc-700 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm font-mono" placeholder={conversionData.commission_type === 'per_gram' ? '$/gram' : conversionData.commission_type === 'percentage' ? '%' : conversionData.commission_type === 'flat_fee' ? 'Flat $' : 'Enter value'} />
                </div>
                {conversionData.commission_type && conversionData.commission_value && conversionData.sale_amount && (
                  <p className="text-gold-500 text-xs mt-2 font-mono">
                    Payout: ${conversionData.commission_type === 'per_gram' 
                      ? (parseFloat(conversionData.commission_value) * (parseFloat(conversionData.total_grams) || 0)).toFixed(2) 
                      : conversionData.commission_type === 'percentage' 
                        ? (parseFloat(conversionData.sale_amount) * parseFloat(conversionData.commission_value) / 100).toFixed(2) 
                        : parseFloat(conversionData.commission_value).toFixed(2)}
                  </p>
                )}
              </div>
              <button onClick={recordConversion} disabled={!conversionData.sale_amount || !conversionData.commission_type || !conversionData.commission_value} data-testid="confirm-conversion-btn" className="w-full bg-cannabis-green hover:bg-green-600 disabled:opacity-50 text-white font-bold uppercase tracking-widest py-3 text-sm transition-all">Confirm Sale Conversion</button>
            </div>
          </div>
        </div>
      )}

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }
        }}
      />
    </div>
  );
};

// Main Catalog Page
const CatalogPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', priceTier: '', minThc: null, search: '', grade: '', growingMethod: '', category: '', bcDd: false });
  const [selectedStrains, setSelectedStrains] = useState([]);
  const [viewingStrain, setViewingStrain] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleStrain, setSampleStrain] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showSaveListModal, setShowSaveListModal] = useState(false);
  const [saveListName, setSaveListName] = useState('');
  const [savingList, setSavingList] = useState(false);
  const [showMyLists, setShowMyLists] = useState(false);
  const [myLists, setMyLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // PWA Install prompt
  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone || localStorage.getItem('pwa_install_dismissed')) return;

    // Always show on mobile devices
    if (isMobile) {
      setShowInstallBanner(true);
    }

    if (!ios) {
      // Android/Desktop — also listen for the browser's install prompt
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Can't auto-install on iOS, just dismiss and let them follow instructions
      setShowInstallBanner(false);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Firegold app installed!');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  const handleShareWithBuyer = async () => {
    setShowShareModal(true);
    if (myReferralCode) return; // Already fetched
    setLoadingReferral(true);
    try {
      const response = await axios.get(`${API}/auth/my-referral`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setMyReferralCode(response.data.referral_code);
    } catch (err) {
      toast.error('Failed to generate referral link');
    } finally {
      setLoadingReferral(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${myReferralCode}`;
    navigator.clipboard.writeText(link);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
    toast.success('Link copied to clipboard!');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in name, email, and message');
      return;
    }
    setContactSending(true);
    try {
      await axios.post(`${API}/contact`, contactForm);
      toast.success('Message sent! We\'ll be in touch soon.');
      setContactForm({ name: '', email: '', company: '', message: '' });
      setShowContactModal(false);
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setContactSending(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const user = localStorage.getItem('userData');
    if (token && user) {
      verifyAuth(token, JSON.parse(user));
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifyAuth = async (token, user) => {
    try {
      await axios.get(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserToken(token);
      setUserData(user);
      setIsAuthenticated(true);
      fetchStrains(token);
      // Track page view
      trackEvent('page_view', { page: 'catalog' });
    } catch (err) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuth = (token, user) => {
    setUserToken(token);
    setUserData(user);
    setIsAuthenticated(true);
    fetchStrains(token);
    // Replace history so back button doesn't go to login
    window.history.replaceState({ page: 'catalog' }, '', '/');
    trackEvent('page_view', { page: 'catalog', event_data: { first_visit: true } });
  };

  const handleLogout = () => {
    trackEvent('logout', { page: 'catalog' });
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUserToken(null);
    setUserData(null);
    setIsAuthenticated(false);
    setStrains([]);
    window.history.replaceState({ page: 'login' }, '', '/');
  };

  // Handle browser back button for internal views
  useEffect(() => {
    const handlePopState = (e) => {
      if (viewingStrain) {
        e.preventDefault();
        setViewingStrain(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingStrain]);

  const fetchStrains = async (token) => {
    try {
      const response = await axios.get(`${API}/strains`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStrains(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        toast.error('Failed to load catalog');
      }
    } finally {
      setLoading(false);
    }
  };

  // Track filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (newFilters.type || newFilters.priceTier || newFilters.minThc || newFilters.grade) {
      trackEvent('filter_apply', {
        filters_applied: {
          type: newFilters.type || null,
          price_tier: newFilters.priceTier || null,
          min_thc: newFilters.minThc || null,
          grade: newFilters.grade || null
        }
      });
    }
  };

  // Track search
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    if (searchTerm && searchTerm.length > 2) {
      trackEvent('search', { search_query: searchTerm });
    }
  };

  // Track strain view
  const handleViewStrain = (strain) => {
    setViewingStrain(strain);
    window.history.pushState({ view: 'strain' }, '', '/');
    trackEvent('strain_view', {
      strain_id: strain.id,
      strain_name: strain.strain_name,
      thc_percentage: strain.thc_percentage,
      strain_type: strain.type,
      price_tier: strain.price_tier
    });
  };

  // Track strain card click
  const handleStrainClick = (strain) => {
    trackEvent('strain_click', {
      strain_id: strain.id,
      strain_name: strain.strain_name,
      strain_type: strain.type,
      price_tier: strain.price_tier
    });
    handleViewStrain(strain);
  };

  const filteredStrains = useMemo(() => {
    return strains.filter(strain => {
      if (filters.type && !strain.type.toLowerCase().includes(filters.type.toLowerCase())) return false;
      if (filters.priceTier && strain.price_tier !== filters.priceTier) return false;
      if (filters.search && !strain.strain_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.minThc) {
        const thcVal = parseFloat(strain.thc_percentage.replace('%', '').replace('+', ''));
        if (thcVal < filters.minThc) return false;
      }
      if (filters.grade) {
        const gradeKey = `grade_${filters.grade.toLowerCase()}_kg`;
        if (!strain[gradeKey] || strain[gradeKey] <= 0) return false;
      }
      if (filters.growingMethod && strain.growing_method !== filters.growingMethod) return false;
      if (filters.category && strain.category !== filters.category) return false;
      if (filters.bcDd && !strain.bc_dd_compliant) return false;
      if (filters.selectedEffects && filters.selectedEffects.length > 0) {
        const strainEffects = Array.isArray(strain.effects)
          ? strain.effects
          : (typeof strain.effects === 'string' ? strain.effects.split(',').map(e => e.trim()) : []);
        const hasAll = filters.selectedEffects.every(e => strainEffects.includes(e));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [strains, filters]);

  const toggleStrainSelection = (strainId) => {
    const strain = strains.find(s => s.id === strainId);
    if (strain) {
      trackEvent('strain_select', {
        strain_id: strain.id,
        strain_name: strain.strain_name,
        strain_type: strain.type,
        price_tier: strain.price_tier
      });
    }
    setSelectedStrains(prev => 
      prev.includes(strainId) 
        ? prev.filter(id => id !== strainId)
        : [...prev, strainId]
    );
  };

  const handleRequestSample = (strain) => {
    trackEvent('sample_request_start', {
      strain_id: strain.id,
      strain_name: strain.strain_name,
      strain_type: strain.type
    });
    setViewingStrain(null);
    setSampleStrain(strain);
    setShowSampleModal(true);
  };

  const handleOpenInquiry = () => {
    trackEvent('inquiry_start', {
      strains_count: selectedStrains.length,
      strain_ids: selectedStrains
    });
    setShowInquiryModal(true);
  };

  // Saved Lists functions
  const fetchMyLists = async () => {
    setLoadingLists(true);
    try {
      const res = await axios.get(`${API}/user/lists`, { headers: { Authorization: `Bearer ${userToken}` } });
      setMyLists(res.data);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    }
    setLoadingLists(false);
  };

  const handleSaveList = async () => {
    if (!saveListName.trim()) { toast.error('Please enter a list name'); return; }
    const strainIds = filteredStrains.map(s => s.id);
    if (strainIds.length === 0) { toast.error('No strains to save'); return; }
    setSavingList(true);
    try {
      await axios.post(`${API}/user/lists`, {
        list_name: saveListName.trim(),
        strain_ids: strainIds,
        filters_applied: filters
      }, { headers: { Authorization: `Bearer ${userToken}` } });
      toast.success(`List "${saveListName}" saved with ${strainIds.length} strains!`);
      setShowSaveListModal(false);
      setSaveListName('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save list');
    }
    setSavingList(false);
  };

  const handleDeleteList = async (listId, listName) => {
    if (!window.confirm(`Delete "${listName}"?`)) return;
    try {
      await axios.delete(`${API}/user/lists/${listId}`, { headers: { Authorization: `Bearer ${userToken}` } });
      setMyLists(prev => prev.filter(l => l.id !== listId));
      toast.success('List deleted');
    } catch (err) {
      toast.error('Failed to delete list');
    }
  };

  const handleDownloadCsv = async (listId, listName) => {
    try {
      const res = await axios.get(`${API}/user/lists/${listId}/csv`, {
        headers: { Authorization: `Bearer ${userToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `firegold_${listName.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error('Failed to download CSV');
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div data-testid="catalog-page" className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-28 w-auto" />
        </div>
        
        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search strains..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-10 pl-10 pr-4 transition-colors outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowContactModal(true)}
            data-testid="contact-us-btn"
            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-gold-500 transition-colors"
            title="Contact Us"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-manrope">Contact</span>
          </button>
          <a
            href="/submit-strain"
            data-testid="submit-strain-cta"
            className="hidden md:flex items-center gap-2 border-2 border-cannabis-green text-cannabis-green hover:bg-cannabis-green hover:text-white font-bold uppercase tracking-widest px-5 py-2 text-xs transition-all"
          >
            <Leaf className="w-4 h-4" />
            Submit Your Product
          </a>
          <a
            href="https://www.instagram.com/my_firegold?igsh=ZjYxOHB1cnh6ZmJl"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="instagram-link-desktop"
            className="hidden md:flex items-center justify-center w-10 h-10 border border-zinc-700 hover:border-pink-500 text-zinc-300 hover:text-pink-400 transition-all"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <button
            onClick={handleShareWithBuyer}
            data-testid="share-buyer-btn"
            className="hidden md:flex items-center gap-2 border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold uppercase tracking-widest px-5 py-2 text-xs transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share with Buyer
          </button>
          {selectedStrains.length > 0 && (
            <button
              data-testid="open-inquiry-btn"
              onClick={handleOpenInquiry}
              className="bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-6 py-2 text-sm transition-all"
            >
              Inquire ({selectedStrains.length})
            </button>
          )}
          {userData && (
            <div className="flex items-center gap-4">
              <span className="text-zinc-400 text-sm hidden md:block">
                {userData.first_name} · {userData.company}
              </span>
              <button 
                onClick={handleLogout}
                data-testid="user-logout-btn"
                className="text-zinc-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
          <button 
            data-testid="mobile-menu-btn"
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 hover:border-gold-500 transition-all"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <Menu className="w-5 h-5 text-gold-500" />
            <span className="text-gold-500 text-xs font-manrope font-bold uppercase tracking-widest">Filter</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-12 relative flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1647268465509-f0229a865b6f)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
          <img 
            src={FIREGOLD_MARKETPLACE_LOGO} 
            alt="Firegold Marketplace" 
            data-testid="hero-marketplace-logo"
            className="h-48 sm:h-64 md:h-80 lg:h-96 w-auto mb-0" 
            style={{ mixBlendMode: 'lighten' }} 
          />
          <h1 className="font-cinzel font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gold-grad tracking-tight mb-2 -mt-4">
            Canadian Craft Cannabis Market
          </h1>
          <p className="font-manrope text-zinc-400 text-lg md:text-xl max-w-2xl">
            Premium wholesale cannabis flower for discerning B2B partners
          </p>
          <p className="font-manrope text-gold-500/60 text-base md:text-lg mt-4">
            {new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()} Catalog
          </p>
        </div>
      </section>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div data-testid="pwa-install-banner" className="bg-gold-500/15 border-y border-gold-500/30 py-3 px-4 md:px-6">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/firegold_icon_192.png" alt="Firegold" className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-manrope text-sm font-bold">Install Firegold App</p>
                {isIOS ? (
                  <p className="text-zinc-300 text-xs">
                    Tap <span className="inline-flex items-center text-gold-500 font-bold">
                      <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      Share
                    </span> then <span className="text-gold-500 font-bold">"Add to Home Screen"</span>
                  </p>
                ) : (
                  <p className="text-zinc-400 text-xs hidden md:block">Quick access from your home screen — no app store needed</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isIOS && (
                <button
                  data-testid="pwa-install-btn"
                  onClick={handleInstallClick}
                  className="bg-gold-500 text-black font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-gold-400 transition-all"
                >
                  Install
                </button>
              )}
              <button
                data-testid="pwa-dismiss-btn"
                onClick={dismissInstallBanner}
                className="w-8 h-8 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-12 pb-24">
        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative w-full mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              data-testid="mobile-search-input"
              type="text"
              placeholder="Search strains..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 pl-10 pr-4 transition-colors outline-none"
            />
          </div>
          <a
            href="/submit-strain"
            data-testid="submit-strain-cta-mobile"
            className="flex items-center justify-center gap-2 border-2 border-cannabis-green text-cannabis-green font-bold uppercase tracking-widest px-5 py-3 text-xs transition-all w-full"
          >
            <Leaf className="w-4 h-4" />
            Submit Your Product
          </a>
          <button
            onClick={handleShareWithBuyer}
            data-testid="share-buyer-btn-mobile"
            className="flex items-center justify-center gap-2 border-2 border-gold-500 text-gold-500 font-bold uppercase tracking-widest px-5 py-3 text-xs transition-all w-full"
          >
            <Share2 className="w-4 h-4" />
            Share with Buyer
          </button>
        </div>

        <div className="flex gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 overflow-y-auto pr-2 scrollbar-thin pb-8" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
              <div className="flex items-center gap-2 mb-8">
                <Filter className="w-4 h-4 text-gold-500" />
                <h2 className="font-manrope font-semibold text-sm uppercase tracking-widest text-zinc-400">Filters</h2>
              </div>
              <FilterSidebar filters={filters} setFilters={handleFilterChange} strains={strains} />
            </div>
          </aside>

          {/* Mobile Filters */}
          {mobileFiltersOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/95 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-manrope font-semibold text-lg text-white">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all">
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>
              <FilterSidebar filters={filters} setFilters={setFilters} strains={strains} />
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full mt-8 bg-gold-500 text-black font-bold uppercase tracking-widest px-6 py-4"
              >
                Apply Filters
              </button>
              <button 
                onClick={() => { setMobileFiltersOpen(false); setShowContactModal(true); }}
                data-testid="mobile-contact-btn"
                className="w-full mt-4 border border-gold-500 text-gold-500 font-bold uppercase tracking-widest px-6 py-4 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Contact Us
              </button>
              <a
                href="https://www.instagram.com/my_firegold?igsh=ZjYxOHB1cnh6ZmJl"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="instagram-link-mobile"
                className="w-full mt-4 border border-pink-500/50 text-pink-400 font-bold uppercase tracking-widest px-6 py-4 flex items-center justify-center gap-2 hover:bg-pink-500/10 transition-all"
              >
                <Instagram className="w-5 h-5" /> Follow Us on Instagram
              </a>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <p className="text-zinc-500 text-sm">
                Showing <span className="text-white font-mono">{filteredStrains.length}</span> of {strains.length} strains
              </p>
              <div className="flex items-center gap-3">
                <button
                  data-testid="save-list-btn"
                  onClick={() => setShowSaveListModal(true)}
                  className="flex items-center gap-1.5 text-gold-500 hover:text-gold-400 text-xs uppercase tracking-widest font-manrope font-bold transition-colors border border-gold-500/30 px-3 py-1.5 hover:border-gold-500"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save List
                </button>
                <button
                  data-testid="my-lists-btn"
                  onClick={() => { setShowMyLists(true); fetchMyLists(); }}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-gold-500 text-xs uppercase tracking-widest font-manrope font-bold transition-colors border border-zinc-700 px-3 py-1.5 hover:border-gold-500/50"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  My Lists
                </button>
                {selectedStrains.length > 0 && (
                  <button
                    data-testid="clear-selection-btn"
                    onClick={() => setSelectedStrains([])}
                    className="text-zinc-500 hover:text-gold-500 text-sm transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-charcoal animate-pulse" />
                ))}
              </div>
            ) : filteredStrains.length === 0 ? (
              <div className="text-center py-16">
                <Flame className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No strains match your filters</p>
                <button 
                  onClick={() => setFilters({ type: '', priceTier: '', minThc: null, search: '', grade: '', growingMethod: '', category: '', bcDd: false })}
                  className="mt-4 text-gold-500 hover:text-gold-400 text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStrains.map((strain) => (
                  <StrainCard 
                    key={strain.id}
                    strain={strain}
                    onSelect={toggleStrainSelection}
                    isSelected={selectedStrains.includes(strain.id)}
                    onViewDetails={handleStrainClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 relative z-10 bg-obsidian">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-28 w-auto" />
          <div className="text-center md:text-right">
            <p className="text-zinc-500 text-sm">The Firegold Standard</p>
            <p className="text-zinc-600 text-xs mt-1">© 2026 Firegold Brands. Premium B2B Cannabis Wholesale.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StrainDetailModal 
        strain={viewingStrain}
        onClose={() => setViewingStrain(null)}
        onAddToInquiry={toggleStrainSelection}
        isInInquiry={viewingStrain ? selectedStrains.includes(viewingStrain.id) : false}
        onRequestSample={handleRequestSample}
      />

      <SampleRequestModal
        isOpen={showSampleModal}
        onClose={() => {
          setShowSampleModal(false);
          setSampleStrain(null);
        }}
        strain={sampleStrain}
        userData={userData}
        userToken={userToken}
      />

      <InquiryModal 
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        selectedStrains={selectedStrains}
        strains={strains}
        userData={userData}
        userToken={userToken}
      />

      {/* Contact Us Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
          <div data-testid="contact-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-lg p-8">
            <button 
              onClick={() => setShowContactModal(false)} 
              data-testid="contact-modal-close"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-gold-500" />
              <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest">Contact Us</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-6">Leave a message and our team will get back to you shortly.</p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Name *</label>
                <input
                  data-testid="contact-name-input"
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Email *</label>
                <input
                  data-testid="contact-email-input"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Company</label>
                <input
                  data-testid="contact-company-input"
                  type="text"
                  value={contactForm.company}
                  onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                  placeholder="Company name (optional)"
                />
              </div>
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Message *</label>
                <textarea
                  data-testid="contact-message-input"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white px-4 py-3 outline-none text-sm min-h-[120px] resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                data-testid="contact-submit-btn"
                disabled={contactSending}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold uppercase tracking-widest py-3 text-sm transition-all"
              >
                {contactSending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share with Buyer Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div data-testid="share-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-md p-8">
            <button 
              onClick={() => setShowShareModal(false)} 
              data-testid="share-modal-close"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-6 h-6 text-gold-500" />
              <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest">Share with Buyer</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              Share this link with your buyer. When they register, they'll automatically be linked to your account.
            </p>
            {loadingReferral ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-gold-500 animate-spin" />
              </div>
            ) : myReferralCode ? (
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-700 p-4 flex items-center justify-between gap-3">
                  <div className="overflow-hidden">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Your Referral Link</p>
                    <p data-testid="referral-link" className="text-gold-500 font-mono text-sm truncate">
                      {window.location.origin}/?ref={myReferralCode}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    data-testid="copy-referral-btn"
                    className="flex-shrink-0 bg-gold-500 hover:bg-gold-400 text-black px-4 py-2 font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2"
                  >
                    {referralCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {referralCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Your Code</p>
                  <p className="text-white font-mono font-bold text-lg">{myReferralCode}</p>
                </div>
                <p className="text-zinc-600 text-xs mt-2">
                  When your buyer registers through this link, they will be connected to you as their referral contact.
                </p>
              </div>
            ) : (
              <p className="text-red-500 text-sm">Failed to generate referral link. Please try again.</p>
            )}
          </div>
        </div>
      )}

      {/* Save List Modal */}
      {showSaveListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSaveListModal(false)} />
          <div data-testid="save-list-modal" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-md p-8">
            <button 
              onClick={() => setShowSaveListModal(false)} 
              data-testid="save-list-modal-close"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <BookmarkPlus className="w-6 h-6 text-gold-500" />
              <h2 className="font-cinzel font-bold text-xl text-white uppercase tracking-widest">Save Current List</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-2">
              Save the current view of <span className="text-white font-mono">{filteredStrains.length}</span> strains to your profile.
            </p>
            {Object.values(filters).some(v => v && v !== false) && (
              <div className="flex flex-wrap gap-1 mb-4">
                {filters.category && <span className="bg-gold-500/10 text-gold-500 text-[10px] px-2 py-0.5 border border-gold-500/30">{filters.category}</span>}
                {filters.type && <span className="bg-gold-500/10 text-gold-500 text-[10px] px-2 py-0.5 border border-gold-500/30">{filters.type}</span>}
                {filters.growingMethod && <span className="bg-gold-500/10 text-gold-500 text-[10px] px-2 py-0.5 border border-gold-500/30">{filters.growingMethod}</span>}
                {filters.minThc && <span className="bg-gold-500/10 text-gold-500 text-[10px] px-2 py-0.5 border border-gold-500/30">THC {filters.minThc}%+</span>}
                {(filters.selectedEffects || []).map(e => <span key={e} className="bg-gold-500/10 text-gold-500 text-[10px] px-2 py-0.5 border border-gold-500/30">{e}</span>)}
              </div>
            )}
            <div className="mb-6">
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">List Name *</label>
              <input
                data-testid="save-list-name-input"
                type="text"
                value={saveListName}
                onChange={(e) => setSaveListName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-11 px-4 outline-none text-sm"
                placeholder="e.g., March 2026 Sativa Picks"
                autoFocus
              />
            </div>
            <button
              data-testid="save-list-confirm-btn"
              onClick={handleSaveList}
              disabled={savingList}
              className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-6 py-3 text-sm transition-all disabled:opacity-50"
            >
              {savingList ? 'Saving...' : `Save ${filteredStrains.length} Strains`}
            </button>
          </div>
        </div>
      )}

      {/* My Lists Panel */}
      {showMyLists && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMyLists(false)} />
          <div data-testid="my-lists-panel" className="relative bg-zinc-950 border border-zinc-800 w-full max-w-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-gold-500" />
                <h2 className="font-cinzel font-bold text-lg text-white uppercase tracking-widest">My Saved Lists</h2>
              </div>
              <button 
                onClick={() => setShowMyLists(false)}
                data-testid="my-lists-close"
                className="w-10 h-10 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingLists ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-gold-500 animate-spin" />
                </div>
              ) : myLists.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No saved lists yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Use "Save List" to save your current catalog view</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myLists.map(list => (
                    <div key={list.id} data-testid={`saved-list-${list.id}`} className="bg-zinc-900/50 border border-zinc-800 p-4 hover:border-gold-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-white font-manrope font-bold text-sm">{list.list_name}</h3>
                          <p className="text-zinc-500 text-xs mt-0.5">{list.strain_count} strains · {new Date(list.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            data-testid={`download-list-${list.id}`}
                            onClick={() => handleDownloadCsv(list.id, list.list_name)}
                            className="flex items-center gap-1 text-gold-500 hover:text-gold-400 text-xs border border-gold-500/30 px-2 py-1 hover:border-gold-500 transition-all"
                            title="Download CSV"
                          >
                            <Download className="w-3 h-3" /> CSV
                          </button>
                          <button
                            data-testid={`delete-list-${list.id}`}
                            onClick={() => handleDeleteList(list.id, list.list_name)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                            title="Delete list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {list.strain_names && list.strain_names.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {list.strain_names.slice(0, 6).map((name, i) => (
                            <span key={i} className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5">{name}</span>
                          ))}
                          {list.strain_names.length > 6 && (
                            <span className="text-zinc-600 text-[10px] px-1.5 py-0.5">+{list.strain_names.length - 6} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }
        }}
      />
    </div>
  );
};

const ResetPasswordPage = () => {
  const [token] = useState(new URLSearchParams(window.location.search).get('token'));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      <div className="bg-charcoal border border-white/10 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-cinzel font-bold text-2xl text-gold-500 tracking-widest">FIREGOLD</h1>
          <p className="text-zinc-500 text-xs tracking-widest mt-1">MARKETPLACE</p>
        </div>
        {!token ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">Invalid reset link. No token found.</p>
            <a href="/" className="text-gold-500 hover:text-gold-400 text-sm uppercase tracking-widest">Back to Login</a>
          </div>
        ) : success ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-cannabis-green mx-auto mb-4" />
            <h2 className="text-white text-lg font-bold mb-2">Password Reset!</h2>
            <p className="text-zinc-400 text-sm mb-6">Your password has been updated. You can now log in.</p>
            <a href="/" className="bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-8 py-3 text-sm transition-all inline-block">Go to Login</a>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <h2 className="font-cinzel font-bold text-lg text-white uppercase tracking-widest text-center mb-4">Set New Password</h2>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">New Password</label>
              <input data-testid="reset-password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="New password" required />
            </div>
            <div>
              <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Confirm Password</label>
              <input data-testid="reset-confirm-input" type="password" value={confirmPassword} onChange={e => setConfirmPw(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="Confirm password" required />
            </div>
            <button type="submit" disabled={loading} data-testid="reset-submit-btn" className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold uppercase tracking-widest py-3 text-sm transition-all">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', text: 'Welcome to Firegold. How can I help you today? Whether you\'re looking to buy premium wholesale cannabis flower or submit your product, I\'m here to assist.' }]);
    }
  }, [isOpen, messages.length]);

  const quickReplies = [
    { label: 'View Catalog', msg: 'How do I view your cannabis catalog?' },
    { label: 'Submit Product', msg: 'I\'m a grower and want to submit my product' },
    { label: 'Pricing Info', msg: 'How does your pricing work?' },
    { label: 'Export Markets', msg: 'What international markets do you support?' },
    { label: 'Contact Sales', msg: 'I\'d like to speak with someone from the Firegold team' }
  ];

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const resp = await axios.post(`${API}/chat`, {
        message: userMsg,
        session_id: sessionId
      });
      setSessionId(resp.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', text: resp.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'I apologize, but I\'m having trouble connecting right now. Please try again or reach out to us at warren@firegold.ca.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="chat-widget">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] h-[520px] bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: 'fadeIn 0.2s ease-out' }} data-testid="chat-window">
          {/* Header */}
          <div className="bg-charcoal border-b border-zinc-800 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gold-500" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Firegold Assistant</p>
                <p className="text-cannabis-green text-[10px] uppercase tracking-widest">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-7 h-7 flex items-center justify-center bg-gold-500 hover:bg-gold-400 transition-all" data-testid="chat-close-btn">
              <Minimize2 className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gold-500/20 text-gold-100 border border-gold-500/30' 
                    : 'bg-zinc-900 text-zinc-300 border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-white/5 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 flex-shrink-0">
            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="px-3 pt-3 flex flex-wrap gap-1.5" data-testid="quick-replies">
                {quickReplies.map((qr, idx) => (
                  <button key={idx} data-testid={`quick-reply-${idx}`}
                    onClick={() => { setInput(qr.msg); }}
                    className="text-[11px] bg-gold-500/10 border border-gold-500/30 text-gold-400 hover:bg-gold-500/20 px-3 py-1.5 transition-all whitespace-nowrap">
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
            <div className="p-3 flex gap-2">
            <input
              data-testid="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white text-sm px-4 py-3 outline-none"
            />
            <button
              data-testid="chat-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 text-black px-4 py-3 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        data-testid="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 flex items-center justify-center shadow-lg transition-all ${
          isOpen ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black'
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
};

// Notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio not available
  }
};

// Affiliate Dashboard Component
const AffiliateDashboard = () => {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const resp = await axios.get(`${API}/affiliate/dashboard/${code}`);
        setData(resp.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Dashboard not found');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [code]);

  if (loading) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="text-gold-500 font-mono text-sm animate-pulse">Loading dashboard...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      <div className="bg-charcoal border border-white/10 p-12 text-center max-w-md">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="font-cinzel font-bold text-xl text-white mb-2">Not Found</h2>
        <p className="text-zinc-500 text-sm">{error}</p>
        <a href="/" className="inline-block mt-6 text-gold-500 text-sm hover:underline">← Back to Marketplace</a>
      </div>
    </div>
  );

  const { stats, recent_events } = data;

  const formatCommission = () => {
    if (data.commission_type === 'per_gram') return `$${data.commission_value}/gram`;
    if (data.commission_type === 'percentage') return `${data.commission_value}%`;
    return `$${data.commission_value} flat`;
  };

  return (
    <div className="min-h-screen bg-obsidian" data-testid="affiliate-dashboard">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={FIREGOLD_LOGO} alt="Firegold" className="h-12 w-auto" />
            <div>
              <h1 className="font-cinzel font-bold text-xl text-white">Affiliate Dashboard</h1>
              <p className="text-zinc-500 text-sm font-mono">{data.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ${data.is_active ? 'bg-cannabis-green/20 text-cannabis-green border border-cannabis-green/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {data.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="text-zinc-600 text-xs font-mono">CODE: {data.referral_code}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-charcoal border border-white/5 p-6" data-testid="stat-referrals">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Referrals</p>
            <p className="font-cinzel font-bold text-3xl text-white">{stats.total_referrals}</p>
          </div>
          <div className="bg-charcoal border border-white/5 p-6" data-testid="stat-conversions">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Conversions</p>
            <p className="font-cinzel font-bold text-3xl text-cannabis-green">{stats.total_conversions}</p>
          </div>
          <div className="bg-charcoal border border-white/5 p-6" data-testid="stat-revenue">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Revenue Generated</p>
            <p className="font-cinzel font-bold text-3xl text-white">${stats.total_revenue.toLocaleString()}</p>
          </div>
          <div className="bg-charcoal border border-white/5 p-6" data-testid="stat-commission">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total Commission</p>
            <p className="font-cinzel font-bold text-3xl text-gold-500">${stats.total_commission.toLocaleString()}</p>
          </div>
        </div>

        {/* Commission Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-charcoal border border-white/5 p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Commission Rate</p>
            <p className="text-white font-bold text-lg">{formatCommission()}</p>
          </div>
          <div className="bg-charcoal border border-white/5 p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Pending Commission</p>
            <p className="text-gold-500 font-bold text-lg">${stats.pending_commission.toLocaleString()}</p>
          </div>
          <div className="bg-charcoal border border-white/5 p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Paid Commission</p>
            <p className="text-cannabis-green font-bold text-lg">${stats.paid_commission.toLocaleString()}</p>
          </div>
        </div>

        {/* Your Referral Link */}
        <div className="bg-charcoal border border-gold-500/30 p-6 mb-10">
          <p className="text-gold-500 text-xs uppercase tracking-widest font-bold mb-3">Your Referral Link</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-black/40 border border-white/10 text-zinc-300 px-4 py-3 text-sm font-mono truncate" data-testid="referral-link">
              {window.location.origin}/?ref={data.referral_code}
            </code>
            <button
              data-testid="copy-referral-link-btn"
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${data.referral_code}`); toast.success('Link copied!'); }}
              className="bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-6 py-3 text-sm transition-all whitespace-nowrap"
            >
              <Copy className="w-4 h-4 inline mr-2" />Copy
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="font-cinzel font-bold text-xl text-white mb-6">Recent Activity</h2>
          {recent_events.length === 0 ? (
            <div className="bg-zinc-900/30 border border-white/5 p-12 text-center">
              <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No activity yet. Share your referral link to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent_events.map((event, idx) => (
                <div key={idx} className="bg-charcoal border border-white/5 px-6 py-4 flex items-center justify-between" data-testid={`event-row-${idx}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center ${event.type === 'conversion' ? 'bg-cannabis-green/20' : 'bg-gold-500/20'}`}>
                      {event.type === 'conversion' ? <DollarSign className="w-4 h-4 text-cannabis-green" /> : <UserPlus className="w-4 h-4 text-gold-500" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold capitalize">{event.type === 'registration' ? 'New Referral' : 'Sale Conversion'}</p>
                      {event.sale_amount && <p className="text-zinc-500 text-xs">Sale: ${event.sale_amount.toLocaleString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {event.commission != null && (
                      <span className="text-cannabis-green font-bold text-sm">+${event.commission.toLocaleString()}</span>
                    )}
                    {event.status && (
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${event.status === 'paid' ? 'bg-cannabis-green/20 text-cannabis-green' : 'bg-gold-500/20 text-gold-500'}`}>
                        {event.status}
                      </span>
                    )}
                    <span className="text-zinc-600 text-xs">{event.date ? new Date(event.date).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <a href="/" className="text-zinc-500 hover:text-gold-500 text-sm transition-colors">← Back to Firegold Marketplace</a>
        </div>
      </div>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
};

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/submit-strain" element={<GrowerSubmitPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/affiliate/:code" element={<AffiliateDashboard />} />
        </Routes>
        <ChatWidgetWrapper />
      </BrowserRouter>
    </div>
  );
}

// Only show chat widget on non-admin pages
const ChatWidgetWrapper = () => {
  const location = window.location.pathname;
  if (location === '/admin') return null;
  return <ChatWidget />;
};

export default App;
