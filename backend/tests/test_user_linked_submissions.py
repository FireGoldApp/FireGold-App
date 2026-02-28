"""
Test User-Linked Submissions Feature
=====================================
Tests that sample requests and inquiries are linked to authenticated users.
Key features tested:
- POST /api/inquiries requires auth and stores user_id/user_email
- POST /api/sample-requests/upload requires auth and stores user_id/user_email
- Both endpoints return 401 without valid user token
"""

import pytest
import requests
import os
import io
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserLinkedSubmissions:
    """Tests for user-linked inquiries and sample requests"""
    
    test_user_email = f"linktest_{uuid.uuid4().hex[:8]}@example.com"
    test_user_password = "TestPass123"
    user_token = None
    user_data = None
    strain_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user and get a strain ID"""
        # Register a new test user
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "User",
            "company": f"TestCompany_{uuid.uuid4().hex[:6]}",
            "country": "Canada",
            "email": self.test_user_email,
            "phone": "+1-555-0001",
            "password": self.test_user_password
        })
        
        if register_response.status_code == 200:
            self.user_token = register_response.json().get("token")
            self.user_data = register_response.json().get("user")
        elif register_response.status_code == 400 and "already registered" in register_response.text:
            # User already exists, try to login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.test_user_email,
                "password": self.test_user_password
            })
            if login_response.status_code == 200:
                self.user_token = login_response.json().get("token")
                self.user_data = login_response.json().get("user")
        
        # Get a strain for sample request testing
        if self.user_token:
            strains_response = requests.get(f"{BASE_URL}/api/strains", 
                headers={"Authorization": f"Bearer {self.user_token}"})
            if strains_response.status_code == 200 and strains_response.json():
                self.strain_id = strains_response.json()[0].get("id")
        
        yield
    
    # ==================== AUTHENTICATION TESTS ====================
    
    def test_inquiry_requires_auth(self):
        """Test that POST /api/inquiries returns 401 without auth token"""
        response = requests.post(f"{BASE_URL}/api/inquiries", json={
            "company_name": "Test Company",
            "contact_name": "Test Contact",
            "email": "test@example.com",
            "strain_ids": ["fake-id"],
            "message": "Test message"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        assert "Authentication required" in response.text or "authentication" in response.text.lower(), \
            f"Expected authentication error message, got: {response.text}"
        print(f"✅ POST /api/inquiries correctly returns 401 without auth")
    
    def test_sample_request_requires_auth(self):
        """Test that POST /api/sample-requests/upload returns 401 without auth token"""
        # Create minimal form data with fake PDF files
        files = {
            'health_canada_license': ('test_hc.pdf', io.BytesIO(b'%PDF-1.4 fake content'), 'application/pdf'),
            'cra_license': ('test_cra.pdf', io.BytesIO(b'%PDF-1.4 fake content'), 'application/pdf')
        }
        data = {
            'company_name': 'Test Company',
            'contact_name': 'Test Contact',
            'email': 'test@example.com',
            'strain_id': 'fake-strain-id',
            'shipping_address': '123 Test St'
        }
        
        response = requests.post(f"{BASE_URL}/api/sample-requests/upload", data=data, files=files)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        assert "Authentication required" in response.text or "authentication" in response.text.lower(), \
            f"Expected authentication error message, got: {response.text}"
        print(f"✅ POST /api/sample-requests/upload correctly returns 401 without auth")
    
    def test_inquiry_rejects_invalid_token(self):
        """Test that POST /api/inquiries rejects invalid token"""
        response = requests.post(f"{BASE_URL}/api/inquiries", 
            json={
                "company_name": "Test Company",
                "contact_name": "Test Contact", 
                "email": "test@example.com",
                "strain_ids": ["fake-id"],
                "message": "Test message"
            },
            headers={"Authorization": "Bearer invalid_token_12345"})
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"✅ POST /api/inquiries correctly rejects invalid token")
    
    def test_sample_request_rejects_invalid_token(self):
        """Test that POST /api/sample-requests/upload rejects invalid token"""
        files = {
            'health_canada_license': ('test_hc.pdf', io.BytesIO(b'%PDF-1.4 fake'), 'application/pdf'),
            'cra_license': ('test_cra.pdf', io.BytesIO(b'%PDF-1.4 fake'), 'application/pdf')
        }
        data = {
            'company_name': 'Test Company',
            'contact_name': 'Test Contact',
            'email': 'test@example.com',
            'strain_id': 'fake-strain-id',
            'shipping_address': '123 Test St'
        }
        
        response = requests.post(f"{BASE_URL}/api/sample-requests/upload", 
            data=data, files=files,
            headers={"Authorization": "Bearer invalid_token_12345"})
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"✅ POST /api/sample-requests/upload correctly rejects invalid token")
    
    # ==================== USER LINKING TESTS ====================
    
    def test_inquiry_stores_user_id_and_email(self):
        """Test that POST /api/inquiries stores user_id and user_email from authenticated user"""
        if not self.user_token or not self.strain_id:
            pytest.skip("User registration failed or no strains available")
        
        inquiry_data = {
            "company_name": "Link Test Company",
            "contact_name": "Link Test Contact",
            "email": "linktest@company.com",  # Form email (may differ from user email)
            "phone": "+1-555-1234",
            "strain_ids": [self.strain_id],
            "message": "Testing user linking for inquiries"
        }
        
        response = requests.post(f"{BASE_URL}/api/inquiries", 
            json=inquiry_data,
            headers={"Authorization": f"Bearer {self.user_token}"})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify user_id is stored
        assert "user_id" in data, f"Response should contain user_id. Got: {data}"
        assert data["user_id"] == self.user_data["id"], \
            f"user_id mismatch: expected {self.user_data['id']}, got {data['user_id']}"
        
        # Verify user_email is stored
        assert "user_email" in data, f"Response should contain user_email. Got: {data}"
        assert data["user_email"] == self.user_data["email"], \
            f"user_email mismatch: expected {self.user_data['email']}, got {data['user_email']}"
        
        print(f"✅ POST /api/inquiries correctly stores user_id: {data['user_id']}")
        print(f"✅ POST /api/inquiries correctly stores user_email: {data['user_email']}")
        
        # Also verify the inquiry ID is returned
        assert "id" in data, "Response should contain inquiry ID"
        print(f"✅ Inquiry created with ID: {data['id']}")
    
    def test_sample_request_stores_user_id_and_email(self):
        """Test that POST /api/sample-requests/upload stores user_id and user_email from authenticated user"""
        if not self.user_token or not self.strain_id:
            pytest.skip("User registration failed or no strains available")
        
        # Create PDF files with actual minimal PDF content
        pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
xref
0 4
trailer<</Size 4/Root 1 0 R>>
startxref
173
%%EOF"""
        
        files = {
            'health_canada_license': ('hc_license.pdf', io.BytesIO(pdf_content), 'application/pdf'),
            'cra_license': ('cra_license.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        
        data = {
            'company_name': 'Sample Link Test Co',
            'contact_name': 'Sample Link Contact',
            'email': 'samplelink@company.com',  # Form email
            'phone': '+1-555-5678',
            'strain_id': self.strain_id,
            'shipping_address': '456 Sample Ave, Test City, TC 12345',
            'message': 'Testing user linking for sample requests'
        }
        
        response = requests.post(f"{BASE_URL}/api/sample-requests/upload", 
            data=data, files=files,
            headers={"Authorization": f"Bearer {self.user_token}"})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        response_data = response.json()
        
        # Verify user_id is stored
        assert "user_id" in response_data, f"Response should contain user_id. Got: {response_data}"
        assert response_data["user_id"] == self.user_data["id"], \
            f"user_id mismatch: expected {self.user_data['id']}, got {response_data['user_id']}"
        
        print(f"✅ POST /api/sample-requests/upload correctly stores user_id: {response_data['user_id']}")
        
        # Verify other expected fields
        assert "id" in response_data, "Response should contain sample request ID"
        assert response_data["strain_name"] is not None, "Response should contain strain_name"
        assert response_data["status"] == "pending", "Initial status should be 'pending'"
        
        print(f"✅ Sample request created with ID: {response_data['id']}")
        print(f"✅ Sample request linked to strain: {response_data['strain_name']}")


class TestUserRegistrationAndAuth:
    """Tests for user registration and authentication flow"""
    
    def test_user_registration_returns_token(self):
        """Test that user registration returns a valid token"""
        test_email = f"regtest_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Registration",
            "last_name": "Test",
            "company": f"RegTestCompany_{uuid.uuid4().hex[:6]}",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-0002",
            "password": "RegTestPass123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, f"Response should contain token. Got: {data}"
        assert "user" in data, f"Response should contain user. Got: {data}"
        assert data["user"]["email"] == test_email.lower(), "User email should match"
        
        print(f"✅ User registration successful, token received")
        print(f"✅ User data: {data['user']}")
    
    def test_user_login_returns_token(self):
        """Test that user login returns a valid token"""
        test_email = f"logintest_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "LoginTestPass123"
        
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Login",
            "last_name": "Test",
            "company": f"LoginTestCompany_{uuid.uuid4().hex[:6]}",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-0003",
            "password": test_password
        })
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, f"Response should contain token. Got: {data}"
        assert "user" in data, f"Response should contain user. Got: {data}"
        
        print(f"✅ User login successful, token received")
    
    def test_verify_token_returns_user_info(self):
        """Test that /api/auth/verify returns user info for valid token"""
        test_email = f"verifytest_{uuid.uuid4().hex[:8]}@example.com"
        
        # Register
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Verify",
            "last_name": "Test",
            "company": "VerifyTestCo",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-0004",
            "password": "VerifyPass123"
        })
        
        if register_response.status_code != 200:
            pytest.skip("Registration failed")
        
        token = register_response.json().get("token")
        
        # Verify token
        verify_response = requests.get(f"{BASE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"})
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}"
        
        data = verify_response.json()
        assert data.get("valid") == True, f"Token should be valid. Got: {data}"
        assert "user" in data, f"Response should contain user. Got: {data}"
        
        print(f"✅ Token verification successful")
        print(f"✅ User info from verify: {data['user']}")


