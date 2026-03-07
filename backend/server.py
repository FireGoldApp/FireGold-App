from fastapi import FastAPI, APIRouter, HTTPException, Query, File, UploadFile, Form, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_EMAIL = os.environ.get('SMTP_EMAIL')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'Firegold Marketplace')
APP_URL = os.environ.get('APP_URL', 'https://app.firegold.ca')

async def send_email(to_email: str, subject: str, html_body: str):
    """Send email via Microsoft 365 SMTP — respects admin email toggle"""
    # Check if emails are enabled
    settings = await db.app_settings.find_one({"key": "emails_enabled"}, {"_id": 0})
    if not settings or not settings.get("value", False):
        logger.info(f"Emails disabled — skipping send to {to_email}: {subject}")
        return False
    
    if not all([SMTP_SERVER, SMTP_EMAIL, SMTP_PASSWORD]):
        logger.warning("Email not configured, skipping send")
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

def email_template(title: str, content: str) -> str:
    """Wrap content in branded Firegold email template"""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; border: 1px solid #222;">
      <div style="padding: 30px; text-align: center; border-bottom: 1px solid #222;">
        <h1 style="color: #D4AF37; font-size: 24px; margin: 0; letter-spacing: 3px;">FIREGOLD</h1>
        <p style="color: #666; font-size: 11px; letter-spacing: 2px; margin-top: 4px;">MARKETPLACE</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #D4AF37; font-size: 18px; margin: 0 0 20px 0;">{title}</h2>
        <div style="color: #ccc; font-size: 14px; line-height: 1.6;">
          {content}
        </div>
      </div>
      <div style="padding: 20px 30px; border-top: 1px solid #222; text-align: center;">
        <p style="color: #555; font-size: 11px; margin: 0;">Firegold Marketplace &bull; Cannabis Wholesale</p>
      </div>
    </div>
    """

# Create the main app without a prefix
app = FastAPI(title="Firegold Cannabis Catalog API")

# Serve uploaded files (PDFs, docs) statically
os.makedirs("/app/uploads/submissions/docs", exist_ok=True)

# Mount uploads under /api/uploads so it's accessible through Kubernetes ingress
api_uploads_app = FastAPI()
api_uploads_app.mount("/", StaticFiles(directory="/app/uploads"), name="uploads")
app.mount("/api/uploads", api_uploads_app)

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
    license_number: Optional[str] = None
    referral_code: Optional[str] = None
    open_permit: Optional[str] = None
    permit_jurisdiction: Optional[str] = None
    user_type: Optional[str] = None  # buyer, seller, both

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
    license_number: Optional[str] = None
    status: str = "active"  # active, suspended
    open_permit: Optional[str] = None
    permit_jurisdiction: Optional[str] = None
    user_type: Optional[str] = None  # buyer, seller, both
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

def verify_any_token(authorization: str = Header(None)):
    """Verify either user or admin token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    token = authorization.replace("Bearer ", "")
    for store in [USER_TOKENS, ADMIN_TOKENS]:
        if token in store:
            data = store[token]
            if datetime.now(timezone.utc) > data['expires_at']:
                del store[token]
                raise HTTPException(status_code=401, detail="Session expired.")
            return data
    raise HTTPException(status_code=401, detail="Invalid or expired session.")

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
    effects: List[str] = []
    grade_a_kg: Optional[float] = None
    grade_b_kg: Optional[float] = None
    grade_c_kg: Optional[float] = None
    harvest_date: Optional[str] = None  # Harvest date of the flower
    growing_method: Optional[str] = None  # Indoor, Outdoor, Greenhouse
    category: Optional[str] = None  # Dried Flower, Fresh Frozen, Trim, Concentrates
    grower_company: Optional[str] = None  # LP/company that grew this strain (admin only)
    grower_name: Optional[str] = None  # Contact name of grower (admin only)
    grower_email: Optional[str] = None  # Grower email (admin only)
    submission_id: Optional[str] = None  # Link back to grower submission
    image_url: Optional[str] = None
    coa_url: Optional[str] = None  # Path to redacted COA PDF
    bc_dd_compliant: Optional[bool] = False  # BC Direct Delivery compliant
    terpene_percentage: Optional[float] = None  # Terpene percentage
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
    effects: List[str] = []
    grade_a_kg: Optional[float] = None
    grade_b_kg: Optional[float] = None
    grade_c_kg: Optional[float] = None
    harvest_date: Optional[str] = None
    growing_method: Optional[str] = None
    category: Optional[str] = None
    extract_type: Optional[str] = None
    extraction_method: Optional[str] = None
    bc_dd_compliant: Optional[bool] = False
    terpene_percentage: Optional[float] = None
    grower_company: Optional[str] = None
    grower_name: Optional[str] = None
    grower_email: Optional[str] = None
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
    lot_size_kg: float  # Lot size in kg
    effects: str
    growing_method: Optional[str] = None  # Indoor, Outdoor, Greenhouse
    category: Optional[str] = None  # Dried Flower, Fresh Frozen, Trim, Concentrates
    export_country: Optional[str] = None  # Country of export
    open_permit: Optional[str] = None  # Yes/No - has open permit
    is_irradiated: Optional[str] = None  # Yes/No - has flower been irradiated for micros
    willing_to_irradiate: Optional[str] = None  # Yes/No - willing to irradiate if required
    gacp_compliant: Optional[str] = None  # Yes/No - is product GACP compliant
    grade_a_kg: Optional[float] = None  # kg of Grade A flower
    grade_b_kg: Optional[float] = None  # kg of Grade B flower
    grade_c_kg: Optional[float] = None  # kg of Grade C flower
    harvest_date: Optional[str] = None  # Harvest date of the crop
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
    lot_size_kg: float  # Lot size in kg
    effects: str
    growing_method: Optional[str] = None
    export_country: Optional[str] = None
    is_irradiated: Optional[str] = None
    willing_to_irradiate: Optional[str] = None
    grade_a_kg: Optional[float] = None
    grade_b_kg: Optional[float] = None
    grade_c_kg: Optional[float] = None
    harvest_date: Optional[str] = None
    additional_notes: Optional[str] = None

class InquiryCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    strain_ids: List[str]
    strain_volumes: Optional[dict] = {}  # {strain_id: "volume in kg"}
    market_of_interest: Optional[str] = None
    message: str
    open_permit: Optional[str] = None
    permit_jurisdiction: Optional[str] = None

class Inquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    strain_ids: List[str]
    strain_volumes: Optional[dict] = {}
    market_of_interest: Optional[str] = None
    message: str
    open_permit: Optional[str] = None
    permit_jurisdiction: Optional[str] = None
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


# Affiliate Models
class AffiliateCreate(BaseModel):
    user_id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    referral_code: str
    commission_type: Optional[str] = None  # Set per-deal at conversion time
    commission_value: Optional[float] = None

class Affiliate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    referral_code: str
    commission_type: Optional[str] = None  # Set per-deal at conversion time
    commission_value: Optional[float] = None
    is_active: bool = True
    total_referrals: int = 0
    total_conversions: int = 0
    total_revenue: float = 0.0
    total_commission: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConvertInquiry(BaseModel):
    sale_amount: float
    total_grams: float = 0.0
    commission_type: Optional[str] = None  # Override affiliate default
    commission_value: Optional[float] = None  # Override affiliate default

class ReferralEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    affiliate_id: str
    affiliate_name: Optional[str] = None
    referral_code: str
    referred_user_id: Optional[str] = None
    referred_email: Optional[str] = None
    event_type: str  # "registration", "conversion"
    inquiry_id: Optional[str] = None
    sale_amount: Optional[float] = None
    total_grams: Optional[float] = None
    commission_type: Optional[str] = None
    commission_value: Optional[float] = None
    commission_amount: Optional[float] = None
    status: str = "pending"  # pending, converted, paid
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    message: str

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    company: Optional[str] = None
    message: str
    status: str = "unread"
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

@api_router.get("/files/{file_path:path}")
async def serve_file(file_path: str, token: str = Query(...)):
    """Serve uploaded files (admin only, token via query param for direct download)"""
    from fastapi.responses import FileResponse
    if token not in ADMIN_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    token_data = ADMIN_TOKENS[token]
    if datetime.now(timezone.utc) > token_data['expires_at']:
        del ADMIN_TOKENS[token]
        raise HTTPException(status_code=401, detail="Token expired")
    full_path = f"/app/uploads/{file_path}"
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path)


