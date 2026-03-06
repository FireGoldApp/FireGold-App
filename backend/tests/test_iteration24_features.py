"""
Iteration 24 Backend Tests
Tests for:
1. PWA icons accessibility
2. Backend inquiry endpoint with open_permit and permit_jurisdiction
3. API health
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAIcons:
    """Tests for PWA icon accessibility"""
    
    def test_pwa_icon_192_accessible(self):
        """PWA 192x192 icon should be accessible"""
        response = requests.get(f"{BASE_URL}/firegold_icon_192.png")
        assert response.status_code == 200, f"192 icon returned {response.status_code}"
        assert 'image/png' in response.headers.get('Content-Type', '')
        print("✅ /firegold_icon_192.png accessible (200)")
    
    def test_pwa_icon_384_accessible(self):
        """PWA 384x384 icon should be accessible"""
        response = requests.get(f"{BASE_URL}/firegold_icon_384.png")
        assert response.status_code == 200, f"384 icon returned {response.status_code}"
        assert 'image/png' in response.headers.get('Content-Type', '')
        print("✅ /firegold_icon_384.png accessible (200)")
    
    def test_pwa_icon_512_accessible(self):
        """PWA 512x512 icon should be accessible"""
        response = requests.get(f"{BASE_URL}/firegold_icon_512.png")
        assert response.status_code == 200, f"512 icon returned {response.status_code}"
        assert 'image/png' in response.headers.get('Content-Type', '')
        print("✅ /firegold_icon_512.png accessible (200)")
    
    def test_manifest_json_accessible(self):
        """manifest.json should be accessible and reference all icons"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"manifest.json returned {response.status_code}"
        data = response.json()
        
        # Check icons array
        icons = data.get('icons', [])
        assert len(icons) >= 3, f"Expected 3+ icons, got {len(icons)}"
        
        # Check each size is present
        icon_srcs = [icon['src'] for icon in icons]
        assert '/firegold_icon_192.png' in icon_srcs, "192 icon missing from manifest"
        assert '/firegold_icon_384.png' in icon_srcs, "384 icon missing from manifest"
        assert '/firegold_icon_512.png' in icon_srcs, "512 icon missing from manifest"
        print("✅ manifest.json contains all 3 PWA icon references")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_health(self):
        """API health endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✅ /api/health returns healthy")


class TestInquiryAPI:
    """Tests for inquiry API with new fields"""
    
    @pytest.fixture
    def user_token(self):
        """Login or register test user and return token"""
        import uuid
        test_email = f"TEST_iter24_{uuid.uuid4().hex[:8]}@test.com"
        
        # Try to register
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "User",
            "company": "Test Company",
            "country": "Domestic (Canada)",
            "email": test_email,
            "phone": "+1-555-000-0000",
            "password": "TestPass123!"
        })
        
        if response.status_code == 200:
            return response.json().get('token')
        
        pytest.skip("Could not register test user for inquiry test")
    
    def test_inquiry_accepts_open_permit_field(self, user_token):
        """POST /api/inquiries should accept open_permit field"""
        # First get a strain ID (requires auth)
        strains_resp = requests.get(
            f"{BASE_URL}/api/strains",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert strains_resp.status_code == 200, f"Strains endpoint returned {strains_resp.status_code}"
        strains = strains_resp.json()
        if not strains:
            pytest.skip("No strains available for testing")
        
        strain_id = strains[0].get('id')
        
        response = requests.post(
            f"{BASE_URL}/api/inquiries",
            json={
                "company_name": "Test Company",
                "contact_name": "Test User",
                "email": "test@example.com",
                "strain_ids": [strain_id],
                "message": "Test inquiry with open permit",
                "open_permit": "Yes",
                "permit_jurisdiction": "Germany"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code in [200, 201], f"Inquiry failed with {response.status_code}: {response.text}"
        print("✅ POST /api/inquiries accepts open_permit and permit_jurisdiction fields")
    
    def test_inquiry_accepts_domestic_canada_jurisdiction(self, user_token):
        """POST /api/inquiries should accept 'Domestic (Canada)' as permit_jurisdiction"""
        strains_resp = requests.get(
            f"{BASE_URL}/api/strains",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        if strains_resp.status_code != 200:
            pytest.skip("Cannot get strains")
        strains = strains_resp.json()
        if not strains:
            pytest.skip("No strains available")
        
        strain_id = strains[0].get('id')
        
        response = requests.post(
            f"{BASE_URL}/api/inquiries",
            json={
                "company_name": "Test Company CA",
                "contact_name": "Test User",
                "email": "test_ca@example.com",
                "strain_ids": [strain_id],
                "message": "Test inquiry domestic Canada",
                "open_permit": "Yes",
                "permit_jurisdiction": "Domestic (Canada)"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code in [200, 201], f"Inquiry failed with {response.status_code}: {response.text}"
        print("✅ POST /api/inquiries accepts 'Domestic (Canada)' as permit_jurisdiction")


class TestRegistrationAPI:
    """Tests for registration API with country field"""
    
    def test_register_accepts_country_dropdown_values(self):
        """POST /api/auth/register should accept country dropdown values"""
        import uuid
        
        # Test with 'Domestic (Canada)'
        test_email = f"TEST_iter24_ca_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "Canada",
            "company": "Test Canadian LP",
            "country": "Domestic (Canada)",
            "email": test_email,
            "phone": "+1-555-111-2222",
            "password": "TestPass123!"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        print("✅ Registration accepts 'Domestic (Canada)' as country")
    
    def test_register_accepts_international_countries(self):
        """POST /api/auth/register should accept international country values"""
        import uuid
        
        # Test with 'Germany'
        test_email = f"TEST_iter24_de_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "Germany",
            "company": "Test German Company",
            "country": "Germany",
            "email": test_email,
            "phone": "+49-555-111-2222",
            "password": "TestPass123!"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        print("✅ Registration accepts 'Germany' as country")
    
    def test_register_accepts_permit_fields(self):
        """POST /api/auth/register should accept open_permit and permit_jurisdiction"""
        import uuid
        
        test_email = f"TEST_iter24_permit_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "Permit",
            "company": "Test Permit Company",
            "country": "Domestic (Canada)",
            "email": test_email,
            "phone": "+1-555-333-4444",
            "password": "TestPass123!",
            "open_permit": "Yes",
            "permit_jurisdiction": "Domestic (Canada)"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        print("✅ Registration accepts open_permit and permit_jurisdiction fields")


class TestAdminAnalytics:
    """Tests for admin analytics including User Activity"""
    
    @pytest.fixture
    def admin_token(self):
        """Login as admin"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "firegold2026"})
        assert response.status_code == 200, "Admin login failed"
        return response.json().get('token')
    
    def test_admin_user_activity_endpoint(self, admin_token):
        """GET /api/analytics/users-report should return user activity data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-report",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"User activity endpoint failed: {response.text}"
        data = response.json()
        # Response should be a list of users with activity data
        assert isinstance(data, list), "Expected list of user activities"
        print(f"✅ /api/analytics/users-report returns {len(data)} users")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