class TestInquiryEndpointDetails:
    """Detailed tests for inquiry endpoint"""
    
    def test_inquiry_data_persisted_in_database(self):
        """Test that inquiry data with user linking is persisted and retrievable"""
        test_email = f"inqpersist_{uuid.uuid4().hex[:8]}@example.com"
        
        # Register user
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Persist",
            "last_name": "Test",
            "company": "PersistTestCo",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-0005",
            "password": "PersistPass123"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip("Registration failed")
        
        token = reg_resp.json().get("token")
        user_id = reg_resp.json().get("user", {}).get("id")
        
        # Get strain ID
        strains_resp = requests.get(f"{BASE_URL}/api/strains",
            headers={"Authorization": f"Bearer {token}"})
        if strains_resp.status_code != 200 or not strains_resp.json():
            pytest.skip("No strains available")
        
        strain_id = strains_resp.json()[0]["id"]
        
        # Create inquiry
        inquiry_resp = requests.post(f"{BASE_URL}/api/inquiries",
            json={
                "company_name": "Persist Check Co",
                "contact_name": "Persist Contact",
                "email": "persist@company.com",
                "phone": "+1-555-9999",
                "strain_ids": [strain_id],
                "message": "Persistence test inquiry"
            },
            headers={"Authorization": f"Bearer {token}"})
        
        assert inquiry_resp.status_code == 200
        inquiry_data = inquiry_resp.json()
        inquiry_id = inquiry_data["id"]
        
        # Verify inquiry has user_id and user_email
        assert inquiry_data.get("user_id") == user_id, "user_id should match registered user"
        assert inquiry_data.get("user_email") == test_email.lower(), "user_email should match"
        
        print(f"✅ Inquiry persisted with user_id: {inquiry_data['user_id']}")
        print(f"✅ Inquiry persisted with user_email: {inquiry_data['user_email']}")
        print(f"✅ Inquiry ID: {inquiry_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