@api_router.get("/grower/verify-license/{license_number}")
async def verify_license(license_number: str):
    """Check if a Health Canada license number exists in our records"""
    # Check grower submissions for this license
    existing = await db.grower_submissions.find_one(
        {"license_number": license_number, "status": "approved"},
        {"_id": 0, "company_name": 1, "license_number": 1}
    )
    # Also check users
    user_match = await db.users.find_one(
        {"license_number": license_number},
        {"_id": 0, "company": 1, "license_number": 1}
    )
    if existing or user_match:
        return {"verified": True, "message": "License number found in our records", "company": existing.get("company_name") if existing else user_match.get("company")}
    return {"verified": False, "message": "License number not found in our records. This does not mean it is invalid."}


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
    category: str = Form(""),
    extract_type: str = Form(""),
    extraction_method: str = Form(""),
    export_country: str = Form(""),
    open_permit: str = Form(""),
    is_irradiated: str = Form(""),
    willing_to_irradiate: str = Form(""),
    gacp_compliant: str = Form(""),
    gmp_compliant: str = Form(""),
    bc_dd_compliant: str = Form(""),
    terpene_percentage: str = Form(""),
    additional_notes: str = Form(""),
    grade_a_kg: float = Form(0),
    grade_b_kg: float = Form(0),
    grade_c_kg: float = Form(0),
    harvest_date: str = Form(""),
    strain_image: Optional[UploadFile] = File(None),
    coa_file: Optional[UploadFile] = File(None),
    health_canada_license: Optional[UploadFile] = File(None),
    cra_license: Optional[UploadFile] = File(None),
    ddc_file: Optional[UploadFile] = File(None)
):
    """Public endpoint for growers to submit their strains for consideration"""
    import shutil
    # Validate lot size
    if lot_size_kg <= 0:
        raise HTTPException(status_code=400, detail="Lot size must be greater than 0")
    
    # Check if same strain from same company already submitted
    existing = await db.grower_submissions.find_one({
        "company_name": {"$regex": f"^{company_name}$", "$options": "i"},
        "strain_name": {"$regex": f"^{strain_name}$", "$options": "i"},
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="This strain has already been submitted and is pending review.")
    
    os.makedirs("/app/uploads/submissions", exist_ok=True)
    os.makedirs("/app/frontend/public/submissions", exist_ok=True)
    
    # Helper to save uploaded file
    def save_upload(upload_file, subfolder, allowed_exts):
        if not upload_file or not upload_file.filename:
            return None
        file_ext = os.path.splitext(upload_file.filename)[1].lower()
        if file_ext not in allowed_exts:
            return None
        safe_name = f"{uuid.uuid4()}{file_ext}"
        os.makedirs(f"/app/uploads/submissions/{subfolder}", exist_ok=True)
        save_path = f"/app/uploads/submissions/{subfolder}/{safe_name}"
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return f"/uploads/submissions/{subfolder}/{safe_name}"
    
    # Handle image upload
    image_path = None
    if strain_image and strain_image.filename:
        allowed_ext = ['.jpg', '.jpeg', '.png', '.webp']
        file_ext = os.path.splitext(strain_image.filename)[1].lower()
        if file_ext not in allowed_ext:
            raise HTTPException(status_code=400, detail="Image must be JPG, PNG, or WebP")
        
        safe_name = f"{uuid.uuid4()}{file_ext}"
        save_path = f"/app/uploads/submissions/{safe_name}"
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(strain_image.file, buffer)
        
        image_path = f"/api/uploads/submissions/{safe_name}"
    
    # Handle document uploads
    pdf_exts = ['.pdf']
    coa_path = save_upload(coa_file, "docs", pdf_exts)
    hc_license_path = save_upload(health_canada_license, "docs", pdf_exts)
    cra_license_path = save_upload(cra_license, "docs", pdf_exts)
    ddc_path = save_upload(ddc_file, "docs", pdf_exts)
    
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
        "category": category or None,
        "extract_type": extract_type or None,
        "extraction_method": extraction_method or None,
        "export_country": export_country or None,
        "open_permit": open_permit or None,
        "is_irradiated": is_irradiated or None,
        "willing_to_irradiate": willing_to_irradiate or None,
        "gacp_compliant": gacp_compliant or None,
        "gmp_compliant": gmp_compliant or None,
        "bc_dd_compliant": bc_dd_compliant or None,
        "terpene_percentage": terpene_percentage or None,
        "license_number": license_number or None,
        "grade_a_kg": grade_a_kg if grade_a_kg > 0 else None,
        "grade_b_kg": grade_b_kg if grade_b_kg > 0 else None,
        "grade_c_kg": grade_c_kg if grade_c_kg > 0 else None,
        "harvest_date": harvest_date or None,
        "image_path": image_path,
        "coa_path": coa_path,
        "health_canada_license_path": hc_license_path,
        "cra_license_path": cra_license_path,
        "ddc_path": ddc_path,
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
            
            # Convert effects from comma-separated string to array
            effects_raw = submission.get("effects", "")
            if isinstance(effects_raw, str):
                effects_list = [e.strip() for e in effects_raw.split(",") if e.strip()]
            else:
                effects_list = effects_raw or []
            
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
                effects=effects_list,
                grade_a_kg=submission.get("grade_a_kg"),
                grade_b_kg=submission.get("grade_b_kg"),
                grade_c_kg=submission.get("grade_c_kg"),
                harvest_date=submission.get("harvest_date"),
                growing_method=submission.get("growing_method"),
                category=submission.get("category"),
                bc_dd_compliant=submission.get("bc_dd_compliant") == "Yes",
                grower_company=submission.get("company_name"),
                grower_name=submission.get("grower_name"),
                grower_email=submission.get("email"),
                submission_id=submission.get("id"),
                image_url=submission.get("image_path")
            )
            doc = new_strain.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            if ppg:
                doc['price_per_gram'] = ppg
            await db.strains.insert_one(doc)
            
            # Send approval email with attachments to QA team
            attachment_info = []
            for field_name, label in [
                ("coa_path", "COA"), 
                ("health_canada_license_path", "Health Canada License"),
                ("cra_license_path", "CRA License"),
                ("ddc_path", "Direct Delivery Compliance")
            ]:
                path = submission.get(field_name)
                if path:
                    full_path = f"/app{path}" if not path.startswith("/app") else path
                    attachment_info.append(f'<li><a href="{os.environ.get("APP_URL", "")}{path}" style="color: #D4AF37;">{label}</a></li>')
            
            docs_html = f"<ul>{''.join(attachment_info)}</ul>" if attachment_info else "<p>No documents uploaded.</p>"
            
            approval_email_body = email_template("Approved Submission — Documents", f"""
                <p>A grower submission has been <strong style="color: #4CAF50;">APPROVED</strong>:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr><td style="color: #888; padding: 4px 8px;">Strain:</td><td style="color: #fff; padding: 4px 8px;">{submission['strain_name']}</td></tr>
                    <tr><td style="color: #888; padding: 4px 8px;">Company:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('company_name', 'N/A')}</td></tr>
                    <tr><td style="color: #888; padding: 4px 8px;">Grower:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('grower_name', 'N/A')}</td></tr>
                    <tr><td style="color: #888; padding: 4px 8px;">Email:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('email', 'N/A')}</td></tr>
                    <tr><td style="color: #888; padding: 4px 8px;">THC:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('thc_percentage', 'N/A')}</td></tr>
                    <tr><td style="color: #888; padding: 4px 8px;">Category:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('category', 'N/A')}</td></tr>
                    <tr><td style="color: #888; padding: 4px 8px;">BC DD:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('bc_dd_compliant', 'N/A')}</td></tr>
                </table>
                <p style="color: #D4AF37; font-weight: bold;">Uploaded Documents:</p>
                {docs_html}
            """)
            
            for qa_email in ["lynette@firegold.ca", "qa@firegold.ca"]:
                await send_email(qa_email, f"Approved: {submission['strain_name']} — {submission.get('company_name', '')}", approval_email_body)
            
            # Send notification to the grower
            grower_email = submission.get("email")
            if grower_email:
                await send_email(
                    grower_email,
                    f"Your Submission Has Been Approved — {submission['strain_name']}",
                    email_template("Submission Approved", f"""
                        <p>Great news! Your product submission has been <strong style="color: #4CAF50;">approved</strong> by the Firegold team.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                            <tr><td style="color: #888; padding: 4px 8px;">Strain:</td><td style="color: #fff; padding: 4px 8px;">{submission['strain_name']}</td></tr>
                            <tr><td style="color: #888; padding: 4px 8px;">Company:</td><td style="color: #fff; padding: 4px 8px;">{submission.get('company_name', 'N/A')}</td></tr>
                        </table>
                        <p>Your product is now listed on the Firegold Marketplace and is visible to qualified buyers.</p>
                        <p>If you have any questions, don't hesitate to reach out to us at <a href="mailto:warren@firegold.ca" style="color: #D4AF37;">warren@firegold.ca</a>.</p>
                    """)
                )
    
    return {"message": f"Submission {body.status}", "submission_id": submission_id}

# Public: Check if LP/company already has licenses on file
@api_router.get("/grower/check-licenses")
async def check_licenses_on_file(company_name: str = Query(..., min_length=2)):
    """Check if an LP/company already has licenses on file from previous submissions"""
    # Look for any submission from this company that has license files
    submissions = await db.grower_submissions.find(
        {"company_name": {"$regex": f"^{company_name}$", "$options": "i"}},
        {"_id": 0, "company_name": 1, "health_canada_license_path": 1, "cra_license_path": 1, "coa_path": 1, "grower_name": 1, "status": 1}
    ).to_list(100)
    
    has_hc = any(s.get("health_canada_license_path") for s in submissions)
    has_cra = any(s.get("cra_license_path") for s in submissions)
    has_coa = any(s.get("coa_path") for s in submissions)
    previous_submissions = len(submissions)
    
    return {
        "company_name": company_name,
        "licenses_on_file": {
            "health_canada_license": has_hc,
            "cra_license": has_cra,
            "coa": has_coa
        },
        "previous_submissions": previous_submissions,
        "recognized": previous_submissions > 0
    }

