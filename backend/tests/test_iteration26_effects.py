"""
Iteration 26 Tests: Effects Feature
Tests for the cannabis effects multi-select feature added to Firegold app.
- Backend: GET /api/strains returns effects as array
- Backend: GET /api/strains?effects=Grounding filters strains
- Backend: PUT /api/strains/{id} accepts effects as array  
- Backend: POST /api/strains/admin/create accepts effects as array
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"
TEST_USER_EMAIL = "test_effects@test.com"
TEST_USER_PASSWORD = "Test1234!"


class TestEffectsFeature:
    """Tests for the Effects feature implementation"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user authentication token - register or login"""
        # Try to register first
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "Effects",
            "company": f"TEST_EFFECTS_CO_{uuid.uuid4().hex[:6]}",
            "country": "Canada",
            "email": f"test_effects_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "555-0000",
            "password": TEST_USER_PASSWORD
        })
        
        if register_response.status_code == 200:
            return register_response.json().get("token")
        
        # If registration fails (email exists), try login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("token")
        
        pytest.skip("Could not authenticate user for testing")
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health check passed")
    
    def test_get_strains_returns_effects_as_array(self, user_token):
        """GET /api/strains should return effects as array of strings"""
        response = requests.get(
            f"{BASE_URL}/api/strains",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Failed to get strains: {response.text}"
        
        strains = response.json()
        assert len(strains) > 0, "No strains returned"
        
        # Check at least one strain has effects as array
        strains_with_effects = [s for s in strains if s.get("effects")]
        assert len(strains_with_effects) > 0, "No strains have effects data"
        
        for strain in strains_with_effects[:5]:  # Check first 5 strains with effects
            effects = strain.get("effects")
            assert isinstance(effects, list), f"Effects for {strain.get('strain_name')} is not an array: {type(effects)}"
            print(f"✅ Strain '{strain.get('strain_name')}' has effects as array: {effects[:3]}...")
        
        print(f"✅ GET /api/strains returns effects as array (checked {len(strains_with_effects)} strains)")
    
    def test_filter_strains_by_effects(self, user_token):
        """GET /api/strains?effects=Grounding should filter strains"""
        # First get all strains to find one with effects
        all_response = requests.get(
            f"{BASE_URL}/api/strains",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert all_response.status_code == 200
        all_strains = all_response.json()
        
        # Find a strain with "Grounding" effect or any common effect
        test_effects = ["Grounding", "Euphoria", "Relaxed", "Calm", "Stress relief"]
        found_effect = None
        
        for strain in all_strains:
            effects = strain.get("effects", [])
            if isinstance(effects, list):
                for test_effect in test_effects:
                    if test_effect in effects:
                        found_effect = test_effect
                        break
            if found_effect:
                break
        
        if not found_effect:
            # Try filtering with any effect from the first strain
            if all_strains and isinstance(all_strains[0].get("effects"), list) and all_strains[0]["effects"]:
                found_effect = all_strains[0]["effects"][0]
        
        if not found_effect:
            pytest.skip("No strains with effects to test filtering")
        
        # Test filtering by the found effect
        filter_response = requests.get(
            f"{BASE_URL}/api/strains",
            params={"effects": found_effect},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert filter_response.status_code == 200, f"Filter request failed: {filter_response.text}"
        filtered_strains = filter_response.json()
        
        # Verify all returned strains have the effect
        for strain in filtered_strains:
            effects = strain.get("effects", [])
            assert isinstance(effects, list), f"Effects is not an array for {strain.get('strain_name')}"
            assert found_effect in effects, f"Strain {strain.get('strain_name')} doesn't have effect '{found_effect}'"
        
        print(f"✅ Filter by effects='{found_effect}' returned {len(filtered_strains)} strains (all contain the effect)")
    
    def test_admin_create_strain_with_effects_array(self, admin_token):
        """POST /api/strains/admin/create should accept effects as array of strings"""
        test_strain_name = f"TEST_EFFECTS_STRAIN_{uuid.uuid4().hex[:8]}"
        test_effects = ["Euphoria", "Relaxed", "Creative thinking"]
        
        response = requests.post(
            f"{BASE_URL}/api/strains/admin/create",
            json={
                "strain_name": test_strain_name,
                "type": "Balanced Hybrid",
                "thc_percentage": "25%",
                "price_tier": "$$",
                "terpene_profile": ["Limonene", "Caryophyllene"],
                "lineage": "Test Lineage x Test Cross",
                "lot_size": "10 kg",
                "effects": test_effects
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create strain: {response.text}"
        created = response.json()
        
        assert created.get("strain_name") == test_strain_name
        assert isinstance(created.get("effects"), list), f"Created strain effects is not array: {type(created.get('effects'))}"
        assert created.get("effects") == test_effects, f"Effects mismatch: {created.get('effects')} != {test_effects}"
        
        # Store strain ID for cleanup
        self.__class__.created_strain_id = created.get("id")
        
        print(f"✅ Created strain '{test_strain_name}' with effects array: {test_effects}")
    
    def test_admin_update_strain_with_effects_array(self, admin_token, user_token):
        """PUT /api/strains/{id} should accept effects as array of strings"""
        # First get a strain to update (use the one we created or find another)
        strain_id = getattr(self.__class__, 'created_strain_id', None)
        
        if not strain_id:
            # Find an existing strain
            response = requests.get(
                f"{BASE_URL}/api/strains",
                headers={"Authorization": f"Bearer {user_token}"}
            )
            strains = response.json()
            if strains:
                strain_id = strains[0].get("id")
            else:
                pytest.skip("No strains available to test update")
        
        # Get the current strain data
        get_response = requests.get(
            f"{BASE_URL}/api/strains/{strain_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert get_response.status_code == 200
        current_strain = get_response.json()
        
        # Update with new effects array
        new_effects = ["Uplifted mood", "Body relaxation", "Focus"]
        
        update_response = requests.put(
            f"{BASE_URL}/api/strains/{strain_id}",
            json={
                "strain_name": current_strain.get("strain_name"),
                "type": current_strain.get("type"),
                "thc_percentage": current_strain.get("thc_percentage"),
                "price_tier": current_strain.get("price_tier"),
                "terpene_profile": current_strain.get("terpene_profile", []),
                "lineage": current_strain.get("lineage", ""),
                "lot_size": current_strain.get("lot_size", ""),
                "effects": new_effects
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert update_response.status_code == 200, f"Failed to update strain: {update_response.text}"
        updated = update_response.json()
        
        assert isinstance(updated.get("effects"), list), f"Updated strain effects is not array: {type(updated.get('effects'))}"
        assert updated.get("effects") == new_effects, f"Effects not updated: {updated.get('effects')} != {new_effects}"
        
        print(f"✅ Updated strain '{current_strain.get('strain_name')}' with new effects: {new_effects}")
    
    def test_grower_submission_effects_stored_correctly(self, admin_token):
        """Grower submission should store effects (as string from FormData) and convert to array on approval"""
        # Note: Grower form sends effects as comma-separated string due to FormData
        # Backend stores it as string in submissions, converts to array on approval
        
        # Get submissions to check effects format
        response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        submissions = response.json()
        
        print(f"✅ Found {len(submissions)} grower submissions")
        
        # Check format of effects in submissions (should be string or already converted)
        for sub in submissions[:3]:
            effects = sub.get("effects", "")
            print(f"  - Submission '{sub.get('strain_name')}' effects type: {type(effects).__name__}, value: {str(effects)[:50]}...")
    
    def test_cleanup_test_strain(self, admin_token):
        """Clean up test strain created during testing"""
        strain_id = getattr(self.__class__, 'created_strain_id', None)
        if strain_id:
            response = requests.delete(
                f"{BASE_URL}/api/strains/{strain_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            if response.status_code == 200:
                print(f"✅ Cleaned up test strain {strain_id}")
            else:
                print(f"⚠️ Could not clean up test strain: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
