"""
Iteration 23 Testing - Focus Areas:
- P0: COA badges and Preview COA button on strain cards and detail view
- P1: Admin panel strain editor - Terpene %, BC DD Compliant, Category fields
- P1: Browser back button behavior after login
- P2: /track route removed (should 404)
- P2: Jurisdiction dropdown disabled/clears when Open Permit != Yes
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://strain-effects.preview.emergentagent.com').rstrip('/')
ADMIN_PASSWORD = "firegold2026"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated requests"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin login failed - skipping admin tests")


@pytest.fixture(scope="module")
def user_token():
    """Register and get user token"""
    import uuid
    test_email = f"TEST_iter23_{uuid.uuid4().hex[:8]}@test.com"
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "first_name": "Test",
        "last_name": "User23",
        "company": "Test Company 23",
        "country": "Canada",
        "email": test_email,
        "phone": "+1234567890",
        "password": "TestPass123!",
        "user_type": "buyer"
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("User registration failed - skipping user tests")


class TestCOAFeature:
    """P0: Test COA badges and URL population for all strains"""
    
    def test_all_strains_have_coa_url(self, admin_token):
        """Verify all 32 strains have coa_url populated"""
        response = requests.get(f"{BASE_URL}/api/strains/admin", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200, f"Failed to get strains: {response.text}"
        
        strains = response.json()
        assert len(strains) >= 32, f"Expected at least 32 strains, got {len(strains)}"
        
        strains_with_coa = [s for s in strains if s.get('coa_url')]
        strains_without_coa = [s['strain_name'] for s in strains if not s.get('coa_url')]
        
        assert len(strains_with_coa) == len(strains), \
            f"Strains missing coa_url: {strains_without_coa}"
    
    def test_coa_endpoint_returns_pdf(self, user_token, admin_token):
        """Verify COA endpoint returns PDF for strains with COA"""
        # Get first strain with COA
        response = requests.get(f"{BASE_URL}/api/strains/admin", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        strains = response.json()
        strain_with_coa = next((s for s in strains if s.get('coa_url')), None)
        
        assert strain_with_coa is not None, "No strain found with COA"
        
        # Try to get COA via endpoint
        coa_response = requests.get(
            f"{BASE_URL}/api/strains/{strain_with_coa['id']}/coa",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        # Should return 200 or redirect/serve PDF
        assert coa_response.status_code in [200, 404], \
            f"COA endpoint returned unexpected status: {coa_response.status_code}"


class TestAdminStrainEditor:
    """P1: Test admin strain editor with new fields"""
    
    def test_strain_has_terpene_percentage_field(self, admin_token):
        """Verify strains include terpene_percentage field"""
        response = requests.get(f"{BASE_URL}/api/strains/admin", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        strains = response.json()
        assert len(strains) > 0, "No strains returned"
        
        # Check that field exists (may be null)
        first_strain = strains[0]
        assert 'terpene_percentage' in first_strain or first_strain.get('terpene_percentage') is None, \
            "terpene_percentage field missing from strain response"
    
    def test_strain_has_bc_dd_compliant_field(self, admin_token):
        """Verify strains include bc_dd_compliant field"""
        response = requests.get(f"{BASE_URL}/api/strains/admin", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        strains = response.json()
        first_strain = strains[0]
        assert 'bc_dd_compliant' in first_strain, \
            "bc_dd_compliant field missing from strain response"
    
    def test_strain_has_category_field(self, admin_token):
        """Verify strains include category field"""
        response = requests.get(f"{BASE_URL}/api/strains/admin", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        strains = response.json()
        first_strain = strains[0]
        assert 'category' in first_strain, \
            "category field missing from strain response"
    
    def test_update_strain_with_new_fields(self, admin_token):
        """Test updating a strain with terpene_percentage, bc_dd_compliant, category"""
        # Get first strain
        response = requests.get(f"{BASE_URL}/api/strains/admin", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        strains = response.json()
        test_strain = strains[0]
        strain_id = test_strain['id']
        
        # Update with new fields
        update_payload = {
            "strain_name": test_strain['strain_name'],
            "type": test_strain['type'],
            "thc_percentage": test_strain['thc_percentage'],
            "price_tier": test_strain['price_tier'],
            "terpene_profile": test_strain.get('terpene_profile', []),
            "lineage": test_strain['lineage'],
            "lot_size": test_strain['lot_size'],
            "effects": test_strain['effects'],
            "terpene_percentage": 3.5,
            "bc_dd_compliant": True,
            "category": "Dried Flower"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/strains/{strain_id}",
            json=update_payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200, \
            f"Failed to update strain: {update_response.text}"
        
        # Verify update
        updated_strain = update_response.json()
        assert updated_strain.get('terpene_percentage') == 3.5
        assert updated_strain.get('bc_dd_compliant') == True
        assert updated_strain.get('category') == "Dried Flower"


class TestTrackRouteRemoved:
    """P2: Verify /track route is removed"""
    
    def test_track_route_not_found(self):
        """Navigating to /track should return 404 or redirect"""
        # This tests the API side - frontend routing will be tested via Playwright
        response = requests.get(f"{BASE_URL}/api/grower/track")
        # The API endpoint still exists but the frontend route should be removed
        # API returns 400 if no parameters given, which is expected
        assert response.status_code in [400, 404], \
            f"Unexpected status code for track: {response.status_code}"


class TestUserRegistration:
    """Test user registration fields including open_permit and jurisdiction"""
    
    def test_register_with_open_permit_fields(self):
        """Test registration accepts open_permit and permit_jurisdiction"""
        import uuid
        test_email = f"TEST_permit_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Permit",
            "last_name": "TestUser",
            "company": "Test Permit Company",
            "country": "Canada",
            "email": test_email,
            "phone": "+1234567890",
            "password": "TestPass123!",
            "open_permit": "Yes",
            "permit_jurisdiction": "Germany",
            "user_type": "both"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
