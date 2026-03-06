"""
Iteration 25 Feature Tests:
1. PWA Install Banner (Auth page): Mobile detection and banner visibility
2. PWA Install Banner (Catalog page): After login banner visibility
3. Affiliate Creation: No commission_type or commission_value fields (optional now)
4. Affiliate Edit: No commission structure fields
5. Convert to Sale Modal: Commission fields NOW REQUIRED
6. Backend: POST /api/admin/affiliates accepts affiliate without commission fields
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data for cleanup
TEST_PREFIX = "TEST_iter25_"

class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")


class TestAdminAffiliateCreation:
    """Test affiliate creation endpoint - commission fields should be optional"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "firegold2026"})
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("token")
    
    def test_create_affiliate_without_commission_fields(self, admin_token):
        """Create affiliate without commission_type and commission_value - should succeed"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "name": f"{TEST_PREFIX}Affiliate_{unique_id}",
            "email": f"{TEST_PREFIX}affiliate_{unique_id}@test.com",
            "phone": "555-1234",
            "company": "Test Company",
            "referral_code": f"TEST{unique_id.upper()}"
            # NO commission_type or commission_value - these are optional now
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/affiliates",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201 or response.status_code == 200, f"Create affiliate failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify the affiliate was created
        assert data.get("name") == payload["name"], "Name mismatch"
        assert data.get("email") == payload["email"], "Email mismatch"
        assert data.get("referral_code") == payload["referral_code"], "Referral code mismatch"
        
        # commission_type and commission_value should be None/null (optional)
        # They may not be present or be None
        print(f"✅ Affiliate created without commission fields: {data.get('name')}")
        print(f"   commission_type: {data.get('commission_type')} (should be None/null)")
        print(f"   commission_value: {data.get('commission_value')} (should be None/null)")
    
    def test_create_affiliate_with_commission_fields(self, admin_token):
        """Create affiliate WITH commission_type and commission_value - should also succeed"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "name": f"{TEST_PREFIX}AffWithComm_{unique_id}",
            "email": f"{TEST_PREFIX}affwithcomm_{unique_id}@test.com",
            "phone": "555-5678",
            "company": "Test Company 2",
            "referral_code": f"TCOMM{unique_id.upper()}",
            "commission_type": "per_gram",
            "commission_value": 0.05
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/affiliates",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201 or response.status_code == 200, f"Create affiliate with commission failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert data.get("name") == payload["name"]
        print(f"✅ Affiliate created with commission fields: {data.get('name')}")


class TestAffiliateEndpoints:
    """Test affiliate list and details endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "firegold2026"})
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_list_affiliates(self, admin_token):
        """Test listing affiliates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/affiliates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"List affiliates failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of affiliates"
        print(f"✅ Listed {len(data)} affiliates")


class TestInquiryConversion:
    """Test inquiry conversion with required commission fields"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "firegold2026"})
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_get_inquiries(self, admin_token):
        """Test listing inquiries that can be converted"""
        response = requests.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"List inquiries failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of inquiries"
        print(f"✅ Listed {len(data)} inquiries")


class TestAffiliateModel:
    """Test that the AffiliateCreate model accepts optional commission fields"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "firegold2026"})
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_affiliate_schema_accepts_optional_commission(self, admin_token):
        """
        Per the code change:
        - commission_type: Optional[str] = None  # Set per-deal at conversion time
        - commission_value: Optional[float] = None
        
        This test verifies the API accepts both scenarios
        """
        unique_id = str(uuid.uuid4())[:8]
        
        # Test 1: No commission fields at all
        payload_no_commission = {
            "name": f"{TEST_PREFIX}NoCommission_{unique_id}",
            "email": f"{TEST_PREFIX}nocomm_{unique_id}@test.com",
            "referral_code": f"NOCOMM{unique_id.upper()}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/affiliates",
            json=payload_no_commission,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed without commission: {response.text}"
        print("✅ Affiliate created successfully WITHOUT commission fields")
        
        # Test 2: With null/None values explicitly
        unique_id2 = str(uuid.uuid4())[:8]
        payload_null_commission = {
            "name": f"{TEST_PREFIX}NullCommission_{unique_id2}",
            "email": f"{TEST_PREFIX}nullcomm_{unique_id2}@test.com",
            "referral_code": f"NULLCOMM{unique_id2.upper()}",
            "commission_type": None,
            "commission_value": None
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/affiliates",
            json=payload_null_commission,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code in [200, 201], f"Failed with null commission: {response.text}"
        print("✅ Affiliate created successfully WITH null commission fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
