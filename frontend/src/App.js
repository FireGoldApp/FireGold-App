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
  Building2
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
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
const StrainDetailModal = ({ strain, onClose, onAddToInquiry, isInInquiry }) => {
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
              className="w-full h-full object-cover"
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
            
            {/* Action Button */}
            <button 
              data-testid="add-to-inquiry-btn"
              onClick={() => onAddToInquiry(strain.id)}
              className={`mt-auto ${isInInquiry ? 'bg-cannabis-green' : 'bg-gold-500 hover:bg-gold-400'} text-black font-bold uppercase tracking-widest px-8 py-4 transition-all`}
            >
              {isInInquiry ? 'Added to Inquiry' : 'Add to Inquiry'}
            </button>
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

// Main Catalog Page
const CatalogPage = () => {
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', priceTier: '', minThc: null, search: '' });
  const [selectedStrains, setSelectedStrains] = useState([]);
  const [viewingStrain, setViewingStrain] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchStrains();
  }, []);

  const fetchStrains = async () => {
    try {
      const response = await axios.get(`${API}/strains`);
      setStrains(response.data);
    } catch (error) {
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
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
    setSelectedStrains(prev => 
      prev.includes(strainId) 
        ? prev.filter(id => id !== strainId)
        : [...prev, strainId]
    );
  };

  return (
    <div data-testid="catalog-page" className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-gold-500" />
          <span className="font-cinzel font-bold text-xl text-gold-grad tracking-wider">FIREGOLD</span>
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
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-gold-500 text-white placeholder-zinc-600 h-10 pl-10 pr-4 transition-colors outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedStrains.length > 0 && (
            <button
              data-testid="open-inquiry-btn"
              onClick={() => setShowInquiryModal(true)}
              className="bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-widest px-6 py-2 text-sm transition-all"
            >
              Inquire ({selectedStrains.length})
            </button>
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
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-gold-500" />
            <span className="font-cinzel text-lg text-gold-grad">FIREGOLD</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-zinc-500 text-sm">The Firegold Standard</p>
            <p className="text-zinc-600 text-xs mt-1">© 2026 Firegold. Premium B2B Cannabis Wholesale.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StrainDetailModal 
        strain={viewingStrain}
        onClose={() => setViewingStrain(null)}
        onAddToInquiry={toggleStrainSelection}
        isInInquiry={viewingStrain ? selectedStrains.includes(viewingStrain.id) : false}
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
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
