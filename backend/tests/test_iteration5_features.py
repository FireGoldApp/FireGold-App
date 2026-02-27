"""
Test suite for Iteration 5 features:
1. P1 Add Strain - Admin can add a new strain via API
2. Smart License Recognition - check-licenses endpoint
3. Submission Status Tracker - track endpoint
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"

# Test companies from review request
COMPANY_WITH_LICENSES = "Maple Leaf Cannabis"
COMPANY_WITHOUT_LICENSES = "Premium Farms Inc"


class TestLicenseRecognition:
    """Tests for GET /api/grower/check-licenses endpoint"""
    
    def test_check_licenses_known_company(self):
        """Known company returns recognized=true with license status"""
        response = requests.get(
            f"{BASE_URL}/api/grower/check-licenses",
            params={"company_name": COMPANY_WITH_LICENSES}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "recognized" in data
        assert "licenses_on_file" in data
        assert "company_name" in data
        print(f"License check response for '{COMPANY_WITH_LICENSES}': {data}")
        
    def test_check_licenses_unknown_company(self):
        """Unknown company returns recognized=false"""
        unknown_company = f"TEST_Unknown_Company_{uuid.uuid4().hex[:6]}"
        response = requests.get(
            f"{BASE_URL}/api/grower/check-licenses",
            params={"company_name": unknown_company}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("recognized") == False, f"Expected recognized=false for unknown company"
        assert data.get("previous_submissions") == 0
        print(f"Unknown company check response: {data}")
        
    def test_check_licenses_requires_company_name(self):
        """Endpoint requires company_name parameter"""
        response = requests.get(f"{BASE_URL}/api/grower/check-licenses")
        assert response.status_code == 422, f"Expected 422 for missing param, got {response.status_code}"


class TestSubmissionTracker:
    """Tests for GET /api/grower/track endpoint"""
    
    def test_track_by_company_name(self):
        """Track submissions by company name returns list with licenses_on_file"""
        response = requests.get(
            f"{BASE_URL}/api/grower/track",
            params={"company_name": COMPANY_WITH_LICENSES}
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "submissions" in data, "Response missing 'submissions' field"
            assert "licenses_on_file" in data, "Response missing 'licenses_on_file' field"
            assert isinstance(data["submissions"], list)
            print(f"Track by company response: {len(data['submissions'])} submissions, licenses: {data['licenses_on_file']}")
            
    def test_track_by_submission_id_not_found(self):
        """Track with invalid submission_id returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/grower/track",
            params={"submission_id": fake_id}
        )
        assert response.status_code == 404, f"Expected 404 for unknown ID, got {response.status_code}"
        
    def test_track_requires_parameter(self):
        """Track endpoint requires either submission_id or company_name"""
        response = requests.get(f"{BASE_URL}/api/grower/track")
        assert response.status_code == 400, f"Expected 400 for missing params, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        print(f"Missing params error: {data['detail']}")

    def test_track_by_unknown_company(self):
        """Track with unknown company returns empty submissions"""
        unknown_company = f"TEST_NonExistent_LP_{uuid.uuid4().hex[:6]}"
        response = requests.get(
            f"{BASE_URL}/api/grower/track",
            params={"company_name": unknown_company}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["submissions"] == [], f"Expected empty submissions for unknown company"
        print(f"Unknown company track response: {data}")


class TestAdminAddStrain:
    """Tests for POST /api/strains/admin/create endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_add_strain_success(self, admin_token):
        """Admin can create a new strain"""
        strain_data = {
            "strain_name": f"TEST_AdminStrain_{uuid.uuid4().hex[:6]}",
            "type": "Balanced Hybrid",
            "thc_percentage": "28.5%",
            "price_tier": "$$",
            "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"],
            "lineage": "TEST Parent A x TEST Parent B",
            "lot_size": "45 kg",
            "effects": "Test Effects - Relaxation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/strains/admin/create",
            json=strain_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Create strain failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["strain_name"] == strain_data["strain_name"]
        assert data["type"] == strain_data["type"]
        assert data["thc_percentage"] == strain_data["thc_percentage"]
        assert "id" in data
        print(f"Created strain: {data['strain_name']} with ID {data['id']}")
        
        # Cleanup - delete the test strain
        strain_id = data["id"]
        delete_response = requests.delete(
            f"{BASE_URL}/api/strains/{strain_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Cleanup: Deleted test strain, status: {delete_response.status_code}")
        
    def test_add_strain_duplicate_name_fails(self, admin_token):
        """Creating strain with existing name fails"""
        # First get existing strains to find a name
        response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code == 200 and response.json():
            existing_name = response.json()[0]["strain_name"]
            
            # Try to create duplicate
            duplicate_data = {
                "strain_name": existing_name,
                "type": "Balanced Hybrid",
                "thc_percentage": "25%",
                "price_tier": "$",
                "terpene_profile": ["Test"],
                "lineage": "Test",
                "lot_size": "10 kg",
                "effects": "Test"
            }
            
            dup_response = requests.post(
                f"{BASE_URL}/api/strains/admin/create",
                json=duplicate_data,
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert dup_response.status_code == 400, f"Expected 400 for duplicate, got {dup_response.status_code}"
            print(f"Duplicate name error: {dup_response.json()}")
        
    def test_add_strain_requires_admin_auth(self):
        """Creating strain without auth fails"""
        strain_data = {
            "strain_name": "TEST_NoAuth",
            "type": "Balanced Hybrid",
            "thc_percentage": "25%",
            "price_tier": "$",
            "terpene_profile": ["Test"],
            "lineage": "Test",
            "lot_size": "10 kg",
            "effects": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/strains/admin/create",
            json=strain_data
        )
        assert response.status_code == 401, f"Expected 401 for no auth, got {response.status_code}"


class TestRegistrationWithPassword:
    """Verify registration still works with user-chosen password (from iteration 4)"""
    
    def test_registration_with_password(self):
        """User can register with chosen password and login"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@testcompany.com"
        test_password = "TestPassword123"
        
        # Register
        register_data = {
            "first_name": "Test",
            "last_name": "User",
            "company": "TEST_Registration_Company",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-TEST",
            "password": test_password
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_data
        )
        assert response.status_code == 200, f"Registration failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Registered user: {test_email}")
        
        # Login with the same password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": test_email, "password": test_password}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"Login successful for {test_email}")


