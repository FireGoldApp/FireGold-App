import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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
  RefreshCw
} from "lucide-react";

// Prevent right-click on images
const preventImageActions = (e) => {
  e.preventDefault();
  return false;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const FIREGOLD_LOGO = "https://customer-assets.emergentagent.com/job_reload-engine/artifacts/sx02pppj_ChatGPT%20Image%20Nov%2011%2C%202025%20at%2009_53_40%20AM.png";

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
          alt={strain.strain_name}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 select-none pointer-events-none"
          onContextMenu={preventImageActions}
          onDragStart={preventImageActions}
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Price Tier Badge */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 border border-gold-500/30">
          <span className="text-gold-500 font-mono text-sm">{strain.price_tier}</span>
        </div>
        
        {/* COA Badge */}
        {strain.coa_url && (
          <div className="absolute top-14 right-4 bg-cannabis-green/90 backdrop-blur-sm px-2 py-0.5 border border-cannabis-green">
            <span className="text-white font-mono text-xs font-bold">COA</span>
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
        <h3 className="font-cinzel font-bold text-xl text-white mb-2">{strain.strain_name}</h3>
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

  if (!strain) return null;

  const handleViewCoa = async () => {
    setCoaLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      // Track COA view
      trackEvent('coa_view', { strain_name: strain.strain_name }, null, strain.id, strain.strain_name);
      const response = await axios.get(`${API}/strains/${strain.id}/coa`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(response.data);
      setCoaBlobUrl(blobUrl);
      setShowCoa(true);
    } catch {
      toast.error('Unable to load COA');
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
            className="flex items-center gap-2 text-zinc-300 active:text-gold-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-manrope uppercase tracking-widest">Back</span>
          </button>
          <span className="text-gold-500 font-cinzel font-bold text-sm truncate max-w-[50%]">{strain.strain_name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square relative">
            <img 
              src={strain.image_url || 'https://images.unsplash.com/photo-1721058454918-5582b68de13c'}
              alt={strain.strain_name}
              className="w-full h-full object-cover select-none pointer-events-none"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
              draggable="false"
            />
            <button 
              data-testid="close-modal-btn"
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-gold-500 text-black hidden md:flex items-center justify-center hover:bg-red-600 hover:text-black transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Details */}
          <div className="p-8 flex flex-col">
            <div className="text-gold-500 font-manrope text-xs uppercase tracking-widest mb-2">
              {strain.type}
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
              <div className="text-zinc-300 font-light">{strain.effects}</div>
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
                      <div className="text-cannabis-green/70 text-[10px] uppercase tracking-widest">Grade A (kg)</div>
                    </div>
                  )}
                  {strain.grade_b_kg > 0 && (
                    <div className="bg-gold-500/10 border border-gold-500/30 p-3 text-center">
                      <div className="text-gold-500 font-bold text-lg font-mono">{strain.grade_b_kg}</div>
                      <div className="text-gold-500/70 text-[10px] uppercase tracking-widest">Grade B (kg)</div>
                    </div>
                  )}
                  {strain.grade_c_kg > 0 && (
                    <div className="bg-zinc-700/30 border border-zinc-600/30 p-3 text-center">
                      <div className="text-zinc-400 font-bold text-lg font-mono">{strain.grade_c_kg}</div>
                      <div className="text-zinc-500 text-[10px] uppercase tracking-widest">Grade C (kg)</div>
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
                className="w-10 h-10 bg-zinc-800 hover:bg-gold-500 hover:text-black flex items-center justify-center transition-all"
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
        <h3 className="font-manrope font-semibold text-sm uppercase tracking-widest text-zinc-500 mb-4">Strain Type</h3>
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
        <h3 className="font-manrope font-semibold text-sm uppercase tracking-widest text-zinc-500 mb-4">Price Tier</h3>
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
        <h3 className="font-manrope font-semibold text-sm uppercase tracking-widest text-zinc-500 mb-4">THC Range</h3>
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
        <h3 className="font-manrope font-semibold text-sm uppercase tracking-widest text-zinc-500 mb-4">Flower Grade</h3>
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
              Grade {grade}
            </button>
          ))}
        </div>
      </div>

      {filters.type || filters.priceTier || filters.minThc || filters.search || filters.grade ? (
        <button
          data-testid="clear-filters-btn"
          onClick={() => setFilters({ type: '', priceTier: '', minThc: null, search: '', grade: '' })}
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
              className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5 text-zinc-400" />
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
    message: ''
  });
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
        strain_ids: selectedStrains
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      toast.success('Inquiry submitted successfully! We will contact you soon.');
      onClose();
      setFormData({ company_name: '', contact_name: '', email: '', phone: '', message: '' });
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
              className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Selected Strains */}
          {selectedStrainDetails.length > 0 && (
            <div className="mb-8">
              <h3 className="font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-4">Selected Strains ({selectedStrainDetails.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedStrainDetails.map(strain => (
                  <span key={strain.id} className="px-3 py-1 bg-gold-500/10 border border-gold-500/30 text-gold-500 text-sm">
                    {strain.strain_name}
                  </span>
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
    thc_percentage: '',
    cbd_percentage: '',
    terpene_profile: '',
    lineage: '',
    lot_size_kg: '',
    effects: '',
    growing_method: 'Indoor',
    export_country: '',
    is_irradiated: '',
    willing_to_irradiate: '',
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
    if (val && (isNaN(num) || num < 30)) {
      setLotError('Minimum lot size is 30 kg');
    } else {
      setLotError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lotKg = parseFloat(formData.lot_size_kg);
    if (isNaN(lotKg) || lotKg < 30) {
      setLotError('Minimum lot size is 30 kg');
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
      submitData.append('thc_percentage', formData.thc_percentage);
      submitData.append('cbd_percentage', formData.cbd_percentage || '');
      submitData.append('terpene_profile', formData.terpene_profile);
      submitData.append('lineage', formData.lineage);
      submitData.append('lot_size_kg', lotKg);
      submitData.append('effects', formData.effects);
      submitData.append('growing_method', formData.growing_method || '');
      submitData.append('export_country', formData.export_country || '');
      submitData.append('is_irradiated', formData.is_irradiated || '');
      submitData.append('willing_to_irradiate', formData.willing_to_irradiate || '');
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
        <div className="bg-charcoal border border-white/10 p-8 max-w-md w-full text-center">
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
          <a href="/" className="block w-full bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all text-center mb-3">
            Back to Catalog
          </a>
          <a href="/track" className="block w-full border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold uppercase tracking-widest px-8 py-3 transition-all text-center">
            Track Submission Status
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
          <h1 className="font-cinzel font-bold text-3xl text-white mb-4">Submit Your Flower</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Are you a licensed grower with premium cannabis flower? Submit your strain for consideration in our B2B catalog. Minimum lot size: <span className="text-gold-500 font-bold">30 kg</span>.
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
                <input
                  data-testid="grower-license-input"
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="LIC-XXXXX"
                />
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
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Effects *</label>
                <input
                  data-testid="grower-effects-input"
                  type="text"
                  required
                  value={formData.effects}
                  onChange={(e) => setFormData(prev => ({ ...prev, effects: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., Relaxation, Mood Elevation, Pain Relief"
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
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Total Lot Size (kg) * <span className="text-gold-500">Min 30 kg</span></label>
                <input
                  data-testid="grower-lot-size-input"
                  type="number"
                  required
                  min="30"
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
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Grade A (kg)</label>
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
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Grade B (kg)</label>
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
                    <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Grade C (kg)</label>
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

              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Country of Export *</label>
                <input
                  data-testid="grower-export-country-input"
                  type="text"
                  required
                  value={formData.export_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, export_country: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none"
                  placeholder="e.g., Canada, Germany, Australia"
                />
              </div>
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
              <ShieldCheck className="w-5 h-5" /> Irradiation & Microbials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">Has the flower been irradiated for micros? *</label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* COA Upload */}
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  Certificate of Analysis (COA)
                  {licensesOnFile?.licenses_on_file?.coa && <span className="text-cannabis-green ml-1">- on file</span>}
                </label>
                <div className="relative">
                  <input
                    data-testid="grower-coa-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCoaFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed ${coaFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors text-center`}>
                    {coaFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4" />
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
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  Health Canada License
                  {licensesOnFile?.licenses_on_file?.health_canada_license && <span className="text-cannabis-green ml-1">- on file</span>}
                </label>
                <div className="relative">
                  <input
                    data-testid="grower-hc-license-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setHcLicenseFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed ${hcLicenseFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors text-center`}>
                    {hcLicenseFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4" />
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
              <div>
                <label className="block font-manrope text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  CRA Excise License
                  {licensesOnFile?.licenses_on_file?.cra_license && <span className="text-cannabis-green ml-1">- on file</span>}
                </label>
                <div className="relative">
                  <input
                    data-testid="grower-cra-license-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCraLicenseFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed ${craLicenseFile ? 'border-cannabis-green bg-cannabis-green/10' : 'border-zinc-700 hover:border-gold-500/50'} p-4 transition-colors text-center`}>
                    {craLicenseFile ? (
                      <div className="flex items-center justify-center gap-2 text-cannabis-green">
                        <Check className="w-4 h-4" />
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
            </div>
            <p className="text-zinc-600 text-xs mt-2">Upload PDFs of your COA, Health Canada, and CRA Excise licenses if available.</p>
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
  const [mode, setMode] = useState('register'); // 'register' or 'login'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerData, setRegisterData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    country: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');

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
      const response = await axios.post(`${API}/auth/register`, registerData);
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
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
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
              <input
                data-testid="register-country"
                type="text"
                required
                value={registerData.country}
                onChange={(e) => setRegisterData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                placeholder="Canada"
              />
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
          </form>
        )}

        <p className="text-zinc-600 text-xs text-center mt-6">
          By registering, you agree to our terms of service.
        </p>
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
              Submit Another Strain
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
      effects: strain.effects || '',
      grade_a_kg: strain.grade_a_kg || '',
      grade_b_kg: strain.grade_b_kg || '',
      grade_c_kg: strain.grade_c_kg || '',
      harvest_date: strain.harvest_date || ''
    });
  };

  const saveEditStrain = async () => {
    setSavingEdit(true);
    try {
      const payload = {
        ...editForm,
        terpene_profile: editForm.terpene_profile.split(',').map(t => t.trim()).filter(Boolean),
        grade_a_kg: parseFloat(editForm.grade_a_kg) || null,
        grade_b_kg: parseFloat(editForm.grade_b_kg) || null,
        grade_c_kg: parseFloat(editForm.grade_c_kg) || null,
        harvest_date: editForm.harvest_date || null
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
    effects: ''
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
        effects: ''
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
        <button 
          onClick={handleLogout}
          data-testid="admin-logout-btn"
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
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
                <div className="text-cannabis-green/70 text-xs uppercase tracking-widest mt-1">Grade A (kg)</div>
              </div>
              <div className="bg-gold-500/10 border border-gold-500/30 p-4 text-center">
                <div className="text-gold-500 font-bold text-3xl font-mono">{inventory.total_grade_b.toFixed(1)}</div>
                <div className="text-gold-500/70 text-xs uppercase tracking-widest mt-1">Grade B (kg)</div>
              </div>
              <div className="bg-zinc-700/20 border border-zinc-600/30 p-4 text-center">
                <div className="text-zinc-400 font-bold text-3xl font-mono">{inventory.total_grade_c.toFixed(1)}</div>
                <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Grade C (kg)</div>
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
        </div>

        {/* Images Tab */}
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
                  <button onClick={() => setEditingStrain(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-6 h-6" />
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
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Price Tier *</label>
                      <select data-testid="edit-strain-tier" value={editForm.price_tier}
                        onChange={e => setEditForm(p => ({...p, price_tier: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none">
                        <option value="$">$</option>
                        <option value="$$">$$</option>
                        <option value="$$$">$$$</option>
                      </select>
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
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Effects *</label>
                      <input data-testid="edit-strain-effects" type="text" value={editForm.effects}
                        onChange={e => setEditForm(p => ({...p, effects: e.target.value}))}
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" />
                    </div>
                  </div>

                  {/* Grade Breakdown */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gold-500 mb-2 font-bold">Grade Breakdown (kg)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Grade A</label>
                        <input data-testid="edit-strain-grade-a" type="number" min="0" step="0.1" value={editForm.grade_a_kg}
                          onChange={e => setEditForm(p => ({...p, grade_a_kg: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Grade B</label>
                        <input data-testid="edit-strain-grade-b" type="number" min="0" step="0.1" value={editForm.grade_b_kg}
                          onChange={e => setEditForm(p => ({...p, grade_b_kg: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Grade C</label>
                        <input data-testid="edit-strain-grade-c" type="number" min="0" step="0.1" value={editForm.grade_c_kg}
                          onChange={e => setEditForm(p => ({...p, grade_c_kg: e.target.value}))}
                          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white h-12 px-4 outline-none" placeholder="0" />
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
                    className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 transition-all"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
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
                    <input
                      type="text"
                      required
                      value={newStrain.effects}
                      onChange={(e) => setNewStrain(prev => ({ ...prev, effects: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-12 px-4 transition-colors outline-none"
                      placeholder="e.g., Mood Elevation, Relaxation, Creativity"
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
                          <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">User</th>
                          <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Company</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">Logins</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">Events</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">Strains</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">Searches</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">COA Views</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">Samples</th>
                          <th className="text-center text-zinc-500 text-xs uppercase tracking-widest p-4">Time Spent</th>
                          <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userActivityReport.map((u, i) => (
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
                                  <span className="text-cannabis-green text-sm">Grade A</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.submissions?.total_grade_a || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gold-500 text-sm">Grade B</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.submissions?.total_grade_b || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-400 text-sm">Grade C</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.submissions?.total_grade_c || 0} kg</span>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-white/5 pt-3">
                              <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Catalog (Approved)</p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-cannabis-green text-sm">Grade A</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.catalog?.total_grade_a || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gold-500 text-sm">Grade B</span>
                                  <span className="text-white font-mono">{globalData.supply.grade_distribution.catalog?.total_grade_b || 0} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-400 text-sm">Grade C</span>
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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Registered Users</h2>
                <p className="text-zinc-500 text-sm">{users.length} total users</p>
              </div>
              <button
                onClick={() => exportCSV('users')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-sm flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="bg-charcoal border border-white/5 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Name</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Company</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Country</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Email</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Status</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-widest p-4">Registered</th>
                    <th className="text-right text-zinc-500 text-xs uppercase tracking-widest p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id || i} className={`border-t border-white/5 hover:bg-zinc-900/50 ${user.status === 'suspended' ? 'opacity-60' : ''} ${user.status === 'removed' ? 'opacity-30' : ''}`}>
                      <td className="p-4 text-white">{user.first_name} {user.last_name}</td>
                      <td className="p-4 text-zinc-400">{user.company}</td>
                      <td className="p-4 text-zinc-400">{user.country}</td>
                      <td className="p-4 text-zinc-400">{user.email}</td>
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
                      <td colSpan="7" className="p-8 text-center text-zinc-600">No users registered yet</td>
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

            {filteredSubmissions.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400">No {submissionFilter === 'all' ? '' : submissionFilter} submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub) => (
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
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Irradiated</p>
                        <p className={`text-sm font-medium ${sub.is_irradiated === 'Yes' ? 'text-cannabis-green' : sub.is_irradiated === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{sub.is_irradiated || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 text-xs uppercase tracking-widest">Willing to Irradiate</p>
                        <p className={`text-sm font-medium ${sub.willing_to_irradiate === 'Yes' ? 'text-cannabis-green' : sub.willing_to_irradiate === 'No' ? 'text-red-400' : 'text-zinc-500'}`}>{sub.willing_to_irradiate || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Grade Breakdown */}
                    {(sub.grade_a_kg || sub.grade_b_kg || sub.grade_c_kg) && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-cannabis-green/10 border border-cannabis-green/30 p-3 text-center">
                          <p className="text-cannabis-green font-bold font-mono text-lg">{sub.grade_a_kg || 0}</p>
                          <p className="text-cannabis-green/70 text-[10px] uppercase tracking-widest">Grade A (kg)</p>
                        </div>
                        <div className="bg-gold-500/10 border border-gold-500/30 p-3 text-center">
                          <p className="text-gold-500 font-bold font-mono text-lg">{sub.grade_b_kg || 0}</p>
                          <p className="text-gold-500/70 text-[10px] uppercase tracking-widest">Grade B (kg)</p>
                        </div>
                        <div className="bg-zinc-700/30 border border-zinc-600/30 p-3 text-center">
                          <p className="text-zinc-400 font-bold font-mono text-lg">{sub.grade_c_kg || 0}</p>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Grade C (kg)</p>
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
                      <p className="text-zinc-300 text-sm">{sub.effects}</p>
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

            {directory.length === 0 ? (
              <div className="bg-charcoal border border-white/5 p-12 text-center">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400">Loading directory...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {directory
                  .filter(s => !directorySearch || s.strain_name.toLowerCase().includes(directorySearch.toLowerCase()))
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
                        {entry.grower_name ? (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Name</p>
                              <p className="text-zinc-200 text-sm">{entry.grower_name}</p>
                            </div>
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Company</p>
                              <p className="text-zinc-200 text-sm">{entry.company_name}</p>
                            </div>
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Email</p>
                              <a href={`mailto:${entry.grower_email}`} className="text-gold-500 text-sm hover:underline">{entry.grower_email}</a>
                            </div>
                            <div>
                              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Phone</p>
                              <a href={`tel:${entry.grower_phone}`} className="text-gold-500 text-sm hover:underline">{entry.grower_phone || 'N/A'}</a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-zinc-600 text-sm italic">No grower submission linked</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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

// Main Catalog Page
const CatalogPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', priceTier: '', minThc: null, search: '', grade: '' });
  const [selectedStrains, setSelectedStrains] = useState([]);
  const [viewingStrain, setViewingStrain] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleStrain, setSampleStrain] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    // Track registration/login
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
    toast.success('Logged out successfully');
  };

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
          <a
            href="/submit-strain"
            data-testid="submit-strain-cta"
            className="hidden md:flex items-center gap-2 border-2 border-cannabis-green text-cannabis-green hover:bg-cannabis-green hover:text-white font-bold uppercase tracking-widest px-5 py-2 text-xs transition-all"
          >
            <Leaf className="w-4 h-4" />
            Submit Your Strain
          </a>
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
            className="md:hidden p-2"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <Menu className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1647268465509-f0229a865b6f)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />
        <div className="relative z-10 flex items-center gap-8 px-6 max-w-5xl mx-auto">
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-28 md:h-40 w-auto flex-shrink-0 hidden sm:block" />
          <div className="text-center sm:text-left">
            <h1 className="font-cinzel font-bold text-4xl md:text-6xl lg:text-7xl text-gold-grad tracking-tight mb-4">
              Cultivar Selection
            </h1>
            <p className="font-manrope text-zinc-400 text-lg md:text-xl max-w-2xl">
              Premium wholesale cannabis flower for discerning B2B partners
            </p>
            <p className="font-mono text-gold-500/60 text-sm mt-4">
              {new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()} Catalog
            </p>
          </div>
        </div>
      </section>

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
            Submit Your Strain
          </a>
        </div>

        <div className="flex gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-28">
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
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              <FilterSidebar filters={filters} setFilters={setFilters} strains={strains} />
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full mt-8 bg-gold-500 text-black font-bold uppercase tracking-widest px-6 py-4"
              >
                Apply Filters
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <p className="text-zinc-500 text-sm">
                Showing <span className="text-white font-mono">{filteredStrains.length}</span> of {strains.length} strains
              </p>
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
                  onClick={() => setFilters({ type: '', priceTier: '', minThc: null, search: '', grade: '' })}
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
      <footer className="border-t border-white/5 py-12 px-6 md:px-12">
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

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/submit-strain" element={<GrowerSubmitPage />} />
          <Route path="/track" element={<SubmissionTracker />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