# Public: Submission status tracker
@api_router.get("/grower/track")
async def track_submission(
    submission_id: Optional[str] = Query(None),
    company_name: Optional[str] = Query(None)
):
    """Public endpoint for growers to track their submission status"""
    if not submission_id and not company_name:
        raise HTTPException(status_code=400, detail="Provide submission_id or company_name")
    
    if submission_id:
        sub = await db.grower_submissions.find_one(
            {"id": submission_id},
            {"_id": 0, "id": 1, "strain_name": 1, "company_name": 1, "status": 1, 
             "created_at": 1, "admin_notes": 1, "admin_price_per_gram": 1,
             "health_canada_license_path": 1, "cra_license_path": 1, "coa_path": 1}
        )
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        submissions = [sub]
    else:
        submissions = await db.grower_submissions.find(
            {"company_name": {"$regex": f"^{company_name}$", "$options": "i"}},
            {"_id": 0, "id": 1, "strain_name": 1, "company_name": 1, "status": 1,
             "created_at": 1, "admin_notes": 1, "admin_price_per_gram": 1,
             "health_canada_license_path": 1, "cra_license_path": 1, "coa_path": 1}
        ).sort("created_at", -1).to_list(100)
    
    # Determine license status for the company
    has_hc = any(s.get("health_canada_license_path") for s in submissions)
    has_cra = any(s.get("cra_license_path") for s in submissions)
    has_coa = any(s.get("coa_path") for s in submissions)
    
    # Clean submissions for public view (remove internal paths)
    results = []
    for s in submissions:
        results.append({
            "id": s["id"],
            "strain_name": s["strain_name"],
            "company_name": s["company_name"],
            "status": s["status"],
            "submitted_at": s.get("created_at"),
            "price_per_gram": s.get("admin_price_per_gram") if s["status"] == "approved" else None
        })
    
    return {
        "submissions": results,
        "licenses_on_file": {
            "health_canada_license": has_hc,
            "cra_license": has_cra,
            "coa": has_coa
        }
    }

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
        password_hash=password_hash,
        license_number=user_data.license_number,
        open_permit=user_data.open_permit,
        permit_jurisdiction=user_data.permit_jurisdiction,
        user_type=user_data.user_type
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
    
    # Track affiliate referral if present
    if user_data.referral_code:
        affiliate = await db.affiliates.find_one(
            {"referral_code": user_data.referral_code.upper(), "is_active": True}, {"_id": 0}
        )
        if affiliate:
            ref_event = ReferralEvent(
                affiliate_id=affiliate["id"],
                referral_code=affiliate["referral_code"],
                referred_user_id=user.id,
                referred_email=user.email,
                event_type="registration"
            )
            ref_doc = ref_event.model_dump()
            ref_doc["created_at"] = ref_doc["created_at"].isoformat()
            await db.referral_events.insert_one(ref_doc)
            # Store the referral code on the user
            await db.users.update_one({"id": user.id}, {"$set": {"referred_by": affiliate["referral_code"]}})
    
    # Send welcome email to new user
    try:
        await send_email(
            user.email,
            "Welcome to Firegold Marketplace",
            email_template("Welcome!", f"""
                <p>Hi {user.first_name},</p>
                <p>Thank you for registering with Firegold Marketplace. Your account is now active and you can browse our full cannabis whole flower catalog.</p>
                <p style="margin: 25px 0;">
                    <a href="{APP_URL}" style="background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; letter-spacing: 2px; font-size: 13px;">VISIT MARKETPLACE</a>
                </p>
                <p>If you have any questions, don't hesitate to reach out.</p>
                <p style="margin-top: 20px; color: #D4AF37;">— The Firegold Team</p>
            """)
        )
    except Exception as e:
        logger.error(f"Welcome email failed: {e}")
    
    # Notify admin of new registration
    try:
        await send_email(
            SMTP_EMAIL,
            f"New User Registration: {user.first_name} {user.last_name} — {user.company}",
            email_template("New User Registration", f"""
                <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                <p><strong>Company:</strong> {user.company}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Country:</strong> {user.country}</p>
                <p><strong>Phone:</strong> {user.phone or 'N/A'}</p>
                <p><strong>License #:</strong> {user_data.license_number or 'N/A'}</p>
                {"<p><strong>Referred by:</strong> " + user_data.referral_code + "</p>" if user_data.referral_code else ""}
            """)
        )
    except Exception as e:
        logger.error(f"Admin notification email failed: {e}")

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
        raise HTTPException(status_code=403, detail="Your access has been paused. Please contact warren@firegold.ca to request new access.")
    
    if user.get('status') == 'removed':
        raise HTTPException(status_code=403, detail="Your account has been removed. Please contact warren@firegold.ca to request new access.")
    
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
    
    # Track login event
    await db.analytics.insert_one({
        "user_id": user['id'],
        "user_email": user['email'],
        "event_type": "login",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {}
    })
    
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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Send password reset email"""
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email is registered, you will receive a reset link shortly."}
    
    reset_token = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    await db.password_resets.insert_one({
        "token": reset_token,
        "user_id": user["id"],
        "email": body.email.lower(),
        "expires_at": expires.isoformat(),
        "used": False
    })
    
    reset_link = f"{APP_URL}/reset-password?token={reset_token}"
    
    await send_email(
        body.email,
        "Reset Your Firegold Password",
        email_template("Password Reset", f"""
            <p>Hi {user.get('first_name', '')},</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p style="margin: 25px 0;">
                <a href="{reset_link}" style="background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; letter-spacing: 2px; font-size: 13px;">RESET PASSWORD</a>
            </p>
            <p style="color: #888; font-size: 12px;">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
        """)
    )
    
    return {"message": "If this email is registered, you will receive a reset link shortly."}

@api_router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Reset password using token"""
    reset = await db.password_resets.find_one({"token": body.token, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    if datetime.now(timezone.utc).isoformat() > reset["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset link has expired")
    
    password_hash = hashlib.sha256(body.new_password.encode()).hexdigest()
    await db.users.update_one({"id": reset["user_id"]}, {"$set": {"password_hash": password_hash}})
    await db.password_resets.update_one({"token": body.token}, {"$set": {"used": True}})
    
    return {"message": "Password reset successful. You can now log in with your new password."}

@api_router.get("/auth/my-referral")
async def get_my_referral(user_data: dict = Depends(verify_user_token)):
    """Get or create a personal referral code for the logged-in user"""
    user_id = user_data.get('user_id')
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user already has a referral code stored
    my_code = user.get('my_referral_code')
    if my_code:
        return {"referral_code": my_code, "referral_url": f"/?ref={my_code}"}
    
    # Auto-generate code from name: FIRSTNAME + LAST_INITIAL
    first = (user.get('first_name') or 'USER').strip().upper().replace(' ', '')
    last = (user.get('last_name') or '').strip().upper()
    base_code = first + (last[0] if last else '')
    
    # Ensure uniqueness
    code = base_code
    counter = 1
    while await db.affiliates.find_one({"referral_code": code}):
        code = f"{base_code}{counter}"
        counter += 1
    
    # Create affiliate record for this user
    affiliate = Affiliate(
        user_id=user_id,
        name=f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
        email=user.get('email', ''),
        phone=user.get('phone'),
        company=user.get('company'),
        referral_code=code,
        commission_rate=0  # Default, admin can adjust
    )
    aff_doc = affiliate.model_dump()
    aff_doc["created_at"] = aff_doc["created_at"].isoformat()
    await db.affiliates.insert_one(aff_doc)
    
    # Store code on user record
    await db.users.update_one({"id": user_id}, {"$set": {"my_referral_code": code}})
    
    return {"referral_code": code, "referral_url": f"/?ref={code}"}

@api_router.get("/auth/users")
async def get_users(token: str = Depends(verify_admin_token)):
    """Get all registered users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00'))
    return users

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, status: dict, token: str = Depends(verify_admin_token)):
    """Pause or reactivate a user's access (admin only)"""
    new_status = status.get("status")
    if new_status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'suspended'")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Invalidate any active tokens for this user if suspending
    if new_status == "suspended":
        to_remove = [t for t, d in USER_TOKENS.items() if d.get('user_id') == user_id]
        for t in to_remove:
            del USER_TOKENS[t]
    
    return {"message": f"User status updated to {new_status}"}

@api_router.delete("/admin/users/{user_id}")
async def remove_user(user_id: str, token: str = Depends(verify_admin_token)):
    """Remove a user permanently (admin only)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark as removed instead of deleting (preserves analytics history)
    await db.users.update_one({"id": user_id}, {"$set": {"status": "removed"}})
    
    # Invalidate any active tokens
    to_remove = [t for t, d in USER_TOKENS.items() if d.get('user_id') == user_id]
    for t in to_remove:
        del USER_TOKENS[t]
    
    return {"message": "User removed"}


@api_router.get("/admin/users/{user_id}/profile")
async def get_user_profile(user_id: str, token: str = Depends(verify_admin_token)):
    """Get comprehensive user profile with activity history"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all inquiries from this user
    user_inquiries = await db.inquiries.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Resolve strain names for inquiries
    all_strain_ids = set()
    for inq in user_inquiries:
        all_strain_ids.update(inq.get("strain_ids", []))
    strain_map = {}
    if all_strain_ids:
        strains_list = await db.strains.find({"id": {"$in": list(all_strain_ids)}}, {"_id": 0, "id": 1, "strain_name": 1}).to_list(500)
        strain_map = {s["id"]: s["strain_name"] for s in strains_list}
    
    for inq in user_inquiries:
        inq["strain_names"] = inq.get("strain_names") or [strain_map.get(sid, "Unknown") for sid in inq.get("strain_ids", [])]
        if isinstance(inq.get("created_at"), datetime):
            inq["created_at"] = inq["created_at"].isoformat()
    
    # Get all sample requests from this user
    user_samples = await db.sample_requests.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    for sr in user_samples:
        if isinstance(sr.get("created_at"), datetime):
            sr["created_at"] = sr["created_at"].isoformat()
    
    # Get analytics events (strain views, filter usage, etc.)
    user_events = await db.analytics.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(500)
    
    # Compute strain view counts
    strain_views = {}
    login_history = []
    filter_usage = {}
    total_page_views = 0
    
    for evt in user_events:
        evt_type = evt.get("event_type", "")
        if isinstance(evt.get("timestamp"), datetime):
            evt["timestamp"] = evt["timestamp"].isoformat()
        
        if evt_type == "strain_view":
            sid = evt.get("strain_id") or evt.get("data", {}).get("strain_id") or evt.get("event_data", {}).get("strain_id")
            sname = evt.get("strain_name") or evt.get("data", {}).get("strain_name") or evt.get("event_data", {}).get("strain_name", "Unknown")
            if sid:
                if sid not in strain_views:
                    strain_views[sid] = {"name": sname, "count": 0, "last_viewed": evt.get("timestamp")}
                strain_views[sid]["count"] += 1
        elif evt_type == "page_view":
            total_page_views += 1
        elif evt_type == "login":
            login_history.append(evt.get("timestamp"))
        elif evt_type in ("filter_change", "filter_apply"):
            fdata = evt.get("filters_applied") or evt.get("event_data", {}).get("filters") or evt.get("data", {})
            if isinstance(fdata, dict):
                for k, v in fdata.items():
                    if v:
                        filter_usage[k] = filter_usage.get(k, 0) + 1
    
    # Sort strain views by count
    top_strains = sorted(strain_views.values(), key=lambda x: x["count"], reverse=True)
    
    # Convert user dates
    if isinstance(user.get("created_at"), datetime):
        user["created_at"] = user["created_at"].isoformat()
    
    return {
        "user": user,
        "inquiries": user_inquiries,
        "sample_requests": user_samples,
        "activity_summary": {
            "total_page_views": total_page_views,
            "total_strain_views": sum(s["count"] for s in strain_views.values()),
            "total_inquiries": len(user_inquiries),
            "total_sample_requests": len(user_samples),
            "login_count": len(login_history),
            "last_login": login_history[0] if login_history else None,
            "login_history": login_history[:20],
        },
        "top_strains_viewed": top_strains[:15],
        "filter_usage": filter_usage,
        "recent_events": user_events[:30]
    }


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
    """Get detailed analytics for a specific user (admin only)"""
    events = await db.analytics.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(500)
    
    sessions = await db.user_sessions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("session_start", -1).to_list(100)
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    strains_viewed = list(set([e.get('strain_name') for e in events if e.get('strain_name')]))
    searches = list(set([e.get('search_query') for e in events if e.get('search_query')]))
    
    # Event timeline grouped by type
    event_counts = {}
    for e in events:
        et = e.get('event_type', 'unknown')
        event_counts[et] = event_counts.get(et, 0) + 1
    
    # Most viewed strains by this user
    strain_view_counts = {}
    for e in events:
        if e.get('event_type') == 'strain_view' and e.get('strain_name'):
            sn = e['strain_name']
            strain_view_counts[sn] = strain_view_counts.get(sn, 0) + 1
    top_strains = sorted(strain_view_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Session summary
    total_sessions = len(sessions)
    total_duration = sum(s.get('total_duration', 0) for s in sessions)
    avg_duration = total_duration // total_sessions if total_sessions > 0 else 0
    
    # First and last activity
    first_event = events[-1].get('timestamp') if events else None
    last_event = events[0].get('timestamp') if events else None
    
    return {
        "user_id": user_id,
        "user_info": user,
        "total_events": len(events),
        "total_sessions": total_sessions,
        "total_duration_seconds": total_duration,
        "avg_session_seconds": avg_duration,
        "first_activity": first_event,
        "last_activity": last_event,
        "strains_viewed": strains_viewed,
        "search_queries": searches,
        "event_breakdown": event_counts,
        "top_strains": [{"strain_name": s[0], "views": s[1]} for s in top_strains],
        "recent_activity": events[:100],
        "sessions": sessions[:20]
    }

@api_router.get("/analytics/users-report")
async def get_users_activity_report(
    sort_by: str = Query("login_count", description="Sort by: login_count, total_events, last_active, strains_viewed"),
    token: str = Depends(verify_admin_token)
):
    """Get comprehensive user activity report sorted by various metrics"""
    all_users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    user_ids = [u['id'] for u in all_users]
    
    # Batch: total events per user
    events_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "total_events": {"$sum": 1}, "last_active": {"$max": "$timestamp"}}}
    ]).to_list(1000)
    events_map = {e["_id"]: e for e in events_agg}
    
    # Batch: login counts and durations
    sessions_agg = await db.user_sessions.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "login_count": {"$sum": 1}, "total_duration": {"$sum": {"$ifNull": ["$total_duration", 0]}}}}
    ]).to_list(1000)
    sessions_map = {s["_id"]: s for s in sessions_agg}
    
    # Batch: unique strains viewed
    strains_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "event_type": "strain_view", "strain_name": {"$ne": None}}},
        {"$group": {"_id": {"user_id": "$user_id", "strain": "$strain_name"}}},
        {"$group": {"_id": "$_id.user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    strains_map = {s["_id"]: s["count"] for s in strains_agg}
    
    # Batch: search counts
    search_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "event_type": "search"}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    search_map = {s["_id"]: s["count"] for s in search_agg}
    
    # Batch: COA views
    coa_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "event_type": "coa_view"}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    coa_map = {c["_id"]: c["count"] for c in coa_agg}
    
    # Batch: sample requests
    sample_agg = await db.sample_requests.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    sample_map = {s["_id"]: s["count"] for s in sample_agg}
    
    user_reports = []
    for user in all_users:
        uid = user['id']
        ev = events_map.get(uid, {})
        sess = sessions_map.get(uid, {})
        user_reports.append({
            "user_id": uid,
            "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "company": user.get('company', ''),
            "email": user.get('email', ''),
            "country": user.get('country', ''),
            "registered": user.get('registration_date') or user.get('created_at', ''),
            "login_count": sess.get("login_count", 0),
            "total_events": ev.get("total_events", 0),
            "total_duration_seconds": sess.get("total_duration", 0),
            "last_active": ev.get("last_active"),
            "strains_viewed": strains_map.get(uid, 0),
            "searches": search_map.get(uid, 0),
            "coa_views": coa_map.get(uid, 0),
            "sample_requests": sample_map.get(uid, 0)
        })
    
    # Sort
    sort_key = sort_by
    if sort_key == 'last_active':
        user_reports.sort(key=lambda x: x.get('last_active') or '', reverse=True)
    else:
        user_reports.sort(key=lambda x: x.get(sort_key, 0), reverse=True)
    
    return user_reports

