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
  UserPlus
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
      </div>
    </div>
  );
};

// Strain Detail Modal
const StrainDetailModal = ({ strain, onClose, onAddToInquiry, isInInquiry, onRequestSample }) => {
  if (!strain) return null;

  return (
    <div 
      data-testid="strain-detail-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-charcoal border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
              className="absolute top-4 right-4 w-10 h-10 bg-black/80 backdrop-blur-sm flex items-center justify-center hover:bg-gold-500 hover:text-black transition-all"
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
            <div className="mb-8">
              <div className="text-zinc-500 font-manrope text-xs uppercase tracking-widest mb-2">Available Quantity</div>
              <div className="text-white font-mono">{strain.lot_size}</div>
            </div>
            
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

      {filters.type || filters.priceTier || filters.minThc || filters.search ? (
        <button
          data-testid="clear-filters-btn"
          onClick={() => setFilters({ type: '', priceTier: '', minThc: null, search: '' })}
          className="w-full px-4 py-2 border border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400 transition-all uppercase tracking-widest text-xs"
        >
          Clear All Filters
        </button>
      ) : null}
    </div>
  );
};

// Sample Request Modal Component
const SampleRequestModal = ({ isOpen, onClose, strain }) => {
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
        headers: { 'Content-Type': 'multipart/form-data' }
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
const InquiryModal = ({ isOpen, onClose, selectedStrains, strains }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStrainDetails = strains.filter(s => selectedStrains.includes(s.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/inquiries`, {
        ...formData,
        strain_ids: selectedStrains
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
    phone: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [tempPassword, setTempPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      setTempPassword(response.data.temp_password);
      toast.success('Registration successful! Save your password shown below.');
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

  const proceedAfterRegister = () => {
    const token = localStorage.getItem('userToken');
    const user = JSON.parse(localStorage.getItem('userData'));
    onAuth(token, user);
  };

  // Show password after successful registration
  if (tempPassword) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
        <div className="bg-charcoal border border-white/10 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-cannabis-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-cannabis-green" />
          </div>
          <h2 className="font-cinzel font-bold text-2xl text-white mb-4">Registration Complete!</h2>
          <p className="text-zinc-400 mb-6">Save your password for future logins:</p>
          
          <div className="bg-zinc-900 border border-gold-500/50 p-4 mb-6">
            <p className="text-gold-500 font-mono text-xl tracking-wider">{tempPassword}</p>
          </div>
          
          <p className="text-zinc-500 text-sm mb-6">
            Write this down! You'll need it to login next time.
          </p>
          
          <button
            onClick={proceedAfterRegister}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-8 py-4 transition-all"
          >
            Continue to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
      <div className="bg-charcoal border border-white/10 p-8 max-w-lg w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-16" />
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
              <div className="text-red-500 text-sm text-center">{error}</div>
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
      const response = await axios.get(`${API}/strains`);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
          </div>
        )}

        {/* Strain Image Management */}
        <div className="mb-8">
          <h2 className="font-cinzel font-bold text-2xl text-white mb-2">Strain Image Management</h2>
          <p className="text-zinc-500 text-sm">Click on any image to upload a new one. Recommended: black background, square aspect ratio.</p>
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
                  
                  {/* Upload overlay */}
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
                </div>

                {/* Delete button */}
                <button
                  data-testid={`delete-strain-${strain.id}`}
                  onClick={() => handleDeleteStrain(strain.id, strain.strain_name)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
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
  const [filters, setFilters] = useState({ type: '', priceTier: '', minThc: null, search: '' });
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
    if (newFilters.type || newFilters.priceTier || newFilters.minThc) {
      trackEvent('filter_apply', {
        filters_applied: {
          type: newFilters.type || null,
          price_tier: newFilters.priceTier || null,
          min_thc: newFilters.minThc || null
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
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-14 w-auto" />
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
        <div className="relative z-10 text-center px-6">
          <h1 className="font-cinzel font-bold text-4xl md:text-6xl lg:text-7xl text-gold-grad tracking-tight mb-4">
            Cultivar Selection
          </h1>
          <p className="font-manrope text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
            Premium wholesale cannabis flower for discerning B2B partners
          </p>
          <p className="font-mono text-gold-500/60 text-sm mt-4">February 2026 Catalog</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-12 pb-24">
        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative w-full">
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
        </div>

        <div className="flex gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-28">
              <div className="flex items-center gap-2 mb-8">
                <Filter className="w-4 h-4 text-gold-500" />
                <h2 className="font-manrope font-semibold text-sm uppercase tracking-widest text-zinc-400">Filters</h2>
              </div>
              <FilterSidebar filters={filters} setFilters={setFilters} strains={strains} />
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
                  onClick={() => setFilters({ type: '', priceTier: '', minThc: null, search: '' })}
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
                    onViewDetails={setViewingStrain}
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
          <img src={FIREGOLD_LOGO} alt="Firegold Brands" className="h-12 w-auto" />
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
      />

      <InquiryModal 
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        selectedStrains={selectedStrains}
        strains={strains}
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
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
