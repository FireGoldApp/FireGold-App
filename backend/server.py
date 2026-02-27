from fastapi import FastAPI, APIRouter, HTTPException, Query, File, UploadFile, Form
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Firegold Cannabis Catalog API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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

@api_router.get("/strains", response_model=List[Strain])
async def get_strains(
    type_filter: Optional[str] = Query(None, description="Filter by strain type"),
    price_tier: Optional[str] = Query(None, description="Filter by price tier"),
    search: Optional[str] = Query(None, description="Search by strain name"),
    min_thc: Optional[float] = Query(None, description="Minimum THC percentage"),
    terpene: Optional[str] = Query(None, description="Filter by terpene")
):
    """Get all strains with optional filters"""
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
async def get_strain(strain_id: str):
    """Get a single strain by ID"""
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
async def get_stats():
    """Get catalog statistics"""
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
    image: UploadFile = File(...)
):
    """Update strain image (admin)"""
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
async def delete_strain(strain_id: str):
    """Delete a strain (admin)"""
    result = await db.strains.delete_one({"id": strain_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strain not found")
    return {"message": "Strain deleted"}

@api_router.put("/strains/{strain_id}")
async def update_strain(strain_id: str, strain_input: StrainCreate):
    """Update strain details (admin)"""
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
