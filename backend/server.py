from fastapi import FastAPI, APIRouter, HTTPException, Query, File, UploadFile, Form, Depends, Header
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import hashlib
import secrets
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin credentials - set via environment or use default
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'firegold2026')
ADMIN_TOKENS = {}  # Store valid session tokens
USER_TOKENS = {}  # Store valid user session tokens

# Create the main app without a prefix
app = FastAPI(title="Firegold Cannabis Catalog API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# User Models
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    company: str  # LP or Company name
    country: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    company: str
    country: str
    email: str
    phone: str
    password_hash: str
    status: str = "active"  # active, suspended
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Analytics Event Model
class AnalyticsEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: Optional[str] = None
    user_company: Optional[str] = None
    event_type: str  # page_view, strain_view, strain_click, filter_apply, search, inquiry_submit, sample_request
    event_data: dict = {}  # Flexible data storage
    page: Optional[str] = None
    strain_id: Optional[str] = None
    strain_name: Optional[str] = None
    thc_percentage: Optional[str] = None
    strain_type: Optional[str] = None
    price_tier: Optional[str] = None
    search_query: Optional[str] = None
    filters_applied: Optional[dict] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrackEventInput(BaseModel):
    event_type: str
    event_data: Optional[dict] = {}
    page: Optional[str] = None
    strain_id: Optional[str] = None
    strain_name: Optional[str] = None
    thc_percentage: Optional[str] = None
    strain_type: Optional[str] = None
    price_tier: Optional[str] = None
    search_query: Optional[str] = None
    filters_applied: Optional[dict] = None
    session_duration: Optional[int] = None  # Time on page in seconds
    page_scroll_depth: Optional[int] = None  # Percentage scrolled

# Session tracking model
class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: Optional[str] = None
    session_start: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_end: Optional[datetime] = None
    total_duration: int = 0  # seconds
    pages_visited: List[str] = []
    strains_viewed: List[str] = []
    actions_count: int = 0

# Duplicate registration flags
class RegistrationFlag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    flag_type: str  # 'duplicate_company', 'duplicate_phone', 'duplicate_email_domain'
    flag_reason: str
    matched_user_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Admin authentication
class AdminLogin(BaseModel):
    password: str

class AdminToken(BaseModel):
    token: str
    expires_at: datetime

def verify_admin_token(authorization: str = Header(None)):
    """Verify admin token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    token = authorization.replace("Bearer ", "")
    if token not in ADMIN_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    
    token_data = ADMIN_TOKENS[token]
    if datetime.now(timezone.utc) > token_data['expires_at']:
        del ADMIN_TOKENS[token]
        raise HTTPException(status_code=401, detail="Admin session expired")
    
    return token

def verify_user_token(authorization: str = Header(None)):
    """Verify user token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Please login or register.")
    
    token = authorization.replace("Bearer ", "")
    if token not in USER_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please login again.")
    
    token_data = USER_TOKENS[token]
    if datetime.now(timezone.utc) > token_data['expires_at']:
        del USER_TOKENS[token]
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")
    
    return token_data

def hash_password(password: str) -> str:
    """Hash a password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

# Define Models
class Strain(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    strain_name: str
    type: str
    thc_percentage: str
    cbd_percentage: Optional[str] = None
    price_tier: str  # $, $$, $$$
    terpene_profile: List[str]
    lineage: str
    lot_size: str
    effects: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StrainCreate(BaseModel):
    strain_name: str
    type: str
    thc_percentage: str
    cbd_percentage: Optional[str] = None
    price_tier: str
    terpene_profile: List[str]
    lineage: str
    lot_size: str
    effects: str
    image_url: Optional[str] = None

# Grower Submission Model
class GrowerSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Grower info
    grower_name: str
    company_name: str
    email: str
    phone: str
    license_number: Optional[str] = None
    # Strain info (matches catalog strain format)
    strain_name: str
    strain_type: str
    thc_percentage: str
    cbd_percentage: Optional[str] = None
    terpene_profile: str  # Comma separated
    lineage: str
    lot_size_kg: float  # Minimum 30 kg
    effects: str
    growing_method: Optional[str] = None  # Indoor, Outdoor, Greenhouse
    export_country: Optional[str] = None  # Country of export
    is_irradiated: Optional[str] = None  # Yes/No - has flower been irradiated for micros
    willing_to_irradiate: Optional[str] = None  # Yes/No - willing to irradiate if required
    image_path: Optional[str] = None  # Path to uploaded image
    additional_notes: Optional[str] = None
    # Status
    status: str = "pending"  # pending, approved, rejected
    admin_notes: Optional[str] = None
    admin_price_per_gram: Optional[str] = None  # Admin sets this during review
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GrowerSubmissionInput(BaseModel):
    grower_name: str
    company_name: str
    email: EmailStr
    phone: str
    license_number: Optional[str] = None
    strain_name: str
    strain_type: str
    thc_percentage: str
    cbd_percentage: Optional[str] = None
    terpene_profile: str
    lineage: str
    lot_size_kg: float  # Minimum 30 kg
    effects: str
    growing_method: Optional[str] = None
    export_country: Optional[str] = None
    is_irradiated: Optional[str] = None
    willing_to_irradiate: Optional[str] = None
    additional_notes: Optional[str] = None

class InquiryCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    strain_ids: List[str]
    message: str

class Inquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    strain_ids: List[str]
    message: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SampleRequestCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    strain_id: str
    health_canada_license: str  # License number
    cra_license: str  # CRA license number
    shipping_address: str
    message: Optional[str] = None

class SampleRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    strain_id: str
    strain_name: Optional[str] = None
    health_canada_license_filename: Optional[str] = None
    cra_license_filename: Optional[str] = None
    shipping_address: str
    message: Optional[str] = None
    status: str = "pending"  # pending, approved, shipped, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Strain image mapping (filename in /strains/ folder)
STRAIN_IMAGE_MAP = {
    "Jealousy": "Jealousy.png",
    "AIS": "AIS.png",
    "Animal Mints": "Animal Mitnz.png",
    "Black Tuna": "Black Tuna.png",
    "Bubble Gum": "Buuble Gum.png",
    "BCC": "BCC.png",
    "Cadillac Rainbows": "Cadillac Rainbow.png",
    "Cerberus": "Cerebrus.png",
    "Chemo Kush": "Chemo Kush.png",
    "Crystal Caviar": "Crystal Caviar.png",
    "G-Force": "G-Force.png",
    "Grape Galena": "Grape Gelina.png",
    "Integrator": "Integrator.png",
    "Jager": "Jager.png",
    "Juicee J": "Juicee J.png",
    "London Zoap": "London Zoap.png",
    "Marshmallow OG": "Marshmellow OG.png",
    "MAC 1": "Mac 1.png",
    "Motorbreath": "Motorbreath.png",
    "Papaya Bombs": "Papaya Bombs.png",
    "Purple Platinum": "Purple Platinum.png",
    "Rainbow": "Rainbow.png",
    "Runtz Coffin Candy": "Runtz Coffin Candy.png",
    "Rainbow Driver": "Rainbow Driver.png",
    "Royal Sherb": "Souffle.png",  # Using Souffle image as placeholder
    "Souffle": "Souffle.png",
    "Strawberry Froyo": "Strawberry Froyo.png"
}

# Seed data from PDF
SEED_STRAINS = [
    {
        "strain_name": "Jealousy",
        "type": "Balanced Hybrid",
        "thc_percentage": "27%+",
        "price_tier": "$$",
        "terpene_profile": ["Beta-myrcene", "Linalool", "Alpha-humulene"],
        "lineage": "Cookies Gelato 41 x Sherbet Bx1",
        "lot_size": "In Harvest",
        "effects": "Mood Elevation, Uplift, Clear Head",
        "image_url": "/strains/Jealousy.png"
    },
    {
        "strain_name": "AIS",
        "type": "Hybrid, Indica Leaning",
        "thc_percentage": "27.39%",
        "price_tier": "$$",
        "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"],
        "lineage": "Falcon 9 x Grease Monkey",
        "lot_size": "35 kg",
        "effects": "Grounding, Euphoric Lift, Physical",
        "image_url": "/strains/AIS.jpg"
    },
    {
        "strain_name": "Animal Mints",
        "type": "Hybrid, Indica Leaning",
        "thc_percentage": "33.38%",
        "price_tier": "$$$",
        "terpene_profile": ["Caryophyllene", "Limonene", "Beta-myrcene"],
        "lineage": "Animal Cookies x SinMint Cookies",
        "lot_size": "Lot 1: 42KG, Lot 2: 45KG",
        "effects": "Mood Elevation, Uplift, Controlled Euphoria",
        "image_url": "/strains/Animal Mints.png"
    },
    {
        "strain_name": "Black Tuna",
        "type": "Hybrid, Indica Dominant",
        "thc_percentage": "27%+",
        "price_tier": "$$$",
        "terpene_profile": ["Caryophyllene", "Limonene", "Beta-myrcene"],
        "lineage": "Herijuana x Lambs Bread",
        "lot_size": "In Harvest",
        "effects": "Mental Elevation, Relaxed Body",
        "image_url": "/strains/Black Tuna.jpg"
    },
    {
        "strain_name": "Bubble Gum",
        "type": "Balanced Hybrid",
        "thc_percentage": "25%+",
        "price_tier": "$$$",
        "terpene_profile": ["Geraniol", "Caryophyllene", "Farnesene"],
        "lineage": "Unknown",
        "lot_size": "In Harvest",
        "effects": "Euphoric Mood, Grounding, Sedative",
        "image_url": "/strains/Bubble Gum.jpg"
    },
    {
        "strain_name": "BCC",
        "type": "Hybrid, Slight Indica Leaning",
        "thc_percentage": "35%+",
        "price_tier": "$$$",
        "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"],
        "lineage": "Wedding Cake x Monkey Banana",
        "lot_size": "In Harvest",
        "effects": "Mood Elevation, Stress, Anxiety Relief",
        "image_url": "/strains/BCC.jpg"
    },
    {
        "strain_name": "Cadillac Rainbows",
        "type": "Hybrid, Indica",
        "thc_percentage": "31%+",
        "price_tier": "$$$",
        "terpene_profile": ["Limonene", "Beta-myrcene", "Caryophyllene"],
        "lineage": "Pure Michigan x Runtz",
        "lot_size": "In Harvest",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Cadillac Rainbows.jpg"
    },
    {
        "strain_name": "Cerberus",
        "type": "Indica Dominant",
        "thc_percentage": "32.43%",
        "price_tier": "$$$",
        "terpene_profile": ["Limonene", "Beta-myrcene", "Caryophyllene"],
        "lineage": "Typhon x Echidna",
        "lot_size": "19 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Cerebrus.png"
    },
    {
        "strain_name": "Chemo Kush",
        "type": "Indica Dominant",
        "thc_percentage": "26.66%",
        "price_tier": "$$$",
        "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"],
        "lineage": "Unknown",
        "lot_size": "35 kg",
        "effects": "Cerebral Calm, Sedative Relax, Mood Softening",
        "image_url": "/strains/Chemo Kush.png"
    },
    {
        "strain_name": "Crystal Caviar",
        "type": "Hybrid Balanced",
        "thc_percentage": "26%+",
        "price_tier": "$$",
        "terpene_profile": ["Terpinolene", "Farnesene", "Beta-myrcene"],
        "lineage": "Dark Matter x Cali Diesel x God",
        "lot_size": "In Harvest",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Crystal Caviar.png"
    },
    {
        "strain_name": "G-Force",
        "type": "Hybrid, Indica Leaning",
        "thc_percentage": "27.81%",
        "price_tier": "$$",
        "terpene_profile": ["Caryophyllene", "Beta-myrcene", "Limonene"],
        "lineage": "G-13 x Skunk #1 x Northern Lights",
        "lot_size": "26 kg",
        "effects": "Stress, Inflammation, Relax, Sleep, Appetite Support",
        "image_url": "/strains/G-Force.png"
    },
    {
        "strain_name": "Grape Galena",
        "type": "Hybrid, Slight Indica",
        "thc_percentage": "29.59%",
        "price_tier": "$$$",
        "terpene_profile": ["Limonene", "Beta-myrcene", "Caryophyllene"],
        "lineage": "OG Kush Breath x Platinum Kush",
        "lot_size": "20 kg",
        "effects": "Mood Shift, Grounded Euphoria, Stress, Sleep, Body Warmth",
        "image_url": "/strains/Grape Gelina.png"
    },
    {
        "strain_name": "Integrator",
        "type": "Balanced Hybrid",
        "thc_percentage": "31.31%",
        "price_tier": "$$",
        "terpene_profile": ["Limonene", "Beta-myrcene", "Caryophyllene"],
        "lineage": "Highschool Sweetheart x Grateful Breath",
        "lot_size": "35 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Integrator.png"
    },
    {
        "strain_name": "Jager",
        "type": "Hybrid, Indica Dominant",
        "thc_percentage": "25%+",
        "price_tier": "$$",
        "terpene_profile": ["Limonene", "Caryophyllene", "Farnesene"],
        "lineage": "G-13 x Skunk #1 x Northern Lights",
        "lot_size": "In Harvest",
        "effects": "Sleep, Appetite, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Jager.png"
    },
    {
        "strain_name": "Juicee J",
        "type": "Hybrid, Slightly Sativa Leaning",
        "thc_percentage": "26%+",
        "price_tier": "$$",
        "terpene_profile": ["Limonene", "Beta-myrcene", "Caryophyllene"],
        "lineage": "Cap Junky x Jealousy",
        "lot_size": "Lot 1: 31 kg, Lot 2: 28 kg, Lot 3: 27 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Mental Clarity, Relax",
        "image_url": "/strains/Juicee J.png"
    },
    {
        "strain_name": "London Zoap",
        "type": "Balanced Hybrid",
        "thc_percentage": "26.70%",
        "price_tier": "$$",
        "terpene_profile": ["Beta-myrcene", "Limonene", "Linalool"],
        "lineage": "London Pound Cake x Zoap",
        "lot_size": "36 kg",
        "effects": "Mood Elevation, Stress, Anxiety Relief",
        "image_url": "/strains/London Zoap.png"
    },
    {
        "strain_name": "Marshmallow OG",
        "type": "Hybrid, Slight Indica",
        "thc_percentage": "31.46%",
        "price_tier": "$$",
        "terpene_profile": ["N/A"],
        "lineage": "Jet Fuel x Chemdog D x Triangle Kush",
        "lot_size": "50 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Marshmellow OG.png"
    },
    {
        "strain_name": "MAC 1",
        "type": "Balanced Hybrid",
        "thc_percentage": "28.69%",
        "price_tier": "$$",
        "terpene_profile": ["N/A"],
        "lineage": "Alien Cookies F2 x Miracle 15",
        "lot_size": "50 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Mac 1.png"
    },
    {
        "strain_name": "Motorbreath",
        "type": "Hybrid, Indica Leaning",
        "thc_percentage": "26.41%",
        "price_tier": "$$",
        "terpene_profile": ["Beta-myrcene", "Caryophyllene", "Limonene"],
        "lineage": "Chemdog x SFV OG Kush",
        "lot_size": "22 kg",
        "effects": "Muscle Tension, Stress, Appetite, Inflammation, Sleep",
        "image_url": "/strains/Motorbreath.png"
    },
    {
        "strain_name": "Papaya Bombs",
        "type": "Hybrid, Indica Leaning",
        "thc_percentage": "29.22%",
        "price_tier": "$$",
        "terpene_profile": ["Beta-myrcene", "Caryophyllene", "Limonene"],
        "lineage": "Papaya x THC Bomb",
        "lot_size": "41 kg",
        "effects": "Mood Elevation, Stress, Inflammation, Muscle Relax",
        "image_url": "/strains/Papaya Bombs.png"
    },
    {
        "strain_name": "Purple Platinum",
        "type": "Hybrid, Indica Leaning",
        "thc_percentage": "27%+",
        "price_tier": "$$$",
        "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"],
        "lineage": "Potent pheno of Purple Kush",
        "lot_size": "In Harvest",
        "effects": "Mild High, Calm Euphoria, Relaxation",
        "image_url": "/strains/Purple Platinum.png"
    },
    {
        "strain_name": "Rainbow",
        "type": "Balanced Hybrid",
        "thc_percentage": "36.11%",
        "price_tier": "$$",
        "terpene_profile": ["N/A"],
        "lineage": "Dancehall x Blueberry",
        "lot_size": "35 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Rainbow.png"
    },
    {
        "strain_name": "Runtz Coffin Candy",
        "type": "Balanced Hybrid",
        "thc_percentage": "28.25%",
        "price_tier": "$$",
        "terpene_profile": ["Limonene", "Beta-myrcene", "Caryophyllene"],
        "lineage": "Runtz x Coffin Candy",
        "lot_size": "40 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Runtz Coffin Candy.png"
    },
    {
        "strain_name": "Rainbow Driver",
        "type": "Balanced Hybrid",
        "thc_percentage": "29.18%",
        "price_tier": "$$",
        "terpene_profile": ["Beta-myrcene", "Limonene", "Caryophyllene"],
        "lineage": "Zkittlez x Sundae Driver",
        "lot_size": "28 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Rainbow Driver.png"
    },
    {
        "strain_name": "Royal Sherb",
        "type": "Balanced Hybrid",
        "thc_percentage": "25%+",
        "price_tier": "$$",
        "terpene_profile": ["Terpinolene", "Ocimene", "Beta-myrcene"],
        "lineage": "Wedding Cake Bx1 x Sherb U4",
        "lot_size": "In Harvest",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Royal Sherb.jpg"
    },
    {
        "strain_name": "Souffle",
        "type": "Balanced Hybrid",
        "thc_percentage": "30.25%",
        "price_tier": "$$",
        "terpene_profile": ["Limonene", "Caryophyllene", "Farnesene"],
        "lineage": "Do-Si-Dos x Lava Cake",
        "lot_size": "26 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Souffle.png"
    },
    {
        "strain_name": "Strawberry Froyo",
        "type": "Balanced Hybrid",
        "thc_percentage": "34.00%",
        "price_tier": "$$",
        "terpene_profile": ["N/A"],
        "lineage": "Grape Cream Cake x Grandpa's Gun Chest",
        "lot_size": "80 kg",
        "effects": "Mood Elevation, Stress, Anxiety, Inflammation, Relax",
        "image_url": "/strains/Strawberry Froyo.png"
    }
]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Firegold Cannabis Catalog API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Grower Submission Endpoints (Public - no auth required)
@api_router.post("/grower/submit")
async def submit_strain(
    grower_name: str = Form(...),
    company_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    license_number: str = Form(""),
    strain_name: str = Form(...),
    strain_type: str = Form(...),
    thc_percentage: str = Form(...),
    cbd_percentage: str = Form(""),
    terpene_profile: str = Form(...),
    lineage: str = Form(...),
    lot_size_kg: float = Form(...),
    effects: str = Form(...),
    growing_method: str = Form(""),
    export_country: str = Form(""),
    is_irradiated: str = Form(""),
    willing_to_irradiate: str = Form(""),
    additional_notes: str = Form(""),
    strain_image: Optional[UploadFile] = File(None)
):
    """Public endpoint for growers to submit their strains for consideration"""
    import shutil
    # Enforce minimum lot size of 30 kg
    if lot_size_kg < 30:
        raise HTTPException(status_code=400, detail="Minimum lot size is 30 kilograms.")
    
    # Check if same strain from same company already submitted
    existing = await db.grower_submissions.find_one({
        "company_name": {"$regex": f"^{company_name}$", "$options": "i"},
        "strain_name": {"$regex": f"^{strain_name}$", "$options": "i"},
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="This strain has already been submitted and is pending review.")
    
    # Handle image upload
    image_path = None
    if strain_image and strain_image.filename:
        allowed_ext = ['.jpg', '.jpeg', '.png', '.webp']
        file_ext = os.path.splitext(strain_image.filename)[1].lower()
        if file_ext not in allowed_ext:
            raise HTTPException(status_code=400, detail="Image must be JPG, PNG, or WebP")
        
        os.makedirs("/app/uploads/submissions", exist_ok=True)
        safe_name = f"{uuid.uuid4()}{file_ext}"
        save_path = f"/app/uploads/submissions/{safe_name}"
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(strain_image.file, buffer)
        image_path = f"/uploads/submissions/{safe_name}"
        
        # Also copy to frontend public for serving
        os.makedirs("/app/frontend/public/submissions", exist_ok=True)
        pub_path = f"/app/frontend/public/submissions/{safe_name}"
        shutil.copy2(save_path, pub_path)
        image_path = f"/submissions/{safe_name}"
    
    sub_id = str(uuid.uuid4())
    doc = {
        "id": sub_id,
        "grower_name": grower_name,
        "company_name": company_name,
        "email": email,
        "phone": phone,
        "license_number": license_number or None,
        "strain_name": strain_name,
        "strain_type": strain_type,
        "thc_percentage": thc_percentage,
        "cbd_percentage": cbd_percentage or None,
        "terpene_profile": terpene_profile,
        "lineage": lineage,
        "lot_size_kg": lot_size_kg,
        "effects": effects,
        "growing_method": growing_method or None,
        "export_country": export_country or None,
        "is_irradiated": is_irradiated or None,
        "willing_to_irradiate": willing_to_irradiate or None,
        "image_path": image_path,
        "additional_notes": additional_notes or None,
        "status": "pending",
        "admin_notes": None,
        "admin_price_per_gram": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.grower_submissions.insert_one(doc)
    
    return {
        "message": "Submission received! We will review your strain and contact you.",
        "submission_id": sub_id,
        "strain_name": strain_name
    }

@api_router.get("/grower/submissions")
async def get_grower_submissions(
    status: Optional[str] = Query(None, description="Filter by status"),
    token: str = Depends(verify_admin_token)
):
    """Get all grower submissions (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    submissions = await db.grower_submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return submissions

class UpdateSubmissionStatus(BaseModel):
    status: str  # approved, rejected, pending
    admin_notes: Optional[str] = None
    admin_price_per_gram: Optional[str] = None

@api_router.put("/grower/submissions/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    body: UpdateSubmissionStatus,
    token: str = Depends(verify_admin_token)
):
    """Update grower submission status (admin only)"""
    if body.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_fields = {"status": body.status}
    if body.admin_notes is not None:
        update_fields["admin_notes"] = body.admin_notes
    if body.admin_price_per_gram is not None:
        update_fields["admin_price_per_gram"] = body.admin_price_per_gram
    
    result = await db.grower_submissions.update_one(
        {"id": submission_id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # If approved, automatically add the strain to the catalog
    if body.status == "approved":
        submission = await db.grower_submissions.find_one({"id": submission_id}, {"_id": 0})
        if submission:
            terpenes = [t.strip() for t in submission.get("terpene_profile", "").split(",") if t.strip()]
            lot_kg = submission.get("lot_size_kg", 30)
            
            # Determine price tier from admin_price_per_gram
            price_tier = "$$"  # default
            ppg = body.admin_price_per_gram or submission.get("admin_price_per_gram")
            if ppg:
                try:
                    ppg_val = float(ppg.replace("$", "").strip())
                    if ppg_val >= 8:
                        price_tier = "$$$"
                    elif ppg_val >= 5:
                        price_tier = "$$"
                    else:
                        price_tier = "$"
                except ValueError:
                    pass
            
            new_strain = Strain(
                strain_name=submission["strain_name"],
                type=submission["strain_type"],
                thc_percentage=submission["thc_percentage"],
                cbd_percentage=submission.get("cbd_percentage"),
                price_tier=price_tier,
                terpene_profile=terpenes,
                lineage=submission["lineage"],
                lot_size=f"{lot_kg} kg",
                effects=submission["effects"],
                image_url=submission.get("image_path")
            )
            doc = new_strain.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            if ppg:
                doc['price_per_gram'] = ppg
            await db.strains.insert_one(doc)
    
    return {"message": f"Submission {body.status}", "submission_id": submission_id}

# Admin authentication endpoints
@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    """Admin login - returns session token"""
    if login.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    
    # Generate session token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)  # Expires end of day
    
    ADMIN_TOKENS[token] = {
        'expires_at': expires_at,
        'created_at': datetime.now(timezone.utc)
    }
    
    return {
        "token": token,
        "expires_at": expires_at.isoformat(),
        "message": "Admin login successful"
    }

@api_router.post("/admin/logout")
async def admin_logout(token: str = Depends(verify_admin_token)):
    """Admin logout - invalidate token"""
    if token in ADMIN_TOKENS:
        del ADMIN_TOKENS[token]
    return {"message": "Logged out successfully"}

@api_router.get("/admin/verify")
async def verify_admin(token: str = Depends(verify_admin_token)):
    """Verify admin token is valid"""
    return {"valid": True, "message": "Admin token valid"}

# User authentication endpoints
@api_router.post("/auth/register")
async def register_user(user_data: UserRegister):
    """Register a new user with duplicate detection"""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please login.")
    
    # Check for duplicates and flag them
    flags = []
    
    # Check duplicate company name
    same_company = await db.users.find(
        {"company": {"$regex": f"^{user_data.company}$", "$options": "i"}},
        {"_id": 0, "id": 1, "company": 1, "email": 1}
    ).to_list(100)
    if same_company:
        flags.append({
            "type": "duplicate_company",
            "reason": f"Company '{user_data.company}' already registered",
            "matched_users": [u['id'] for u in same_company]
        })
    
    # Check duplicate phone
    same_phone = await db.users.find(
        {"phone": user_data.phone},
        {"_id": 0, "id": 1, "phone": 1, "email": 1}
    ).to_list(100)
    if same_phone:
        flags.append({
            "type": "duplicate_phone", 
            "reason": f"Phone '{user_data.phone}' already registered",
            "matched_users": [u['id'] for u in same_phone]
        })
    
    # Check same email domain (potential multiple registrations from same company)
    email_domain = user_data.email.split('@')[1].lower()
    same_domain = await db.users.find(
        {"email": {"$regex": f"@{email_domain}$", "$options": "i"}},
        {"_id": 0, "id": 1, "email": 1, "company": 1}
    ).to_list(100)
    if same_domain:
        flags.append({
            "type": "same_email_domain",
            "reason": f"Email domain '@{email_domain}' has {len(same_domain)} other registration(s)",
            "matched_users": [u['id'] for u in same_domain]
        })
    
    # Hash the user-provided password
    password_hash = hash_password(user_data.password)
    
    # Create user
    user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        company=user_data.company,
        country=user_data.country,
        email=user_data.email.lower(),
        phone=user_data.phone,
        password_hash=password_hash
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['has_flags'] = len(flags) > 0
    await db.users.insert_one(doc)
    
    # Store flags if any
    for flag in flags:
        flag_doc = RegistrationFlag(
            user_id=user.id,
            flag_type=flag['type'],
            flag_reason=flag['reason'],
            matched_user_ids=flag['matched_users']
        )
        flag_dict = flag_doc.model_dump()
        flag_dict['created_at'] = flag_dict['created_at'].isoformat()
        await db.registration_flags.insert_one(flag_dict)
    
    # Generate session token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
    
    USER_TOKENS[token] = {
        'user_id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'company': user.company,
        'expires_at': expires_at
    }
    
    # Create session tracking
    session = UserSession(
        user_id=user.id,
        user_email=user.email
    )
    session_doc = session.model_dump()
    session_doc['session_start'] = session_doc['session_start'].isoformat()
    await db.user_sessions.insert_one(session_doc)
    
    return {
        "message": "Registration successful",
        "token": token,
        "session_id": session.id,
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "company": user.company,
            "email": user.email
        },
        "temp_password": temp_password,  # Send this to user for future logins
        "flags_detected": len(flags)  # Let admin know if flags were raised
    }

@api_router.post("/auth/login")
async def login_user(login: UserLogin):
    """Login existing user"""
    user = await db.users.find_one({"email": login.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email not found. Please register first.")
    
    if user.get('password_hash') != hash_password(login.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    if user.get('status') == 'suspended':
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")
    
    # Generate session token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
    
    USER_TOKENS[token] = {
        'user_id': user['id'],
        'email': user['email'],
        'first_name': user['first_name'],
        'company': user['company'],
        'expires_at': expires_at
    }
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user['id'],
            "first_name": user['first_name'],
            "last_name": user['last_name'],
            "company": user['company'],
            "email": user['email']
        }
    }

@api_router.post("/auth/logout")
async def logout_user(user_data: dict = Depends(verify_user_token)):
    """Logout user"""
    # Find and remove token
    for token, data in list(USER_TOKENS.items()):
        if data.get('user_id') == user_data.get('user_id'):
            del USER_TOKENS[token]
            break
    return {"message": "Logged out successfully"}

@api_router.get("/auth/verify")
async def verify_user(user_data: dict = Depends(verify_user_token)):
    """Verify user token is valid"""
    return {
        "valid": True,
        "user": {
            "first_name": user_data.get('first_name'),
            "company": user_data.get('company'),
            "email": user_data.get('email')
        }
    }

@api_router.get("/auth/users")
async def get_users(token: str = Depends(verify_admin_token)):
    """Get all registered users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00'))
    return users

# Analytics Tracking Endpoints
@api_router.post("/analytics/track")
async def track_event(
    event_input: TrackEventInput,
    user_data: dict = Depends(verify_user_token),
    user_agent: Optional[str] = Header(None)
):
    """Track user analytics event"""
    event = AnalyticsEvent(
        user_id=user_data.get('user_id'),
        user_email=user_data.get('email'),
        user_company=user_data.get('company'),
        event_type=event_input.event_type,
        event_data=event_input.event_data or {},
        page=event_input.page,
        strain_id=event_input.strain_id,
        strain_name=event_input.strain_name,
        thc_percentage=event_input.thc_percentage,
        strain_type=event_input.strain_type,
        price_tier=event_input.price_tier,
        search_query=event_input.search_query,
        filters_applied=event_input.filters_applied,
        user_agent=user_agent
    )
    
    doc = event.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.analytics.insert_one(doc)
    
    return {"tracked": True}

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    days: int = Query(30, description="Number of days to analyze"),
    token: str = Depends(verify_admin_token)
):
    """Get analytics dashboard data (admin only)"""
    from_date = datetime.now(timezone.utc) - timedelta(days=days)
    from_date_str = from_date.isoformat()
    
    # Total events
    total_events = await db.analytics.count_documents({"timestamp": {"$gte": from_date_str}})
    
    # Unique users
    unique_users_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]
    unique_users_result = await db.analytics.aggregate(unique_users_pipeline).to_list(1)
    unique_users = unique_users_result[0]['count'] if unique_users_result else 0
    
    # Event type breakdown
    event_types_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    event_types = await db.analytics.aggregate(event_types_pipeline).to_list(100)
    
    # Most viewed strains
    strain_views_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "event_type": "strain_view", "strain_name": {"$ne": None}}},
        {"$group": {"_id": {"strain_name": "$strain_name", "strain_id": "$strain_id"}, "views": {"$sum": 1}}},
        {"$sort": {"views": -1}},
        {"$limit": 10}
    ]
    top_strains = await db.analytics.aggregate(strain_views_pipeline).to_list(10)
    
    # THC potency interest (what THC ranges are users viewing)
    thc_interest_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "thc_percentage": {"$ne": None}}},
        {"$group": {"_id": "$thc_percentage", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    thc_interest = await db.analytics.aggregate(thc_interest_pipeline).to_list(10)
    
    # Strain type interest
    type_interest_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "strain_type": {"$ne": None}}},
        {"$group": {"_id": "$strain_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    type_interest = await db.analytics.aggregate(type_interest_pipeline).to_list(20)
    
    # Price tier interest
    price_interest_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "price_tier": {"$ne": None}}},
        {"$group": {"_id": "$price_tier", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    price_interest = await db.analytics.aggregate(price_interest_pipeline).to_list(10)
    
    # Search queries
    search_queries_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "event_type": "search", "search_query": {"$ne": None}}},
        {"$group": {"_id": "$search_query", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    top_searches = await db.analytics.aggregate(search_queries_pipeline).to_list(15)
    
    # Filter usage
    filter_usage_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "event_type": "filter_apply"}},
        {"$group": {"_id": "$filters_applied", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    filter_usage = await db.analytics.aggregate(filter_usage_pipeline).to_list(10)
    
    # User engagement by company
    company_engagement_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}, "user_company": {"$ne": None}}},
        {"$group": {"_id": "$user_company", "events": {"$sum": 1}, "strains_viewed": {"$addToSet": "$strain_id"}}},
        {"$project": {"_id": 1, "events": 1, "unique_strains": {"$size": "$strains_viewed"}}},
        {"$sort": {"events": -1}},
        {"$limit": 10}
    ]
    company_engagement = await db.analytics.aggregate(company_engagement_pipeline).to_list(10)
    
    # Daily activity trend
    daily_trend_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$project": {"date": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_trend = await db.analytics.aggregate(daily_trend_pipeline).to_list(60)
    
    return {
        "period_days": days,
        "summary": {
            "total_events": total_events,
            "unique_users": unique_users
        },
        "event_breakdown": event_types,
        "top_strains": [{"strain_name": s['_id']['strain_name'], "strain_id": s['_id']['strain_id'], "views": s['views']} for s in top_strains],
        "thc_interest": [{"thc": t['_id'], "count": t['count']} for t in thc_interest],
        "strain_type_interest": [{"type": t['_id'], "count": t['count']} for t in type_interest],
        "price_tier_interest": [{"tier": p['_id'], "count": p['count']} for p in price_interest],
        "top_searches": [{"query": s['_id'], "count": s['count']} for s in top_searches],
        "filter_patterns": filter_usage,
        "company_engagement": [{"company": c['_id'], "events": c['events'], "unique_strains": c['unique_strains']} for c in company_engagement],
        "daily_trend": daily_trend
    }

@api_router.get("/analytics/user/{user_id}")
async def get_user_analytics(user_id: str, token: str = Depends(verify_admin_token)):
    """Get analytics for a specific user (admin only)"""
    events = await db.analytics.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(500)
    
    # User journey summary
    strains_viewed = list(set([e.get('strain_name') for e in events if e.get('strain_name')]))
    searches = list(set([e.get('search_query') for e in events if e.get('search_query')]))
    
    return {
        "user_id": user_id,
        "total_events": len(events),
        "strains_viewed": strains_viewed,
        "search_queries": searches,
        "recent_activity": events[:50]
    }

# CSV Export Endpoints
@api_router.get("/analytics/export/csv")
async def export_analytics_csv(
    days: int = Query(30, description="Number of days to export"),
    token: str = Depends(verify_admin_token)
):
    """Export analytics data to CSV (admin only)"""
    from_date = datetime.now(timezone.utc) - timedelta(days=days)
    from_date_str = from_date.isoformat()
    
    events = await db.analytics.find(
        {"timestamp": {"$gte": from_date_str}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(10000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Timestamp', 'User ID', 'User Email', 'Company', 'Event Type',
        'Strain Name', 'Strain Type', 'THC %', 'Price Tier', 
        'Search Query', 'Page', 'Session Duration (s)'
    ])
    
    # Data rows
    for event in events:
        writer.writerow([
            event.get('timestamp', ''),
            event.get('user_id', ''),
            event.get('user_email', ''),
            event.get('user_company', ''),
            event.get('event_type', ''),
            event.get('strain_name', ''),
            event.get('strain_type', ''),
            event.get('thc_percentage', ''),
            event.get('price_tier', ''),
            event.get('search_query', ''),
            event.get('page', ''),
            event.get('session_duration', '')
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=firegold_analytics_{days}days.csv"}
    )

@api_router.get("/users/export/csv")
async def export_users_csv(token: str = Depends(verify_admin_token)):
    """Export registered users to CSV (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'User ID', 'First Name', 'Last Name', 'Company', 'Country',
        'Email', 'Phone', 'Status', 'Has Flags', 'Registered At'
    ])
    
    # Data rows
    for user in users:
        writer.writerow([
            user.get('id', ''),
            user.get('first_name', ''),
            user.get('last_name', ''),
            user.get('company', ''),
            user.get('country', ''),
            user.get('email', ''),
            user.get('phone', ''),
            user.get('status', 'active'),
            user.get('has_flags', False),
            user.get('created_at', '')
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=firegold_users.csv"}
    )

@api_router.get("/analytics/flags")
async def get_registration_flags(token: str = Depends(verify_admin_token)):
    """Get all registration flags (admin only)"""
    flags = await db.registration_flags.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return flags

@api_router.get("/analytics/sessions")
async def get_user_sessions(
    days: int = Query(7, description="Number of days"),
    token: str = Depends(verify_admin_token)
):
    """Get user session data (admin only)"""
    from_date = datetime.now(timezone.utc) - timedelta(days=days)
    from_date_str = from_date.isoformat()
    
    sessions = await db.user_sessions.find(
        {"session_start": {"$gte": from_date_str}},
        {"_id": 0}
    ).sort("session_start", -1).to_list(500)
    
    return sessions

# Session tracking endpoint
@api_router.post("/analytics/session/update")
async def update_session(
    session_id: str,
    duration: int = Query(0, description="Session duration in seconds"),
    pages: List[str] = Query(default=[]),
    strains: List[str] = Query(default=[]),
    user_data: dict = Depends(verify_user_token)
):
    """Update user session data"""
    await db.user_sessions.update_one(
        {"id": session_id, "user_id": user_data.get('user_id')},
        {
            "$set": {
                "total_duration": duration,
                "session_end": datetime.now(timezone.utc).isoformat()
            },
            "$addToSet": {
                "pages_visited": {"$each": pages},
                "strains_viewed": {"$each": strains}
            },
            "$inc": {"actions_count": 1}
        }
    )
    return {"updated": True}

from datetime import timedelta

@api_router.post("/seed")
async def seed_database():
    """Seed the database with initial strain data"""
    count = await db.strains.count_documents({})
    if count > 0:
        return {"message": f"Database already seeded with {count} strains"}
    
    for strain_data in SEED_STRAINS:
        strain = Strain(**strain_data)
        doc = strain.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.strains.insert_one(doc)
    
    return {"message": f"Seeded {len(SEED_STRAINS)} strains"}

@api_router.post("/reseed")
async def reseed_database():
    """Clear and reseed the database with updated strain data"""
    # Delete all existing strains
    await db.strains.delete_many({})
    
    # Re-seed with new data
    for strain_data in SEED_STRAINS:
        strain = Strain(**strain_data)
        doc = strain.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.strains.insert_one(doc)
    
    return {"message": f"Reseeded {len(SEED_STRAINS)} strains with updated images"}

@api_router.get("/strains/admin", response_model=List[Strain])
async def get_strains_admin(token: str = Depends(verify_admin_token)):
    """Get all strains for admin (no user auth required)"""
    strains = await db.strains.find({}, {"_id": 0}).to_list(1000)
    for strain in strains:
        if isinstance(strain.get('created_at'), str):
            strain['created_at'] = datetime.fromisoformat(strain['created_at'].replace('Z', '+00:00'))
    return strains

@api_router.post("/strains/admin/create", response_model=Strain)
async def create_strain_admin(strain_input: StrainCreate, token: str = Depends(verify_admin_token)):
    """Create a new strain (admin only)"""
    # Check if strain name already exists
    existing = await db.strains.find_one({"strain_name": {"$regex": f"^{strain_input.strain_name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail=f"Strain '{strain_input.strain_name}' already exists")
    
    strain = Strain(**strain_input.model_dump())
    doc = strain.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.strains.insert_one(doc)
    return strain

@api_router.get("/strains", response_model=List[Strain])
async def get_strains(
    type_filter: Optional[str] = Query(None, description="Filter by strain type"),
    price_tier: Optional[str] = Query(None, description="Filter by price tier"),
    search: Optional[str] = Query(None, description="Search by strain name"),
    min_thc: Optional[float] = Query(None, description="Minimum THC percentage"),
    terpene: Optional[str] = Query(None, description="Filter by terpene"),
    user_data: dict = Depends(verify_user_token)
):
    """Get all strains with optional filters (requires authentication)"""
    query = {}
    
    if type_filter:
        query["type"] = {"$regex": type_filter, "$options": "i"}
    
    if price_tier:
        query["price_tier"] = price_tier
    
    if search:
        query["strain_name"] = {"$regex": search, "$options": "i"}
    
    if terpene:
        query["terpene_profile"] = {"$regex": terpene, "$options": "i"}
    
    strains = await db.strains.find(query, {"_id": 0}).to_list(1000)
    
    # Filter by THC if specified
    if min_thc is not None:
        filtered = []
        for s in strains:
            thc_str = s.get('thc_percentage', '0').replace('%', '').replace('+', '')
            try:
                thc_val = float(thc_str)
                if thc_val >= min_thc:
                    filtered.append(s)
            except ValueError:
                filtered.append(s)
        strains = filtered
    
    # Convert timestamps
    for strain in strains:
        if isinstance(strain.get('created_at'), str):
            strain['created_at'] = datetime.fromisoformat(strain['created_at'].replace('Z', '+00:00'))
    
    return strains

@api_router.get("/strains/{strain_id}", response_model=Strain)
async def get_strain(strain_id: str, user_data: dict = Depends(verify_user_token)):
    """Get a single strain by ID (requires authentication)"""
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    
    if isinstance(strain.get('created_at'), str):
        strain['created_at'] = datetime.fromisoformat(strain['created_at'].replace('Z', '+00:00'))
    
    return strain

@api_router.post("/strains", response_model=Strain)
async def create_strain(strain_input: StrainCreate):
    """Create a new strain"""
    strain = Strain(**strain_input.model_dump())
    doc = strain.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.strains.insert_one(doc)
    return strain

@api_router.post("/inquiries", response_model=Inquiry)
async def create_inquiry(inquiry_input: InquiryCreate):
    """Create a new buyer inquiry"""
    inquiry = Inquiry(**inquiry_input.model_dump())
    doc = inquiry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.inquiries.insert_one(doc)
    return inquiry

@api_router.get("/inquiries", response_model=List[Inquiry])
async def get_inquiries():
    """Get all inquiries (admin)"""
    inquiries = await db.inquiries.find({}, {"_id": 0}).to_list(1000)
    for inq in inquiries:
        if isinstance(inq.get('created_at'), str):
            inq['created_at'] = datetime.fromisoformat(inq['created_at'].replace('Z', '+00:00'))
    return inquiries

@api_router.post("/sample-requests/upload")
async def create_sample_request_with_files(
    company_name: str = Form(...),
    contact_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    strain_id: str = Form(...),
    shipping_address: str = Form(...),
    message: str = Form(""),
    health_canada_license: UploadFile = File(...),
    cra_license: UploadFile = File(...)
):
    """Create a new sample request with license PDF uploads"""
    # Validate file types
    if not health_canada_license.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Health Canada license must be a PDF file")
    if not cra_license.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="CRA license must be a PDF file")
    
    # Get strain name
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    strain_name = strain.get("strain_name") if strain else "Unknown"
    
    # Read and store files as base64 in the database
    hc_content = await health_canada_license.read()
    cra_content = await cra_license.read()
    
    request_id = str(uuid.uuid4())
    
    # Store the sample request with file data
    doc = {
        "id": request_id,
        "company_name": company_name,
        "contact_name": contact_name,
        "email": email,
        "phone": phone if phone else None,
        "strain_id": strain_id,
        "strain_name": strain_name,
        "health_canada_license_filename": health_canada_license.filename,
        "health_canada_license_data": base64.b64encode(hc_content).decode('utf-8'),
        "cra_license_filename": cra_license.filename,
        "cra_license_data": base64.b64encode(cra_content).decode('utf-8'),
        "shipping_address": shipping_address,
        "message": message if message else None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sample_requests.insert_one(doc)
    
    # Return without the file data
    return {
        "id": request_id,
        "company_name": company_name,
        "contact_name": contact_name,
        "email": email,
        "strain_id": strain_id,
        "strain_name": strain_name,
        "health_canada_license_filename": health_canada_license.filename,
        "cra_license_filename": cra_license.filename,
        "status": "pending"
    }

@api_router.post("/sample-requests", response_model=SampleRequest)
async def create_sample_request(request_input: SampleRequestCreate):
    """Create a new sample request with license verification"""
    # Get strain name for the request
    strain = await db.strains.find_one({"id": request_input.strain_id}, {"_id": 0})
    strain_name = strain.get("strain_name") if strain else "Unknown"
    
    sample_request = SampleRequest(
        **request_input.model_dump(),
        strain_name=strain_name
    )
    doc = sample_request.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sample_requests.insert_one(doc)
    return sample_request

@api_router.get("/sample-requests", response_model=List[SampleRequest])
async def get_sample_requests():
    """Get all sample requests (admin)"""
    requests = await db.sample_requests.find({}, {"_id": 0}).to_list(1000)
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'].replace('Z', '+00:00'))
    return requests

@api_router.get("/stats")
async def get_stats(token: str = Depends(verify_admin_token)):
    """Get catalog statistics (admin only)"""
    strain_count = await db.strains.count_documents({})
    inquiry_count = await db.inquiries.count_documents({})
    sample_request_count = await db.sample_requests.count_documents({})
    
    # Get type distribution
    pipeline = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    type_dist = await db.strains.aggregate(pipeline).to_list(100)
    
    return {
        "total_strains": strain_count,
        "total_inquiries": inquiry_count,
        "total_sample_requests": sample_request_count,
        "type_distribution": type_dist
    }

@api_router.put("/strains/{strain_id}/image")
async def update_strain_image(
    strain_id: str,
    image: UploadFile = File(...),
    token: str = Depends(verify_admin_token)
):
    """Update strain image (admin only)"""
    # Validate file type
    allowed_types = ['.jpg', '.jpeg', '.png', '.webp']
    file_ext = os.path.splitext(image.filename)[1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid image type. Use JPG, PNG, or WebP")
    
    # Check strain exists
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    
    # Save image to public folder
    import shutil
    filename = f"{strain['strain_name']}{file_ext}"
    filepath = f"/app/frontend/public/strains/{filename}"
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Update database
    new_image_url = f"/strains/{filename}"
    await db.strains.update_one(
        {"id": strain_id},
        {"$set": {"image_url": new_image_url}}
    )
    
    return {"message": "Image updated", "image_url": new_image_url}

@api_router.delete("/strains/{strain_id}")
async def delete_strain(strain_id: str, token: str = Depends(verify_admin_token)):
    """Delete a strain (admin only)"""
    result = await db.strains.delete_one({"id": strain_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strain not found")
    return {"message": "Strain deleted"}

@api_router.put("/strains/{strain_id}")
async def update_strain(strain_id: str, strain_input: StrainCreate, token: str = Depends(verify_admin_token)):
    """Update strain details (admin only)"""
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    
    update_data = strain_input.model_dump()
    await db.strains.update_one(
        {"id": strain_id},
        {"$set": update_data}
    )
    
    updated = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    return updated

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Seed database on startup if empty"""
    count = await db.strains.count_documents({})
    if count == 0:
        logger.info("Seeding database with initial strains...")
        for strain_data in SEED_STRAINS:
            strain = Strain(**strain_data)
            doc = strain.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.strains.insert_one(doc)
        logger.info(f"Seeded {len(SEED_STRAINS)} strains")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