@api_router.get("/analytics/engagement")
async def get_engagement_metrics(
    days: int = Query(30),
    token: str = Depends(verify_admin_token)
):
    """Get engagement metrics: avg session duration, peak times, conversion rates"""
    from_date = datetime.now(timezone.utc) - timedelta(days=days)
    from_date_str = from_date.isoformat()
    
    # Session metrics
    sessions = await db.user_sessions.find(
        {"session_start": {"$gte": from_date_str}},
        {"_id": 0}
    ).to_list(10000)
    
    durations = [s.get('total_duration', 0) for s in sessions if s.get('total_duration', 0) > 0]
    avg_session = sum(durations) // len(durations) if durations else 0
    max_session = max(durations) if durations else 0
    total_sessions = len(sessions)
    
    # Peak usage hours
    hour_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$project": {"hour": {"$substr": ["$timestamp", 11, 2]}}},
        {"$group": {"_id": "$hour", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    peak_hours = await db.analytics.aggregate(hour_pipeline).to_list(24)
    
    # Peak usage days of week
    day_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$project": {"date": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_activity = await db.analytics.aggregate(day_pipeline).to_list(60)
    
    # Conversion funnel: views -> sample requests
    total_viewers = await db.analytics.aggregate([
        {"$match": {"timestamp": {"$gte": from_date_str}, "event_type": "strain_view"}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]).to_list(1)
    viewer_count = total_viewers[0]['count'] if total_viewers else 0
    
    sample_requesters = await db.sample_requests.aggregate([
        {"$match": {"request_date": {"$gte": from_date_str}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]).to_list(1)
    requester_count = sample_requesters[0]['count'] if sample_requesters else 0
    
    # Navigation flow: what users do after login
    flow_pipeline = [
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$sort": {"user_id": 1, "timestamp": 1}},
        {"$group": {
            "_id": "$user_id",
            "events": {"$push": "$event_type"}
        }},
        {"$project": {
            "first_action": {"$arrayElemAt": ["$events", 0]},
            "second_action": {"$arrayElemAt": ["$events", 1]},
            "third_action": {"$arrayElemAt": ["$events", 2]}
        }}
    ]
    flows = await db.analytics.aggregate(flow_pipeline).to_list(1000)
    
    # Count common flows
    flow_counts = {}
    for f in flows:
        path = ' → '.join(filter(None, [f.get('first_action'), f.get('second_action'), f.get('third_action')]))
        if path:
            flow_counts[path] = flow_counts.get(path, 0) + 1
    top_flows = sorted(flow_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Returning vs new users
    all_time_users_result = await db.analytics.aggregate([
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]).to_list(1)
    all_time_users = all_time_users_result[0]['count'] if all_time_users_result else 0
    
    period_users_result = await db.analytics.aggregate([
        {"$match": {"timestamp": {"$gte": from_date_str}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"}
    ]).to_list(1)
    period_users = period_users_result[0]['count'] if period_users_result else 0
    
    return {
        "period_days": days,
        "sessions": {
            "total": total_sessions,
            "avg_duration_seconds": avg_session,
            "max_duration_seconds": max_session
        },
        "peak_hours": [{"hour": h['_id'], "events": h['count']} for h in peak_hours[:6]],
        "daily_activity": daily_activity,
        "conversion": {
            "total_viewers": viewer_count,
            "sample_requesters": requester_count,
            "conversion_rate": round(requester_count / viewer_count * 100, 1) if viewer_count > 0 else 0
        },
        "top_navigation_flows": [{"flow": f[0], "count": f[1]} for f in top_flows],
        "user_base": {
            "all_time": all_time_users,
            "active_this_period": period_users
        }
    }

@api_router.get("/analytics/users-export/csv")
async def export_user_activity_csv(token: str = Depends(verify_admin_token)):
    """Export user activity report to CSV"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    user_ids = [u['id'] for u in users]
    
    # Batch all queries
    events_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "total_events": {"$sum": 1}, "last_active": {"$max": "$timestamp"}}}
    ]).to_list(1000)
    events_map = {e["_id"]: e for e in events_agg}
    
    sessions_agg = await db.user_sessions.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "login_count": {"$sum": 1}}}
    ]).to_list(1000)
    sessions_map = {s["_id"]: s["login_count"] for s in sessions_agg}
    
    strains_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "event_type": "strain_view", "strain_name": {"$ne": None}}},
        {"$group": {"_id": {"user_id": "$user_id", "strain": "$strain_name"}}},
        {"$group": {"_id": "$_id.user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    strains_map = {s["_id"]: s["count"] for s in strains_agg}
    
    search_agg = await db.analytics.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "event_type": "search"}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    search_map = {s["_id"]: s["count"] for s in search_agg}
    
    sample_agg = await db.sample_requests.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    sample_map = {s["_id"]: s["count"] for s in sample_agg}
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Company", "Email", "Country", "Registered", "Logins", "Total Events", "Strains Viewed", "Searches", "Sample Requests", "Last Active"])
    
    for user in users:
        uid = user['id']
        ev = events_map.get(uid, {})
        writer.writerow([
            f"{user.get('first_name','')} {user.get('last_name','')}",
            user.get('company', ''),
            user.get('email', ''),
            user.get('country', ''),
            user.get('registration_date', user.get('created_at', '')),
            sessions_map.get(uid, 0),
            ev.get("total_events", 0),
            strains_map.get(uid, 0),
            search_map.get(uid, 0),
            sample_map.get(uid, 0),
            ev.get("last_active", '')
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=firegold_user_activity.csv"}
    )

@api_router.get("/analytics/global")
async def get_global_analytics(token: str = Depends(verify_admin_token)):
    """Comprehensive global analytics — geographic, demand signals, and market insights"""
    
    # --- Geographic Breakdown ---
    # Users by country
    country_pipeline = [
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    users_by_country = await db.users.aggregate(country_pipeline).to_list(50)
    
    # Submissions by export country
    export_pipeline = [
        {"$match": {"export_country": {"$ne": None}}},
        {"$group": {"_id": "$export_country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    exports_by_country = await db.grower_submissions.aggregate(export_pipeline).to_list(50)
    
    # Company interest by country (which companies from which countries are most active)
    company_country_pipeline = [
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "id", "as": "user_info"}},
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": {"country": "$user_info.country", "company": "$user_info.company"},
            "events": {"$sum": 1},
            "strains_viewed": {"$addToSet": "$strain_name"}
        }},
        {"$project": {
            "country": "$_id.country",
            "company": "$_id.company",
            "events": 1,
            "unique_strains": {"$size": {"$filter": {"input": "$strains_viewed", "cond": {"$ne": ["$$this", None]}}}}
        }},
        {"$sort": {"events": -1}},
        {"$limit": 20}
    ]
    company_by_country = await db.analytics.aggregate(company_country_pipeline).to_list(20)
    
    # --- Demand Signals ---
    # Most requested sample strains
    sample_demand_pipeline = [
        {"$group": {"_id": "$strain_name", "requests": {"$sum": 1}, "companies": {"$addToSet": "$company_name"}}},
        {"$project": {"strain_name": "$_id", "requests": 1, "unique_companies": {"$size": "$companies"}}},
        {"$sort": {"requests": -1}},
        {"$limit": 10}
    ]
    sample_demand = await db.sample_requests.aggregate(sample_demand_pipeline).to_list(10)
    
    # Strain types in demand (by views, not just existence)
    type_demand_pipeline = [
        {"$match": {"event_type": "strain_view", "strain_type": {"$ne": None}}},
        {"$group": {"_id": "$strain_type", "views": {"$sum": 1}, "unique_users": {"$addToSet": "$user_id"}}},
        {"$project": {"type": "$_id", "views": 1, "user_count": {"$size": "$unique_users"}}},
        {"$sort": {"views": -1}},
        {"$limit": 10}
    ]
    type_demand = await db.analytics.aggregate(type_demand_pipeline).to_list(10)
    
    # Price tier demand
    tier_demand_pipeline = [
        {"$match": {"event_type": "strain_view", "price_tier": {"$ne": None}}},
        {"$group": {"_id": "$price_tier", "views": {"$sum": 1}, "unique_users": {"$addToSet": "$user_id"}}},
        {"$project": {"tier": "$_id", "views": 1, "user_count": {"$size": "$unique_users"}}},
        {"$sort": {"views": -1}}
    ]
    tier_demand = await db.analytics.aggregate(tier_demand_pipeline).to_list(10)
    
    # --- Supply-Side Insights ---
    # Grower submissions by status
    submission_status = await db.grower_submissions.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(5)
    
    # Grower submissions by strain type
    grower_type_pipeline = [
        {"$group": {"_id": "$strain_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    grower_types = await db.grower_submissions.aggregate(grower_type_pipeline).to_list(10)
    
    # Average lot sizes
    lot_pipeline = [
        {"$match": {"lot_size_kg": {"$gt": 0}}},
        {"$group": {"_id": None, "avg_lot": {"$avg": "$lot_size_kg"}, "min_lot": {"$min": "$lot_size_kg"}, "max_lot": {"$max": "$lot_size_kg"}, "total_kg": {"$sum": "$lot_size_kg"}}}
    ]
    lot_stats = await db.grower_submissions.aggregate(lot_pipeline).to_list(1)
    
    # Irradiation stats
    irrad_pipeline = [
        {"$group": {"_id": "$is_irradiated", "count": {"$sum": 1}}}
    ]
    irradiation_stats = await db.grower_submissions.aggregate(irrad_pipeline).to_list(5)
    
    # Grade distribution analytics
    grade_pipeline = [
        {"$match": {"$or": [{"grade_a_kg": {"$gt": 0}}, {"grade_b_kg": {"$gt": 0}}, {"grade_c_kg": {"$gt": 0}}]}},
        {"$group": {
            "_id": None,
            "total_grade_a": {"$sum": {"$ifNull": ["$grade_a_kg", 0]}},
            "total_grade_b": {"$sum": {"$ifNull": ["$grade_b_kg", 0]}},
            "total_grade_c": {"$sum": {"$ifNull": ["$grade_c_kg", 0]}},
            "submissions_with_grades": {"$sum": 1}
        }}
    ]
    grade_stats = await db.grower_submissions.aggregate(grade_pipeline).to_list(1)
    
    # Grade distribution from catalog strains
    catalog_grade_pipeline = [
        {"$match": {"$or": [{"grade_a_kg": {"$gt": 0}}, {"grade_b_kg": {"$gt": 0}}, {"grade_c_kg": {"$gt": 0}}]}},
        {"$group": {
            "_id": None,
            "total_grade_a": {"$sum": {"$ifNull": ["$grade_a_kg", 0]}},
            "total_grade_b": {"$sum": {"$ifNull": ["$grade_b_kg", 0]}},
            "total_grade_c": {"$sum": {"$ifNull": ["$grade_c_kg", 0]}},
            "strains_with_grades": {"$sum": 1}
        }}
    ]
    catalog_grades = await db.strains.aggregate(catalog_grade_pipeline).to_list(1)
    
    # --- Terpene Interest ---
    terpene_pipeline = [
        {"$match": {"event_type": "strain_view", "terpene_profile": {"$ne": None}}},
        {"$unwind": "$terpene_profile"},
        {"$group": {"_id": "$terpene_profile", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    terpene_interest = await db.analytics.aggregate(terpene_pipeline).to_list(15)
    
    # --- Growth Metrics ---
    # New registrations over time
    reg_pipeline = [
        {"$project": {"date": {"$substr": [{"$ifNull": ["$registration_date", "$created_at"]}, 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    registration_timeline = await db.users.aggregate(reg_pipeline).to_list(100)
    
    # Total counts
    total_users = await db.users.count_documents({})
    total_strains = await db.strains.count_documents({})
    total_submissions = await db.grower_submissions.count_documents({})
    total_samples = await db.sample_requests.count_documents({})
    total_events = await db.analytics.count_documents({})
    strains_with_coa = await db.strains.count_documents({"coa_url": {"$ne": None}})
    
    return {
        "totals": {
            "users": total_users,
            "strains": total_strains,
            "strains_with_coa": strains_with_coa,
            "submissions": total_submissions,
            "sample_requests": total_samples,
            "total_events": total_events
        },
        "geographic": {
            "users_by_country": [{"country": c["_id"] or "Unknown", "count": c["count"]} for c in users_by_country],
            "exports_by_country": [{"country": c["_id"] or "Unknown", "count": c["count"]} for c in exports_by_country],
            "company_activity_by_country": [{"country": c.get("country", "Unknown"), "company": c.get("company", "Unknown"), "events": c["events"], "strains_viewed": c["unique_strains"]} for c in company_by_country]
        },
        "demand": {
            "top_sample_requests": [{"strain_name": s["strain_name"], "requests": s["requests"], "unique_companies": s["unique_companies"]} for s in sample_demand],
            "type_demand": [{"type": t["type"], "views": t["views"], "unique_users": t["user_count"]} for t in type_demand],
            "tier_demand": [{"tier": t["tier"], "views": t["views"], "unique_users": t["user_count"]} for t in tier_demand],
            "terpene_interest": [{"terpene": t["_id"], "views": t["count"]} for t in terpene_interest]
        },
        "supply": {
            "submission_status": {s["_id"]: s["count"] for s in submission_status},
            "grower_types": [{"type": g["_id"], "count": g["count"]} for g in grower_types],
            "lot_stats": lot_stats[0] if lot_stats else {"avg_lot": 0, "min_lot": 0, "max_lot": 0, "total_kg": 0},
            "irradiation": {(i["_id"] or "Not specified"): i["count"] for i in irradiation_stats},
            "grade_distribution": {
                "submissions": grade_stats[0] if grade_stats else {"total_grade_a": 0, "total_grade_b": 0, "total_grade_c": 0, "submissions_with_grades": 0},
                "catalog": catalog_grades[0] if catalog_grades else {"total_grade_a": 0, "total_grade_b": 0, "total_grade_c": 0, "strains_with_grades": 0}
            }
        },
        "growth": {
            "registration_timeline": registration_timeline
        }
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
    """Export comprehensive marketing-ready user list to CSV (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(10000)
    
    # Gather inquiry counts and last inquiry date per user
    inquiries = await db.inquiries.find({}, {"_id": 0, "user_id": 1, "created_at": 1, "status": 1, "strain_ids": 1}).to_list(10000)
    user_inquiry_map = {}
    for inq in inquiries:
        uid = inq.get("user_id")
        if uid:
            if uid not in user_inquiry_map:
                user_inquiry_map[uid] = {"count": 0, "last_date": None, "strain_count": 0}
            user_inquiry_map[uid]["count"] += 1
            user_inquiry_map[uid]["strain_count"] += len(inq.get("strain_ids", []))
            inq_date = inq.get("created_at")
            if inq_date and (user_inquiry_map[uid]["last_date"] is None or str(inq_date) > str(user_inquiry_map[uid]["last_date"])):
                user_inquiry_map[uid]["last_date"] = inq_date
    
    # Gather sample request counts per user
    samples = await db.sample_requests.find({}, {"_id": 0, "user_id": 1}).to_list(10000)
    user_sample_map = {}
    for sr in samples:
        uid = sr.get("user_id")
        if uid:
            user_sample_map[uid] = user_sample_map.get(uid, 0) + 1
    
    # Gather analytics event counts per user
    analytics_pipeline = [
        {"$group": {"_id": "$user_id", "total_events": {"$sum": 1}, "last_active": {"$max": "$created_at"}}}
    ]
    activity = await db.analytics.aggregate(analytics_pipeline).to_list(10000)
    user_activity_map = {a["_id"]: a for a in activity if a["_id"]}
    
    # Gather referral info
    referral_map = {}
    affiliates_list = await db.affiliates.find({}, {"_id": 0}).to_list(1000)
    aff_code_map = {a["referral_code"]: a["name"] for a in affiliates_list}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'First Name', 'Last Name', 'Company', 'Country', 'Email', 'Phone',
        'License Number', 'Status', 'Registered Date',
        'Total Inquiries', 'Strains Inquired', 'Last Inquiry Date',
        'Sample Requests', 'Total Events', 'Last Active',
        'Referred By Code', 'Referred By Name'
    ])
    
    for user in users:
        uid = user.get('id', '')
        inq_info = user_inquiry_map.get(uid, {})
        activity_info = user_activity_map.get(uid, {})
        ref_code = user.get('referred_by_code', '') or user.get('referral_code', '') or ''
        ref_name = aff_code_map.get(ref_code, '') if ref_code else ''
        
        writer.writerow([
            user.get('first_name', ''),
            user.get('last_name', ''),
            user.get('company', ''),
            user.get('country', ''),
            user.get('email', ''),
            user.get('phone', ''),
            user.get('license_number', ''),
            user.get('status', 'active'),
            user.get('created_at', ''),
            inq_info.get('count', 0),
            inq_info.get('strain_count', 0),
            inq_info.get('last_date', ''),
            user_sample_map.get(uid, 0),
            activity_info.get('total_events', 0),
            activity_info.get('last_active', ''),
            ref_code,
            ref_name
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=firegold_marketing_users_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"}
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
        sd = {**strain_data}
        if isinstance(sd.get("effects"), str):
            sd["effects"] = [e.strip() for e in sd["effects"].split(",") if e.strip()]
        strain = Strain(**sd)
        doc = strain.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.strains.insert_one(doc)
    
    return {"message": f"Reseeded {len(SEED_STRAINS)} strains with updated images"}

@api_router.get("/admin/strain-directory")
async def get_strain_directory(token: str = Depends(verify_admin_token)):
    """Get all strains enriched with grower submission data (licenses, contact info)"""
    strains = await db.strains.find({}, {"_id": 0}).to_list(1000)
    submissions = await db.grower_submissions.find({}, {"_id": 0}).to_list(1000)
    
    # Index submissions by strain_name for quick lookup
    sub_by_strain = {}
    for sub in submissions:
        name = sub.get("strain_name", "").strip().lower()
        if name not in sub_by_strain or sub.get("status") == "approved":
            sub_by_strain[name] = sub
    
    directory = []
    for strain in strains:
        entry = {
            "id": strain.get("id"),
            "strain_name": strain.get("strain_name"),
            "type": strain.get("type"),
            "thc_percentage": strain.get("thc_percentage"),
            "lot_size": strain.get("lot_size"),
            "coa_url": strain.get("coa_url"),
            "image_url": strain.get("image_url"),
            "grade_a_kg": strain.get("grade_a_kg"),
            "grade_b_kg": strain.get("grade_b_kg"),
            "grade_c_kg": strain.get("grade_c_kg"),
            "harvest_date": strain.get("harvest_date"),
        }
        # Match to grower submission
        key = strain.get("strain_name", "").strip().lower()
        sub = sub_by_strain.get(key)
        if sub:
            entry["grower_name"] = sub.get("grower_name")
            entry["company_name"] = sub.get("company_name")
            entry["grower_email"] = sub.get("email")
            entry["grower_phone"] = sub.get("phone")
            entry["license_number"] = sub.get("license_number")
            entry["gacp_compliant"] = sub.get("gacp_compliant")
            entry["coa_path"] = sub.get("coa_path")
            entry["health_canada_license_path"] = sub.get("health_canada_license_path")
            entry["cra_license_path"] = sub.get("cra_license_path")
            entry["submission_id"] = sub.get("id")
        else:
            entry["grower_name"] = strain.get("grower_name")
            entry["company_name"] = strain.get("grower_company")
            entry["grower_email"] = strain.get("grower_email")
            entry["grower_phone"] = None
            entry["license_number"] = None
            entry["gacp_compliant"] = None
            entry["coa_path"] = None
            entry["health_canada_license_path"] = None
            entry["cra_license_path"] = None
            entry["submission_id"] = strain.get("submission_id")
        directory.append(entry)
    
    return directory

@api_router.get("/admin/inventory-summary")
async def get_inventory_summary(token: str = Depends(verify_admin_token)):
    """Get total inventory summary aggregated across all catalog strains"""
    pipeline = [
        {"$group": {
            "_id": None,
            "total_grade_a": {"$sum": {"$ifNull": ["$grade_a_kg", 0]}},
            "total_grade_b": {"$sum": {"$ifNull": ["$grade_b_kg", 0]}},
            "total_grade_c": {"$sum": {"$ifNull": ["$grade_c_kg", 0]}},
            "strains_with_grades": {"$sum": {"$cond": [
                {"$or": [
                    {"$gt": [{"$ifNull": ["$grade_a_kg", 0]}, 0]},
                    {"$gt": [{"$ifNull": ["$grade_b_kg", 0]}, 0]},
                    {"$gt": [{"$ifNull": ["$grade_c_kg", 0]}, 0]}
                ]}, 1, 0
            ]}},
            "total_strains": {"$sum": 1}
        }}
    ]
    result = await db.strains.aggregate(pipeline).to_list(1)
    data = result[0] if result else {"total_grade_a": 0, "total_grade_b": 0, "total_grade_c": 0, "strains_with_grades": 0, "total_strains": 0}
    data.pop("_id", None)
    data["total_inventory_kg"] = data["total_grade_a"] + data["total_grade_b"] + data["total_grade_c"]
    return data


class UpdateStrainLicense(BaseModel):
    license_number: Optional[str] = None
    grower_company: Optional[str] = None
    grower_name: Optional[str] = None
    grower_email: Optional[str] = None

@api_router.put("/admin/strain-directory/{strain_id}/license")
async def update_strain_license(strain_id: str, body: UpdateStrainLicense, token: str = Depends(verify_admin_token)):
    """Update license and grower info for a strain in the directory"""
    update_fields = {}
    if body.license_number is not None:
        update_fields["license_number"] = body.license_number
    if body.grower_company is not None:
        update_fields["grower_company"] = body.grower_company
    if body.grower_name is not None:
        update_fields["grower_name"] = body.grower_name
    if body.grower_email is not None:
        update_fields["grower_email"] = body.grower_email
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.strains.update_one({"id": strain_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Strain not found")
    return {"message": "Strain license info updated"}


@api_router.get("/admin/strain-directory/csv")
async def export_strain_directory_csv(token: str = Depends(verify_admin_token)):
    """Export full strain directory with all submission details as CSV"""
    strains = await db.strains.find({}, {"_id": 0}).to_list(1000)
    submissions = await db.grower_submissions.find({}, {"_id": 0}).to_list(1000)
    
    sub_by_strain = {}
    for sub in submissions:
        name = sub.get("strain_name", "").strip().lower()
        if name not in sub_by_strain or sub.get("status") == "approved":
            sub_by_strain[name] = sub
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Strain Name", "Type", "THC %", "CBD %", "Lot Size", "Effects", "Lineage",
        "Terpene Profile", "Price Tier", "Harvest Date",
        "Grade A (kg)", "Grade B (kg)", "Grade C (kg)",
        "Grower/LP Name", "Company", "Email", "Phone", "License Number",
        "Submission Date", "Submission Status", "Growing Method",
        "Export Country", "Irradiated", "Willing to Irradiate",
        "Admin Price/Gram", "Admin Notes", "Additional Notes",
        "Has COA", "Has HC License", "Has CRA License"
    ])
    
    for strain in strains:
        key = strain.get("strain_name", "").strip().lower()
        sub = sub_by_strain.get(key, {})
        writer.writerow([
            strain.get("strain_name", ""),
            strain.get("type", ""),
            strain.get("thc_percentage", ""),
            strain.get("cbd_percentage", ""),
            strain.get("lot_size", ""),
            ", ".join(strain.get("effects", [])) if isinstance(strain.get("effects"), list) else strain.get("effects", ""),
            strain.get("lineage", ""),
            ", ".join(strain.get("terpene_profile", [])) if isinstance(strain.get("terpene_profile"), list) else strain.get("terpene_profile", ""),
            strain.get("price_tier", ""),
            strain.get("harvest_date") or sub.get("harvest_date", ""),
            strain.get("grade_a_kg") or sub.get("grade_a_kg", ""),
            strain.get("grade_b_kg") or sub.get("grade_b_kg", ""),
            strain.get("grade_c_kg") or sub.get("grade_c_kg", ""),
            sub.get("grower_name", ""),
            sub.get("company_name", ""),
            sub.get("email", ""),
            sub.get("phone", ""),
            sub.get("license_number", ""),
            sub.get("created_at", ""),
            sub.get("status", ""),
            sub.get("growing_method", ""),
            sub.get("export_country", ""),
            sub.get("is_irradiated", ""),
            sub.get("willing_to_irradiate", ""),
            sub.get("admin_price_per_gram", ""),
            sub.get("admin_notes", ""),
            sub.get("additional_notes", ""),
            "Yes" if strain.get("coa_url") or sub.get("coa_path") else "No",
            "Yes" if sub.get("health_canada_license_path") else "No",
            "Yes" if sub.get("cra_license_path") else "No",
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=firegold_strain_directory_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"}
    )

@api_router.put("/admin/submissions/{submission_id}/redacted-coa")
async def upload_redacted_coa(submission_id: str, coa: UploadFile = File(...), token: str = Depends(verify_admin_token)):
    """Upload a redacted COA to replace the original on a submission"""
    submission = await db.grower_submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if not coa.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="COA must be a PDF file")
    
    # Save redacted COA, overwriting the original
    coa_dir = Path("/app/uploads/submissions/coa")
    coa_dir.mkdir(parents=True, exist_ok=True)
    coa_path = coa_dir / f"{submission_id}.pdf"
    
    content = await coa.read()
    with open(coa_path, "wb") as f:
        f.write(content)
    
    coa_url = f"/uploads/submissions/coa/{submission_id}.pdf"
    await db.grower_submissions.update_one(
        {"id": submission_id},
        {"$set": {"coa_path": coa_url, "coa_redacted": True}}
    )
    
    return {"message": "Redacted COA uploaded successfully", "coa_path": coa_url}

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
    effects: Optional[str] = Query(None, description="Comma-separated effects to filter by"),
    category: Optional[str] = Query(None, description="Filter by category"),
    growing_method: Optional[str] = Query(None, description="Filter by growing method"),
    bc_dd: Optional[bool] = Query(None, description="Filter BC DD compliant"),
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
    
    if category:
        query["category"] = category
    
    if growing_method:
        query["growing_method"] = growing_method
    
    if bc_dd:
        query["bc_dd_compliant"] = True
    
    if effects:
        effects_list = [e.strip() for e in effects.split(",") if e.strip()]
        if effects_list:
            query["effects"] = {"$all": effects_list}
    
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

@api_router.post("/inquiries")
async def create_inquiry(inquiry_input: InquiryCreate, user_data: dict = Depends(verify_user_token)):
    """Create a new buyer inquiry (linked to authenticated user)"""
    # Resolve strain names from IDs
    strain_names = []
    if inquiry_input.strain_ids:
        strains_cursor = db.strains.find({"id": {"$in": inquiry_input.strain_ids}}, {"_id": 0, "id": 1, "strain_name": 1})
        strains_list = await strains_cursor.to_list(100)
        strain_names = [s["strain_name"] for s in strains_list]

    inquiry = Inquiry(**inquiry_input.model_dump())
    doc = inquiry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_id'] = user_data.get('user_id')
    doc['user_email'] = user_data.get('email')
    doc['user_company'] = user_data.get('company')
    doc['user_first_name'] = user_data.get('first_name')
    doc['strain_names'] = strain_names
    await db.inquiries.insert_one(doc)
    del doc['_id']
    
    # Notify admin of new inquiry
    strain_list_html = "".join(f"<li>{name}</li>" for name in strain_names)
    volumes_html = "".join(f"<li>{sid}: {vol}</li>" for sid, vol in (inquiry_input.strain_volumes or {}).items())
    try:
        await send_email(
            SMTP_EMAIL,
            f"New Inquiry: {inquiry_input.contact_name} — {inquiry_input.company_name}",
            email_template("New Inquiry Received", f"""
                <p><strong>From:</strong> {inquiry_input.contact_name}</p>
                <p><strong>Company:</strong> {inquiry_input.company_name}</p>
                <p><strong>Email:</strong> {inquiry_input.email}</p>
                <p><strong>Market of Interest:</strong> {inquiry_input.market_of_interest or 'N/A'}</p>
                <p><strong>Strains Requested:</strong></p><ul>{strain_list_html}</ul>
                <p><strong>Message:</strong> {inquiry_input.message or 'N/A'}</p>
            """)
        )
    except Exception as e:
        logger.error(f"Inquiry notification email failed: {e}")
    
    return doc

@api_router.get("/inquiries", response_model=List[Inquiry])
async def get_inquiries():
    """Get all inquiries (admin)"""
    inquiries = await db.inquiries.find({}, {"_id": 0}).to_list(1000)
    for inq in inquiries:
        if isinstance(inq.get('created_at'), str):
            inq['created_at'] = datetime.fromisoformat(inq['created_at'].replace('Z', '+00:00'))
    return inquiries

@api_router.get("/admin/inquiries")
async def get_admin_inquiries(
    status: Optional[str] = Query(None),
    token: str = Depends(verify_admin_token)
):
    """Get all inquiries with user details for admin management"""
    query = {}
    if status and status != "all":
        query["status"] = status

    inquiries = await db.inquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

    # Resolve strain names for inquiries that don't have them cached
    all_strain_ids = set()
    for inq in inquiries:
        all_strain_ids.update(inq.get("strain_ids", []))
    strain_map = {}
    if all_strain_ids:
        strains_list = await db.strains.find({"id": {"$in": list(all_strain_ids)}}, {"_id": 0, "id": 1, "strain_name": 1}).to_list(500)
        strain_map = {s["id"]: s["strain_name"] for s in strains_list}

    # Resolve user details
    all_user_ids = set(inq.get("user_id") for inq in inquiries if inq.get("user_id"))
    user_map = {}
    if all_user_ids:
        users_list = await db.users.find({"id": {"$in": list(all_user_ids)}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "company": 1, "phone": 1}).to_list(500)
        user_map = {u["id"]: u for u in users_list}

    enriched = []
    for inq in inquiries:
        # Resolve strain names
        strain_names = inq.get("strain_names") or [strain_map.get(sid, "Unknown") for sid in inq.get("strain_ids", [])]
        # Get user info
        user = user_map.get(inq.get("user_id"), {})
        enriched.append({
            "id": inq.get("id"),
            "company_name": inq.get("company_name"),
            "contact_name": inq.get("contact_name"),
            "email": inq.get("email"),
            "phone": inq.get("phone"),
            "message": inq.get("message"),
            "market_of_interest": inq.get("market_of_interest"),
            "strain_ids": inq.get("strain_ids", []),
            "strain_names": strain_names,
            "strain_volumes": inq.get("strain_volumes", {}),
            "status": inq.get("status", "pending"),
            "admin_notes": inq.get("admin_notes"),
            "created_at": inq.get("created_at"),
            "user_id": inq.get("user_id"),
            "user_email": inq.get("user_email") or user.get("email"),
            "user_company": inq.get("user_company") or user.get("company"),
            "user_first_name": inq.get("user_first_name") or user.get("first_name"),
            "user_last_name": user.get("last_name"),
            "user_phone": user.get("phone"),
        })

    return enriched

class UpdateInquiryStatus(BaseModel):
    status: str  # pending, responded, archived
    admin_notes: Optional[str] = None

@api_router.put("/admin/inquiries/{inquiry_id}/status")
async def update_inquiry_status(
    inquiry_id: str,
    body: UpdateInquiryStatus,
    token: str = Depends(verify_admin_token)
):
    """Update inquiry status and admin notes"""
    if body.status not in ("pending", "responded", "archived"):
        raise HTTPException(status_code=400, detail="Status must be 'pending', 'responded', or 'archived'")

    update_fields = {"status": body.status}
    if body.admin_notes is not None:
        update_fields["admin_notes"] = body.admin_notes

    result = await db.inquiries.update_one({"id": inquiry_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    return {"message": f"Inquiry marked as {body.status}", "inquiry_id": inquiry_id}


# ============== AFFILIATE SYSTEM ==============

@api_router.post("/admin/affiliates")
async def create_affiliate(body: AffiliateCreate, token: str = Depends(verify_admin_token)):
    """Create a new affiliate (admin only)"""
    existing = await db.affiliates.find_one({"referral_code": body.referral_code.upper()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Referral code already exists")
    
    affiliate = Affiliate(
        user_id=body.user_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        company=body.company,
        referral_code=body.referral_code.upper(),
        commission_type=body.commission_type,
        commission_value=body.commission_value
    )
    doc = affiliate.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.affiliates.insert_one(doc)
    del doc["_id"]
    return doc

@api_router.get("/admin/affiliates")
async def get_affiliates(token: str = Depends(verify_admin_token)):
    """Get all affiliates with stats"""
    affiliates = await db.affiliates.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with live referral counts
    for aff in affiliates:
        ref_count = await db.referral_events.count_documents({"affiliate_id": aff["id"]})
        conv_count = await db.referral_events.count_documents({"affiliate_id": aff["id"], "event_type": "conversion"})
        
        # Calculate totals from conversion events
        conversions = await db.referral_events.find(
            {"affiliate_id": aff["id"], "event_type": "conversion"}, {"_id": 0}
        ).to_list(500)
        total_revenue = sum(c.get("sale_amount", 0) or 0 for c in conversions)
        total_commission = sum(c.get("commission_amount", 0) or 0 for c in conversions)
        
        aff["total_referrals"] = ref_count
        aff["total_conversions"] = conv_count
        aff["total_revenue"] = total_revenue
        aff["total_commission"] = total_commission
    
    return affiliates

@api_router.get("/admin/affiliates/{affiliate_id}")
async def get_affiliate_detail(affiliate_id: str, token: str = Depends(verify_admin_token)):
    """Get detailed affiliate profile with all referral events"""
    affiliate = await db.affiliates.find_one({"id": affiliate_id}, {"_id": 0})
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    events = await db.referral_events.find(
        {"affiliate_id": affiliate_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Get referred users info
    referred_user_ids = [e.get("referred_user_id") for e in events if e.get("referred_user_id")]
    user_map = {}
    if referred_user_ids:
        users = await db.users.find({"id": {"$in": referred_user_ids}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "company": 1}).to_list(500)
        user_map = {u["id"]: u for u in users}
    
    for evt in events:
        if evt.get("referred_user_id") and evt["referred_user_id"] in user_map:
            evt["referred_user"] = user_map[evt["referred_user_id"]]
    
    total_revenue = sum(e.get("sale_amount", 0) or 0 for e in events if e.get("event_type") == "conversion")
    total_commission = sum(e.get("commission_amount", 0) or 0 for e in events if e.get("event_type") == "conversion")
    pending_commission = sum(e.get("commission_amount", 0) or 0 for e in events if e.get("status") == "pending" and e.get("event_type") == "conversion")
    paid_commission = sum(e.get("commission_amount", 0) or 0 for e in events if e.get("status") == "paid")
    
    return {
        "affiliate": affiliate,
        "events": events,
        "stats": {
            "total_referrals": len(events),
            "total_conversions": len([e for e in events if e.get("event_type") == "conversion"]),
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "pending_commission": pending_commission,
            "paid_commission": paid_commission
        }
    }

@api_router.put("/admin/affiliates/{affiliate_id}")
async def update_affiliate(affiliate_id: str, body: dict, token: str = Depends(verify_admin_token)):
    """Update affiliate details including commission structure"""
    allowed = ["name", "email", "phone", "company", "referral_code", "commission_type", "commission_value", "is_active"]
    update = {}
    for k in allowed:
        if k in body:
            update[k] = body[k]
    if "referral_code" in update:
        update["referral_code"] = update["referral_code"].upper()
    result = await db.affiliates.update_one({"id": affiliate_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    return {"message": "Affiliate updated"}

@api_router.put("/admin/affiliates/{affiliate_id}/toggle")
async def toggle_affiliate(affiliate_id: str, token: str = Depends(verify_admin_token)):
    """Toggle affiliate active/inactive"""
    affiliate = await db.affiliates.find_one({"id": affiliate_id}, {"_id": 0, "is_active": 1})
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    new_status = not affiliate.get("is_active", True)
    await db.affiliates.update_one({"id": affiliate_id}, {"$set": {"is_active": new_status}})
    return {"message": f"Affiliate {'activated' if new_status else 'deactivated'}", "is_active": new_status}

@api_router.post("/admin/inquiries/{inquiry_id}/convert")
async def convert_inquiry(inquiry_id: str, body: ConvertInquiry, token: str = Depends(verify_admin_token)):
    """Convert an inquiry to a sale, calculate affiliate commission (one level deep only)"""
    inquiry = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    referred_user_id = inquiry.get("user_id")
    
    # Find the DIRECT referrer only (one level deep)
    affiliate = None
    if referred_user_id:
        user = await db.users.find_one({"id": referred_user_id}, {"_id": 0})
        ref_code = user.get("referred_by") if user else None
        if ref_code:
            affiliate = await db.affiliates.find_one({"referral_code": ref_code, "is_active": True}, {"_id": 0})
    
    commission = 0.0
    c_type = body.commission_type
    c_value = body.commission_value
    
    if affiliate:
        # Use override if provided, else use affiliate's default
        if not c_type:
            c_type = affiliate.get("commission_type", "per_gram")
        if c_value is None:
            c_value = affiliate.get("commission_value", 0.03)
        
        if c_type == "per_gram":
            commission = c_value * body.total_grams
        elif c_type == "percentage":
            commission = (c_value / 100) * body.sale_amount
        elif c_type == "flat_fee":
            commission = c_value
        
        event = ReferralEvent(
            affiliate_id=affiliate["id"],
            affiliate_name=affiliate.get("name"),
            referral_code=affiliate["referral_code"],
            referred_user_id=referred_user_id,
            referred_email=inquiry.get("email"),
            event_type="conversion",
            inquiry_id=inquiry_id,
            sale_amount=body.sale_amount,
            total_grams=body.total_grams,
            commission_type=c_type,
            commission_value=c_value,
            commission_amount=commission,
            status="pending"
        )
        doc = event.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.referral_events.insert_one(doc)
        doc.pop("_id", None)
    
    # Mark inquiry as converted
    await db.inquiries.update_one({"id": inquiry_id}, {"$set": {
        "status": "converted",
        "sale_amount": body.sale_amount,
        "total_grams": body.total_grams,
        "commission_amount": commission,
        "converted_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {
        "message": f"Sale recorded. Commission: ${commission:.2f}" if affiliate else "Sale recorded. No affiliate referral found.",
        "commission": commission,
        "affiliate_name": affiliate["name"] if affiliate else None
    }

@api_router.put("/admin/referrals/{event_id}/paid")
async def mark_referral_paid(event_id: str, token: str = Depends(verify_admin_token)):
    """Mark a referral commission as paid"""
    result = await db.referral_events.update_one({"id": event_id}, {"$set": {"status": "paid"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Referral event not found")
    return {"message": "Commission marked as paid"}

# Public: Resolve referral code (for tracking on frontend)
@api_router.get("/affiliate/resolve/{code}")
async def resolve_referral_code(code: str):
    """Check if a referral code is valid"""
    affiliate = await db.affiliates.find_one(
        {"referral_code": code.upper(), "is_active": True},
        {"_id": 0, "id": 1, "name": 1, "referral_code": 1}
    )
    if not affiliate:
        return {"valid": False}
    return {"valid": True, "affiliate_name": affiliate["name"], "referral_code": affiliate["referral_code"]}

# Affiliate dashboard (for affiliates themselves)
@api_router.get("/affiliate/dashboard/{code}")
async def get_affiliate_dashboard(code: str):
    """Public dashboard for affiliates to see their stats"""
    affiliate = await db.affiliates.find_one({"referral_code": code.upper()}, {"_id": 0})
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    events = await db.referral_events.find(
        {"affiliate_id": affiliate["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    registrations = [e for e in events if e.get("event_type") == "registration"]
    conversions = [e for e in events if e.get("event_type") == "conversion"]
    
    total_revenue = sum(c.get("sale_amount", 0) or 0 for c in conversions)
    total_commission = sum(c.get("commission_amount", 0) or 0 for c in conversions)
    pending = sum(c.get("commission_amount", 0) or 0 for c in conversions if c.get("status") == "pending")
    paid = sum(c.get("commission_amount", 0) or 0 for c in conversions if c.get("status") == "paid")
    
    return {
        "name": affiliate["name"],
        "referral_code": affiliate["referral_code"],
        "commission_type": affiliate.get("commission_type", "per_gram"),
        "commission_value": affiliate.get("commission_value", 0),
        "is_active": affiliate["is_active"],
        "stats": {
            "total_referrals": len(registrations),
            "total_conversions": len(conversions),
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "pending_commission": pending,
            "paid_commission": paid
        },
        "recent_events": [{
            "type": e.get("event_type"),
            "date": e.get("created_at"),
            "sale_amount": e.get("sale_amount"),
            "commission": e.get("commission_amount"),
            "status": e.get("status")
        } for e in events[:20]]
    }


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
    cra_license: UploadFile = File(...),
    user_data: dict = Depends(verify_user_token)
):
    """Create a new sample request with license PDF uploads (linked to authenticated user)"""
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
    
    # Store the sample request with file data, linked to authenticated user
    doc = {
        "id": request_id,
        "user_id": user_data.get('user_id'),
        "user_email": user_data.get('email'),
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
        "user_id": user_data.get('user_id'),
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
    
    # Save image to uploads folder (persists across builds)
    import shutil
    safe_name = f"{uuid.uuid4()}{file_ext}"
    filepath = f"/app/uploads/submissions/{safe_name}"
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Also copy to public/strains for backward compatibility
    pub_path = f"/app/frontend/public/strains/{strain['strain_name']}{file_ext}"
    try:
        shutil.copy2(filepath, pub_path)
    except Exception:
        pass
    
    # Update database - use API-served path
    new_image_url = f"/api/uploads/submissions/{safe_name}"
    await db.strains.update_one(
        {"id": strain_id},
        {"$set": {"image_url": new_image_url}}
    )
    
    return {"message": "Image updated", "image_url": new_image_url}

@api_router.put("/strains/{strain_id}/coa")
async def upload_strain_coa(
    strain_id: str,
    coa: UploadFile = File(...),
    token: str = Depends(verify_admin_token)
):
    """Upload redacted COA PDF for a strain (admin only)"""
    import shutil
    if not coa.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="COA must be a PDF file")
    
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    
    os.makedirs("/app/uploads/coa", exist_ok=True)
    safe_name = f"{strain_id}.pdf"
    save_path = f"/app/uploads/coa/{safe_name}"
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(coa.file, buffer)
    
    coa_path = f"/uploads/coa/{safe_name}"
    await db.strains.update_one(
        {"id": strain_id},
        {"$set": {"coa_url": coa_path}}
    )
    
    return {"message": "COA uploaded", "coa_url": coa_path}

@api_router.delete("/strains/{strain_id}/coa")
async def remove_strain_coa(strain_id: str, token: str = Depends(verify_admin_token)):
    """Remove COA from a strain (admin only)"""
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    
    # Delete the file if it exists
    file_path = f"/app/uploads/coa/{strain_id}.pdf"
    if os.path.exists(file_path):
        os.remove(file_path)
    
    await db.strains.update_one(
        {"id": strain_id},
        {"$set": {"coa_url": None}}
    )
    return {"message": "COA removed"}

@api_router.get("/strains/{strain_id}/coa")
async def view_strain_coa(strain_id: str, user_data: dict = Depends(verify_any_token)):
    """View COA PDF for a strain (authenticated users or admins)"""
    from fastapi.responses import FileResponse
    strain = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    if not strain:
        raise HTTPException(status_code=404, detail="Strain not found")
    if not strain.get("coa_url"):
        raise HTTPException(status_code=404, detail="No COA available for this strain")
    
    coa_url = strain["coa_url"]
    
    # Check multiple possible locations for the COA file
    possible_paths = [
        f"/app{coa_url}",                           # /app/coa/xxx.pdf (public dir)
        f"/app/frontend/public{coa_url}",            # /app/frontend/public/coa/xxx.pdf
        f"/app/uploads{coa_url.replace('/uploads', '')}",  # Legacy uploads path
        f"/app/uploads/coa/{strain_id}.pdf"          # Old format
    ]
    
    for file_path in possible_paths:
        if os.path.exists(file_path):
            return FileResponse(file_path, media_type="application/pdf", headers={"Content-Disposition": "inline"})
    
    # If file not found locally, redirect to the public URL
    raise HTTPException(status_code=404, detail="COA file not found on server")

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
    
    update_data = strain_input.model_dump(exclude_unset=True)
    await db.strains.update_one(
        {"id": strain_id},
        {"$set": update_data}
    )
    
    updated = await db.strains.find_one({"id": strain_id}, {"_id": 0})
    return updated

# Include the router in the main app

# --- Contact Messages ---
@api_router.post("/contact")
async def submit_contact_message(msg: ContactMessageCreate):
    """Public endpoint for visitors to leave a message for admin"""
    contact = ContactMessage(
        name=msg.name,
        email=msg.email,
        company=msg.company,
        message=msg.message
    )
    doc = contact.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contact_messages.insert_one(doc)
    doc.pop("_id", None)
    
    # Notify admin of new contact message
    try:
        await send_email(
            SMTP_EMAIL,
            f"New Contact Message: {msg.name}",
            email_template("New Contact Message", f"""
                <p><strong>Name:</strong> {msg.name}</p>
                <p><strong>Email:</strong> {msg.email}</p>
                <p><strong>Company:</strong> {msg.company or 'N/A'}</p>
                <p><strong>Message:</strong></p>
                <p style="background: #111; padding: 15px; border-left: 3px solid #D4AF37;">{msg.message}</p>
            """)
        )
    except Exception as e:
        logger.error(f"Contact notification email failed: {e}")
    
    return {"message": "Your message has been sent. We'll be in touch soon!"}

@api_router.get("/admin/contact-messages")
async def get_contact_messages(token: str = Depends(verify_admin_token)):
    """Admin endpoint to view contact messages"""
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return messages

@api_router.put("/admin/contact-messages/{message_id}/read")
async def mark_message_read(message_id: str, token: str = Depends(verify_admin_token)):
    """Mark a contact message as read"""
    result = await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": {"status": "read"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Marked as read"}

@api_router.delete("/admin/contact-messages/{message_id}")
async def delete_contact_message(message_id: str, token: str = Depends(verify_admin_token)):
    """Delete a contact message"""
    result = await db.contact_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted"}

class ReplyMessageBody(BaseModel):
    reply_text: str

@api_router.post("/admin/contact-messages/{message_id}/reply")
async def reply_to_message(message_id: str, body: ReplyMessageBody, token: str = Depends(verify_admin_token)):
    """Reply to a contact message via email"""
    msg = await db.contact_messages.find_one({"id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Send reply email
    await send_email(
        msg["email"],
        f"Re: Your message to Firegold",
        email_template("Reply from Firegold", f"""
            <p>Hi {msg['name']},</p>
            <p>Thank you for reaching out. Here is our response:</p>
            <div style="background: #111; padding: 15px; border-left: 3px solid #D4AF37; margin: 15px 0;">
                {body.reply_text.replace(chr(10), '<br>')}
            </div>
            <hr style="border-color: #333; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">Your original message:</p>
            <p style="color: #aaa; font-style: italic;">{msg['message']}</p>
        """)
    )
    
    # Update message status and store reply
    reply_record = {
        "text": body.reply_text,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": {"status": "replied"}, "$push": {"replies": reply_record}}
    )
    return {"message": "Reply sent successfully"}

# --- AI Chatbot ---
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

CHATBOT_SYSTEM_PROMPT = """You are Firegold's AI assistant for the Firegold Marketplace — a premium B2B wholesale cannabis flower platform based in Canada.

Your role is to warmly greet visitors, answer questions, qualify leads, and advance conversations so the Firegold team can step in at the right moment. Be professional, knowledgeable, and personable — you represent the Firegold brand.

## ABOUT FIREGOLD
Firegold Marketplace is a premium B2B wholesale platform connecting licensed Canadian cannabis growers with qualified buyers worldwide. We curate top-tier whole flower products and facilitate international trade with full compliance support. Based in Canada, we work exclusively with Health Canada licensed producers.

## PRODUCTS & CATALOG
- Product categories: Dried Flower, Fresh Frozen, Trim, and Concentrates
- Flower grades: Grade A (Bigs), Grade B (Mids), Grade C (Smalls)
- Growing methods: Indoor, Outdoor, Greenhouse
- Minimum lot sizes typically start at 30kg
- All products come with a Certificate of Analysis (COA)
- Product details include: THC/CBD percentages, terpene profiles, lineage, effects, harvest date
- To view the full catalog, buyers must register for a free account on the platform

## COMPLIANCE & QUALITY
- All growers are Health Canada licensed
- Products can be GACP (Good Agricultural and Collection Practices) compliant
- Products can be GMP (Good Manufacturing Practices) compliant
- Irradiation services available for products that require it for export
- We support Direct Delivery Compliance documentation
- COA (Certificate of Analysis) provided for every product
- Health Canada License and CRA Excise License documentation tracked

## EXPORT MARKETS
We actively support international markets including:
- Germany, Australia, Portugal, United Kingdom, Czech Republic, Israel, South Africa
- Open permit facilitation available for qualifying buyers
- We help navigate export compliance requirements for each jurisdiction

## FOR BUYERS
- Register for free to access the full strain catalog
- Browse strains with detailed COA, terpene profiles, THC/CBD data
- Submit inquiries specifying volume needed and target market
- Our team handles pricing quotes — pricing depends on strain, grade, volume, and destination market
- Sample requests available for qualified buyers
- We do NOT provide pricing in chat — our team will follow up with custom quotes

## FOR SELLERS / GROWERS
- Submit your product through our "Submit Your Product" page
- We accept submissions from licensed Canadian cannabis producers
- Required information: strain details, flower grades, harvest date, growing method
- Required documents: COA, Health Canada License, CRA Excise License, Direct Delivery Compliance (if available)
- Compliance questions: GACP status, GMP status, irradiation status
- Track your submission status on our Submission Tracker page

## HOW THE PROCESS WORKS
1. Buyer registers on the platform (free)
2. Buyer browses the curated catalog of available strains
3. Buyer submits an inquiry with volume needs and target market
4. Firegold team reviews and provides a custom quote
5. Terms are agreed upon, compliance documentation is verified
6. Product is prepared, tested, and shipped according to destination requirements

## FREQUENTLY ASKED QUESTIONS

Q: How do I register?
A: Click "Register" on our homepage. You'll need your company name, country, email, and phone. Registration is free and gives you full catalog access.

Q: What are your prices?
A: Pricing is customized based on strain, grade, volume, and destination market. Submit an inquiry through the platform and our team will provide a detailed quote.

Q: What is the minimum order?
A: Minimum lot sizes typically start at 30kg, but this can vary by product. Contact us for specific availability.

Q: How do I submit my product as a grower?
A: Visit our "Submit Your Product" page. You'll need your strain details, flower grade breakdown, compliance information, and supporting documents (COA, licenses).

Q: Do you ship internationally?
A: Yes! We actively support exports to Germany, Australia, Portugal, UK, Czech Republic, Israel, South Africa, and other markets with proper permits.

Q: What is an Open Permit?
A: An Open Permit allows for the legal import of cannabis products into specific international jurisdictions. We can help facilitate this process.

Q: How do I track my submission?
A: Use our Submission Tracker page — enter your submission tracking ID to check the current status.

Q: How do I contact the Firegold team directly?
A: Use the "Contact Us" button on our site, email us at warren@firegold.ca, or submit an inquiry through the platform.

## CUSTOM TRAINING DATA
{custom_training}

## CONVERSATION GUIDELINES
- Keep responses concise (2-4 sentences max unless detail is requested)
- If someone is interested in buying, collect: company name, volume needs, target market/country — then let them know our team will follow up with a quote
- If someone wants to sell/submit product, direct them to the "Submit Your Product" page at /submit-strain
- For pricing questions, explain that pricing is customized and our team handles specific quotes
- NEVER make up specific prices, strain availability, or delivery timelines
- If a question is beyond your scope, offer to connect them with the Firegold team at warren@firegold.ca
- Use a warm, professional tone — no emojis, keep it business-appropriate
- When someone asks to register, tell them to click "Register" on the homepage or go to the main page
"""

@api_router.post("/chat")
async def chat_endpoint(body: ChatMessage):
    """AI chatbot endpoint for visitor inquiries"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="Chat service unavailable")
    
    session_id = body.session_id or str(uuid.uuid4())
    budget_fallback = "Thank you for your interest! Our AI assistant is temporarily at capacity. Please don't hesitate to reach out directly — you can email us at warren@firegold.ca or use the Contact Us button above, and our team will get back to you promptly."
    
    try:
        # Load conversation history from DB
        history = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
        
        # Load custom training data
        training_docs = await db.bot_training.find({}, {"_id": 0}).to_list(100)
        custom_training = ""
        if training_docs:
            custom_training = "\n".join([f"Q: {d.get('question','')}\nA: {d.get('answer','')}" for d in training_docs])
        
        system_prompt = CHATBOT_SYSTEM_PROMPT.replace("{custom_training}", custom_training or "No custom training data added yet.")
        
        chat = LlmChat(
            api_key=llm_key,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        # Replay history into the chat object
        if history and history.get("messages"):
            for msg in history["messages"]:
                if msg["role"] == "user":
                    chat._messages.append({"role": "user", "content": msg["text"]})
                elif msg["role"] == "assistant":
                    chat._messages.append({"role": "assistant", "content": msg["text"]})
        
        # Send new message
        user_msg = UserMessage(text=body.message)
        response = await chat.send_message(user_msg)
    except Exception as chat_err:
        error_msg = str(chat_err)
        if "budget" in error_msg.lower() or "exceeded" in error_msg.lower():
            response = budget_fallback
        else:
            logging.error(f"Chat error: {error_msg}")
            response = budget_fallback
    
    # Save to DB
    history = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    new_messages = history["messages"] if history and history.get("messages") else []
    new_messages.append({"role": "user", "text": body.message, "ts": datetime.now(timezone.utc).isoformat()})
    new_messages.append({"role": "assistant", "text": response, "ts": datetime.now(timezone.utc).isoformat()})
    
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"session_id": session_id, "messages": new_messages, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"response": response, "session_id": session_id}

# --- Bot Training Admin Endpoints ---
class BotTrainingEntry(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "general"

@api_router.get("/admin/bot-training")
async def get_bot_training(token: str = Depends(verify_admin_token)):
    entries = await db.bot_training.find({}, {"_id": 0}).to_list(500)
    return entries

@api_router.post("/admin/bot-training")
async def add_bot_training(entry: BotTrainingEntry, token: str = Depends(verify_admin_token)):
    doc = {
        "id": str(uuid.uuid4()),
        "question": entry.question,
        "answer": entry.answer,
        "category": entry.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bot_training.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/bot-training/{entry_id}")
async def update_bot_training(entry_id: str, entry: BotTrainingEntry, token: str = Depends(verify_admin_token)):
    result = await db.bot_training.update_one(
        {"id": entry_id},
        {"$set": {"question": entry.question, "answer": entry.answer, "category": entry.category}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Updated"}

@api_router.delete("/admin/bot-training/{entry_id}")
async def delete_bot_training(entry_id: str, token: str = Depends(verify_admin_token)):
    result = await db.bot_training.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Deleted"}

# --- App Settings (Email Toggle) ---
@api_router.get("/admin/settings")
async def get_settings(token: str = Depends(verify_admin_token)):
    settings = {}
    docs = await db.app_settings.find({}, {"_id": 0}).to_list(50)
    for d in docs:
        settings[d["key"]] = d["value"]
    return settings

@api_router.put("/admin/settings")
async def update_settings(body: dict, token: str = Depends(verify_admin_token)):
    for key, value in body.items():
        await db.app_settings.update_one(
            {"key": key},
            {"$set": {"key": key, "value": value}},
            upsert=True
        )
    return {"message": "Settings updated"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging

@api_router.post("/admin/migrate-data")
async def migrate_data(body: dict, token: str = Depends(verify_admin_token)):
    """Temporary endpoint to import data from preview to production"""
    results = {}
    for collection_name, docs in body.items():
        if collection_name in ['users', 'strains', 'affiliates', 'inquiries', 'grower_submissions', 'sample_requests', 'referral_events', 'contact_messages']:
            if docs:
                # Skip duplicates by checking 'id' field
                inserted = 0
                for doc in docs:
                    doc_id = doc.get('id')
                    if doc_id:
                        existing = await db[collection_name].find_one({"id": doc_id})
                        if not existing:
                            await db[collection_name].insert_one(doc)
                            inserted += 1
                    else:
                        await db[collection_name].insert_one(doc)
                        inserted += 1
                results[collection_name] = f"{inserted} inserted (of {len(docs)})"
    return results

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
            sd = {**strain_data}
            # Convert legacy effects strings to arrays
            if isinstance(sd.get("effects"), str):
                sd["effects"] = [e.strip() for e in sd["effects"].split(",") if e.strip()]
            strain = Strain(**sd)
            doc = strain.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.strains.insert_one(doc)
        logger.info(f"Seeded {len(SEED_STRAINS)} strains")
    
    # Ensure emails_enabled setting exists (default OFF)
    existing = await db.app_settings.find_one({"key": "emails_enabled"})
    if not existing:
        await db.app_settings.insert_one({"key": "emails_enabled", "value": False})
    
    # Migration: ensure all strains have growing_method and bc_dd_compliant
    await db.strains.update_many(
        {"growing_method": {"$exists": False}},
        {"$set": {"growing_method": "Indoor"}}
    )
    await db.strains.update_many(
        {"bc_dd_compliant": {"$exists": False}},
        {"$set": {"bc_dd_compliant": False}}
    )
    await db.strains.update_many(
        {"category": {"$exists": False}},
        {"$set": {"category": "Dried Flower"}}
    )
    await db.strains.update_many(
        {"terpene_percentage": {"$exists": False}},
        {"$set": {"terpene_percentage": None}}
    )
    
    # Migration: set COA URLs for strains — FORCE update to ensure data consistency across environments
    COA_MAPPING = {"Jealousy": "/coa/5b2e6ecc-77a3-4488-915e-c8b9f8926c14.pdf", "AIS": "/coa/341d303a-8d1e-4d28-b09b-86484d179a39.pdf", "Animal Mints": "/coa/ab4b23c6-5b79-4dcb-93ed-d470b4b7234e.pdf", "Black Tuna": "/coa/032e5b6b-c18f-4e36-aebb-f18b6b216101.pdf", "Bubble Gum": "/coa/ed0bf094-4e22-41ec-b466-1c45e9dff15c.pdf", "BCC": "/coa/32635610-bd85-4c6b-a67d-379102bf1bff.pdf", "Cadillac Rainbows": "/coa/97db0b6b-75e0-4c04-a31f-294e4aa05692.pdf", "Cerberus": "/coa/636ef5a0-a511-41fd-a303-16284b753270.pdf", "Chemo Kush": "/coa/341f9778-edd6-4c84-915b-e3ade4a0d9eb.pdf", "Crystal Caviar": "/coa/b5c07ca3-f82d-4d69-9e2e-f003d4312e33.pdf", "G-Force": "/coa/85669ca0-7670-47f5-a615-93c38c395fd2.pdf", "Grape Galena": "/coa/0b320b8b-4cc7-4649-baf0-04cac3fa7a6e.pdf", "Integrator": "/coa/1cd0eb7f-212f-44a4-8af6-2523e14d4d84.pdf", "Jager": "/coa/b7bd1ee7-ca53-44ce-a4b5-46575b65fd6d.pdf", "Juciy Jay": "/coa/73a92ea9-603b-49a3-9fa2-d8264f558bdc.pdf", "London Zoap": "/coa/088578d9-5f65-4145-8ba3-73e0aa3265aa.pdf", "Marshmallow OG": "/coa/6675e526-c92e-444f-bbc0-20442b5a55fa.pdf", "MAC 1": "/coa/3df312de-a234-4f01-8da6-7eecd67d2828.pdf", "Motor Breath": "/coa/8ff0f974-acce-4974-a60d-5eb5428bdfdc.pdf", "Papaya Bombs": "/coa/1af59a60-db2b-43e6-ace4-7e52d153a39b.pdf", "Purple Platinum": "/coa/7f697039-1bb0-4aa4-9020-060561c29f27.pdf", "Rainbow": "/coa/3001ec99-75a1-4d27-b8d7-b40c4de9fcd1.pdf", "Runtz Coffin Candy": "/coa/59e90613-b651-4760-8937-08d611bee1d5.pdf", "Rainbow Driver": "/coa/b88e4b94-0ba1-48fa-8827-9cd434ea84e3.pdf", "King  Sherb": "/coa/21a73034-8c3c-4f16-b0a6-9b8622ea87e3.pdf", "Souffle": "/coa/38da590c-3713-4e2d-b7f6-abc4fc39dd68.pdf", "Strawberry Froyo": "/coa/1f9ec6cb-bd5f-497e-95ca-87e5a577c4d7.pdf", "24K gold ": "/coa/d592440b-0c92-4400-a87c-814f32bd3770.pdf", "Garlic Funk ": "/coa/63a73a22-f671-45e4-af43-7a6898aeb453.pdf", "Garlic Funk": "/coa/033b68c1-f54f-4156-8bdf-9a5e92d76aaf.pdf", "Dantes Inferno": "/coa/677ad769-3c4f-4e1d-ad30-592624cd5953.pdf", "Sunset Struedel": "/coa/e1a86ff2-d648-431c-9ce1-f8259ac17f45.pdf"}
    coa_updated = 0
    for strain_name, coa_path in COA_MAPPING.items():
        # Force-update: use case-insensitive match and always set the coa_url
        result = await db.strains.update_many(
            {"strain_name": {"$regex": f"^{strain_name.strip()}$", "$options": "i"}},
            {"$set": {"coa_url": coa_path}}
        )
        coa_updated += result.modified_count
    logger.info(f"COA migration complete — updated {coa_updated} strains")

    # Migration: convert effects from string to array for all strains
    effects_migrated = 0
    async for strain_doc in db.strains.find({"effects": {"$type": "string"}}):
        effects_str = strain_doc.get("effects", "")
        if isinstance(effects_str, str):
            effects_arr = [e.strip() for e in effects_str.split(",") if e.strip()]
            await db.strains.update_one(
                {"_id": strain_doc["_id"]},
                {"$set": {"effects": effects_arr}}
            )
            effects_migrated += 1
    if effects_migrated:
        logger.info(f"Migrated effects to arrays for {effects_migrated} strains")

    # Migration: fix submission image paths (old /submissions/ -> /api/uploads/submissions/)
    fixed_images = await db.grower_submissions.update_many(
        {"image_path": {"$regex": "^/submissions/", "$not": {"$regex": "^/api/"}}},
        [{"$set": {"image_path": {"$concat": ["/api/uploads", "$image_path"]}}}]
    )
    if fixed_images.modified_count:
        logger.info(f"Fixed {fixed_images.modified_count} submission image paths")
    # Also fix strain image_urls that point to old /submissions/ paths
    fixed_strain_images = await db.strains.update_many(
        {"image_url": {"$regex": "^/submissions/", "$not": {"$regex": "^/api/"}}},
        [{"$set": {"image_url": {"$concat": ["/api/uploads", "$image_url"]}}}]
    )
    if fixed_strain_images.modified_count:
        logger.info(f"Fixed {fixed_strain_images.modified_count} strain image paths")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
