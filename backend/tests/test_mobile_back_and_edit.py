"""
Tests for mobile back button and admin strain edit functionality.
Focus on:
1. Backend PUT /api/strains/{strain_id} endpoint - verify image_url preserved when exclude_unset=True
2. Basic strain CRUD operations
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Admin can login with correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in admin login response"
        print(f"✅ Admin login successful, token received")
    
    def test_admin_login_failure(self):
        """Admin login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should reject wrong password"
        print(f"✅ Admin login correctly rejects wrong password")


class TestStrainEditEndpoint:
    """Test PUT /api/strains/{strain_id} endpoint - focus on image_url preservation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and strains list"""
        # Admin login
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get strains list
        response = requests.get(f"{BASE_URL}/api/strains", headers=self.headers)
        assert response.status_code == 200
        self.strains = response.json()
        assert len(self.strains) > 0, "No strains found"
    
    def test_edit_strain_preserves_image_url(self):
        """
        Editing a strain should preserve image_url when not included in update payload.
        This tests the exclude_unset=True fix in the backend.
        """
        # Find Jealousy strain (has image_url set)
        test_strain = None
        for strain in self.strains:
            if strain.get("strain_name") == "Jealousy":
                test_strain = strain
                break
        
        if not test_strain:
            # Use first strain with image_url
            for strain in self.strains:
                if strain.get("image_url"):
                    test_strain = strain
                    break
        
        assert test_strain, "No strain with image_url found"
        strain_id = test_strain["id"]
        original_image_url = test_strain.get("image_url")
        original_thc = test_strain.get("thc_percentage")
        
        print(f"Testing strain: {test_strain['strain_name']}")
        print(f"Original image_url: {original_image_url}")
        print(f"Original THC: {original_thc}")
        
        # Edit only THC percentage - NOT including image_url in payload
        new_thc = "TEST_28.5%" if original_thc != "TEST_28.5%" else "TEST_29.5%"
        update_payload = {
            "strain_name": test_strain["strain_name"],
            "type": test_strain["type"],
            "thc_percentage": new_thc,
            "price_tier": test_strain["price_tier"],
            "terpene_profile": test_strain["terpene_profile"],
            "lineage": test_strain["lineage"],
            "lot_size": test_strain["lot_size"],
            "effects": test_strain["effects"]
            # Intentionally NOT including image_url
        }
        
        response = requests.put(
            f"{BASE_URL}/api/strains/{strain_id}",
            json=update_payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"PUT failed: {response.text}"
        
        updated_strain = response.json()
        updated_image_url = updated_strain.get("image_url")
        updated_thc = updated_strain.get("thc_percentage")
        
        print(f"Updated image_url: {updated_image_url}")
        print(f"Updated THC: {updated_thc}")
        
        # Verify THC changed
        assert updated_thc == new_thc, f"THC not updated. Expected: {new_thc}, Got: {updated_thc}"
        print(f"✅ THC successfully updated to {updated_thc}")
        
        # CRITICAL: Verify image_url is preserved (not set to None)
        assert updated_image_url == original_image_url, \
            f"image_url was NOT preserved! Expected: {original_image_url}, Got: {updated_image_url}"
        print(f"✅ image_url preserved correctly: {updated_image_url}")
        
        # Revert the THC change
        revert_payload = {
            "strain_name": test_strain["strain_name"],
            "type": test_strain["type"],
            "thc_percentage": original_thc,
            "price_tier": test_strain["price_tier"],
            "terpene_profile": test_strain["terpene_profile"],
            "lineage": test_strain["lineage"],
            "lot_size": test_strain["lot_size"],
            "effects": test_strain["effects"]
        }
        requests.put(f"{BASE_URL}/api/strains/{strain_id}", json=revert_payload, headers=self.headers)
        print(f"✅ Reverted THC back to {original_thc}")
    
    def test_edit_strain_requires_admin_auth(self):
        """PUT /api/strains/{id} requires admin authentication"""
        test_strain = self.strains[0]
        strain_id = test_strain["id"]
        
        # Try without auth
        response = requests.put(
            f"{BASE_URL}/api/strains/{strain_id}",
            json={
                "strain_name": test_strain["strain_name"],
                "type": test_strain["type"],
                "thc_percentage": "99%",
                "price_tier": test_strain["price_tier"],
                "terpene_profile": test_strain["terpene_profile"],
                "lineage": test_strain["lineage"],
                "lot_size": test_strain["lot_size"],
                "effects": test_strain["effects"]
            }
        )
        assert response.status_code == 401, f"Should require auth, got {response.status_code}"
        print(f"✅ PUT /api/strains/{strain_id} correctly requires admin auth (401)")
    
    def test_edit_nonexistent_strain_returns_404(self):
        """PUT /api/strains/{id} returns 404 for non-existent strain"""
        response = requests.put(
            f"{BASE_URL}/api/strains/nonexistent-id-12345",
            json={
                "strain_name": "Test",
                "type": "Hybrid",
                "thc_percentage": "25%",
                "price_tier": "$$",
                "terpene_profile": ["Test"],
                "lineage": "Test",
                "lot_size": "50kg",
                "effects": "Test"
            },
            headers=self.headers
        )
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print(f"✅ PUT /api/strains/nonexistent-id correctly returns 404")


class TestUserAuth:
    """Test user authentication for accessing strains"""
    
    def test_strains_requires_auth(self):
        """GET /api/strains requires user authentication"""
        response = requests.get(f"{BASE_URL}/api/strains")
        assert response.status_code == 401, f"Should require auth, got {response.status_code}"
        print(f"✅ GET /api/strains correctly requires authentication (401)")
    
    def test_strains_accessible_with_user_token(self):
        """Strains accessible after user registration"""
        import time
        test_email = f"straintest{int(time.time())}@example.com"
        
        # Register
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Strain",
            "last_name": "Tester",
            "company": "Strain Test Corp",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-0000",
            "password": "testpass123"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        user_token = response.json()["token"]
        
        # Access strains
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/strains", headers=headers)
        assert response.status_code == 200, f"Strains access failed: {response.text}"
        strains = response.json()
        assert len(strains) > 0, "No strains returned"
        print(f"✅ User can access {len(strains)} strains after registration")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