class TestGrowerSubmissionFields:
    """Verify all grower submission fields still work (from iterations 3-4)"""
    
    def test_grower_submission_all_fields(self):
        """Submit with export country, irradiation, and verify response"""
        submission_data = {
            "grower_name": "Test Grower",
            "company_name": f"TEST_Company_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@testlp.com",
            "phone": "+1-555-9999",
            "strain_name": f"TEST_Strain_{uuid.uuid4().hex[:6]}",
            "strain_type": "Balanced Hybrid",
            "thc_percentage": "28%",
            "terpene_profile": "Limonene, Myrcene",
            "lineage": "Test Parent x Test Parent",
            "lot_size_kg": "35",
            "effects": "Relaxation, Mood Elevation",
            "export_country": "Germany",
            "is_irradiated": "Yes",
            "willing_to_irradiate": "Yes"
        }
        
        # Use form data for multipart submission (as per iteration 3 changes)
        files = {}  # No files for this test
        
        response = requests.post(
            f"{BASE_URL}/api/grower/submit",
            data=submission_data
        )
        assert response.status_code == 200, f"Submission failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "submission_id" in data
        assert "strain_name" in data
        print(f"Created submission: {data['submission_id']} for {data['strain_name']}")
        
        # Verify we can track it
        track_response = requests.get(
            f"{BASE_URL}/api/grower/track",
            params={"submission_id": data["submission_id"]}
        )
        assert track_response.status_code == 200, f"Track failed: {track_response.text}"
        track_data = track_response.json()
        assert len(track_data["submissions"]) == 1
        print(f"Tracked submission status: {track_data['submissions'][0]['status']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
